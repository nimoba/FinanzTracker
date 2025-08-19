import { Router } from 'express';
import { authenticatePassword, logout, verifyToken } from '../controllers/authController';

const router = Router();

router.post('/', authenticatePassword);
router.post('/logout', logout);
router.get('/verify', verifyToken, (req, res) => {
  res.json({ success: true, authenticated: true });
});

export default router;