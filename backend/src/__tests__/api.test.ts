import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';

// Mocks are hoisted before imports — order here is intentional
vi.mock('../config/database', () => ({
  default: {
    one: vi.fn(),
    oneOrNone: vi.fn(),
    none: vi.fn(),
    any: vi.fn(),
  },
}));

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
  },
}));

vi.mock('nodemailer', () => ({
  default: {
    createTestAccount: vi.fn().mockResolvedValue({
      smtp: { host: 'smtp.test.com', port: 587, secure: false },
      user: 'testuser',
      pass: 'testpass',
    }),
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-id' }),
    }),
    getTestMessageUrl: vi.fn().mockReturnValue('http://preview.example.com'),
  },
}));

vi.mock('multer', () => {
  const passThrough = (req: any, res: any, next: any) => next();
  const multerFn: any = () => ({ single: () => passThrough });
  multerFn.diskStorage = vi.fn().mockReturnValue({});
  return { default: multerFn };
});

vi.mock('../middleware/auth', () => ({
  authenticate: vi.fn((req: any, _res: any, next: any) => {
    req.user = { id: 1, username: 'testuser', email: 'test@example.com', email_verified: true };
    next();
  }),
}));

import db from '../config/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth';
import apiRoutes from '../routes/api';

// Build a minimal Express app for testing (no listen)
function createTestApp() {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use('/api', apiRoutes);
  return app;
}

// vi.mocked() gives typed access to mock methods (.mockResolvedValue, etc.)
const mockDb = vi.mocked(db) as unknown as { one: ReturnType<typeof vi.fn>; oneOrNone: ReturnType<typeof vi.fn>; none: ReturnType<typeof vi.fn>; any: ReturnType<typeof vi.fn> };
const mockBcrypt = vi.mocked(bcrypt) as unknown as { hash: ReturnType<typeof vi.fn>; compare: ReturnType<typeof vi.fn> };
const mockJwt = vi.mocked(jwt) as unknown as { sign: ReturnType<typeof vi.fn>; verify: ReturnType<typeof vi.fn> };
const mockAuth = vi.mocked(authenticate) as ReturnType<typeof vi.fn>;

const defaultUser = { id: 1, username: 'testuser', email: 'test@example.com', email_verified: true };

beforeEach(() => {
  vi.clearAllMocks();
  // Re-establish authenticate default (clearAllMocks resets call counts but not implementations;
  // this explicit reset ensures each test starts with the verified-user default)
  mockAuth.mockImplementation((req: any, _res: any, next: any) => {
    req.user = defaultUser;
    next();
  });
});

// ---------------------------------------------------------------------------

describe('GET /api/test', () => {
  it('returns 200 with message', async () => {
    const res = await request(createTestApp()).get('/api/test');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('API is working!');
  });
});

// ---------------------------------------------------------------------------

