import bcrypt from 'bcrypt';
import crypto from 'crypto';
import express, { Request, Response } from 'express';
import db from '../config/database';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth';
import nodemailer from 'nodemailer';

const router = express.Router();

// Test endpoint
router.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'API is working!' });
});

router.post('/users/signup', async (req: Request, res: Response) => {
  const { name, username, email, password, timezone } = req.body;
  const password_hash = await bcrypt.hash(password, 10);
  const user = await db.one('INSERT INTO users (username, name, email, password_hash, timezone) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email', [username, name, email, password_hash, timezone]);
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await db.none('UPDATE users SET verification_token = $1, verification_token_expires = $2 WHERE id = $3', [verificationToken, expires, user.id]);
  // send email
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: "maddison53@ethereal.email",
      pass: "jn7jnAPss4f63QBp6D",
    },
  });
  (async () => {
    const info = await transporter.sendMail({
      from: '"Madison Foo Koch" <maddison53@ethereal.email>',
      to: "bar@example.com, baz@example.com",
      subject: "hello",
      text: `http://localhost:3000/verify?token=${verificationToken}`,
      html: `<b>http://localhost:3000/verify?token=${verificationToken}</b>`,
    })
    console.log("Message sent:", info.messageId);
  });
  
  res.status(201).json({message: 'Check your email to verify your account'});
})

router.post('/users/verify', async (req: Request, res: Response) => {
  const { token } = req.query;
  const user = await db.oneOrNone('SELECT id FROM users WHERE verification_token = $1 AND verification_token_expires > NOW()', [token]);
  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  } else {
    await db.none('UPDATE users SET email_verified = TRUE, verification_token = NULL WHERE id=$1', [user.id])
  }
  res.json({ message: 'Email verified' });
})

router.post('/users/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { password_hash, id } = await db.oneOrNone('SELECT id, password_hash FROM users WHERE email = $1', [email]);
  const match = await bcrypt.compare(password, password_hash)
  if (password_hash === null || !match) {
    res.status(401).json({
      message: "Invalid email or password"
    })
  } else {
    const token = jwt.sign(
      { id: id },
      'my-secret-key',
      { expiresIn: '7d' }
    )
    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7*24*60*60*1000
    });
    res.json({message: 'Login successful'});
  }
})

// login
router.get('/users/me', authenticate, async(req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  const user = await db.one('SELECT id, username, email FROM users WHERE id=$1', [req.user.id]);
  res.json(user);
})

// post posts or repost
router.post('/post', authenticate, async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(403).json({ message: 'Please login to post' });
  }
  if (!req.user.email_verified) {
    return res.status(403).json({ message: 'Please verify your email first' });
  }
  const { post } = req.body;
  const { already_posted_today } = await db.one('SELECT (last_post_date AT TIME ZONE timezone)::date = (NOW() AT TIME ZONE timezone)::date AS already_posted_today FROM users WHERE id=$1', [req.user.id]);
  if (already_posted_today) {
    res.status(429).json({ message: "You've already posted today"});
    return;
  }
  await db.one(`
  INSERT INTO posts
  (content, user_id, is_repost, original_post_id, original_user_id)
  VALUES ($1, $2, $3, $4, $5)
  RETURNING content`,
    [post.content, req.user.id, post.is_repost, post.original_post_id, post.original_user_id]);
  await db.none('UPDATE users SET last_post_date = NOW() WHERE id=$1', [req.user.id]);
  res.status(201).send("post successful");
})

// feed
router.get('/posts', async (req: Request, res: Response) => {
  const posts = await db.any(`
  SELECT id, content, created_at, is_repost
  FROM posts
  WHERE created_at > NOW() - INTERVAL '3 days'
  ORDER BY created_at
  DESC LIMIT 10`);
  res.json(posts);
})

// users:verify
// users:reset-password-request
// users:reset-password

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
