# Changelog

All notable changes to the Uzbek Wars project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup with monorepo structure
- Backend API with Express.js and TypeScript
- Frontend PWA with React 18+ and Vite
- MongoDB database configuration with Mongoose
- Docker containerization with multi-stage builds
- Nginx reverse proxy configuration
- Environment variable management
- Professional error handling and logging
- ESLint and Prettier configuration
- Testing setup with Jest (backend) and Vitest (frontend)
- PWA configuration with service worker
- TailwindCSS with Uzbek cultural color palette
- Mobile-first responsive design
- Health check endpoints
- Rebuild script for clean container rebuilds
- Comprehensive README documentation

### Infrastructure
- Docker Compose orchestration
- Port 3060 proxy configuration
- Non-root container users for security
- Health checks for all services
- Log rotation configuration
- aaPanel cache cleaning support

### Development Tools
- TypeScript strict mode
- Hot module replacement (HMR)
- Concurrent development servers
- Code formatting with Prettier
- Linting with ESLint
- Git hooks preparation (Husky ready)

## [1.0.0] - 2024-01-XX

### Initial Release
- Project foundation established
- Ready for feature development

---

## Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `refactor:` - Code refactoring
- `docs:` - Documentation changes
- `test:` - Test additions or modifications
- `chore:` - Maintenance tasks
- `style:` - Code style changes
- `perf:` - Performance improvements
