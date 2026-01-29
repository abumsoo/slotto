import bcrypt from 'bcrypt';
import express, { Request, Response } from 'express';
import db from '../config/database';

const router = express.Router();

// Test endpoint
router.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'API is working!' });
});

router.post('/users/signup', async (req: Request, res: Response) => {
  const { name, username, email, password } = req.body;
  const password_hash = await bcrypt.hash(password, 10);
  const user = await db.one('INSERT INTO users (username, name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, username, email', [username, name, email, password_hash]);
  res.status(201).json(user);
})

router.post('/users/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { password_hash } = await db.oneOrNone('SELECT password_hash FROM users WHERE email = $1', [email]);
  const match = await bcrypt.compare(password, password_hash)
  if (password_hash === null || !match) {
    res.status(401).json({
      message: "Invalid email or password"
    })
  } else {
    res.status(200).send("login successful");
  }
})

router.post('/post', async (req: Request, res: Response) => {
  const { content } = req.body;
  const user_id = 1;
  const post = await db.one('INSERT INTO posts (content, user_id) VALUES ($1, $2) RETURNING content', [content, user_id]);
  res.status(201).send("post successful");
})

// DONE: add a way to add a user
// DONE: login page
// DONE: add a user
// TODO: add a way to add a post
// TODO: make a post

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
    const { value } = await db.one('SELECT 123 as value');
    res.json({ 
      message: 'Database connected successfully!',
      timestamp: value
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
