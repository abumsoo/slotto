import bcrypt from 'bcrypt';
import crypto from 'crypto';
import express, { Request, Response } from 'express';
import db from '../config/database';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth';
import multer from 'multer';
import nodemailer from 'nodemailer';

const router = express.Router();

// Test endpoint
router.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'API is working!' });
});

async function sendTestEmail(verificationToken: string, recipientEmail: string) {
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: testAccount.smtp.host, // "smtp.ethereal.email",
    port: testAccount.smtp.port, // 587,
    secure: testAccount.smtp.secure, // false,
    auth: {
      user: testAccount.user, // "maddison53@ethereal.email",
      pass: testAccount.pass, // "jn7jnAPss4f63QBp6D",
    },
  });
  const info = await transporter.sendMail({
    from: '"Test Sender" <test@example.com>',
    to: recipientEmail,
    subject: "Test email",
    text: `http://localhost:3000/verify?token=${verificationToken}`,
    html: `<b>http://localhost:3000/verify?token=${verificationToken}</b>`,
  })
  console.log("Message sent:", info.messageId);
  
  const previewUrl = nodemailer.getTestMessageUrl(info);
  console.log("Preview URL: %s", previewUrl);
}

router.post('/users/signup', async (req: Request, res: Response) => {
  const { name, username, email, password, timezone } = req.body;
  const password_hash = await bcrypt.hash(password, 10);
  const user = await db.one('INSERT INTO users (username, name, email, password_hash, timezone) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email', [username, name, email, password_hash, timezone]);
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await db.none('UPDATE users SET verification_token = $1, verification_token_expires = $2 WHERE id = $3', [verificationToken, expires, user.id]);
  // send email
  sendTestEmail(verificationToken, email).catch(console.error);
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

router.post('/users/resend-verification', authenticate, async (req: Request, res: Response) => {
  if (req.user!.email_verified) {
    return res.status(400).json({ message: 'Email already verified' });
  }
  const existing = await db.oneOrNone('SELECT verification_token_expires FROM users WHERE id = $1', [req.user!.id]);
  if (existing?.verification_token_expires) {
    const tokenAge = Date.now() - (new Date(existing.verification_token_expires).getTime() - 60 * 60 * 1000);
    if (tokenAge < 60 * 1000) {
      return res.status(429).json({ message: 'Please wait before requesting another email' });
    }
  }
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000);
  await db.none('UPDATE users SET verification_token = $1, verification_token_expires = $2 WHERE id = $3', [verificationToken, expires, req.user!.id]);
  sendTestEmail(verificationToken, req.user!.email).catch(console.error);
  res.json({ message: 'Verification email sent' });
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

router.post('/users/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

router.get('/users/me', authenticate, async(req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  const user = await db.one('SELECT id, username, name, email, email_verified AS verified FROM users WHERE id=$1', [req.user.id]);
  res.json(user);
})

router.patch('/users/profile', authenticate, async (req: Request, res: Response) => {
  const { username, name } = req.body;
  if (!username && !name) {
    return res.status(400).json({ message: 'Username or name is required' });
  }
  if (username !== undefined) {
    if (username.length < 1 || username.length > 50 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ message: 'Username must be 1-50 alphanumeric characters or underscores' });
    }
    const existing = await db.oneOrNone('SELECT id FROM users WHERE username = $1 AND id != $2', [username, req.user!.id]);
    if (existing) {
      return res.status(409).json({ message: 'Username is already taken' });
    }
  }
  if (name !== undefined && (name.length < 1 || name.length > 100)) {
    return res.status(400).json({ message: 'Name must be 1-100 characters' });
  }
  const user = await db.one(
    'UPDATE users SET username = COALESCE($1, username), name = COALESCE($2, name) WHERE id = $3 RETURNING id, username, name, email',
    [username || null, name || null, req.user!.id]
  );
  res.json(user);
})

router.patch('/users/email', authenticate, async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ message: 'Valid email is required' });
  }
  const current = await db.one('SELECT email FROM users WHERE id = $1', [req.user!.id]);
  if (current.email === email) {
    return res.status(400).json({ message: 'This is already your email' });
  }
  const existing = await db.oneOrNone('SELECT id FROM users WHERE email = $1 AND id != $2', [email, req.user!.id]);
  if (existing) {
    return res.status(409).json({ message: 'Email is already in use' });
  }
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000);
  await db.none(
    'UPDATE users SET email = $1, email_verified = FALSE, verification_token = $2, verification_token_expires = $3 WHERE id = $4',
    [email, verificationToken, expires, req.user!.id]
  );
  sendTestEmail(verificationToken, email).catch(console.error);
  res.json({ message: 'Email updated. Check your inbox to verify.' });
})

