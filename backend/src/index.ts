import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import apiRoutes from './routes/api';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CORS_ORIGIN
    ? ['http://localhost:3000', ...process.env.CORS_ORIGIN.split(',')]
    : 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
