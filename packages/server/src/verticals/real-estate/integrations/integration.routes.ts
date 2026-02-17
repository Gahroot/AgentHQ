import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../../auth/middleware';
import { integrationService } from './integration.service';
import { FubClient } from './fub/fub.client';
import { DotloopClient } from './dotloop/dotloop.client';
import { QuickBooksClient } from './quickbooks/quickbooks.client';
import { IntegrationType } from './integration.types';
import { parsePagination, buildPaginationResult } from '../../../utils/pagination';

const router = Router();

// --- CRUD ---

const connectSchema = z.object({
  type: z.enum(['fub', 'dotloop', 'quickbooks']),
  credentials: z.record(z.any()),
  settings: z.record(z.any()).optional(),
});

router.post('/connect', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = connectSchema.parse(req.body);
    const integration = await integrationService.connectIntegration(
      req.auth!.orgId,
      body.type,
      body.credentials,
      body.settings
    );
    res.status(201).json({ success: true, data: integration });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors[0].message } });
      return;
    }
    throw err;
  }
});

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const integrations = await integrationService.listIntegrations(req.auth!.orgId);
  res.json({ success: true, data: integrations });
});

// --- FUB static routes (before /:id) ---

router.get('/fub/test', async (req: AuthenticatedRequest, res: Response) => {
  const result = await integrationService.testConnection(req.auth!.orgId, 'fub');
  res.json({ success: true, data: result });
});

router.get('/fub/people', async (req: AuthenticatedRequest, res: Response) => {
  const client = await integrationService.getClient(req.auth!.orgId, 'fub') as FubClient;
  const result = await client.listPeople({
    sort: req.query.sort as string | undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
  });
  res.json({ success: true, data: result });
});

router.get('/fub/people/:id', async (req: AuthenticatedRequest, res: Response) => {
  const client = await integrationService.getClient(req.auth!.orgId, 'fub') as FubClient;
  const result = await client.getPerson(parseInt(req.params.id, 10));
  res.json({ success: true, data: result });
});

router.get('/fub/deals', async (req: AuthenticatedRequest, res: Response) => {
  const client = await integrationService.getClient(req.auth!.orgId, 'fub') as FubClient;
  const result = await client.listDeals({
    sort: req.query.sort as string | undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
  });
  res.json({ success: true, data: result });
});

router.get('/fub/deals/:id', async (req: AuthenticatedRequest, res: Response) => {
  const client = await integrationService.getClient(req.auth!.orgId, 'fub') as FubClient;
  const result = await client.getDeal(parseInt(req.params.id, 10));
  res.json({ success: true, data: result });
});

router.get('/fub/events', async (req: AuthenticatedRequest, res: Response) => {
  const client = await integrationService.getClient(req.auth!.orgId, 'fub') as FubClient;
  const result = await client.listEvents({
    sort: req.query.sort as string | undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
  });
  res.json({ success: true, data: result });
});

const createFubEventSchema = z.object({
  type: z.string().min(1),
  person: z.number(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

router.post('/fub/events', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = createFubEventSchema.parse(req.body);
    const client = await integrationService.getClient(req.auth!.orgId, 'fub') as FubClient;
    const result = await client.createEvent(body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors[0].message } });
      return;
    }
    throw err;
  }
});

router.get('/fub/users', async (req: AuthenticatedRequest, res: Response) => {
  const client = await integrationService.getClient(req.auth!.orgId, 'fub') as FubClient;
  const result = await client.listUsers({
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
  });
  res.json({ success: true, data: result });
});

// --- Dotloop static routes ---

router.get('/dotloop/test', async (req: AuthenticatedRequest, res: Response) => {
  const result = await integrationService.testConnection(req.auth!.orgId, 'dotloop');
  res.json({ success: true, data: result });
});

router.get('/dotloop/profiles', async (req: AuthenticatedRequest, res: Response) => {
  const client = await integrationService.getClient(req.auth!.orgId, 'dotloop') as DotloopClient;
  const result = await client.getProfile();
  res.json({ success: true, data: result });
});

router.get('/dotloop/profiles/:pid/loops', async (req: AuthenticatedRequest, res: Response) => {
  const client = await integrationService.getClient(req.auth!.orgId, 'dotloop') as DotloopClient;
  const result = await client.listLoops(parseInt(req.params.pid, 10), {
    batchNumber: req.query.batchNumber ? parseInt(req.query.batchNumber as string, 10) : undefined,
    batchSize: req.query.batchSize ? parseInt(req.query.batchSize as string, 10) : undefined,
  });
  res.json({ success: true, data: result });
});

