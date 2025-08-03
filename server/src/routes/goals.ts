import { Router } from 'express';
import {
  getGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  updateGoalProgress
} from '../controllers/goalController';

const router = Router();

router.get('/', getGoals);
router.get('/:id', getGoal);
router.post('/', createGoal);
router.put('/:id', updateGoal);
router.put('/:id/progress', updateGoalProgress);
router.delete('/:id', deleteGoal);

export default router;