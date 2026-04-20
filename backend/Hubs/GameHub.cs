using CheckersGame.Models;
using CheckersGame.Services;
using Microsoft.AspNetCore.SignalR;

namespace CheckersGame.Hubs;

public class GameHub : Hub
{
    private readonly GameService _gameService;

    public GameHub(GameService gameService) => _gameService = gameService;

    // Cria uma nova partida (Jogador 1 / Vermelho)
    public async Task CreateGame()
    {
        var game = _gameService.CreateGame(Context.ConnectionId);
        await Groups.AddToGroupAsync(Context.ConnectionId, game.GameId);
        await Clients.Caller.SendAsync("GameCreated", game.GameId);
        await Clients.Caller.SendAsync("GameStateUpdated",
            _gameService.ToDto(game, Context.ConnectionId));
    }

    // Player 2 solicita entrada — o criador precisa aprovar
    public async Task RequestJoin(string gameId)
    {
        var (success, hostId, error) = _gameService.RequestJoin(gameId, Context.ConnectionId);
        if (!success)
        {
            await Clients.Caller.SendAsync("Error", error);
            return;
        }

        // Avisa Player 2 que está aguardando aprovação
        await Clients.Caller.SendAsync("JoinRequested", gameId);

        // Envia solicitação ao criador da sala
        if (hostId != null)
            await Clients.Client(hostId).SendAsync("JoinRequest");
    }

    // Criador aprova a entrada do candidato
    public async Task ApproveJoin(string gameId)
    {
        var (success, player2Id) = _gameService.ApproveJoin(gameId, Context.ConnectionId);
        if (!success || player2Id == null) return;

        var game = _gameService.GetGame(gameId)!;

        await Groups.AddToGroupAsync(Context.ConnectionId, gameId);
        await Groups.AddToGroupAsync(player2Id, gameId);

        await Clients.Client(game.Player1ConnectionId!)
            .SendAsync("GameStateUpdated", _gameService.ToDto(game, game.Player1ConnectionId));
        await Clients.Client(player2Id)
            .SendAsync("GameStateUpdated", _gameService.ToDto(game, player2Id));
    }

    // Criador recusa a entrada do candidato
    public async Task DenyJoin(string gameId)
    {
        var (success, requesterId) = _gameService.DenyJoin(gameId, Context.ConnectionId);
        if (!success || requesterId == null) return;

        await Clients.Client(requesterId).SendAsync("JoinDenied");
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

        if (game.Player1ConnectionId != null)
            await Clients.Client(game.Player1ConnectionId)
                .SendAsync("GameStateUpdated", _gameService.ToDto(game, game.Player1ConnectionId));
        if (game.Player2ConnectionId != null)
            await Clients.Client(game.Player2ConnectionId)
                .SendAsync("GameStateUpdated", _gameService.ToDto(game, game.Player2ConnectionId));
    }

    // Abandona a partida
    public async Task AbandonGame(string gameId)
    {
        var (success, opponentId) = _gameService.AbandonGame(gameId, Context.ConnectionId);
        if (!success) return;

        var game = _gameService.GetGame(gameId)!;

        await Clients.Caller.SendAsync("GameAbandoned");

        if (opponentId != null)
        {
            await Clients.Client(opponentId)
                .SendAsync("GameStateUpdated", _gameService.ToDto(game, opponentId));
            await Clients.Client(opponentId).SendAsync("OpponentAbandoned");
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
        // Notifica candidato pendente se o criador desconectou enquanto aguardava
        string? pendingRequesterId = _gameService.GetPendingRequester(Context.ConnectionId);
        if (pendingRequesterId != null)
            await Clients.Client(pendingRequesterId).SendAsync("JoinDenied");

        var game = _gameService.FindGameByConnection(Context.ConnectionId);

        _gameService.HandleDisconnect(Context.ConnectionId);

        if (game != null)
        {
            string? otherId = game.Player1ConnectionId == Context.ConnectionId
                ? game.Player2ConnectionId
                : game.Player1ConnectionId;

            if (otherId != null)
            {
                await Clients.Client(otherId)
                    .SendAsync("GameStateUpdated", _gameService.ToDto(game, otherId));

                if (game.Status == GameStatus.Finished && game.Winner.HasValue)
                    await Clients.Client(otherId).SendAsync("OpponentAbandoned");
            }
        }

        await base.OnDisconnectedAsync(exception);
    }
}
