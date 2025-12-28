import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '@dhs-atlas/database';
import { customer, contact } from '@dhs-atlas/database/schema';
import { eq, and, ilike } from 'drizzle-orm';
import { logEvent } from '@dhs-atlas/event-log';

export const customers = new Hono();

// Schemas
const createCustomerSchema = z.object({
  name: z.string().min(1).max(256),
  type: z.enum(['company', 'individual']).default('company'),
  level: z.enum(['normal', 'important', 'vip']).default('normal'),
  industry: z.string().max(128).optional(),
  address: z.string().optional(),
  website: z.string().max(256).optional(),
  notes: z.string().optional(),
});

const updateCustomerSchema = z.object({
  name: z.string().min(1).max(256).optional(),
  type: z.enum(['company', 'individual']).optional(),
  level: z.enum(['normal', 'important', 'vip']).optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  industry: z.string().max(128).optional(),
  address: z.string().optional(),
  website: z.string().max(256).optional(),
  notes: z.string().optional(),
});

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  level: z.enum(['normal', 'important', 'vip']).optional(),
});

// List customers
customers.get('/', zValidator('query', querySchema), async (c) => {
  const enterpriseId = c.get('enterpriseId');
  const { page, limit, search, level } = c.req.valid('query');

  const offset = (page - 1) * limit;
  const conditions = [eq(customer.enterpriseId, enterpriseId)];

  if (level) {
    conditions.push(eq(customer.level, level));
  }

  if (search) {
    conditions.push(ilike(customer.name, `%${search}%`));
  }

  const [data, [{ count }]] = await Promise.all([
    db
      .select()
      .from(customer)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(customer.createdAt),
    db
      .select({ count: db.$count(customer) })
      .from(customer)
      .where(and(...conditions)),
  ]);

  const total = Number(count);
  const totalPages = Math.ceil(total / limit);

  return c.json({
    data,
    pagination: { page, limit, total, totalPages },
  });
});

// Get customer by ID
customers.get('/:id', async (c) => {
  const enterpriseId = c.get('enterpriseId');
  const id = c.req.param('id');

  const result = await db.query.customer.findFirst({
    where: and(eq(customer.id, id), eq(customer.enterpriseId, enterpriseId)),
  });

  if (!result) {
    return c.json({ error: 'Customer not found', code: 'NOT_FOUND' }, 404);
  }

  return c.json(result);
});

// Create customer
customers.post('/', zValidator('json', createCustomerSchema), async (c) => {
  const enterpriseId = c.get('enterpriseId');
  const user = c.get('user');
  const body = c.req.valid('json');

  const [result] = await db
    .insert(customer)
    .values({
      enterpriseId,
      ...body,
      status: 'active',
    })
    .returning();

  await logEvent({
    enterpriseId,
    eventType: 'customer.created',
    actorType: 'user',
    actorId: user.id,
    targetType: 'customer',
    targetId: result.id,
    payload: { name: result.name },
  });

  return c.json(result, 201);
});

// Update customer
customers.patch('/:id', zValidator('json', updateCustomerSchema), async (c) => {
  const enterpriseId = c.get('enterpriseId');
  const user = c.get('user');
  const id = c.req.param('id');
  const body = c.req.valid('json');

  const existing = await db.query.customer.findFirst({
    where: and(eq(customer.id, id), eq(customer.enterpriseId, enterpriseId)),
  });

  if (!existing) {
    return c.json({ error: 'Customer not found', code: 'NOT_FOUND' }, 404);
  }

  const [result] = await db
    .update(customer)
    .set({
      ...body,
      updatedAt: new Date(),
    })
    .where(and(eq(customer.id, id), eq(customer.enterpriseId, enterpriseId)))
    .returning();

  await logEvent({
    enterpriseId,
    eventType: 'customer.updated',
    actorType: 'user',
    actorId: user.id,
    targetType: 'customer',
    targetId: result.id,
    payload: { changes: body },
  });

  return c.json(result);
});

// Delete customer
customers.delete('/:id', async (c) => {
  const enterpriseId = c.get('enterpriseId');
  const user = c.get('user');
  const id = c.req.param('id');

  const existing = await db.query.customer.findFirst({
    where: and(eq(customer.id, id), eq(customer.enterpriseId, enterpriseId)),
  });

  if (!existing) {
    return c.json({ error: 'Customer not found', code: 'NOT_FOUND' }, 404);
  }

  await db
    .delete(customer)
    .where(and(eq(customer.id, id), eq(customer.enterpriseId, enterpriseId)));

  await logEvent({
    enterpriseId,
    eventType: 'customer.deleted',
    actorType: 'user',
    actorId: user.id,
    targetType: 'customer',
    targetId: id,
    payload: { name: existing.name },
  });

  return c.body(null, 204);
});

// Get customer contacts
customers.get('/:id/contacts', async (c) => {
  const enterpriseId = c.get('enterpriseId');
  const customerId = c.req.param('id');

  const contacts = await db
    .select()
    .from(contact)
    .where(
      and(
        eq(contact.customerId, customerId),
        eq(contact.enterpriseId, enterpriseId)
      )
    );

  return c.json({ data: contacts });
});

// Batch delete customers
const batchDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
});

customers.post('/batch-delete', zValidator('json', batchDeleteSchema), async (c) => {
  const enterpriseId = c.get('enterpriseId');
  const user = c.get('user');
  const { ids } = c.req.valid('json');

  let successCount = 0;
  let failedCount = 0;

  for (const id of ids) {
    try {
      const existing = await db.query.customer.findFirst({
        where: and(eq(customer.id, id), eq(customer.enterpriseId, enterpriseId)),
      });

      if (existing) {
        await db
          .delete(customer)
          .where(and(eq(customer.id, id), eq(customer.enterpriseId, enterpriseId)));

        await logEvent({
          enterpriseId,
          eventType: 'customer.deleted',
          actorType: 'user',
          actorId: user.id,
          targetType: 'customer',
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

