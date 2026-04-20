using CheckersGame.Models;

namespace CheckersGame.Services;

public class GameService
{
    private readonly Dictionary<string, GameState> _games = new();

    public GameState CreateGame(string connectionId)
    {
        var game = new GameState();
        game.Player1ConnectionId = connectionId;
        InitializeBoard(game);
        _games[game.GameId] = game;
        return game;
    }

    public GameState? GetGame(string gameId) =>
        _games.TryGetValue(gameId, out var g) ? g : null;

    public IEnumerable<GameState> GetOpenGames() =>
        _games.Values.Where(g => g.Status == GameStatus.Waiting);

    public GameState? FindGameByConnection(string connectionId) =>
        _games.Values.FirstOrDefault(g =>
            g.Player1ConnectionId == connectionId ||
            g.Player2ConnectionId == connectionId);

    // Solicita entrada: guarda o candidato para aprovação do criador
    public (bool Success, string? HostId, string? Error) RequestJoin(string gameId, string requesterId)
    {
        var game = GetGame(gameId);
        if (game == null)
            return (false, null, "Jogo não encontrado. Verifique o código.");
        if (game.Player1ConnectionId == requesterId)
            return (false, null, "Você criou esta partida. Aguarde outro jogador.");
        if (game.Status == GameStatus.Playing)
            return (false, null, "Esta partida já está em andamento.");
        if (game.Status == GameStatus.Finished)
            return (false, null, "Esta partida já foi encerrada.");
        if (game.PendingJoinConnectionId != null)
            return (false, null, "Já há uma solicitação pendente para esta partida.");

        game.PendingJoinConnectionId = requesterId;
        return (true, game.Player1ConnectionId, null);
    }

    // Criador aprova a entrada do candidato
    public (bool Success, string? Player2Id) ApproveJoin(string gameId, string hostId)
    {
        var game = GetGame(gameId);
        if (game == null || game.Player1ConnectionId != hostId) return (false, null);
        if (game.PendingJoinConnectionId == null) return (false, null);

        var player2Id = game.PendingJoinConnectionId;
        game.Player2ConnectionId = player2Id;
        game.PendingJoinConnectionId = null;
        game.Status = GameStatus.Playing;
        return (true, player2Id);
    }

    // Criador recusa a entrada do candidato
    public (bool Success, string? RequesterId) DenyJoin(string gameId, string hostId)
    {
        var game = GetGame(gameId);
        if (game == null || game.Player1ConnectionId != hostId) return (false, null);

        var requesterId = game.PendingJoinConnectionId;
        game.PendingJoinConnectionId = null;
        return (true, requesterId);
    }

    // Retorna o ID do candidato pendente de um jogo cujo host desconectou
    public string? GetPendingRequester(string hostConnectionId)
    {
        var game = _games.Values.FirstOrDefault(g => g.Player1ConnectionId == hostConnectionId);
        return game?.PendingJoinConnectionId;
    }

    private static void InitializeBoard(GameState game)
    {
        // Jogador 1 (Vermelho) começa nas linhas 0–2 (casas escuras)
        for (int r = 0; r < 3; r++)
            for (int c = 0; c < 8; c++)
                if ((r + c) % 2 == 1)
                    game.Board[r, c] = new Piece(PlayerColor.Red);

        // Jogador 2 (Preto) começa nas linhas 5–7 (casas escuras)
        for (int r = 5; r < 8; r++)
            for (int c = 0; c < 8; c++)
                if ((r + c) % 2 == 1)
                    game.Board[r, c] = new Piece(PlayerColor.Black);
    }

    // Retorna posições de destino válidas para a peça em (row, col)
    public List<PositionDto> GetValidMoveTargets(GameState game, int row, int col) =>
        GetValidMoves(game, row, col)
            .Select(m => new PositionDto { Row = m.ToRow, Col = m.ToCol })
            .ToList();

    private List<Move> GetValidMoves(GameState game, int row, int col)
    {
        var piece = game.Board[row, col];
        if (piece == null || piece.Color != game.CurrentPlayer)
            return new();

        // Durante captura múltipla só a peça designada pode mover
        if (game.InMultiCapture)
        {
            if (game.MultiCaptureRow != row || game.MultiCaptureCol != col)
                return new();
            return GetCaptures(game, row, col);
        }

        // Jogador escolhe livremente: movimentos simples + capturas disponíveis
        var moves = GetSimpleMoves(game, row, col);
        moves.AddRange(GetCaptures(game, row, col));
        return moves;
    }

