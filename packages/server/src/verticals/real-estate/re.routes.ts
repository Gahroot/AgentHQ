import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../auth/middleware';
import { reService } from './re.service';
import { parsePagination, buildPaginationResult } from '../../utils/pagination';

const router = Router();

// Transactions

const createTransactionSchema = z.object({
  property_address: z.string().min(1),
  mls_number: z.string().optional(),
  type: z.enum(['buy', 'sell', 'lease']),
  listing_price: z.number().optional(),
  listing_agent_id: z.string().optional(),
  buyers_agent_id: z.string().optional(),
  client_name: z.string().optional(),
  key_dates: z.record(z.any()).optional(),
});

router.post('/transactions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = createTransactionSchema.parse(req.body);
    const transaction = await reService.createTransaction(req.auth!.orgId, body);
    res.status(201).json({ success: true, data: transaction });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors[0].message } });
      return;
    }
    throw err;
  }
});

router.get('/transactions', async (req: AuthenticatedRequest, res: Response) => {
  const { limit, offset, page } = parsePagination(req);
  const filters = {
    status: req.query.status as string | undefined,
    type: req.query.type as string | undefined,
    listing_agent_id: req.query.listing_agent_id as string | undefined,
    buyers_agent_id: req.query.buyers_agent_id as string | undefined,
  };
  const { transactions, total } = await reService.listTransactions(req.auth!.orgId, filters, limit, offset);
  res.json({
    success: true,
    data: transactions,
    pagination: buildPaginationResult(page, limit, total),
  });
});

router.get('/transactions/:id', async (req: AuthenticatedRequest, res: Response) => {
  const tx = await reService.getTransaction(req.params.id, req.auth!.orgId);
  if (!tx) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Transaction not found' } });
    return;
  }
  res.json({ success: true, data: tx });
});

const updateTransactionSchema = z.object({
  status: z.enum(['prospecting', 'listed', 'under_contract', 'pending', 'closed', 'cancelled']).optional(),
  sale_price: z.number().optional(),
  commission_rate: z.number().optional(),
  commission_amount: z.number().optional(),
  key_dates: z.record(z.any()).optional(),
});

router.patch('/transactions/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = updateTransactionSchema.parse(req.body);
    const tx = await reService.updateTransaction(req.params.id, req.auth!.orgId, body);
    if (!tx) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Transaction not found' } });
      return;
    }
    res.json({ success: true, data: tx });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors[0].message } });
      return;
    }
    throw err;
  }
});

// Metrics

router.get('/metrics', async (req: AuthenticatedRequest, res: Response) => {
  const filters = {
    agent_id: req.query.agent_id as string | undefined,
    period: req.query.period as string | undefined,
    from: req.query.from as string | undefined,
    to: req.query.to as string | undefined,
  };
  const metrics = await reService.getMetrics(req.auth!.orgId, filters);
  res.json({ success: true, data: metrics });
});

router.get('/metrics/leaderboard', async (req: AuthenticatedRequest, res: Response) => {
  const period = (req.query.period as string) || 'monthly';
  const periodStart = req.query.period_start as string;
  if (!periodStart) {
    res.status(400).json({
      success: false,
      error: { code: 'MISSING_PARAM', message: 'period_start is required' },
    });
    return;
  }
  const leaderboard = await reService.getLeaderboard(req.auth!.orgId, period, periodStart);
  res.json({ success: true, data: leaderboard });
});

export default router;
