import { Request, Response } from 'express';
import prisma from '../config/db.js';

// GET /api/chats — list all conversations for the logged-in user
export async function listConversations(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;

    const conversations = await prisma.chatConversation.findMany({
      where: {
        OR: [{ founderId: userId }, { juniorProId: userId }],
      },
      include: {
        bounty: { select: { title: true } },
        founder: { select: { id: true, name: true, avatarUrl: true } },
        juniorPro: { select: { id: true, name: true, avatarUrl: true } },
        messages: { orderBy: { timestamp: 'desc' }, take: 1 },
      },
      orderBy: { lastMessageTime: 'desc' },
    });

    const result = conversations.map((c) => {
      const lastMsg = c.messages[0];
      // Count unread: messages not sent by current user since they last sent one
      // (simplified: all messages from the other party after the last message by current user)
      return {
        id: c.id,
        bountyId: c.bountyId,
        bountyTitle: c.bounty.title,
        founderId: c.founderId,
        founderName: c.founder.name,
        founderAvatarUrl: c.founder.avatarUrl,
        juniorProId: c.juniorProId,
        juniorProName: c.juniorPro.name,
        juniorProAvatarUrl: c.juniorPro.avatarUrl,
        lastMessage: lastMsg?.content || null,
        lastMessageTime: c.lastMessageTime.toISOString(),
        unreadCount: 0, // simplified — real unread tracking would need a read cursor
      };
    });

    res.json(result);
  } catch (err) {
    console.error('[listConversations]', err);
    res.status(500).json({ error: 'Failed to list conversations' });
  }
}

// GET /api/chats/:id/messages — get message history
export async function getMessages(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const conversationId = req.params.id as string;

    // Verify the user is part of this conversation
    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    if (conversation.founderId !== userId && conversation.juniorProId !== userId) {
      res.status(403).json({ error: 'Not authorized to view this conversation' });
      return;
    }

    const messages = await prisma.chatMessage.findMany({
      where: { conversationId },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
      orderBy: { timestamp: 'asc' },
    });

    res.json(
      messages.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        senderName: m.sender.name,
        senderRole: m.sender.role,
        content: m.content,
        imageUrl: m.imageUrl,
        timestamp: m.timestamp.toISOString(),
      })),
    );
  } catch (err) {
    console.error('[getMessages]', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
}

// POST /api/chats/:id/messages — send a message
export async function sendMessage(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const conversationId = req.params.id as string;
    const { content, imageUrl } = req.body;

    if (!content && !imageUrl) {
      res.status(400).json({ error: 'Message content or image is required' });
      return;
    }

    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    if (conversation.founderId !== userId && conversation.juniorProId !== userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const message = await prisma.chatMessage.create({
      data: {
        conversationId,
        senderId: userId,
        content: content || '',
        imageUrl: imageUrl || null,
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
    });

    // Update lastMessageTime on the conversation
    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: { lastMessageTime: message.timestamp },
    });

    res.status(201).json({
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderName: message.sender.name,
      senderRole: message.sender.role,
      content: message.content,
      imageUrl: message.imageUrl,
      timestamp: message.timestamp.toISOString(),
    });
  } catch (err) {
    console.error('[sendMessage]', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
}
