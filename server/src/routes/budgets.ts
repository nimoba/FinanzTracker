import { Router } from 'express';
import {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetProgress
} from '../controllers/budgetController';

const router = Router();

router.get('/', getBudgets);
router.get('/:id', getBudget);
router.get('/:id/progress', getBudgetProgress);
router.post('/', createBudget);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

export default router;