    private bool HasAnyCapture(GameState game, PlayerColor player)
    {
        for (int r = 0; r < 8; r++)
            for (int c = 0; c < 8; c++)
            {
                var p = game.Board[r, c];
                if (p?.Color == player && GetCaptures(game, r, c).Count > 0)
                    return true;
            }
        return false;
    }

    private List<Move> GetSimpleMoves(GameState game, int row, int col)
    {
        var piece = game.Board[row, col];
        if (piece == null) return new();

        var moves = new List<Move>();
        foreach (var (dr, dc) in GetDirections(piece))
        {
            int nr = row + dr, nc = col + dc;
            if (InBounds(nr, nc) && game.Board[nr, nc] == null)
                moves.Add(new Move { FromRow = row, FromCol = col, ToRow = nr, ToCol = nc });
        }
        return moves;
    }

    private List<Move> GetCaptures(GameState game, int row, int col)
    {
        var piece = game.Board[row, col];
        if (piece == null) return new();

        var captures = new List<Move>();
        foreach (var (dr, dc) in GetDirections(piece))
        {
            int mr = row + dr, mc = col + dc;   // posição da peça adversária
            int lr = row + 2 * dr, lc = col + 2 * dc; // posição de pouso

            if (InBounds(lr, lc)
                && game.Board[mr, mc] != null
                && game.Board[mr, mc]!.Color != piece.Color
                && game.Board[lr, lc] == null)
            {
                var cap = new Move { FromRow = row, FromCol = col, ToRow = lr, ToCol = lc };
                cap.Captures.Add((mr, mc));
                captures.Add(cap);
            }
        }
        return captures;
    }

    private static IEnumerable<(int dr, int dc)> GetDirections(Piece piece)
    {
        if (piece.Type == PieceType.King)
            return new[] { (-1, -1), (-1, 1), (1, -1), (1, 1) };

        // Vermelho move para baixo (linha cresce), Preto move para cima
        return piece.Color == PlayerColor.Red
            ? new[] { (1, -1), (1, 1) }
            : new[] { (-1, -1), (-1, 1) };
    }

    private static bool InBounds(int r, int c) => r is >= 0 and < 8 && c is >= 0 and < 8;

    public (bool Success, string? Error) ExecuteMove(
        GameState game, int fromRow, int fromCol, int toRow, int toCol)
    {
        if (game.Status != GameStatus.Playing)
            return (false, "Jogo não está ativo");

        var validMoves = GetValidMoves(game, fromRow, fromCol);
        var move = validMoves.FirstOrDefault(m => m.ToRow == toRow && m.ToCol == toCol);
        if (move == null)
            return (false, "Movimento inválido");

        var piece = game.Board[fromRow, fromCol]!;
        game.Board[fromRow, fromCol] = null;
        game.Board[toRow, toCol] = piece;

        // Remove peças capturadas
        foreach (var (r, c) in move.Captures)
        {
            game.Board[r, c] = null;
            if (game.CurrentPlayer == PlayerColor.Red) game.BlackPieces--;
            else game.RedPieces--;
        }

        // Promoção a dama
        bool promoted = false;
        if (piece.Type == PieceType.Normal)
        {
            if ((piece.Color == PlayerColor.Red && toRow == 7) ||
                (piece.Color == PlayerColor.Black && toRow == 0))
            {
                piece.Type = PieceType.King;
                promoted = true;
            }
        }

        // Captura múltipla: se houver mais capturas disponíveis (e sem promoção)
        if (move.IsCapture && !promoted)
        {
            var further = GetCaptures(game, toRow, toCol);
            if (further.Count > 0)
            {
                game.InMultiCapture = true;
                game.MultiCaptureRow = toRow;
                game.MultiCaptureCol = toCol;
                return (true, null);
            }
        }

        // Encerra captura múltipla e passa o turno
        game.InMultiCapture = false;
        game.MultiCaptureRow = null;
        game.MultiCaptureCol = null;
        game.CurrentPlayer = game.CurrentPlayer == PlayerColor.Red
            ? PlayerColor.Black
            : PlayerColor.Red;

        CheckWinCondition(game);
        return (true, null);
    }

