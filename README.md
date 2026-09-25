# MineStress

**A professional performance-testing laboratory for Minecraft servers.**

Advanced Minecraft server stress testing, load simulation, and performance analysis platform.

## Vision

MineStress provides a production-grade platform for legitimate Minecraft server performance testing with:

- Realistic virtual-player simulation
- Configurable bot populations with behavior profiles
- Scenario-based workloads
- Live performance telemetry
- Distributed load generation
- AI-assisted analysis
- Professional web dashboard control

## Core Architecture

```
                         WEB DASHBOARD
                              │
                              │ HTTPS / WebSocket
                              ▼
                       API / CONTROLLER
                              │
             ┌────────────────┼────────────────┐
             │                │                │
             ▼                ▼                ▼
       TEST MANAGER     SCENARIO ENGINE   WORKER MANAGER
             │                │                │
             └────────────────┼────────────────┘
                              │
                           gRPC/API
                              │
             ┌────────────────┼────────────────┐
             ▼                ▼                ▼
          WORKER 1         WORKER 2         WORKER N
             │                │                │
        Bot Runtime      Bot Runtime      Bot Runtime
             │                │                │
             ▼           Minecraft Server
                         (Real or Simulated)
                              │
                              ▼
                       TELEMETRY ENGINE
                              │
                              ▼
                       ANALYSIS ENGINE
                              │
                     ┌────────┴────────┐
                     ▼                 ▼
                  REPORTS          AI ANALYST
```

## Project Structure

```
minestress/
│
├── apps/
│   ├── dashboard/              # Next.js web frontend
│   ├── controller/             # Kotlin/Java controller service
│   ├── worker/                 # Go or Kotlin worker agent
│   └── cli/                    # CLI client
│
├── packages/
│   ├── api-types/              # Shared TypeScript types
│   ├── scenario-engine/        # Scenario execution engine
│   ├── telemetry/              # Telemetry collection & aggregation
│   ├── shared/                 # Shared utilities
│   └── ui/                     # React component library
│
├── minecraft/
│   ├── core/                   # Bot runtime
│   ├── protocol/               # Minecraft protocol
│   ├── versions/               # Multi-version support
│   └── adapters/               # Client adapters
│
├── plugins/                    # Plugin system
│
├── infrastructure/
│   ├── docker/                 # Docker configuration
│   ├── migrations/             # Database migrations
│   └── deployment/             # Deployment configs
│
├── docs/                       # Documentation
│
├── docker-compose.yml          # Local development
├── .env.example                # Environment template
└── README.md                   # This file
```

## Technology Stack

### Frontend
- **Next.js** + TypeScript + React
- **WebSocket** for real-time updates
- **TailwindCSS** + custom design system
- Responsive: desktop, tablet, mobile

### Backend
- **Kotlin/Java 25+** for controller
- **PostgreSQL** for persistent state
- **Redis** for coordination & pub/sub
- **gRPC** + Protocol Buffers for worker communication
- **REST API** for dashboard
- **OpenAI-compatible API** for AI features

### Infrastructure
- **Docker** + `docker-compose`
- **Testcontainers** for testing
- **Protocol Buffers** for serialization

## Current Status

**Phase**: 1 - Foundation (In Progress)

### Completed
- [x] Repository scaffold
- [x] Monorepo structure
- [x] Database schema
- [x] Docker environment
- [ ] Controller foundation
- [ ] Dashboard shell
- [ ] Worker registration
- [ ] WebSocket infrastructure

### Next Steps
1. Implement controller service
2. Create database migrations
3. Build dashboard authentication & shell
4. Set up worker registration API
5. Implement WebSocket telemetry pipeline
6. Create simulation bot engine
7. Build first end-to-end workflow

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- Java 25+
- Go 1.22+

### Development

```bash
# Clone the repository
git clone https://github.com/purabsingh089/HELL-NHHH.git
cd HELL-NHHH

# Copy environment template
cp .env.example .env

# Start services
docker-compose up -d

# Initialize database
npm run db:migrate

# Start development servers
npm run dev
```

**Access:**
- Dashboard: http://localhost:3000
- Controller API: http://localhost:8080
- API Docs: http://localhost:8080/api/docs

## Environment Variables

See `.env.example` for all configuration options.

Key variables:
```
DATABASE_URL=postgresql://user:password@localhost:5432/minestress
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
API_SECRET=your-api-secret
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=your-api-key
AI_MODEL=gpt-4-turbo
```

## Development Commands

```bash
# Database
npm run db:migrate          # Run migrations
npm run db:seed             # Seed demo data (dev only)
npm run db:reset            # Reset database

# Build & test
npm run build               # Build all packages
npm run test                # Run tests
npm run lint                # Lint code
npm run type-check          # TypeScript checking

# Development
npm run dev                 # Start all services
npm run dev:controller      # Controller only
npm run dev:dashboard       # Dashboard only
npm run dev:worker          # Worker only

# Stop
docker-compose down         # Stop all services
```

## API Documentation

REST API endpoints:
- `POST /api/tests` — Create test
- `GET /api/tests` — List tests
- `GET /api/tests/:id` — Get test details
- `POST /api/tests/:id/start` — Start test
- `POST /api/tests/:id/pause` — Pause test
- `POST /api/tests/:id/resume` — Resume test
- `POST /api/tests/:id/stop` — Stop test
- `GET /api/scenarios` — List scenarios
- `GET /api/workers` — List workers
- `GET /api/metrics` — Retrieve metrics

WebSocket channels:
- `test:{id}:metrics` — Live test metrics
- `test:{id}:events` — Test events
- `test:{id}:bots` — Bot state updates
- `worker:{id}:status` — Worker health
- `system:alerts` — System alerts

See `docs/API.md` for full specification.

## Security

- Authentication via JWT
- Role-based access control (RBAC)
- Audit logging of administrative actions
- Encrypted secrets management
- Rate limiting on APIs
- Target authorization confirmation

Roles:
- **Owner** — Full access
- **Admin** — System management
- **Operator** — Test execution
- **Developer** — API access
- **Viewer** — Read-only access

## FAQ

**Q: Is MineStress a griefing tool?**

A: No. MineStress is designed exclusively for legitimate performance testing of Minecraft servers that the operator owns or is explicitly authorized to test. Misuse is prohibited.

**Q: Can I test servers I don't own?**

A: Only with explicit authorization. The platform requires confirmation before any test execution.

**Q: Does it work with modded servers?**

A: The core architecture supports plugin adapters for different Minecraft implementations. Initial release targets vanilla + Paper.

**Q: Can I extend it?**

A: Yes. The plugin system allows custom scenarios, behaviors, metrics, and more without modifying core.

## License

See LICENSE file.

## Contributing

Contributions are welcome. Please:
1. Follow the coding standards
2. Add tests for new features
3. Update documentation
4. Submit a pull request

## Support

- Documentation: `/docs`
- Issues: GitHub Issues
- API Docs: Dashboard → API section
- Community: [Link to community if applicable]

---

**Built with precision for professional load testing.**
