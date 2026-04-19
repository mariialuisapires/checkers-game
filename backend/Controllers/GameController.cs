using CheckersGame.Services;
using Microsoft.AspNetCore.Mvc;

namespace CheckersGame.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GameController : ControllerBase
{
    private readonly GameService _gameService;

    public GameController(GameService gameService) => _gameService = gameService;

    [HttpGet]
    public IActionResult GetOpenGames()
    {
        var games = _gameService.GetOpenGames()
            .Select(g => new { gameId = g.GameId, status = "waiting" });
        return Ok(games);
    }

    [HttpGet("{gameId}")]
    public IActionResult GetGame(string gameId)
    {
        var game = _gameService.GetGame(gameId);
        if (game == null) return NotFound();
        return Ok(_gameService.ToDto(game));
    }
}
