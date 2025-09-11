# Contributing to E2E Delivery Management System

Thank you for your interest in contributing to the E2E Delivery Management System! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/e2e-delivery-management.git`
3. Install dependencies: `npm install`
4. Start development server: `npm run dev`

## 📝 How to Contribute

### 1. Reporting Issues

- Use the GitHub issue tracker
- Provide detailed information about the bug or feature request
- Include steps to reproduce (for bugs)
- Include screenshots if applicable

### 2. Submitting Pull Requests

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Run tests: `npm run type-check` and `npm run lint`
4. Commit your changes with a descriptive message
5. Push to your fork and submit a pull request

### 3. Code Style Guidelines

- Follow TypeScript best practices
- Use meaningful variable and function names
- Add comments for complex logic
- Follow the existing code structure
- Use Prettier for code formatting

### 4. Commit Message Format

Use conventional commit format:

```
type(scope): description

feat(tmf): add new capability mapping feature
fix(ui): resolve infinite loop in domain manager
docs(readme): update installation instructions
```

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
├── components/            # Reusable UI components
├── lib/                  # Utility libraries
└── types/                # TypeScript definitions
```

## 🧪 Testing

- Run type checking: `npm run type-check`
- Run linting: `npm run lint`
- Build the project: `npm run build`

## 📋 Development Workflow

1. **Create an issue** for the feature/bug you want to work on
2. **Fork the repository** and create a feature branch
3. **Make your changes** following the coding guidelines
4. **Test your changes** thoroughly
5. **Submit a pull request** with a clear description
6. **Wait for review** and address any feedback

## 🤝 Code Review Process

- All pull requests require review
- Maintainers will review your code
- Address any feedback or requested changes
- Once approved, your PR will be merged

## 📞 Getting Help

- Create an issue for bugs or feature requests
- Join our discussions for general questions
- Check existing issues and pull requests

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to the E2E Delivery Management System! 🎉
