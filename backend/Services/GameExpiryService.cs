using CheckersGame.Hubs;
using CheckersGame.Services;
using Microsoft.AspNetCore.SignalR;

namespace CheckersGame.Services;

public class GameExpiryService : BackgroundService
{
    private readonly GameService _gameService;
    private readonly IHubContext<GameHub> _hubContext;

    private const int CheckIntervalMs = 60_000;

    public GameExpiryService(GameService gameService, IHubContext<GameHub> hubContext)
    {
        _gameService = gameService;
        _hubContext  = hubContext;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(CheckIntervalMs, stoppingToken);

            var expired = _gameService.ExpireWaitingGames(GameService.LobbyExpiryMinutes);

            foreach (var (hostId, pendingId) in expired)
            {
                if (hostId != null)
                    await _hubContext.Clients.Client(hostId)
                        .SendAsync("GameExpired", cancellationToken: stoppingToken);

                // Caso alguém estivesse aguardando aprovação, avisa também
                if (pendingId != null)
                    await _hubContext.Clients.Client(pendingId)
                        .SendAsync("JoinDenied", cancellationToken: stoppingToken);
            }
        }
    }
}
