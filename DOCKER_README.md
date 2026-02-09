# Envision PRMS - Complete Docker Setup

## 📦 Files Created

- `Dockerfile.python` - Python backend (simplified, optimized)
- `Dockerfile.frontend` - Production frontend build (multi-stage, Alpine-based)
- `Dockerfile.dev` - Development frontend with hot reload
- `compose.yaml` - Docker Compose orchestration
- `.dockerignore` - Build context optimization
- `Makefile` - Convenient commands
- `DOCKER_GUIDE.md` - Detailed usage guide

## 🚀 Quick Start

### Option 1: Using Makefile (Recommended)
```bash
# Build images
make build

# Start services
make up

# View logs
make logs

# Access frontend at http://localhost:5177
```

### Option 2: Using Docker Compose Directly
```bash
# Build and start
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### Option 3: Development Mode (with hot reload)
```bash
make dev
# Frontend with hot reload at http://localhost:5178
```

## 📋 Available Make Commands

| Command | Description |
|---------|-------------|
| `make help` | Show all commands |
| `make build` | Build all images |
| `make up` | Start production services |
| `make dev` | Start with hot reload |
| `make down` | Stop all services |
| `make logs` | View all logs |
| `make ps` | List containers |
| `make restart` | Restart services |
| `make clean` | Remove everything |
| `make shell-backend` | Access Python shell |
| `make shell-frontend` | Access frontend shell |

## 🏗️ Architecture

```
envision-prms/
├── python-backend (Port: internal only)
│   ├── Python 3.14
│   ├── PDF/Excel/DOCX processing
│   └── Interactive shell
│
└── frontend (Port: 5177 or 5178)
    ├── Vue.js + TypeScript
    ├── Vite build system
    └── Production: serve | Dev: vite dev server
```

## 🔧 Services Details

### Python Backend
- **Image**: python:3.14-slim
- **User**: appuser (non-root)
- **Health Check**: Python import test
- **Volumes**:
  - `./scripts` (read-only)
  - `./coi-prototype` (read-only)
  - `python-data` (persistent)

### Frontend (Production)
- **Image**: node:25-alpine (multi-stage)
- **Port**: 5177
- **User**: appuser (non-root)
- **Health Check**: HTTP ping
- **Build**: Optimized Vite production build

### Frontend (Development)
- **Profile**: `dev`
- **Port**: 5178
- **Features**: Hot reload, source maps
- **Volumes**: Live code mounting

## 🎯 Docker Best Practices Implemented

✅ **Build Optimization**
- Multi-stage builds for smaller final images
- Layer caching for faster rebuilds
- BuildKit syntax for advanced features

✅ **Security**
- Non-root users in all containers
- Minimal base images (slim/alpine)
- Read-only mounts where appropriate
- No secrets in images

✅ **Performance**
- Alpine-based images (smaller, faster)
- Build caching with pip/npm caches
- Optimized layer ordering

✅ **Reliability**
- Health checks for all services
- Service dependencies with conditions
- Automatic restarts (unless-stopped)
- Proper signal handling

✅ **Developer Experience**
- Separate dev/prod configurations
- Hot reload in development
- Easy-to-use Makefile commands
- Comprehensive documentation

## 📊 Image Sizes

Expected sizes:
- Frontend: ~250MB (Alpine-based)
- Python Backend: ~400MB (Debian slim-based with dependencies)

## 🔍 Troubleshooting

### Build Issues
```bash
# Check for errors
docker compose build --progress=plain

# Clean build
make clean && make build
```

### Network Issues
```bash
# Check service connectivity
docker compose exec frontend ping python-backend

# Inspect network
docker network inspect envision-prms_prms-network
```

### Port Conflicts
```bash
# Find what's using the port
lsof -i :5177

# Change port in compose.yaml if needed
```

### Performance Issues
```bash
# Check resource usage
docker stats

# Prune unused resources
docker system prune -a
```

## 🔐 Security Considerations

1. **No root privileges**: All containers run as non-root users
2. **Minimal attack surface**: Using slim/alpine base images
3. **Read-only volumes**: Source code mounted as read-only
4. **Network isolation**: Services on dedicated bridge network
5. **No hardcoded secrets**: Use environment variables

## 📝 Next Steps

1. **Build the images**:
   ```bash
   make build
   ```

2. **Start the services**:
   ```bash
   make up
   ```

3. **Access the application**:
   - Frontend: http://localhost:5177

4. **Run Python scripts**:
   ```bash
   docker compose exec python-backend python3 sample-engagement-letter.py
   docker compose exec python-backend python3 scripts/parse_coi_documents.py
   ```

5. **Development workflow**:
   ```bash
   # Start dev mode
   make dev
   
   # Edit files in prms-dashboard-v2/src
   # Changes auto-reload at http://localhost:5178
   ```

## 🤝 Integration with CI/CD

The setup is ready for CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Build images
  run: docker compose build

- name: Run tests
  run: docker compose run --rm frontend npm test

- name: Push to registry
  run: docker compose push
```

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)

---

**Note**: The COI System directory has been excluded from the build context due to special characters in the path. Mount it as a volume if needed:

```yaml
volumes:
  - "./COI System:/app/COI System:ro"
```