describe('POST /api/users/signup', () => {
  it('creates a user and returns 201', async () => {
    mockBcrypt.hash.mockResolvedValue('hashed_password');
    mockDb.one.mockResolvedValue({ id: 1, username: 'newuser', email: 'new@example.com' });
    mockDb.none.mockResolvedValue(undefined);

    const res = await request(createTestApp())
      .post('/api/users/signup')
      .send({ name: 'New User', username: 'newuser', email: 'new@example.com', password: 'password123', timezone: 'UTC' });

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/check your email/i);
    expect(mockDb.one).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------

describe('POST /api/users/verify', () => {
  it('returns 400 for an invalid or expired token', async () => {
    mockDb.oneOrNone.mockResolvedValue(null);

    const res = await request(createTestApp())
      .post('/api/users/verify')
      .query({ token: 'badtoken' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid or expired token');
  });

  it('verifies a valid token and returns 200', async () => {
    mockDb.oneOrNone.mockResolvedValue({ id: 1 });
    mockDb.none.mockResolvedValue(undefined);

    const res = await request(createTestApp())
      .post('/api/users/verify')
      .query({ token: 'validtoken123' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Email verified');
  });
});

// ---------------------------------------------------------------------------

describe('POST /api/users/login', () => {
  it('returns 200 and sets a cookie on valid credentials', async () => {
    mockDb.oneOrNone.mockResolvedValue({ id: 1, password_hash: '$2b$10$hashed' });
    mockBcrypt.compare.mockResolvedValue(true);
    mockJwt.sign.mockReturnValue('test_jwt_token');

    const res = await request(createTestApp())
      .post('/api/users/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Login successful');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('returns 401 for a wrong password', async () => {
    mockDb.oneOrNone.mockResolvedValue({ id: 1, password_hash: '$2b$10$hashed' });
    mockBcrypt.compare.mockResolvedValue(false);

    const res = await request(createTestApp())
      .post('/api/users/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('returns 401 when the email does not exist', async () => {
    mockDb.oneOrNone.mockResolvedValue(null);

    const res = await request(createTestApp())
      .post('/api/users/login')
      .send({ email: 'nobody@example.com', password: 'anything' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });
});

// ---------------------------------------------------------------------------

describe('POST /api/users/logout', () => {
  it('returns 200 and clears the token cookie', async () => {
    const res = await request(createTestApp()).post('/api/users/logout');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logged out');
    const raw = res.headers['set-cookie'];
    const cookies: string[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
    expect(cookies.some((c: string) => c.startsWith('token=;'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------

describe('GET /api/users/me', () => {
  it('returns user info when authenticated', async () => {
    mockDb.one.mockResolvedValue({ id: 1, username: 'testuser', name: 'Test User', email: 'test@example.com', verified: true });

    const res = await request(createTestApp()).get('/api/users/me');

    expect(res.status).toBe(200);
    expect(res.body.username).toBe('testuser');
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockImplementationOnce((_req: any, res: any) => {
      res.status(401).json({ message: 'Not authenticated' });
    });

    const res = await request(createTestApp()).get('/api/users/me');

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------

describe('GET /api/posts', () => {
  it('returns an array of posts', async () => {
    const mockPosts = [
      { id: 1, content: 'Hello world', username: 'user1', created_at: new Date().toISOString() },
      { id: 2, content: 'Second post', username: 'user2', created_at: new Date().toISOString() },
    ];
    mockDb.any.mockResolvedValue(mockPosts);

    const res = await request(createTestApp()).get('/api/posts');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].content).toBe('Hello world');
  });

  it('returns an empty array when there are no posts', async () => {
    mockDb.any.mockResolvedValue([]);

    const res = await request(createTestApp()).get('/api/posts');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ---------------------------------------------------------------------------

describe('POST /api/post', () => {
  it('returns 400 for empty content', async () => {
    const res = await request(createTestApp())
      .post('/api/post')
      .send({ content: '' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Post must be 1-1000 characters');
  });

  it('returns 400 for content over 1000 characters', async () => {
    const res = await request(createTestApp())
      .post('/api/post')
      .send({ content: 'x'.repeat(1001) });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Post must be 1-1000 characters');
  });

  it('returns 403 for unverified users', async () => {
    mockAuth.mockImplementationOnce((req: any, _res: any, next: any) => {
      req.user = { ...defaultUser, email_verified: false };
      next();
    });

    const res = await request(createTestApp())
      .post('/api/post')
      .send({ content: 'Hello!' });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Please verify your email first');
  });

  it('returns 429 if the user already posted today', async () => {
    mockDb.one.mockResolvedValue({ already_posted_today: true });

    const res = await request(createTestApp())
      .post('/api/post')
      .send({ content: 'Hello!' });

    expect(res.status).toBe(429);
    expect(res.body.message).toBe('You already posted today');
  });

  it('creates a post and returns 201', async () => {
    const mockPost = { id: 1, content: 'Hello!', user_id: 1, created_at: new Date().toISOString() };
    mockDb.one
      .mockResolvedValueOnce({ already_posted_today: false })
      .mockResolvedValueOnce(mockPost);
    mockDb.none.mockResolvedValue(undefined);

    const res = await request(createTestApp())
      .post('/api/post')
      .send({ content: 'Hello!' });

    expect(res.status).toBe(201);
    expect(res.body.content).toBe('Hello!');
  });

  it('returns 400 if the referenced post does not exist', async () => {
    mockDb.one.mockResolvedValue({ already_posted_today: false });
    mockDb.oneOrNone.mockResolvedValue(null); // referenced post not found

    const res = await request(createTestApp())
      .post('/api/post')
      .send({ content: 'Hello!', referenced_post_id: 999 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Referenced post not found');
  });
});

// ---------------------------------------------------------------------------

describe('PATCH /api/users/profile', () => {
  it('returns 400 if neither username nor name is provided', async () => {
    const res = await request(createTestApp())
      .patch('/api/users/profile')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Username or name is required');
  });

  it('returns 400 for an invalid username format', async () => {
    const res = await request(createTestApp())
      .patch('/api/users/profile')
      .send({ username: 'invalid username!' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/alphanumeric/i);
  });

  it('returns 409 if the username is already taken', async () => {
    mockDb.oneOrNone.mockResolvedValue({ id: 2 }); // different user has this username

    const res = await request(createTestApp())
      .patch('/api/users/profile')
      .send({ username: 'taken_user' });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Username is already taken');
  });

  it('updates the profile and returns the updated user', async () => {
    mockDb.oneOrNone.mockResolvedValue(null); // username not taken
    mockDb.one.mockResolvedValue({ id: 1, username: 'newname', name: 'Test', email: 'test@example.com' });

    const res = await request(createTestApp())
      .patch('/api/users/profile')
      .send({ username: 'newname' });

    expect(res.status).toBe(200);
    expect(res.body.username).toBe('newname');
  });
});
