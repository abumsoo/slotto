import express, { Request, Response } from 'express';
import pool from '../config/database';

const router = express.Router();

// Test endpoint
router.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'API is working!' });
});

// users
// users:signup
// users:login
// users:verify
// users:reset-password-request
// users:reset-password

// feed
// post posts
// repost

// Database test endpoint
// TODO: Add rate limiting for production use (e.g., express-rate-limit)
router.get('/db-test', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      message: 'Database connected successfully!',
      timestamp: result.rows[0].now 
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ 
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
