namespace CheckersGame.Models;

public class Move
{
    public int FromRow { get; set; }
    public int FromCol { get; set; }
    public int ToRow { get; set; }
    public int ToCol { get; set; }
    public List<(int Row, int Col)> Captures { get; set; } = new();
    public bool IsCapture => Captures.Count > 0;
}
