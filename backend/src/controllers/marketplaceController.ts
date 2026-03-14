import { Request, Response } from 'express';
import prisma from '../config/db.js';

// Helper to map DB listing to frontend shape
function mapListing(l: any, currentUserId?: string) {
  const contact = (l.sellerContactConfig as any) || {};
  return {
    id: l.id,
    sellerId: l.sellerId,
    itemName: l.itemName,
    description: l.description,
    category: l.category,
    bulkQuantity: l.bulkQuantity,
    pricePerUnit: Number(l.pricePerUnit),
    minOrderQty: l.minOrderQty,
    location: l.location,
    sellerName: l.seller?.name || '',
    sellerContact: {
      phone: contact.phone || '',
      email: contact.email || '',
    },
    status: l.status,
    createdAt: l.createdAt.toISOString(),
    isOwn: currentUserId ? l.sellerId === currentUserId : false,
  };
}

// GET /api/marketplace
export async function getMarketplace(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    const listings = await prisma.marketplaceListing.findMany({
      where: { status: 'ACTIVE' },
      include: { seller: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    // Also include the current user's non-ACTIVE listings so they see their own
    let ownNonActive: any[] = [];
    if (userId) {
      ownNonActive = await prisma.marketplaceListing.findMany({
        where: { sellerId: userId, status: { not: 'ACTIVE' } },
        include: { seller: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    const all = [...listings, ...ownNonActive];
    res.json(all.map(l => mapListing(l, userId)));
  } catch (err) {
    console.error('[getMarketplace]', err);
    res.status(500).json({ error: 'Failed to fetch marketplace' });
  }
}

// POST /api/marketplace
export async function createListing(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const { itemName, description, category, location, bulkQuantity, minOrderQty, pricePerUnit, sellerContact, status } = req.body;

    if (!itemName || !bulkQuantity || pricePerUnit == null) {
      res.status(400).json({ error: 'itemName, bulkQuantity, and pricePerUnit are required' });
      return;
    }

    const listing = await prisma.marketplaceListing.create({
      data: {
        sellerId: userId,
        itemName,
        description: description || '',
        category: category || 'Other',
        location: location || '',
        bulkQuantity: String(bulkQuantity),
        minOrderQty: minOrderQty ? String(minOrderQty) : '1',
        pricePerUnit,
        sellerContactConfig: sellerContact || {},
        status: status || 'ACTIVE',
      },
      include: { seller: { select: { name: true } } },
    });

    res.status(201).json(mapListing(listing, userId));
  } catch (err) {
    console.error('[createListing]', err);
    res.status(500).json({ error: 'Failed to create listing' });
  }
}

// DELETE /api/marketplace/:id
export async function deleteListing(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const id = req.params.id as string;

    const listing = await prisma.marketplaceListing.findUnique({ where: { id } });
    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }
    if (listing.sellerId !== userId) {
      res.status(403).json({ error: 'Not authorized to delete this listing' });
      return;
    }

    await prisma.marketplaceListing.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error('[deleteListing]', err);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
}
