import { Router } from 'express';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { EventIndexer } from '../services/eventIndexer.js';
import { cacheService } from '../services/cacheService.js';
import { getStellarRpcUrl } from '../config/stellar.js';
import { WebhookService } from '../services/webhookService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../errors/AppError.js';
import { updatePauseStateFromDatabase } from '../middleware/pauseGuard.js';

const router = Router();
router.get(
  '/maintenance',
  asyncHandler(async (req, res) => {
    const expected = process.env.CRON_SECRET;
    const supplied = req.headers.authorization?.replace(/^Bearer /, '') ?? '';
    if (
      !expected ||
      supplied.length !== expected.length ||
      !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
    ) {
      throw AppError.unauthorized('Invalid scheduler credentials');
    }
    const lockId = randomUUID();
    if (!(await cacheService.setNotExists('trustlend:maintenance-lock', lockId, 290))) {
      res.status(202).json({ status: 'already-running' });
      return;
    }
    try {
      const contracts = [
        process.env.LOAN_MANAGER_CONTRACT_ID,
        process.env.LENDING_POOL_CONTRACT_ID,
        process.env.REMITTANCE_NFT_CONTRACT_ID,
        process.env.MULTISIG_GOVERNANCE_CONTRACT_ID,
      ].filter((id): id is string => Boolean(id));
      if (!contracts.length) throw AppError.serviceUnavailable('Contracts are not configured');
      const indexer = new EventIndexer({
        rpcUrl: getStellarRpcUrl(),
        contractConfigs: contracts.map((contractId) => ({ contractId })),
        batchSize: 1000,
        pollIntervalMs: 30000,
      });
      await indexer.runOnce();
      await updatePauseStateFromDatabase();
      await WebhookService.processRetries();
      res.json({ status: 'ok', contractsIndexed: contracts.length });
    } finally {
      await cacheService.deleteIfMatch('trustlend:maintenance-lock', lockId);
    }
  }),
);
export default router;
