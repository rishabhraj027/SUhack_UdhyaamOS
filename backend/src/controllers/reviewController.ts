import { Request, Response } from 'express';
import prisma from '../config/db.js';

// POST /api/reviews
export async function createReview(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const { negotiationId, rating, deliveredOnTime, comment } = req.body;

    if (!negotiationId || rating == null || deliveredOnTime == null) {
      res.status(400).json({ error: 'negotiationId, rating, and deliveredOnTime are required' });
      return;
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Rating must be between 1 and 5' });
      return;
    }

    // Verify negotiation exists and is ACCEPTED
    const negotiation = await prisma.negotiation.findUnique({ where: { id: negotiationId } });
    if (!negotiation) {
      res.status(404).json({ error: 'Negotiation not found' });
      return;
    }
    if (negotiation.status !== 'ACCEPTED') {
      res.status(400).json({ error: 'Can only review accepted deals' });
      return;
    }
    // Only the buyer can review
    if (negotiation.fromBuyerId !== userId) {
      res.status(403).json({ error: 'Only the buyer can leave a review' });
      return;
    }

    // Check no existing review
    const existing = await prisma.review.findUnique({ where: { negotiationId } });
    if (existing) {
      res.status(409).json({ error: 'A review already exists for this deal' });
      return;
    }

    const review = await prisma.review.create({
      data: {
        negotiationId,
        reviewerId: userId,
        revieweeId: negotiation.toSellerId,
        rating: Number(rating),
        deliveredOnTime: Boolean(deliveredOnTime),
        comment: comment || '',
      },
      include: {
        reviewer: { select: { name: true } },
      },
    });

    // Recalculate seller's average rating
    const allReviews = await prisma.review.findMany({
      where: { revieweeId: negotiation.toSellerId },
      select: { rating: true },
    });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await prisma.user.update({
      where: { id: negotiation.toSellerId },
      data: { rating: Math.round(avgRating * 10) / 10 },
    });

    res.status(201).json({
      id: review.id,
      negotiationId: review.negotiationId,
      reviewerId: review.reviewerId,
      reviewerName: review.reviewer.name,
      rating: review.rating,
      deliveredOnTime: review.deliveredOnTime,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
    });
  } catch (err) {
    console.error('[createReview]', err);
    res.status(500).json({ error: 'Failed to create review' });
  }
}

// GET /api/reviews/user/:userId
export async function getReviewsForUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.params.userId as string;

    const reviews = await prisma.review.findMany({
      where: { revieweeId: userId },
      include: {
        reviewer: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(reviews.map(r => ({
      id: r.id,
      negotiationId: r.negotiationId,
      reviewerId: r.reviewerId,
      reviewerName: r.reviewer.name,
      rating: r.rating,
      deliveredOnTime: r.deliveredOnTime,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    })));
  } catch (err) {
    console.error('[getReviewsForUser]', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
}
