import type { Request, Response } from 'express';
import { getGlobalStats } from '../services/stats.service';

export const statsController = {
  async get(_req: Request, res: Response): Promise<void> {
    const stats = await getGlobalStats();
    res.json(stats);
  },
};