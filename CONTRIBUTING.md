# Contributing to Uzbek Wars

Thank you for your interest in contributing to Uzbek Wars! This document provides guidelines and standards for contributing to the project.

## Code of Conduct

- Be respectful and professional
- Write clean, maintainable code
- Follow the established patterns and conventions
- Test your changes thoroughly
- Document your code appropriately

## Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/uzbek-wars.git
   cd uzbek-wars
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

## Code Standards

### TypeScript

- **Strict mode enabled**: All code must be type-safe
- **No `any` types**: Use proper typing or `unknown`
- **Explicit return types**: For public functions
- **Interface over type**: Prefer interfaces for object shapes

### Code Style

- **ESLint**: Must pass without errors
- **Prettier**: Code must be formatted
- **Naming conventions**:
  - `camelCase` for variables and functions
  - `PascalCase` for classes and components
  - `UPPER_SNAKE_CASE` for constants
  - Descriptive names (no `x`, `temp`, `data`)

### Comments

- **English only**: All comments in English
- **Explain "why", not "what"**: Code should be self-documenting
- **JSDoc for public APIs**: Include parameter and return types
- **Professional tone**: Write as a senior developer, not AI

**Good example:**
```typescript
/**
 * Calculates damage with defense mitigation
 * 
 * Defense is capped at 75% to prevent invulnerability.
 * This ensures all attacks deal at least 25% damage.
 * 
 * @param attacker - Attacking entity stats
 * @param defender - Defending entity stats
 * @returns Final damage after mitigation
 */
function calculateDamage(attacker: CombatStats, defender: CombatStats): number {
  const defenseReduction = Math.min(0.75, defender.defense / 100);
  return attacker.attack * (1 - defenseReduction);
}
```

**Bad example:**
```typescript
// This function calculates the damage
// It takes attacker and defender
// Returns the damage value
function calculateDamage(attacker, defender) {
  // Calculate damage
  const damage = attacker.attack * (1 - defender.defense / 100);
  return damage;
}
```

## Architecture Patterns

### Backend

- **Repository Pattern**: Data access layer
- **Service Pattern**: Business logic layer
- **Controller Pattern**: HTTP request handling
- **Dependency Injection**: Loose coupling

### Frontend

- **Component Composition**: Small, reusable components
- **Custom Hooks**: Shared logic extraction
- **Service Layer**: API communication
- **State Management**: React Query for server state

## Git Workflow

### Branch Naming

- `feat/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `refactor/what-changed` - Code refactoring
- `docs/what-documented` - Documentation
- `test/what-tested` - Tests

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `docs`: Documentation
- `test`: Tests
- `chore`: Maintenance
- `style`: Formatting
- `perf`: Performance

**Examples:**
```
feat(player): add profession system with 5 specializations

Implements the profession system allowing players to choose
from 5 different professions at level 10.

Closes #123

fix(combat): correct damage calculation for critical hits

The critical hit multiplier was being applied before defense
reduction, causing incorrect damage values.

refactor(inventory): extract item management to separate service

Moved item management logic from player service to dedicated
inventory service for better separation of concerns.
```

## Testing

### Requirements

- **Unit tests**: For all business logic
- **Integration tests**: For API endpoints
- **Property tests**: For universal properties
- **Coverage**: Minimum 80% for new code

### Running Tests

```bash
# All tests
npm test

# Backend only
npm run test:backend

# Frontend only
npm run test:frontend

# With coverage
npm run test:coverage
```

### Writing Tests

```typescript
// Unit test example
describe('calculateExperience', () => {
  it('should return increasing values for higher levels', () => {
    const level1 = calculateExperience(1);
    const level2 = calculateExperience(2);
    
    expect(level2).toBeGreaterThan(level1);
  });
});

// Property test example
import fc from 'fast-check';

describe('Property: Experience formula is monotonic', () => {
  it('should always increase with level', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 99 }),
        (level) => {
          const current = calculateExperience(level);
          const next = calculateExperience(level + 1);
          return next > current;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

## Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feat/your-feature
   ```

2. **Make your changes**
   - Write code following standards
   - Add tests
   - Update documentation

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

4. **Push to your fork**
   ```bash
   git push origin feat/your-feature
   ```

5. **Create Pull Request**
   - Clear title and description
   - Reference related issues
   - Include screenshots for UI changes
   - Ensure CI passes

### PR Checklist

- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] ESLint passes
- [ ] Tests pass
- [ ] No console.log statements
- [ ] Commit messages follow convention
- [ ] Branch is up to date with main

## Code Review

### As a Reviewer

- Be constructive and respectful
- Explain reasoning for suggestions
- Approve when standards are met
- Request changes if needed

### As an Author

- Respond to all comments
- Make requested changes
- Ask for clarification if needed
- Be open to feedback

## Questions?

- Open an issue for bugs
- Start a discussion for features
- Ask in pull request comments

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to Uzbek Wars! 🎮
