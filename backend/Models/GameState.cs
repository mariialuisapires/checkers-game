namespace CheckersGame.Models;

public enum GameStatus { Waiting, Playing, Finished }

public class GameState
{
    public string GameId { get; set; } = Guid.NewGuid().ToString()[..8].ToUpper();
    public Piece?[,] Board { get; set; } = new Piece[8, 8];
    public PlayerColor CurrentPlayer { get; set; } = PlayerColor.Red;
    public GameStatus Status { get; set; } = GameStatus.Waiting;
    public PlayerColor? Winner { get; set; }
    public string? Player1ConnectionId { get; set; }
    public string? Player2ConnectionId { get; set; }
    public string? PendingJoinConnectionId { get; set; }
    public bool InMultiCapture { get; set; }
    public int? MultiCaptureRow { get; set; }
    public int? MultiCaptureCol { get; set; }
    public int RedPieces { get; set; } = 12;
    public int BlackPieces { get; set; } = 12;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
