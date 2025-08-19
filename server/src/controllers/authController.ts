import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AuthRequest, AuthResponse } from '../../../shared/types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '30d';

export const authenticatePassword = async (req: Request<{}, AuthResponse, AuthRequest>, res: Response<AuthResponse>) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required'
      });
    }

    const correctPassword = process.env.PASSWORD || 'fallback123';
    
    // For now, we'll use simple comparison, but in production you'd hash the stored password
    const isValid = password === correctPassword;
    
    if (isValid) {
      // Generate JWT token
      const payload = { authenticated: true, timestamp: Date.now() };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
      
      // Set secure cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
      
      res.status(200).json({ 
        success: true,
        token // Also return token for client-side storage if needed
      });
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

export const verifyToken = (req: Request, res: Response, next: any) => {
  try {
    const token = req.cookies?.auth_token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('auth_token');
  res.json({ success: true, message: 'Logged out successfully' });
};