router.get('/dotloop/profiles/:pid/loops/:lid', async (req: AuthenticatedRequest, res: Response) => {
  const client = await integrationService.getClient(req.auth!.orgId, 'dotloop') as DotloopClient;
  const result = await client.getLoop(parseInt(req.params.pid, 10), parseInt(req.params.lid, 10));
  res.json({ success: true, data: result });
});

router.get('/dotloop/profiles/:pid/loops/:lid/detail', async (req: AuthenticatedRequest, res: Response) => {
  const client = await integrationService.getClient(req.auth!.orgId, 'dotloop') as DotloopClient;
  const result = await client.getLoopDetail(parseInt(req.params.pid, 10), parseInt(req.params.lid, 10));
  res.json({ success: true, data: result });
});

router.get('/dotloop/profiles/:pid/loops/:lid/participants', async (req: AuthenticatedRequest, res: Response) => {
  const client = await integrationService.getClient(req.auth!.orgId, 'dotloop') as DotloopClient;
  const result = await client.listParticipants(parseInt(req.params.pid, 10), parseInt(req.params.lid, 10));
  res.json({ success: true, data: result });
});

// --- QuickBooks static routes ---

router.get('/quickbooks/test', async (req: AuthenticatedRequest, res: Response) => {
  const result = await integrationService.testConnection(req.auth!.orgId, 'quickbooks');
  res.json({ success: true, data: result });
});

router.get('/quickbooks/accounts', async (req: AuthenticatedRequest, res: Response) => {
  const client = await integrationService.getClient(req.auth!.orgId, 'quickbooks') as QuickBooksClient;
  const result = await client.queryAccounts(req.query.query as string | undefined);
  res.json({ success: true, data: result });
});

router.get('/quickbooks/accounts/:id', async (req: AuthenticatedRequest, res: Response) => {
  const client = await integrationService.getClient(req.auth!.orgId, 'quickbooks') as QuickBooksClient;
  const result = await client.getAccount(req.params.id);
  res.json({ success: true, data: result });
});

router.get('/quickbooks/invoices', async (req: AuthenticatedRequest, res: Response) => {
  const client = await integrationService.getClient(req.auth!.orgId, 'quickbooks') as QuickBooksClient;
  const result = await client.queryInvoices(req.query.query as string | undefined);
  res.json({ success: true, data: result });
});

router.get('/quickbooks/invoices/:id', async (req: AuthenticatedRequest, res: Response) => {
  const client = await integrationService.getClient(req.auth!.orgId, 'quickbooks') as QuickBooksClient;
  const result = await client.getInvoice(req.params.id);
  res.json({ success: true, data: result });
});

router.get('/quickbooks/payments', async (req: AuthenticatedRequest, res: Response) => {
  const client = await integrationService.getClient(req.auth!.orgId, 'quickbooks') as QuickBooksClient;
  const result = await client.queryPayments(req.query.query as string | undefined);
  res.json({ success: true, data: result });
});

router.get('/quickbooks/payments/:id', async (req: AuthenticatedRequest, res: Response) => {
  const client = await integrationService.getClient(req.auth!.orgId, 'quickbooks') as QuickBooksClient;
  const result = await client.getPayment(req.params.id);
  res.json({ success: true, data: result });
});

router.get('/quickbooks/bills', async (req: AuthenticatedRequest, res: Response) => {
  const client = await integrationService.getClient(req.auth!.orgId, 'quickbooks') as QuickBooksClient;
  const result = await client.queryBills(req.query.query as string | undefined);
  res.json({ success: true, data: result });
});

router.get('/quickbooks/bills/:id', async (req: AuthenticatedRequest, res: Response) => {
  const client = await integrationService.getClient(req.auth!.orgId, 'quickbooks') as QuickBooksClient;
  const result = await client.getBill(req.params.id);
  res.json({ success: true, data: result });
});

// --- Param routes (after static routes) ---

router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const integration = await integrationService.getIntegration(req.params.id, req.auth!.orgId);
  res.json({ success: true, data: integration });
});

router.post('/:id/disconnect', async (req: AuthenticatedRequest, res: Response) => {
  const integration = await integrationService.disconnectIntegration(req.params.id, req.auth!.orgId);
  res.json({ success: true, data: integration });
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  await integrationService.deleteIntegration(req.params.id, req.auth!.orgId);
  res.json({ success: true });
});

router.get('/:id/sync-logs', async (req: AuthenticatedRequest, res: Response) => {
  const { limit, offset, page } = parsePagination(req);
  const { logs, total } = await integrationService.getSyncLogs(req.params.id, req.auth!.orgId, limit, offset);
  res.json({
    success: true,
    data: logs,
    pagination: buildPaginationResult(page, limit, total),
  });
});

export default router;
