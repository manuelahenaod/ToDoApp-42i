import { Router } from 'express';
import { getGlobalStats } from '../services/stats';

const router = Router();

router.get('/', async (_req, res) => {
  const stats = await getGlobalStats();
  res.json(stats);
});

export default router;