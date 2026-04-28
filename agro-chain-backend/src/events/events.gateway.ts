// src/events/events.gateway.ts
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } }) 
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`নতুন ইউজার কানেক্ট হয়েছে: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`ইউজার ডিসকানেক্ট হয়েছে: ${client.id}`);
  }

  
  broadcastMarketUpdate(lots: any) {
    this.server.emit('market_updated', {
      success: true,
      message: 'মার্কেট আপডেট হয়েছে!',
      data: lots
    });
  }
}