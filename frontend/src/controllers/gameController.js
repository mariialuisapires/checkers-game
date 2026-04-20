// Controller MVC: intermedia as interações do usuário com o servidor via SignalR
export class GameController {
  constructor(connection) {
    this.connection = connection;
  }

  createGame() {
    return this.connection.invoke('CreateGame');
  }

  requestJoin(gameId) {
    return this.connection.invoke('RequestJoin', gameId);
  }

  approveJoin(gameId) {
    return this.connection.invoke('ApproveJoin', gameId);
  }

  denyJoin(gameId) {
    return this.connection.invoke('DenyJoin', gameId);
  }

  selectPiece(gameId, row, col) {
    return this.connection.invoke('SelectPiece', gameId, row, col);
  }

  makeMove(gameId, fromRow, fromCol, toRow, toCol) {
    return this.connection.invoke('MakeMove', gameId, fromRow, fromCol, toRow, toCol);
  }

  abandonGame(gameId) {
    return this.connection.invoke('AbandonGame', gameId);
  }

  rejoinLobby(gameId) {
    return this.connection.invoke('RejoinLobby', gameId);
  }

  getOpenGames() {
    return this.connection.invoke('GetOpenGames');
  }
}
