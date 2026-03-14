import { Request, Response } from 'express';
import prisma from '../config/db.js';

function sanitizeUser(user: any) {
  const { passwordHash, ...rest } = user;
  return rest;
}

// GET /api/users/me
export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error('[getMe]', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

// PUT /api/users/me
export async function updateMe(req: Request, res: Response): Promise<void> {
  try {
    const allowedFields = [
      'name', 'bio', 'website', 'portfolioUrl', 'bannerColor', 'avatarUrl',
      'skills', 'cin', 'gstin', 'yearEstablished', 'industry',
      'officialEmail', 'contactPhone', 'address', 'companyDescription',
    ];

    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: updates,
    });

    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error('[updateMe]', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

// GET /api/users?ids=uuid1,uuid2
export async function getUsersByIds(req: Request, res: Response): Promise<void> {
  try {
    const idsParam = req.query.ids as string;
    if (!idsParam) {
      res.status(400).json({ error: 'ids query parameter is required' });
      return;
    }

    const ids = idsParam.split(',').map(id => id.trim()).filter(Boolean);
    if (ids.length === 0) {
      res.json({ users: [] });
      return;
    }

    const users = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        bio: true,
        skills: true,
        score: true,
        rating: true,
        industry: true,
      },
    });

    res.json({ users });
  } catch (err) {
    console.error('[getUsersByIds]', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

// GET /api/users/:userId/profile  — public profile with reviews & reliability score (works for both Business and JuniorPro)
export async function getPublicProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.params.userId as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        role: true,
        avatarUrl: true,
        bio: true,
        skills: true,
        portfolioUrl: true,
        bannerColor: true,
        industry: true,
        address: true,
        companyDescription: true,
        yearEstablished: true,
        gstin: true,
        website: true,
        officialEmail: true,
        score: true,
        rating: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.role === 'JuniorPro') {
      // ── JuniorPro profile: stats from bounties ──
      const completedBounties = await prisma.bounty.findMany({
        where: { claimedById: userId, status: 'COMPLETED' },
        include: {
          feedbacks: { where: { rating: { not: null } }, take: 1 },
          milestones: { orderBy: { createdAt: 'asc' } },
          founder: { select: { name: true, avatarUrl: true } },
        },
      });

      const allClaimedBounties = await prisma.bounty.findMany({
        where: { claimedById: userId, status: { in: ['IN_PROGRESS', 'REVIEW', 'REVISION_REQUESTED', 'COMPLETED'] } },
      });

      // Revision count: bounties that had REVISION_REQUESTED status (have revision feedback)
      const bountiesWithRevisions = await prisma.bountyFeedback.groupBy({
        by: ['bountyId'],
        where: {
          bounty: { claimedById: userId },
          rating: null, // non-review feedback = revision feedback
          sender: { role: 'Business' }, // founder-sent revision requests
        },
      });

      const totalMissions = completedBounties.length;
      const totalActive = allClaimedBounties.length;
      const revisionCount = bountiesWithRevisions.length;

      // Ratings from founder reviews on completed bounties
      const founderReviews = completedBounties
        .map(b => b.feedbacks[0])
        .filter(Boolean);

      const ratings = founderReviews.map(f => Number(f.rating));
      const avgRating = ratings.length > 0
        ? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10
        : 0;

      // Deadline adherence: completed bounties where completion was before deadline
      const onTimeBounties = completedBounties.filter(b => {
        if (!b.deadline) return true; // no deadline = on time
        return b.updatedAt <= b.deadline;
      });
      const deadlineAdherence = totalMissions > 0
        ? Math.round((onTimeBounties.length / totalMissions) * 100)
        : 0;

      const revisionRate = totalActive > 0
        ? Math.round((revisionCount / totalActive) * 100)
        : 0;

      // Reliability score for JuniorPro:
      // rating(40%) + deadline adherence(35%) + volume(15%) + consistency(10%)
      let reliabilityScore = 0;
      if (ratings.length > 0) {
        const ratingScore = (avgRating / 5) * 40;
        const deliveryScore = (deadlineAdherence / 100) * 35;
        const volumeBonus = (Math.min(ratings.length, 10) / 10) * 15;
        const mean = avgRating;
        const variance = ratings.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / ratings.length;
        const stddev = Math.sqrt(variance);
        const consistencyBonus = stddev < 0.5 ? 10 : (stddev < 1.0 ? 5 : 0);
        reliabilityScore = Math.min(Math.round(ratingScore + deliveryScore + volumeBonus + consistencyBonus), 100);
      }

      res.json({
        user: {
          ...user,
          score: Number(user.score),
          rating: Number(user.rating),
          createdAt: user.createdAt.toISOString(),
        },
        reviews: founderReviews.map(f => ({
          id: f.id,
          bountyId: f.bountyId,
          rating: Number(f.rating),
          comment: f.message,
          createdAt: f.createdAt.toISOString(),
        })),
        completedProjects: completedBounties.map(b => ({
          id: b.id,
          title: b.title,
          category: b.category,
          price: Number(b.price),
          completedAt: b.updatedAt.toISOString(),
          founderName: b.founder.name,
          founderAvatarUrl: b.founder.avatarUrl,
          rating: b.feedbacks[0] ? Number(b.feedbacks[0].rating) : null,
          reviewComment: b.feedbacks[0]?.message || null,
          milestones: b.milestones.map(m => ({
            id: m.id,
            title: m.title,
            status: m.status,
          })),
        })),
        stats: {
          reliabilityScore,
          avgRating,
          deadlineAdherence,
          totalMissions,
          revisionRate,
          totalReviews: ratings.length,
          onTimePercent: deadlineAdherence,
          totalDeals: totalMissions,
        },
      });
      return;
    }

    // ── Business profile: stats from negotiation reviews ──
    const reviews = await prisma.review.findMany({
      where: { revieweeId: userId },
      include: { reviewer: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const totalDeals = await prisma.negotiation.count({
      where: { toSellerId: userId, status: 'ACCEPTED' },
    });

    const totalReviews = reviews.length;
    let reliabilityScore = 0;
    let avgRating = 0;
    let onTimePercent = 0;

    if (totalReviews > 0) {
      const ratings = reviews.map(r => r.rating);
      avgRating = ratings.reduce((s, r) => s + r, 0) / totalReviews;
      avgRating = Math.round(avgRating * 10) / 10;

      const onTimeCount = reviews.filter(r => r.deliveredOnTime).length;
      onTimePercent = Math.round((onTimeCount / totalReviews) * 100);

      const ratingScore = (avgRating / 5) * 40;
      const deliveryScore = (onTimeCount / totalReviews) * 35;
      const volumeBonus = (Math.min(totalReviews, 10) / 10) * 15;
      const mean = avgRating;
      const variance = ratings.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / totalReviews;
      const stddev = Math.sqrt(variance);
      const consistencyBonus = stddev < 0.5 ? 10 : (stddev < 1.0 ? 5 : 0);

      reliabilityScore = Math.round(ratingScore + deliveryScore + volumeBonus + consistencyBonus);
      reliabilityScore = Math.min(reliabilityScore, 100);
    }

    res.json({
      user: {
        ...user,
        score: Number(user.score),
        rating: Number(user.rating),
        createdAt: user.createdAt.toISOString(),
      },
      reviews: reviews.map(r => ({
        id: r.id,
        negotiationId: r.negotiationId,
        reviewerId: r.reviewerId,
        reviewerName: r.reviewer.name,
        rating: r.rating,
        deliveredOnTime: r.deliveredOnTime,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
      })),
      stats: {
        reliabilityScore,
        avgRating,
        onTimePercent,
        totalDeals,
        totalReviews,
      },
    });
  } catch (err) {
    console.error('[getPublicProfile]', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}
