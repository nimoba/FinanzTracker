import { Router } from 'express';
import { authenticatePassword } from '../controllers/authController';

const router = Router();

router.post('/', authenticatePassword);

export default router;