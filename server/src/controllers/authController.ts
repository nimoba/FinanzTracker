import { Request, Response } from 'express';
import { AuthRequest, AuthResponse } from '../../../shared/types';

export const authenticatePassword = (req: Request<{}, AuthResponse, AuthRequest>, res: Response<AuthResponse>) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required'
      });
    }

    const correctPassword = process.env.PASSWORD || 'fallback123';
    
    if (password === correctPassword) {
      res.status(200).json({ success: true });
    } else {
      res.status(401).json({ 
        success: false, 
        error: 'Invalid password' 
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};