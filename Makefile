.PHONY: help build up down logs clean dev prod restart

# Default target
help:
	@echo "Envision PRMS Docker Commands"
	@echo "=============================="
	@echo "make build       - Build all Docker images"
	@echo "make up          - Start production services"
	@echo "make dev         - Start development services (with hot reload)"
	@echo "make down        - Stop all services"
	@echo "make restart     - Restart all services"
	@echo "make logs        - View logs from all services"
	@echo "make clean       - Remove all containers, images, and volumes"
	@echo "make ps          - List running containers"

# Build all images
build:
	docker compose build

# Start production services
up:
	docker compose up -d

# Start production in foreground
prod:
	docker compose up

# Start development services with hot reload
dev:
	docker compose --profile dev up

# Stop all services
down:
	docker compose --profile dev down

# Restart services
restart:
	docker compose restart

# View logs
logs:
	docker compose logs -f

# List running containers
ps:
	docker compose ps

# Clean everything
clean:
	docker compose --profile dev down -v --rmi all
	docker system prune -f

# Backend shell
shell-backend:
	docker compose exec python-backend /bin/sh

# Frontend shell
shell-frontend:
	docker compose exec frontend /bin/sh
