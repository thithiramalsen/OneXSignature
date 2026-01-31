# Contributing to OneX Signature

Thank you for considering contributing to OneX Signature! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and constructive in all interactions.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported
2. Use the bug report template
3. Include:
   - Clear description of the issue
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details

### Suggesting Enhancements

1. Check if the enhancement has been suggested
2. Provide clear use cases
3. Explain why this enhancement would be useful

### Pull Requests

1. Fork the repository
2. Create a feature branch from `main`
3. Follow the coding standards
4. Write clear commit messages
5. Add tests for new features
6. Update documentation
7. Submit a pull request

## Development Setup

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 15+ (for local development)

### Local Development

```bash
# Clone the repository
git clone https://github.com/thithiramalsen/OneXSignature.git
cd OneXSignature

# Backend setup
cd backend
npm install
cp .env.example .env
npm run dev

# Frontend setup (in a new terminal)
cd frontend
npm install
npm start
```

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Define proper types/interfaces
- Avoid `any` type
- Use meaningful variable names
- Add JSDoc comments for complex functions

### Backend

- Follow RESTful API conventions
- Use async/await for asynchronous operations
- Implement proper error handling
- Validate all inputs
- Use parameterized queries for database operations

### Frontend

- Use functional components with hooks
- Implement proper state management
- Follow React best practices
- Use Tailwind CSS for styling
- Make components reusable

### Git Commits

Format: `type(scope): subject`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

Example: `feat(auth): add password reset functionality`

## Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

## Documentation

- Update README.md for major changes
- Update API documentation
- Add JSDoc comments for new functions
- Update inline comments

## Project Structure

### Backend

```
backend/src/
├── config/         # Configuration
├── controllers/    # Request handlers
├── middleware/     # Express middleware
├── routes/         # API routes
├── services/       # Business logic
├── types/          # TypeScript types
└── server.ts       # Entry point
```

### Frontend

```
frontend/src/
├── components/     # Reusable components
├── context/        # React context
├── pages/          # Page components
├── services/       # API services
├── types/          # TypeScript types
└── App.tsx         # Main component
```

## Questions?

Feel free to open an issue for any questions or clarifications.

Thank you for contributing! 🎉
