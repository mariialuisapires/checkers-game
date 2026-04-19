namespace CheckersGame.Models;

public enum PieceType { Normal, King }
public enum PlayerColor { Red, Black }

public class Piece
{
    public PieceType Type { get; set; } = PieceType.Normal;
    public PlayerColor Color { get; set; }

    public Piece(PlayerColor color) => Color = color;
}
