# Узбек Варс (Uzbek Wars)

Mobile-first Progressive Web App game with Uzbek cultural aesthetics. Built with React 18+, TypeScript, Node.js, Express, and MongoDB.

## 🎮 Project Overview

Uzbek Wars is a mobile-optimized web game where players choose and level up an Uzbek character by performing various activities. The game features:

- **Mobile-First Design**: Optimized for iPhone and Android devices
- **PWA Support**: Installable on home screen, works offline
- **Multi-language**: Russian, Uzbek, Ukrainian, English
- **Cultural Aesthetics**: Uzbek folk art style and themes
- **Real-time Progression**: Character leveling, currency system, activities
- **Professional Architecture**: Enterprise patterns, SOLID principles, TypeScript strict mode

## 🏗️ Architecture

### Monorepo Structure

```
uzbek-wars/
├── frontend/          # React 18+ PWA with Vite
├── backend/           # Express.js API with TypeScript
├── docker-compose.yml # Container orchestration
└── rebuild.sh         # Clean rebuild script
```

### Technology Stack

**Frontend:**
- React 18+ with TypeScript
- Vite for fast builds
- TailwindCSS for mobile-first styling
- Framer Motion for animations
- React Query for state management
- i18next for internationalization

**Backend:**
- Node.js 20+ with Express.js
- TypeScript with strict mode
- MongoDB Atlas with Mongoose
- JWT authentication
- Winston for logging
- Passport for Google OAuth

**Infrastructure:**
- Docker & Docker Compose
- Nginx reverse proxy
- Port 3060 for external access

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- MongoDB Atlas account (or local MongoDB)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd uzbek-wars
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

### Development

**Run locally without Docker:**

```bash
# Install dependencies for all workspaces
npm install

# Run both frontend and backend
npm run dev

# Or run separately
npm run dev:backend  # Backend on port 3000
npm run dev:frontend # Frontend on port 5173
```

**Run with Docker:**

```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### Production Deployment

**Using the rebuild script (recommended):**

```bash
./rebuild.sh
```

This script:
1. Stops all containers
2. Removes old images
3. Cleans Docker caches
4. Cleans aaPanel caches (if present)
5. Rebuilds images from scratch
6. Starts containers

**Manual deployment:**

```bash
# Build images
docker-compose build --no-cache

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

## 📝 Environment Variables

Required variables (see `.env.example`):

```env
# MongoDB
MONGODB_URI=mongodb+srv://...
DB_NAME=uzbek_wars

# Server
PORT=3000
NODE_ENV=production

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Payment (optional)
PAYMENT_API_KEY=your-payment-key
PAYMENT_WEBHOOK_SECRET=your-webhook-secret
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run backend tests
npm run test:backend

# Run frontend tests
npm run test:frontend

# Coverage report
npm run test:coverage
```

## 📦 Building

```bash
# Build all workspaces
npm run build

# Build backend only
npm run build:backend

# Build frontend only
npm run build:frontend
```

## 🔍 Code Quality

```bash
# Lint all code
npm run lint

# Format code
npm run format
```

### Code Standards

- **TypeScript Strict Mode**: All code is type-safe
- **ESLint**: Enforced code style
- **Prettier**: Consistent formatting
- **Conventional Commits**: Structured commit messages
- **Enterprise Patterns**: Repository, Service, Factory patterns
- **SOLID Principles**: Clean, maintainable code

## 🌐 API Endpoints

### Health Check
```
GET /health
```

### Authentication
```
POST /api/auth/google
POST /api/auth/dev-login (development only)
```

### Player
```
GET /api/player/state
POST /api/player/select-character
PATCH /api/player/language
```

### Activities
```
POST /api/activities/execute
```

## 🎨 Design System

### Color Palette (Uzbek Cultural Theme)

- **Primary**: `#D4AF37` (Gold)
- **Secondary**: `#8B4513` (Brown)
- **Accent**: `#FF6B35` (Orange)
- **Background**: `#FFF8DC` (Cream)
- **Text**: `#2C1810` (Dark Brown)

### Mobile-First Breakpoints

- `xs`: 375px (iPhone SE)
- `sm`: 640px
- `md`: 768px (iPad)
- `lg`: 1024px
- `xl`: 1280px

## 📱 PWA Features

- **Installable**: Add to home screen
- **Offline Support**: Service Worker caching
- **App-like Experience**: Fullscreen mode
- **Fast Loading**: Optimized assets
- **Push Notifications**: (Future feature)

## 🔒 Security

- Helmet.js for security headers
- CORS configuration
- JWT token authentication
- Input validation
- Rate limiting
- Non-root Docker containers
- Environment variable protection

## 📊 Monitoring

- Winston logging with levels
- Docker health checks
- Error tracking
- Performance monitoring

## 🤝 Contributing

1. Follow Conventional Commits format
2. Write tests for new features
3. Ensure ESLint passes
4. Update documentation
5. Professional code style (see Requirements 46)

### Commit Format

```
feat(scope): add new feature
fix(scope): fix bug
refactor(scope): refactor code
docs(scope): update documentation
test(scope): add tests
chore(scope): update dependencies
```

## 📄 License

This project is licensed under the PolyForm Noncommercial License 1.0.0.

Copyright (c) 2026 German Vitiaz.

Commercial use, sale, or other commercial exploitation of this project
is not permitted without separate permission from the copyright holder.

See LICENSE for the complete license terms.

## 👥 Team

Uzbek Wars Development Team

## 🆘 Troubleshooting

### Docker Issues

```bash
# Clean everything and rebuild
./rebuild.sh

# View container logs
docker-compose logs -f [service-name]

# Restart specific service
docker-compose restart [service-name]
```

### Database Connection Issues

1. Check MongoDB URI in `.env`
2. Verify network connectivity
3. Check MongoDB Atlas IP whitelist
4. Review backend logs: `docker-compose logs backend`

### Port Conflicts

If port 3060 is in use:
```bash
# Change DOCKER_PROXY_PORT in .env
# Or stop conflicting service
lsof -ti:3060 | xargs kill -9
```

## 📈 Performance

- **Lighthouse Score Target**: 90+
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Bundle Size**: < 200KB (gzipped)

---

**Built with ❤️ for the Uzbek gaming community**
