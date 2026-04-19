using CheckersGame.Models;
using CheckersGame.Services;
using Microsoft.AspNetCore.SignalR;

namespace CheckersGame.Hubs;

public class GameHub : Hub
{
    private readonly GameService _gameService;

    public GameHub(GameService gameService) => _gameService = gameService;

    // Cria uma nova partida e coloca o criador como Jogador 1 (Vermelho)
    public async Task CreateGame()
    {
        var game = _gameService.CreateGame(Context.ConnectionId);
        await Groups.AddToGroupAsync(Context.ConnectionId, game.GameId);
        await Clients.Caller.SendAsync("GameCreated", game.GameId);
        await Clients.Caller.SendAsync("GameStateUpdated",
            _gameService.ToDto(game, Context.ConnectionId));
    }

    // Entra em uma partida existente como Jogador 2 (Preto)
    public async Task JoinGame(string gameId)
    {
        var game = _gameService.GetGame(gameId);
        if (game == null)
        {
            await Clients.Caller.SendAsync("Error", "Jogo não encontrado. Verifique o código e tente novamente.");
            return;
        }

        // Impede que o criador entre na própria partida
        if (game.Player1ConnectionId == Context.ConnectionId)
        {
            await Clients.Caller.SendAsync("Error", "Você criou esta partida. Aguarde outro jogador entrar com o código.");
            return;
        }

        if (game.Status == GameStatus.Playing)
        {
            await Clients.Caller.SendAsync("Error", "Esta partida já está em andamento.");
            return;
        }

        if (game.Status == GameStatus.Finished)
        {
            await Clients.Caller.SendAsync("Error", "Esta partida já foi encerrada.");
            return;
        }

        if (!_gameService.JoinGame(game, Context.ConnectionId))
        {
            await Clients.Caller.SendAsync("Error", "Não foi possível entrar nesta partida.");
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, gameId);

        // Envia estado personalizado para cada jogador (papel diferente)
        await Clients.Client(game.Player1ConnectionId!)
            .SendAsync("GameStateUpdated", _gameService.ToDto(game, game.Player1ConnectionId));
        await Clients.Client(game.Player2ConnectionId!)
            .SendAsync("GameStateUpdated", _gameService.ToDto(game, game.Player2ConnectionId));
    }

    // Solicita os movimentos válidos para a peça em (row, col)
    public async Task SelectPiece(string gameId, int row, int col)
    {
        var game = _gameService.GetGame(gameId);
        if (game == null) return;

        var moves = _gameService.GetValidMoveTargets(game, row, col);
        await Clients.Caller.SendAsync("ValidMovesUpdated", new { row, col, moves });
    }

    // Executa um movimento e notifica ambos os jogadores
    public async Task MakeMove(string gameId, int fromRow, int fromCol, int toRow, int toCol)
    {
        var game = _gameService.GetGame(gameId);
        if (game == null)
        {
            await Clients.Caller.SendAsync("Error", "Jogo não encontrado");
            return;
        }

        // Valida se é a vez do jogador que enviou o comando
        string expectedId = game.CurrentPlayer == PlayerColor.Red
            ? game.Player1ConnectionId!
            : game.Player2ConnectionId!;

        if (Context.ConnectionId != expectedId)
        {
            await Clients.Caller.SendAsync("Error", "Não é sua vez de jogar");
            return;
        }

        var (success, error) = _gameService.ExecuteMove(game, fromRow, fromCol, toRow, toCol);
        if (!success)
        {
            await Clients.Caller.SendAsync("Error", error);
            return;
        }

        // Notifica cada jogador com seu estado personalizado
        if (game.Player1ConnectionId != null)
            await Clients.Client(game.Player1ConnectionId)
                .SendAsync("GameStateUpdated", _gameService.ToDto(game, game.Player1ConnectionId));
        if (game.Player2ConnectionId != null)
            await Clients.Client(game.Player2ConnectionId)
                .SendAsync("GameStateUpdated", _gameService.ToDto(game, game.Player2ConnectionId));
    }

    // Abandona a partida: quem chama perde (ou cancela a sala se ainda aguardando)
    public async Task AbandonGame(string gameId)
    {
        var (success, opponentId) = _gameService.AbandonGame(gameId, Context.ConnectionId);
        if (!success) return;

        var game = _gameService.GetGame(gameId)!;

        // Notifica o próprio jogador para voltar ao lobby
        await Clients.Caller.SendAsync("GameAbandoned");

        // Notifica o oponente: estado final + aviso explícito de abandono
        if (opponentId != null)
        {
            await Clients.Client(opponentId)
                .SendAsync("GameStateUpdated", _gameService.ToDto(game, opponentId));
            await Clients.Client(opponentId)
                .SendAsync("OpponentAbandoned");
        }
    }

    // Lista partidas aguardando jogador
    public async Task GetOpenGames()
    {
        var games = _gameService.GetOpenGames()
            .Select(g => new GameListItemDto { GameId = g.GameId })
            .ToList();
        await Clients.Caller.SendAsync("OpenGames", games);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var game = _gameService.FindGameByConnection(Context.ConnectionId);

        _gameService.HandleDisconnect(Context.ConnectionId);

        if (game != null)
        {
            string? otherId = game.Player1ConnectionId == Context.ConnectionId
                ? game.Player2ConnectionId
                : game.Player1ConnectionId;

            if (otherId != null)
                await Clients.Client(otherId)
                    .SendAsync("GameStateUpdated", _gameService.ToDto(game, otherId));
        }

        await base.OnDisconnectedAsync(exception);
    }
}
