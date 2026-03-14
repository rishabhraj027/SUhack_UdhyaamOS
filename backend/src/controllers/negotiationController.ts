import { Request, Response } from 'express';
import prisma from '../config/db.js';

function mapNegotiation(n: any) {
  return {
    id: n.id,
    listingId: n.listingId,
    listingItemName: n.listing?.itemName || '',
    fromBuyer: n.fromBuyerId,
    fromBuyerName: n.buyer?.name || '',
    toSeller: n.toSellerId,
    toSellerName: n.seller?.name || '',
    originalPrice: Number(n.originalPrice),
    offerPrice: Number(n.offerPrice),
    quantity: n.quantity,
    message: n.message,
    status: n.status,
    createdAt: n.createdAt.toISOString(),
    counterResponse: n.counterResponse || undefined,
    hasReview: !!n.review,
  };
}

// GET /api/negotiations
export async function getNegotiations(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;

    const negotiations = await prisma.negotiation.findMany({
      where: {
        OR: [{ fromBuyerId: userId }, { toSellerId: userId }],
      },
      include: {
        listing: { select: { itemName: true } },
        buyer: { select: { name: true } },
        seller: { select: { name: true } },
        review: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(negotiations.map(mapNegotiation));
  } catch (err) {
    console.error('[getNegotiations]', err);
    res.status(500).json({ error: 'Failed to fetch negotiations' });
  }
}

// POST /api/negotiations
export async function createNegotiation(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const { listingId, offerPrice, quantity, message } = req.body;

    if (!listingId || offerPrice == null) {
      res.status(400).json({ error: 'listingId and offerPrice are required' });
      return;
    }

    const listing = await prisma.marketplaceListing.findUnique({ where: { id: listingId } });
    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }
    if (listing.sellerId === userId) {
      res.status(400).json({ error: 'Cannot negotiate on your own listing' });
      return;
    }

    const negotiation = await prisma.negotiation.create({
      data: {
        listingId,
        fromBuyerId: userId,
        toSellerId: listing.sellerId,
        originalPrice: listing.pricePerUnit,
        offerPrice,
        quantity: quantity ? String(quantity) : '1',
        message: message || '',
      },
      include: {
        listing: { select: { itemName: true } },
        buyer: { select: { name: true } },
        seller: { select: { name: true } },
        review: { select: { id: true } },
      },
    });

    res.status(201).json(mapNegotiation(negotiation));
  } catch (err) {
    console.error('[createNegotiation]', err);
    res.status(500).json({ error: 'Failed to create negotiation' });
  }
}

// PUT /api/negotiations/:id/respond
export async function respondNegotiation(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const id = req.params.id as string;
    const { action, counterPrice, counterMessage } = req.body;

    if (!action || !['ACCEPTED', 'REJECTED', 'COUNTERED'].includes(action)) {
      res.status(400).json({ error: 'action must be ACCEPTED, REJECTED, or COUNTERED' });
      return;
    }

    const negotiation = await prisma.negotiation.findUnique({ where: { id } });
    if (!negotiation) {
      res.status(404).json({ error: 'Negotiation not found' });
      return;
    }

    // Only the seller or buyer involved can respond
    if (negotiation.toSellerId !== userId && negotiation.fromBuyerId !== userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const updateData: any = { status: action };

    if (action === 'COUNTERED' && counterPrice != null) {
      updateData.counterResponse = {
        price: counterPrice,
        message: counterMessage || '',
        createdAt: new Date().toISOString(),
      };
    }

    const updated = await prisma.negotiation.update({
      where: { id },
      data: updateData,
      include: {
        listing: { select: { itemName: true } },
        buyer: { select: { name: true } },
        seller: { select: { name: true } },
        review: { select: { id: true } },
      },
    });

    res.json(mapNegotiation(updated));
  } catch (err) {
    console.error('[respondNegotiation]', err);
    res.status(500).json({ error: 'Failed to respond to negotiation' });
  }
}
