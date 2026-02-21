import bcrypt from 'bcrypt';
import crypto from 'crypto';
import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import db from '../config/database';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth';
import multer from 'multer';
import nodemailer from 'nodemailer';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { message: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: { message: 'Too many accounts created from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: { message: 'Too many password reset requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const tokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { message: 'Too many attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Test endpoint
router.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'API is working!' });
});

async function sendEmail(subject: string, link: string, recipientEmail: string) {
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  const info = await transporter.sendMail({
    from: '"Slothy" <no-reply@slothy.app>',
    to: recipientEmail,
    subject,
    text: link,
    html: `<b><a href="${link}">${link}</a></b>`,
  });
  console.log("Message sent:", info.messageId);
  console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
}

async function sendTestEmail(verificationToken: string, recipientEmail: string) {
  await sendEmail(
    'Verify your Slothy account',
    `http://localhost:3000/verify?token=${verificationToken}`,
    recipientEmail,
  );
}

router.post('/users/signup', signupLimiter, async (req: Request, res: Response) => {
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

router.post('/users/verify', tokenLimiter, async (req: Request, res: Response) => {
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

router.post('/users/login', loginLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await db.oneOrNone('SELECT id, password_hash FROM users WHERE email = $1', [email]);
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  const token = jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
  res.cookie('token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 7*24*60*60*1000
  });
  res.json({ message: 'Login successful' });
})

router.post('/users/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

router.get('/users/me', authenticate, async(req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  const user = await db.one(`
    SELECT id, username, name, email, email_verified AS verified,
      (last_post_date IS NOT NULL AND
        (last_post_date AT TIME ZONE timezone)::date = (NOW() AT TIME ZONE timezone)::date
      ) AS "hasPostedToday"
    FROM users WHERE id = $1
  `, [req.user.id]);
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

router.post('/post', authenticate, upload.single('image'), async (req: Request, res: Response) => {
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
  const referencedPostId = body.referenced_post_id ? parseInt(body.referenced_post_id) : null;
  if (referencedPostId) {
    const exists = await db.oneOrNone('SELECT id FROM posts WHERE id = $1', [referencedPostId]);
    if (!exists) {
      return res.status(400).json({ message: 'Referenced post not found' });
    }
  }
  const post = await db.one(`
  INSERT INTO posts
  (content, user_id, image_url, referenced_post_id)
  VALUES ($1, $2, $3, $4)
  RETURNING *`,
    [body.content, req.user.id, imageUrl, referencedPostId]);
  await db.none('UPDATE users SET last_post_date = NOW() WHERE id=$1', [req.user.id]);

  // Create notification if referencing another user's post
  if (referencedPostId) {
    const refPost = await db.oneOrNone('SELECT user_id FROM posts WHERE id = $1', [referencedPostId]);
    if (refPost && refPost.user_id !== req.user.id) {
      await db.none(
        'INSERT INTO notifications (user_id, actor_id, post_id, referenced_post_id) VALUES ($1, $2, $3, $4)',
        [refPost.user_id, req.user.id, post.id, referencedPostId]
      );
    }
  }

  res.status(201).json(post);

})


// single post
router.get('/posts/:id', async (req: Request, res: Response) => {
  const post = await db.oneOrNone(`
    SELECT p.*, u.username,
      true AS is_feed,
      rp.content AS parent_content, rpu.username AS parent_username, rp.id AS parent_id
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN posts rp ON p.referenced_post_id = rp.id
    LEFT JOIN users rpu ON rp.user_id = rpu.id
    WHERE p.id = $1
  `, [req.params.id]);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  res.json(post);
});

// feed
router.get('/posts', async (req: Request, res: Response) => {
  const cursor = (req.query.cursor as string) || null;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

  const rows = await db.any(`
  WITH paginated_feed AS (
    SELECT p.*
    FROM posts p
    WHERE p.created_at > NOW() - INTERVAL '3 days'
      AND ($1::timestamptz IS NULL OR p.created_at < $1::timestamptz)
    ORDER BY p.created_at DESC
    LIMIT $2
  ),
  ancestors AS (
    SELECT ref.*
    FROM posts ref
    JOIN paginated_feed f ON f.referenced_post_id = ref.id
    WHERE ref.id NOT IN (SELECT id FROM paginated_feed)
  ),
  combined AS (
    SELECT *, true AS from_feed FROM paginated_feed
    UNION ALL
    SELECT *, false AS from_feed FROM ancestors
  )
  SELECT c.*, u.username,
    (c.created_at > NOW() - INTERVAL '3 days') AS is_feed,
    c.from_feed,
    rp.content AS parent_content, rpu.username AS parent_username, rp.id AS parent_id
  FROM combined c
  JOIN users u ON c.user_id = u.id
  LEFT JOIN posts rp ON c.referenced_post_id = rp.id
  LEFT JOIN users rpu ON rp.user_id = rpu.id
  ORDER BY c.created_at DESC
  `, [cursor, limit]);

  const paginatedRows = rows.filter((r: any) => r.from_feed);
  const ancestorRows = rows.filter((r: any) => !r.from_feed);
  const nextCursor = paginatedRows.length === limit
    ? (paginatedRows[paginatedRows.length - 1].created_at as Date).toISOString()
    : null;

  res.json({ posts: paginatedRows, ancestors: ancestorRows, nextCursor });
})

router.post('/users/reset-password-request', passwordResetLimiter, async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  const user = await db.oneOrNone('SELECT id, email FROM users WHERE email = $1', [email]);
  // Always respond the same way to avoid leaking whether an account exists
  if (!user) {
    return res.json({ message: 'If an account exists for that email, a reset link has been sent.' });
  }
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await db.none(
    'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
    [resetToken, expires, user.id]
  );
  sendEmail(
    'Reset your Slothy password',
    `http://localhost:3000/reset-password?token=${resetToken}`,
    user.email,
  ).catch(console.error);
  res.json({ message: 'If an account exists for that email, a reset link has been sent.' });
});

router.post('/users/reset-password', tokenLimiter, async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }
  const user = await db.oneOrNone(
    'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
    [token]
  );
  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired reset link' });
  }
  const newHash = await bcrypt.hash(newPassword, 10);
  await db.none(
    'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
    [newHash, user.id]
  );
  res.json({ message: 'Password reset successfully. You can now log in.' });
});

// User's own posts (all time)
router.get('/users/me/posts', authenticate, async (req: Request, res: Response) => {
  const posts = await db.any(
    `SELECT p.*, u.username,
      rp.content AS parent_content,
        rpu.username AS parent_username,
      rp.id AS parent_id
     FROM posts p
     JOIN users u ON p.user_id = u.id
     LEFT JOIN posts rp ON p.referenced_post_id = rp.id
     LEFT JOIN users rpu ON rp.user_id = rpu.id
     WHERE p.user_id = $1 AND p.created_at > NOW() - INTERVAL '3 days'
     ORDER BY p.created_at DESC`,
    [req.user!.id]
  );
  res.json(posts);
});

// Single post by ID
router.get('/posts/:id', async (req: Request, res: Response) => {
  const postId = parseInt(req.params.id as string);
  const post = await db.oneOrNone(`
    SELECT p.*, u.username,
      (p.created_at > NOW() - INTERVAL '3 days') AS is_feed,
      rp.content AS parent_content,
      rpu.username AS parent_username,
      rp.id AS parent_id
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN posts rp ON p.referenced_post_id = rp.id
    LEFT JOIN users rpu ON rp.user_id = rpu.id
    WHERE p.id = $1`,
    [postId]
  );
  if (!post) return res.status(404).json({ message: 'Post not found' });
  res.json(post);
});

// Thread view: ancestors + descendants of a post
router.get('/posts/:id/thread', async (req: Request, res: Response) => {
  const postId = parseInt(req.params.id as string);
  const thread = await db.any(`
    WITH RECURSIVE descendants AS (
      SELECT p.* FROM posts p WHERE p.referenced_post_id = $1
      UNION ALL
      SELECT child.* FROM posts child
      JOIN descendants d ON child.referenced_post_id = d.id
    )
    SELECT d.*, u.username FROM descendants d
    JOIN users u ON d.user_id = u.id
    ORDER BY d.created_at ASC`,
    [postId]
  );
  res.json(thread);
});

// Notifications
router.get('/notifications', authenticate, async (req: Request, res: Response) => {
  const notifications = await db.any(`
    SELECT n.*, u.username AS actor_username,
           substring(p.content from 1 for 100) AS post_snippet
    FROM notifications n
    JOIN users u ON n.actor_id = u.id
    JOIN posts p ON n.post_id = p.id
    WHERE n.user_id = $1
    ORDER BY n.created_at DESC
    LIMIT 50`,
    [req.user!.id]
  );
  res.json(notifications);
});

router.get('/notifications/unread-count', authenticate, async (req: Request, res: Response) => {
  const { count } = await db.one(
    'SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND read = FALSE',
    [req.user!.id]
  );
  res.json({ count });
});

router.patch('/notifications/read', authenticate, async (req: Request, res: Response) => {
  const { ids } = req.body || {};
  if (ids && Array.isArray(ids) && ids.length > 0) {
    await db.none(
      'UPDATE notifications SET read = TRUE WHERE user_id = $1 AND id IN ($2:csv)',
      [req.user!.id, ids]
    );
  } else {
    await db.none(
      'UPDATE notifications SET read = TRUE WHERE user_id = $1',
      [req.user!.id]
    );
  }
  res.json({ message: 'Marked as read' });
});

// Database test endpoint
// TODO: Add rate limiting for production use (e.g., express-rate-limit)
router.get('/db-test', async (_req: Request, res: Response) => {
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
