import { Server } from 'socket.io';
import { prisma } from './config/prisma';
import { verifyToken } from './utils/jwt';
import { stripSensitive } from './utils/sanitize';
import { IncomingMessage } from 'http';

export function initSocket(server: any, clientOrigin: string) {
  const io = new Server(server, {
    cors: {
      origin: clientOrigin,
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return next(new Error('unauthorized'));
      }
      const payload = verifyToken(token);
      socket.data.user = payload;
      return next();
    } catch {
      return next(new Error('unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.data.user?.id as string;
    if (userId) {
      await prisma.user.update({ where: { id: userId }, data: { online: true, lastSeen: new Date() } });
      socket.broadcast.emit('user:online', { userId });
    }

    socket.on('conversation:join', (conversationId: string) => {
      socket.join(conversationId);
    });

    socket.on('message:typing', (payload: { conversationId: string; isTyping: boolean }) => {
      socket.to(payload.conversationId).emit('message:typing', { userId, ...payload });
    });

    socket.on('message:send', async (payload: { conversationId: string; content: string }) => {
      const message = await prisma.message.create({
        data: {
          conversationId: payload.conversationId,
          senderId: userId,
          content: payload.content
        },
        include: { sender: true }
      });

      await prisma.conversation.update({
        where: { id: payload.conversationId },
        data: { updatedAt: new Date() }
      });

      io.to(payload.conversationId).emit('message:new', stripSensitive(message));
    });

    socket.on('disconnect', async () => {
      if (userId) {
        await prisma.user.update({ where: { id: userId }, data: { online: false, lastSeen: new Date() } });
        socket.broadcast.emit('user:offline', { userId });
      }
    });
  });

  return io;
}
