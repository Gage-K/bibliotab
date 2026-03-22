.PHONY: help dev dev-all build install db-start db-stop docker-up docker-down clean

# Default target
help:
	@echo "TabLab v2 - Development Commands"
	@echo ""
	@echo "Local Development (requires Postgres installed):"
	@echo "  make dev         - Start backend + frontend (assumes DB is running)"
	@echo "  make dev-all     - Start database + backend + frontend"
	@echo "  make db-start    - Start PostgreSQL"
	@echo "  make db-stop     - Stop PostgreSQL"
	@echo ""
	@echo "Docker (everything in containers):"
	@echo "  make docker-up   - Start all services with Docker"
	@echo "  make docker-down - Stop all Docker services"
	@echo ""
	@echo "Setup:"
	@echo "  make install     - Install all dependencies"
	@echo "  make build       - Build all projects"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean       - Clean node_modules and build artifacts"

# Local development (assumes Postgres installed)
dev:
	pnpm run dev

dev-all:
	pnpm run dev:all

# Database commands (Homebrew Postgres)
db-start:
	brew services start postgresql@14

db-stop:
	brew services stop postgresql@14

db-status:
	brew services list | grep postgres

# Docker commands
docker-up:
	docker-compose up

docker-down:
	docker-compose down

docker-rebuild:
	docker-compose up --build

docker-logs:
	docker-compose logs -f

# Build
build:
	pnpm run build

# Install dependencies
install:
	pnpm install
	cd server && pnpm install
	cd client && pnpm install

# Clean
clean:
	rm -rf node_modules server/node_modules client/node_modules
	rm -rf server/dist client/dist