router.patch('/users/password', authenticate, async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters' });
  }
  const { password_hash } = await db.one('SELECT password_hash FROM users WHERE id = $1', [req.user!.id]);
  const match = await bcrypt.compare(currentPassword, password_hash);
  if (!match) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }
  const newHash = await bcrypt.hash(newPassword, 10);
  await db.none('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user!.id]);
  res.json({ message: 'Password updated' });
})

router.delete('/users/me', authenticate, async (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }
  const { password_hash } = await db.one('SELECT password_hash FROM users WHERE id = $1', [req.user!.id]);
  const match = await bcrypt.compare(password, password_hash);
  if (!match) {
    return res.status(401).json({ message: 'Password is incorrect' });
  }
  await db.none('DELETE FROM users WHERE id = $1', [req.user!.id]);
  res.clearCookie('token');
  res.json({ message: 'Account deleted' });
})


// post posts
const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads',
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

router.post('/post', upload.single('image'), authenticate, async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(403).json({ message: 'Please login to post' });
  }
  if (!req.user.email_verified) {
    return res.status(403).json({ message: 'Please verify your email first' });
  }
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const body = req.body;
  if (!body.content || body.content.length > 1000) {
    return res.status(400).json({ message: 'Post must be 1-1000 characters'});
  }
  const { already_posted_today } = await db.one('SELECT (last_post_date AT TIME ZONE timezone)::date = (NOW() AT TIME ZONE timezone)::date AS already_posted_today FROM users WHERE id=$1', [req.user.id]);
  if (already_posted_today) {
    res.status(429).json({ message: "You already posted today"});
    return;
  }
  const post = await db.one(`
  INSERT INTO posts
  (content, user_id, image_url, is_repost, original_post_id, original_user_id)
  VALUES ($1, $2, $3, $4, $5, $6)
  RETURNING *`,
    [body.content, req.user.id, imageUrl, body.is_repost, body.original_post_id, body.original_user_id]);
  await db.none('UPDATE users SET last_post_date = NOW() WHERE id=$1', [req.user.id]);
  res.status(201).json(post);

})


// repost
router.post('/repost', authenticate, async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(403).json({ message: 'Please login to repost' });
  }
  const { already_posted_today } = await db.one('SELECT (last_post_date AT TIME ZONE timezone)::date = (NOW() AT TIME ZONE timezone)::date AS already_posted_today FROM users WHERE id=$1', [req.user.id]);
  if (already_posted_today) {
    res.status(429).json({ message: "You already posted today"});
    return;
  }
  const post = await db.oneOrNone(`
  INSERT INTO posts (content, user_id, image_url, is_repost, original_post_id, original_user_id)
  SELECT content, $1, image_url, TRUE, id, user_id
  FROM posts
  WHERE id = $2
  RETURNING *`, [ req.user.id, req.body.postId]);
  if (!post) {
    return res.status(404).json({ message: 'Repost failed' });
  }
  res.status(201).json(post);
});

// feed
router.get('/posts', async (req: Request, res: Response) => {
  const posts = await db.any(`
  SELECT id, user_id, content, image_url, created_at, is_repost, original_post_id, original_user_id
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
