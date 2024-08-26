import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {StripeMintStatus} from "@prisma/client";

@WebSocketGateway({
  namespace: '/socket/mint/status',
  cors: {
    origin: '*',
  },
})

export class MintSocket{
  @WebSocketServer()
  server: Server;

/*  // Este método se ejecuta cuando un cliente se conecta
  handleConnection(client: Socket) {
    const sessionId = client.handshake.query.sessionId; // Asume que el sessionId se pasa en la conexión
    if (sessionId) {
      client.join(sessionId); // El cliente se une a una sala con su sessionId
    }
  }*/


  emitToSession(sessionId: string, event: string, data: StripeMintStatus) {
    this.server.to(sessionId).emit(event, data);
  }

  @SubscribeMessage('isMinted')
  isMinted(@MessageBody() data: StripeMintStatus, @ConnectedSocket() client: Socket): {status: StripeMintStatus }  {
    return {status: data};
  }
}
