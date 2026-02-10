# TabLab v2 - Development Setup Guide

This guide explains how to run the full application (database, backend, frontend) with a single command.

---

## Quick Start

### Option 1: Docker (Recommended - Most Reliable)

**Pros:**
- ✅ Everything runs in containers (consistent environment)
- ✅ Don't need Postgres installed locally
- ✅ Isolated from your system
- ✅ Easy to reset/rebuild

**One-time setup:**
```bash
# Install Docker Desktop if you haven't
# https://www.docker.com/products/docker-desktop

# Create .env file in root (copy from server/.env)
cp server/.env .env
```

**Run everything:**
```bash
make docker-up
# or
docker-compose up
```

**Access:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Database: localhost:5432

**Stop everything:**
```bash
make docker-down
# or
docker-compose down
```

---

### Option 2: Local Development (Faster iteration)

**Pros:**
- ✅ Faster hot-reload
- ✅ Uses your local editor/tools
- ✅ No Docker overhead

**Cons:**
- ❌ Need Postgres installed
- ❌ Need to manage Postgres separately

**Prerequisites:**
```bash
# Install PostgreSQL (if not installed)
brew install postgresql@14

# Install pnpm (if not installed)
npm install -g pnpm

# Install dependencies
make install
# or
pnpm install
cd server && pnpm install
cd client && pnpm install
```

**Run everything (single command):**
```bash
make dev-all
# or
pnpm run dev:all
```

This starts:
1. PostgreSQL database
2. Backend API (port 3000)
3. Frontend dev server (port 5173)

**Run just backend + frontend (assumes DB already running):**
```bash
make dev
# or
pnpm run dev
```

---

## Detailed Commands

### Database Management (Local Postgres)

```bash
# Start PostgreSQL
make db-start
# or
brew services start postgresql@14

# Stop PostgreSQL
make db-stop
# or
brew services stop postgresql@14

# Check if Postgres is running
make db-status
# or
brew services list | grep postgres
```

### Docker Commands

```bash
# Start all services (DB + Backend + Frontend)
make docker-up
docker-compose up

# Start in background (detached mode)
docker-compose up -d

# Stop all services
make docker-down
docker-compose down

# Rebuild containers (after changing Dockerfile)
make docker-rebuild
docker-compose up --build

# View logs
make docker-logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Restart a specific service
docker-compose restart backend

# Stop and remove everything (including volumes)
docker-compose down -v
```

### Build Commands

```bash
# Build both backend and frontend for production
make build
pnpm run build

# Build individually
cd server && pnpm run build
cd client && pnpm run build
```

---

## Troubleshooting

### Port Already in Use

If you get "port already in use" errors:

```bash
# Find what's using port 3000 (backend)
lsof -i :3000

# Find what's using port 5173 (frontend)
lsof -i :5173

# Find what's using port 5432 (postgres)
lsof -i :5432

# Kill the process
kill -9 <PID>
```

### Docker Issues

```bash
# Remove all containers and start fresh
docker-compose down -v
docker-compose up --build

# Remove Docker cache (if builds are failing)
docker system prune -a
```

### Postgres Connection Issues

**Local Postgres:**
```bash
# Check if Postgres is running
brew services list | grep postgres

# Check Postgres logs
tail -f /usr/local/var/log/postgresql@14.log

# Connect to database manually
psql -U postgres -d tablab
```

**Docker Postgres:**
```bash
# Connect to database container
docker-compose exec postgres psql -U postgres -d tablab

# View Postgres logs
docker-compose logs postgres
```

### Can't Connect to Backend from Frontend

Make sure your environment variables are set:

**Local development (`/server/.env`):**
```env
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=tablab
DB_PORT=5432
ACCESS_TOKEN_SECRET=your-secret-here
REFRESH_TOKEN_SECRET=your-refresh-secret-here
FE_API=http://localhost:5173
```

**Docker development (root `.env`):**
```env
DB_HOST=postgres  # Use service name in Docker
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=tablab
DB_PORT=5432
ACCESS_TOKEN_SECRET=your-secret-here
REFRESH_TOKEN_SECRET=your-refresh-secret-here
FE_API=http://localhost:5173
```

**Frontend (`/client/.env`):**
```env
VITE_BE_URL=http://localhost:3000
```

