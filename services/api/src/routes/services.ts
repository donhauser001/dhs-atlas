import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '@dhs-atlas/database';
import { service } from '@dhs-atlas/database/schema';
import { eq, and, ilike } from 'drizzle-orm';
import { logEvent } from '@dhs-atlas/event-log';

export const services = new Hono();

// Schemas
const createServiceSchema = z.object({
  name: z.string().min(1).max(256),
  description: z.string().optional(),
  serviceType: z.string().min(1).max(64),
  pricingModel: z.record(z.unknown()).optional(),
});

const updateServiceSchema = z.object({
  name: z.string().min(1).max(256).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  pricingModel: z.record(z.unknown()).optional(),
});

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
});

// List services
services.get('/', zValidator('query', querySchema), async (c) => {
  const enterpriseId = c.get('enterpriseId');
  const { page, limit, search, status } = c.req.valid('query');

  const offset = (page - 1) * limit;
  const conditions = [eq(service.enterpriseId, enterpriseId)];

  if (status) {
    conditions.push(eq(service.status, status));
  }

  if (search) {
    conditions.push(ilike(service.name, `%${search}%`));
  }

  const [data, [{ count }]] = await Promise.all([
    db
      .select()
      .from(service)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(service.createdAt),
    db
      .select({ count: db.$count(service) })
      .from(service)
      .where(and(...conditions)),
  ]);

  const total = Number(count);
  const totalPages = Math.ceil(total / limit);

  return c.json({
    data,
    pagination: { page, limit, total, totalPages },
  });
});

// Get service by ID
services.get('/:id', async (c) => {
  const enterpriseId = c.get('enterpriseId');
  const id = c.req.param('id');

  const result = await db.query.service.findFirst({
    where: and(eq(service.id, id), eq(service.enterpriseId, enterpriseId)),
  });

  if (!result) {
    return c.json({ error: 'Service not found', code: 'NOT_FOUND' }, 404);
  }

  return c.json(result);
});

// Create service
services.post('/', zValidator('json', createServiceSchema), async (c) => {
  const enterpriseId = c.get('enterpriseId');
  const user = c.get('user');
  const body = c.req.valid('json');

  const [result] = await db
    .insert(service)
    .values({
      enterpriseId,
      name: body.name,
      description: body.description,
      serviceType: body.serviceType,
      pricingModel: body.pricingModel ?? {},
      status: 'draft',
    })
    .returning();

  // Log event
  await logEvent({
    enterpriseId,
    eventType: 'service.created',
    actorType: 'user',
    actorId: user.id,
    targetType: 'service',
    targetId: result.id,
    payload: { name: result.name },
  });

  return c.json(result, 201);
});

// Update service
services.patch('/:id', zValidator('json', updateServiceSchema), async (c) => {
  const enterpriseId = c.get('enterpriseId');
  const user = c.get('user');
  const id = c.req.param('id');
  const body = c.req.valid('json');

  const existing = await db.query.service.findFirst({
    where: and(eq(service.id, id), eq(service.enterpriseId, enterpriseId)),
  });

  if (!existing) {
    return c.json({ error: 'Service not found', code: 'NOT_FOUND' }, 404);
  }

  const [result] = await db
    .update(service)
    .set({
      ...body,
      updatedAt: new Date(),
    })
    .where(and(eq(service.id, id), eq(service.enterpriseId, enterpriseId)))
    .returning();

  // Log event
  await logEvent({
    enterpriseId,
    eventType: 'service.updated',
    actorType: 'user',
    actorId: user.id,
    targetType: 'service',
    targetId: result.id,
    payload: { changes: body },
  });

  return c.json(result);
});

// Delete service
services.delete('/:id', async (c) => {
  const enterpriseId = c.get('enterpriseId');
  const user = c.get('user');
  const id = c.req.param('id');

  const existing = await db.query.service.findFirst({
    where: and(eq(service.id, id), eq(service.enterpriseId, enterpriseId)),
  });

  if (!existing) {
    return c.json({ error: 'Service not found', code: 'NOT_FOUND' }, 404);
  }

  await db
    .delete(service)
    .where(and(eq(service.id, id), eq(service.enterpriseId, enterpriseId)));

  // Log event
  await logEvent({
    enterpriseId,
    eventType: 'service.deleted',
    actorType: 'user',
    actorId: user.id,
    targetType: 'service',
    targetId: id,
    payload: { name: existing.name },
  });

  return c.body(null, 204);
});

// Batch archive services
const batchArchiveSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
});

services.post('/batch-archive', zValidator('json', batchArchiveSchema), async (c) => {
  const enterpriseId = c.get('enterpriseId');
  const user = c.get('user');
  const { ids } = c.req.valid('json');

  let successCount = 0;
  let failedCount = 0;

  for (const id of ids) {
    try {
      const existing = await db.query.service.findFirst({
        where: and(eq(service.id, id), eq(service.enterpriseId, enterpriseId)),
      });

      if (existing && existing.status !== 'archived') {
        await db
          .update(service)
          .set({ status: 'archived', updatedAt: new Date() })
          .where(and(eq(service.id, id), eq(service.enterpriseId, enterpriseId)));

        await logEvent({
          enterpriseId,
          eventType: 'service.archived',
          actorType: 'user',
          actorId: user.id,
          targetType: 'service',
          targetId: id,
          payload: { name: existing.name, batch: true },
        });

        successCount++;
      } else {
        failedCount++;
      }
    } catch {
      failedCount++;
    }
  }

  return c.json({ success: successCount, failed: failedCount });
});

