namespace CheckersGame.Models;

public class PieceDto
{
    public string Color { get; set; } = "";
    public string Type { get; set; } = "";
}

public class PositionDto
{
    public int Row { get; set; }
    public int Col { get; set; }
}

public class GameStateDto
{
    public string GameId { get; set; } = "";
    public List<List<PieceDto?>> Board { get; set; } = new();
    public string CurrentPlayer { get; set; } = "";
    public string Status { get; set; } = "";
    public string? Winner { get; set; }
    public bool InMultiCapture { get; set; }
    public PositionDto? MultiCapturePiece { get; set; }
    public int RedPieces { get; set; }
    public int BlackPieces { get; set; }
    public string? PlayerRole { get; set; }
    public string? ExpiresAt  { get; set; }  // ISO-8601, apenas para status=waiting
}

public class GameListItemDto
{
    public string GameId { get; set; } = "";
}