---

## Development Workflow

### Recommended: Docker for First-Time Setup

```bash
# 1. Start everything
make docker-up

# 2. Access the app
# - Frontend: http://localhost:5173
# - Backend: http://localhost:3000/api/health

# 3. Make changes to code (hot-reload works!)

# 4. View logs if needed
make docker-logs

# 5. Stop when done
make docker-down
```

### Recommended: Local for Active Development

Once you're comfortable, switch to local for faster iteration:

```bash
# 1. Start Postgres (only need to do once)
make db-start

# 2. Start backend + frontend
make dev

# 3. Make changes (hot-reload works!)

# 4. Stop with Ctrl+C

# Postgres keeps running until you stop it:
make db-stop
```

---

## Project Structure

```
tablab-v2/
├── server/              # Backend API (Node.js + Express)
│   ├── src/
│   ├── package.json
│   └── Dockerfile.dev
├── client/              # Frontend (React + Vite)
│   ├── src/
│   ├── package.json
│   └── Dockerfile.dev
├── shared/              # Shared types/utilities
├── docker-compose.yml   # Docker orchestration
├── Makefile            # Convenience commands
└── package.json        # Root package (workspace)
```

---

## Next Steps

1. **First time setup:**
   ```bash
   # Install dependencies
   make install

   # Start with Docker (easiest)
   make docker-up
   ```

2. **Create your first user:**
   - Go to http://localhost:5173
   - Click "Register"
   - Create account
   - Start creating tabs!

3. **Development:**
   - Code changes auto-reload in both frontend and backend
   - Check browser console for frontend errors
   - Check terminal for backend errors

---

## Cheat Sheet

| Task | Docker | Local |
|------|--------|-------|
| Start everything | `make docker-up` | `make dev-all` |
| Start just app | `make docker-up` | `make dev` |
| Stop everything | `make docker-down` | `Ctrl+C` + `make db-stop` |
| View logs | `make docker-logs` | Check terminal |
| Rebuild | `make docker-rebuild` | `make build` |
| Clean install | `docker-compose down -v` | `make clean && make install` |

---

## Tips

1. **Use Docker for:**
   - First-time setup
   - Consistent environment
   - Testing production-like setup
   - When you don't want to install Postgres

2. **Use Local for:**
   - Faster development iteration
   - Better debugging experience
   - Lower resource usage
   - When you're comfortable with the stack

3. **Hybrid approach:**
   - Run Postgres in Docker: `docker-compose up postgres`
   - Run backend + frontend locally: `make dev`
   - Best of both worlds!

---

## Common Issues

### "Cannot connect to database"
- **Docker**: Make sure `DB_HOST=postgres` in root `.env`
- **Local**: Make sure `DB_HOST=localhost` in `server/.env`
- **Both**: Ensure database is running and credentials match

### "Port 5173 already in use"
- Another Vite server is running
- Kill it: `lsof -i :5173` then `kill -9 <PID>`

### "pnpm command not found"
```bash
npm install -g pnpm
```

### Changes not reflecting
- Frontend: Check browser console, hard refresh (Cmd+Shift+R)
- Backend: Check terminal for TypeScript errors
- Docker: May need to rebuild: `make docker-rebuild`

---

## Environment Variables Reference

**Required for Backend (`/server/.env`):**
```env
# Database
DB_HOST=localhost              # or 'postgres' for Docker
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=tablab
DB_PORT=5432

# Authentication (generate secure random strings!)
ACCESS_TOKEN_SECRET=<64-char-random-string>
REFRESH_TOKEN_SECRET=<64-char-random-string>

# Server
NODE_ENV=development
PORT=3000

# CORS
FE_API=http://localhost:5173
```

**Required for Frontend (`/client/.env`):**
```env
VITE_BE_URL=http://localhost:3000
```

**Generate secure secrets:**
```bash
# macOS/Linux
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use online generator
# https://randomkeygen.com/
```

---

## Help

If you run into issues:
1. Check this guide's troubleshooting section
2. Check logs: `make docker-logs` or terminal output
3. Try rebuilding: `make docker-rebuild` or `make clean && make install`
4. Check that all environment variables are set correctly

For more help, create an issue in the repository.
