import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ReplynotificationService } from './replynotification.service';

@WebSocketGateway({
  cors: {
    origin: '*', // Cấu hình CORS theo yêu cầu bảo mật của bạn
  },
})
export class ReplynotificationGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly replynotificationService: ReplynotificationService,
  ) {}

  afterInit(server: Server) {
    this.replynotificationService.setSocketServer(server);
  }

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      client.join(`user:${userId}`);
      console.log(`Client ${client.id} connected for user ${userId}`);
    } else {
      console.log(`Client ${client.id} connected without userId`);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('getNotifications')
  async handleGetNotifications(
    @MessageBody() data: { userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId } = data;
    try {
      const notifications =
        await this.replynotificationService.findAllNotificationByUser(userId);
      client.emit('notifications', notifications);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('markNotificationAsSeen')
  async handleMarkNotificationAsSeen(
    @MessageBody() data: { id: number; userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const { id, userId } = data;
    try {
      await this.replynotificationService.updateNotification(id);
      // Re-emit the updated list of notifications to the user
      const notifications =
        await this.replynotificationService.findAllNotificationByUser(userId);
      this.server.to(`user:${userId}`).emit('notifications', notifications);
    } catch (error) {
      console.error('Error marking notification as seen:', error.message);
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('deleteNotification')
  async handleDeleteNotification(
    @MessageBody() data: { id: number; userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const { id, userId } = data;
    try {
      await this.replynotificationService.deleteReplyNotification(id);
      // Re-emit the updated list of notifications to the user
      const notifications =
        await this.replynotificationService.findAllNotificationByUser(userId);
      this.server.to(`user:${userId}`).emit('notifications', notifications);
    } catch (error) {
      console.error('Error deleting notification:', error.message);
      client.emit('error', { message: error.message });
    }
  }
}
