import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../config/database';

interface User {
  id: number;
  username: string;
  email: string;
  email_verified: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const payload = jwt.verify(token, 'my-secret-key');
    if (typeof payload === 'string' || typeof payload.id !== 'number') {
      return res.status(401).json({ message: 'Invalid token payload' });
    }
    const user = await db.oneOrNone('SELECT * FROM users WHERE id = $1', [payload.id]);
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Forbidden - Invalid or expired token' });
  }
}
