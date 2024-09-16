import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket, OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {StripeMintStatus} from "@prisma/client";

@WebSocketGateway({
  namespace: '/socket/mint/status',
  cors: {
    origin: '*',
  },
})

export class MintSocket implements OnGatewayConnection{
  @WebSocketServer()
  server: Server;


  handleConnection(client: Socket) {
    const sessionId = client.handshake.query.sessionId;
    if (sessionId) {
      client.join(sessionId);
    }
  }


  emitToSession(sessionId: string, data: StripeMintStatus) {
    this.server.to(sessionId).emit('isMinted',  data );
  }


}
