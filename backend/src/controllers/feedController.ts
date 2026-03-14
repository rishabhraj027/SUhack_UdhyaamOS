import { Request, Response } from 'express';
import prisma from '../config/db.js';

// GET /api/feed — paginated list of feed posts with nested replies
export async function listPosts(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const tag = req.query.tag as string | undefined;

    const where = tag ? { tags: { has: tag } } : {};

    const posts = await prisma.feedPost.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
        replies: {
          include: {
            author: { select: { id: true, name: true, avatarUrl: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        likes: { where: { userId }, select: { userId: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    res.json(
      posts.map((p) => ({
        id: p.id,
        authorId: p.authorId,
        authorName: p.author.name,
        authorAvatarUrl: p.author.avatarUrl,
        authorRole: p.author.role,
        content: p.content,
        tags: p.tags,
        likes: p.likesCount,
        liked: p.likes.length > 0,
        createdAt: p.createdAt.toISOString(),
        replies: p.replies.map((r) => ({
          id: r.id,
          authorId: r.authorId,
          authorName: r.author.name,
          authorAvatarUrl: r.author.avatarUrl,
          authorRole: r.author.role,
          content: r.content,
          likes: r.likesCount,
          createdAt: r.createdAt.toISOString(),
        })),
      })),
    );
  } catch (err) {
    console.error('[listPosts]', err);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
}

// POST /api/feed — create a new post
export async function createPost(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { content, tags } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ error: 'Content is required' });
      return;
    }

    const post = await prisma.feedPost.create({
      data: {
        authorId: userId,
        content: content.trim(),
        tags: Array.isArray(tags) ? tags.map((t: string) => t.toLowerCase().trim()).filter(Boolean) : [],
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
      },
    });

    res.status(201).json({
      id: post.id,
      authorId: post.authorId,
      authorName: post.author.name,
      authorAvatarUrl: post.author.avatarUrl,
      authorRole: post.author.role,
      content: post.content,
      tags: post.tags,
      likes: 0,
      liked: false,
      createdAt: post.createdAt.toISOString(),
      replies: [],
    });
  } catch (err) {
    console.error('[createPost]', err);
    res.status(500).json({ error: 'Failed to create post' });
  }
}

// POST /api/feed/:id/like — toggle like
export async function toggleLike(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const postId = req.params.id as string;

    const post = await prisma.feedPost.findUnique({ where: { id: postId } });
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const existing = await prisma.postLike.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      // Unlike
      await prisma.postLike.delete({ where: { userId_postId: { userId, postId } } });
      await prisma.feedPost.update({ where: { id: postId }, data: { likesCount: { decrement: 1 } } });
      res.json({ liked: false, likes: post.likesCount - 1 });
    } else {
      // Like
      await prisma.postLike.create({ data: { userId, postId } });
      await prisma.feedPost.update({ where: { id: postId }, data: { likesCount: { increment: 1 } } });
      res.json({ liked: true, likes: post.likesCount + 1 });
    }
  } catch (err) {
    console.error('[toggleLike]', err);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
}

// POST /api/feed/:id/replies — post a reply
export async function createReply(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const postId = req.params.id as string;
    const { content } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ error: 'Content is required' });
      return;
    }

    const post = await prisma.feedPost.findUnique({ where: { id: postId } });
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const reply = await prisma.feedReply.create({
      data: {
        postId,
        authorId: userId,
        content: content.trim(),
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
      },
    });

    res.status(201).json({
      id: reply.id,
      authorId: reply.authorId,
      authorName: reply.author.name,
      authorAvatarUrl: reply.author.avatarUrl,
      authorRole: reply.author.role,
      content: reply.content,
      likes: 0,
      createdAt: reply.createdAt.toISOString(),
    });
  } catch (err) {
    console.error('[createReply]', err);
    res.status(500).json({ error: 'Failed to create reply' });
  }
}

// DELETE /api/feed/:id — delete own post
export async function deletePost(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const postId = req.params.id as string;

    const post = await prisma.feedPost.findUnique({ where: { id: postId } });
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    if (post.authorId !== userId) {
      res.status(403).json({ error: 'Can only delete your own posts' });
      return;
    }

    await prisma.feedPost.delete({ where: { id: postId } });
    res.json({ success: true });
  } catch (err) {
    console.error('[deletePost]', err);
    res.status(500).json({ error: 'Failed to delete post' });
  }
}

// DELETE /api/feed/:id/replies/:replyId — delete own reply
export async function deleteReply(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const replyId = req.params.replyId as string;

    const reply = await prisma.feedReply.findUnique({ where: { id: replyId } });
    if (!reply) {
      res.status(404).json({ error: 'Reply not found' });
      return;
    }
    if (reply.authorId !== userId) {
      res.status(403).json({ error: 'Can only delete your own replies' });
      return;
    }

    await prisma.feedReply.delete({ where: { id: replyId } });
    res.json({ success: true });
  } catch (err) {
    console.error('[deleteReply]', err);
    res.status(500).json({ error: 'Failed to delete reply' });
  }
}

// GET /api/feed/trending — aggregate tag frequencies from recent posts
export async function getTrending(req: Request, res: Response): Promise<void> {
  try {
    // Get posts from the last 7 days
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const posts = await prisma.feedPost.findMany({
      where: { createdAt: { gte: since } },
      select: { tags: true },
    });

    const tagCounts: Record<string, number> = {};
    for (const post of posts) {
      for (const tag of post.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    const trending = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    res.json(trending);
  } catch (err) {
    console.error('[getTrending]', err);
    res.status(500).json({ error: 'Failed to fetch trending tags' });
  }
}
