# Envision PRMS - Docker Configuration

This project is containerized using Docker with Docker Compose for easy deployment.

## Quick Start

### Build and Run (Production)
```bash
# Build all images
make build

# Start services
make up

# View logs
make logs
```

The frontend will be available at `http://localhost:5177`

### Development Mode (with hot reload)
```bash
make dev
```

The development frontend will be available at `http://localhost:5178`

## Manual Commands

### Build Images
```bash
docker compose build
```

### Start Services
```bash
# Production mode
docker compose up -d

# Development mode (with hot reload)
docker compose --profile dev up
```

### Stop Services
```bash
docker compose --profile dev down
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f frontend
docker compose logs -f python-backend
```

### Execute Commands in Containers
```bash
# Python backend shell
docker compose exec python-backend /bin/bash

# Frontend shell
docker compose exec frontend /bin/sh

# Run Python script
docker compose exec python-backend python3 scripts/parse_coi_documents.py
```

## Services

### Frontend (Vue.js)
- **Production**: Port 5177
- **Development**: Port 5178 (with hot reload)
- Built with Vite
- Served with `serve` in production

### Python Backend
- Python 3.14
- Includes document processing capabilities (PDF, Excel, DOCX)
- Interactive shell available

## Docker Files

- `Dockerfile.python` - Python backend container
- `Dockerfile.frontend` - Frontend production build
- `Dockerfile.dev` - Frontend development with hot reload
- `compose.yaml` - Multi-service orchestration
- `.dockerignore` - Files excluded from Docker context
- `Makefile` - Convenient commands

## Best Practices Implemented

✓ Multi-stage builds for smaller images  
✓ Layer caching optimization  
✓ Non-root users for security  
✓ Health checks for container monitoring  
✓ Alpine-based images where appropriate  
✓ BuildKit syntax for advanced features  
✓ Separate dev and production configurations  
✓ Named volumes for data persistence  
✓ Service dependencies and health checks  

## Makefile Commands

```bash
make help       # Show all available commands
make build      # Build all Docker images
make up         # Start production services
make dev        # Start development services
make down       # Stop all services
make logs       # View logs
make clean      # Remove all containers, images, and volumes
make restart    # Restart all services
make ps         # List running containers
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using the port
lsof -i :5177

# Stop conflicting service or change port in compose.yaml
```

### Rebuild from Scratch
```bash
make clean
make build
```

### View Build Logs
```bash
docker compose build --progress=plain
```

## Environment Variables

Create a `.env` file in the project root for custom configuration:

```env
# Example
PYTHON_ENV=production
NODE_ENV=production
```

## Data Persistence

- `python-data` volume: Stores Python application data
- Mount host directories as needed in `compose.yaml`

## Security Notes

- Containers run as non-root users
- Minimal base images (slim/alpine)
- No secrets in images (use environment variables)
- Read-only mounts where appropriate
