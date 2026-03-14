import { Request, Response } from 'express';
import prisma from '../config/db.js';

// GET /api/catalog — fetch catalog for logged-in business
export async function getCatalog(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const items = await prisma.businessCatalog.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = items.map(i => ({
      id: i.id,
      itemName: i.itemName,
      bulkQuantity: i.bulkQuantity,
      pricePerUnit: Number(i.pricePerUnit),
      status: i.status,
    }));

    res.json(mapped);
  } catch (err) {
    console.error('[getCatalog]', err);
    res.status(500).json({ error: 'Failed to fetch catalog' });
  }
}

// POST /api/catalog — add new inventory item
export async function addCatalogItem(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const { itemName, bulkQuantity, pricePerUnit, status } = req.body;

    if (!itemName || !bulkQuantity || pricePerUnit == null) {
      res.status(400).json({ error: 'itemName, bulkQuantity, and pricePerUnit are required' });
      return;
    }

    const item = await prisma.businessCatalog.create({
      data: {
        sellerId: userId,
        itemName,
        bulkQuantity: String(bulkQuantity),
        pricePerUnit,
        status: status || 'IN_STOCK',
      },
    });

    res.status(201).json({
      id: item.id,
      itemName: item.itemName,
      bulkQuantity: item.bulkQuantity,
      pricePerUnit: Number(item.pricePerUnit),
      status: item.status,
    });
  } catch (err) {
    console.error('[addCatalogItem]', err);
    res.status(500).json({ error: 'Failed to add catalog item' });
  }
}
