# Jogo de Damas Online

Jogo de damas multiplayer em tempo real.  
**Backend**: C# / ASP.NET Core 8 + SignalR  
**Frontend**: React + Vite  
**Arquitetura**: MVC  

## Pré-requisitos

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/) e npm

## Como executar

### 1. Backend (terminal 1)

```bash
cd backend
dotnet run
```

Roda em `http://localhost:5000`

### 2. Frontend (terminal 2)

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:3000` no navegador.

## Como jogar

1. **Jogador 1** abre o navegador, clica em **Criar Nova Partida** e compartilha o código gerado.  
2. **Jogador 2** abre outro navegador (ou outra aba/aba anônima), cola o código e clica em **Entrar**.  
3. A partida começa! Vermelho sempre joga primeiro.

## Regras implementadas

- Tabuleiro 8×8, peças nas casas escuras
- Peças normais movem-se diagonalmente para frente
- **Captura obrigatória**: se houver captura disponível, deve ser feita
- **Captura múltipla**: a peça continua capturando enquanto houver alvos
- Promoção a **Dama** ao atingir a última fileira; damas movem em todas as diagonais
- Vitória: adversário sem peças ou sem movimentos válidos
- Tabuleiro **invertido para o Jogador 2** (suas peças sempre aparecem embaixo)
- Movimentos possíveis destacados ao selecionar uma peça

## Estrutura do código

```
backend/
├── Controllers/GameController.cs   ← API REST (listar/consultar partidas)
├── Hubs/GameHub.cs                 ← SignalR (tempo real)
├── Models/                         ← Peça, Movimento, Estado, DTOs
├── Services/GameService.cs         ← Toda a lógica do jogo
└── Program.cs

frontend/src/
├── components/
│   ├── Lobby.jsx       ← Criar/entrar em partida
│   ├── GameBoard.jsx   ← Tabuleiro (View)
│   ├── Cell.jsx        ← Casa individual
│   ├── GameInfo.jsx    ← Placar e turno
├── controllers/
│   └── gameController.js   ← Intermedia UI ↔ SignalR (Controller)
├── services/
│   └── signalRService.js   ← Conexão SignalR
└── App.jsx                 ← Orquestrador de estado (Model da View)
```
