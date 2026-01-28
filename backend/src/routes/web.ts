import express, { Request, Response } from 'express';

const router = express.Router();

// Test endpoint
router.get('/signup', (req: Request, res: Response) => {
  res.json({ message: 'API is working!' });
});

export default router;
