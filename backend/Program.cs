using CheckersGame.Hubs;
using CheckersGame.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddSingleton<GameService>();
builder.Services.AddHostedService<GameExpiryService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy =>
    {
        policy
            .WithOrigins("http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

app.UseCors("ReactApp");
app.UseRouting();
app.MapControllers();
app.MapHub<GameHub>("/gamehub");

app.Run("http://localhost:5000");
