import { Router } from 'express';
import {
  getOverview,
  getSpendingByCategory,
  getCashFlow
} from '../controllers/analyticsController';

const router = Router();

router.get('/overview', getOverview);
router.get('/spending-by-category', getSpendingByCategory);
router.get('/cash-flow', getCashFlow);

export default router;