    private void CheckWinCondition(GameState game)
    {
        if (game.RedPieces == 0)
        {
            game.Status = GameStatus.Finished;
            game.Winner = PlayerColor.Black;
            return;
        }
        if (game.BlackPieces == 0)
        {
            game.Status = GameStatus.Finished;
            game.Winner = PlayerColor.Red;
            return;
        }

        // Verifica se o jogador atual tem algum movimento válido (simples ou captura)
        bool hasAnyMove = false;

        for (int r = 0; r < 8 && !hasAnyMove; r++)
            for (int c = 0; c < 8 && !hasAnyMove; c++)
            {
                var p = game.Board[r, c];
                if (p?.Color == game.CurrentPlayer)
                    hasAnyMove = GetSimpleMoves(game, r, c).Count > 0
                              || GetCaptures(game, r, c).Count > 0;
            }

        if (!hasAnyMove)
        {
            game.Status = GameStatus.Finished;
            game.Winner = game.CurrentPlayer == PlayerColor.Red
                ? PlayerColor.Black
                : PlayerColor.Red;
        }
    }

    public GameStateDto ToDto(GameState game, string? connectionId = null)
    {
        var board = new List<List<PieceDto?>>();
        for (int r = 0; r < 8; r++)
        {
            var row = new List<PieceDto?>();
            for (int c = 0; c < 8; c++)
            {
                var p = game.Board[r, c];
                row.Add(p == null ? null : new PieceDto
                {
                    Color = p.Color == PlayerColor.Red ? "red" : "black",
                    Type = p.Type == PieceType.King ? "king" : "normal"
                });
            }
            board.Add(row);
        }

        string? role = connectionId == game.Player1ConnectionId ? "red"
                     : connectionId == game.Player2ConnectionId ? "black"
                     : null;

        return new GameStateDto
        {
            GameId = game.GameId,
            Board = board,
            CurrentPlayer = game.CurrentPlayer == PlayerColor.Red ? "red" : "black",
            Status = game.Status.ToString().ToLower(),
            Winner = game.Winner.HasValue
                ? (game.Winner == PlayerColor.Red ? "red" : "black")
                : null,
            InMultiCapture = game.InMultiCapture,
            MultiCapturePiece = game.InMultiCapture && game.MultiCaptureRow.HasValue
                ? new PositionDto { Row = game.MultiCaptureRow.Value, Col = game.MultiCaptureCol!.Value }
                : null,
            RedPieces = game.RedPieces,
            BlackPieces = game.BlackPieces,
            PlayerRole = role
        };
    }

    public (bool Success, string? OpponentConnectionId) AbandonGame(string gameId, string connectionId)
    {
        var game = GetGame(gameId);
        if (game == null || game.Status == GameStatus.Finished)
            return (false, null);

        string? opponentId = game.Player1ConnectionId == connectionId
            ? game.Player2ConnectionId
            : game.Player2ConnectionId == connectionId
                ? game.Player1ConnectionId
                : null;

        if (game.Status == GameStatus.Playing)
        {
            // Quem abandonou perde; oponente vence
            game.Status = GameStatus.Finished;
            game.Winner = game.Player1ConnectionId == connectionId
                ? PlayerColor.Black
                : PlayerColor.Red;
        }
        else
        {
            // Sala em espera: simplesmente encerra sem vencedor
            game.Status = GameStatus.Finished;
        }

        return (true, opponentId);
    }

    public void HandleDisconnect(string connectionId)
    {
        var game = _games.Values.FirstOrDefault(g =>
            g.Player1ConnectionId == connectionId || g.Player2ConnectionId == connectionId);

        if (game == null || game.Status == GameStatus.Finished) return;

        // Só encerra a partida se ambos os jogadores já estavam conectados (Playing).
        // Enquanto aguarda o 2º jogador (Waiting), o criador pode reconectar sem perder a sala.
        if (game.Status != GameStatus.Playing) return;

        game.Status = GameStatus.Finished;
        game.Winner = game.Player1ConnectionId == connectionId
            ? PlayerColor.Black
            : PlayerColor.Red;
    }
}
