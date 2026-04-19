import * as signalR from '@microsoft/signalr';

let connection = null;

export function createConnection() {
  connection = new signalR.HubConnectionBuilder()
    .withUrl('http://localhost:5000/gamehub')
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();
  return connection;
}

export async function startConnection() {
  if (!connection) createConnection();
  if (connection.state === signalR.HubConnectionState.Disconnected) {
    await connection.start();
  }
  return connection;
}
