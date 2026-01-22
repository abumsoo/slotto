# slotto

A full-stack web application built with React/TypeScript, Next.js, Node.js, and PostgreSQL.

## Project Structure

```
slotto/
├── frontend/          # Next.js frontend application (React + TypeScript)
├── backend/           # Node.js backend API (Express + TypeScript)
└── README.md          # This file
```

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **ESLint** - Code linting

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **TypeScript** - Type-safe JavaScript
- **PostgreSQL** - Relational database
- **pg** - PostgreSQL client for Node.js
- **dotenv** - Environment variable management
- **CORS** - Cross-Origin Resource Sharing

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd slotto
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env and update with your PostgreSQL credentials
# DATABASE_URL=postgresql://username:password@localhost:5432/slotto
```

### 3. Setup PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE slotto;

# Exit psql
\q
```

### 4. Setup Frontend

```bash
cd ../frontend

# Install dependencies
npm install
```

## Running the Application

### Start Backend (Terminal 1)

```bash
cd backend
npm run dev
```

Backend will run on http://localhost:3001

### Start Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

Frontend will run on http://localhost:3000

### Access the Application

Open your browser and navigate to:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api/test
- Health Check: http://localhost:3001/health
- Database Test: http://localhost:3001/api/db-test

## Available Scripts

### Backend

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production build

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## API Endpoints

### Health Check
- **GET** `/health` - Check if server is running

### API Routes
- **GET** `/api/test` - Test API connection
- **GET** `/api/db-test` - Test database connection

## Environment Variables

### Backend (.env)
```
PORT=3001
DATABASE_URL=postgresql://username:password@localhost:5432/slotto
NODE_ENV=development
```

## Development

### Adding New API Endpoints

1. Create or edit route files in `backend/src/routes/`
2. Import and use in `backend/src/index.ts`

### Adding New Pages

1. Create new files in `frontend/src/app/`
2. Next.js uses file-based routing

## Security Considerations

This is a basic starter application. For production use, consider implementing:

- **Rate Limiting**: Add rate limiting to API endpoints (e.g., using `express-rate-limit`)
- **Input Validation**: Validate and sanitize all user inputs
- **Authentication**: Implement user authentication (e.g., JWT, OAuth)
- **HTTPS**: Use HTTPS in production
- **Environment Variables**: Never commit `.env` files with sensitive data
- **SQL Injection Protection**: Use parameterized queries (already implemented with pg)
- **CORS Configuration**: Restrict CORS to specific origins in production

## Troubleshooting

### Database Connection Issues

1. Ensure PostgreSQL is running:
   ```bash
   sudo service postgresql status
   ```

2. Check your DATABASE_URL in `backend/.env`

3. Verify database exists:
   ```bash
   psql -U postgres -l
   ```

### Port Already in Use

If ports 3000 or 3001 are in use:
- Change PORT in `backend/.env`
- Frontend port can be changed with: `npm run dev -- -p <port>`

## License

ISC