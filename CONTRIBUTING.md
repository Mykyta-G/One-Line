# Contributing to One-Line

Thank you for your interest in contributing to One-Line! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a professional and respectful environment for all contributors.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/One-Line.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Install dependencies: `npm install`
5. Build the project: `npm run build`

## Development Workflow

### Project Structure

```
One-Line/
├── packages/
│   ├── core/          # Shared command management library
│   └── cli/           # Standalone CLI application
├── scripts/           # Build and packaging scripts
└── docs/              # Documentation
```

### Building the Project

```bash
# Build all packages
npm run build

# Build specific package
cd packages/core && npm run build
cd packages/cli && npm run build
```

### Testing Your Changes

#### CLI Testing
```bash
cd packages/cli
npm link
one-line  # Test your changes
```

## Coding Standards

### TypeScript
- Use TypeScript for all new code
- Follow existing code style and conventions
- Ensure proper type definitions for all functions and interfaces
- Run TypeScript compiler without errors

### Code Style
- Use 2 spaces for indentation
- Use single quotes for strings
- Add meaningful comments for complex logic
- Keep functions small and focused
- Use descriptive variable and function names

### Commit Messages
Follow conventional commit format:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(cli): add support for environment variables
fix(core): resolve command execution timeout issue
docs(readme): update installation instructions
```

## Pull Request Process

1. **Update Documentation**: Ensure README and relevant docs are updated
2. **Test Thoroughly**: Test your changes on multiple platforms if possible
3. **Clean Commits**: Ensure your commit history is clean and meaningful
4. **Update CHANGELOG**: Add your changes to `CHANGELOG.md`
5. **Create PR**: Submit a pull request with a clear description

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how you tested your changes

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings or errors
- [ ] CHANGELOG.md updated
```

## Reporting Issues

### Bug Reports
Include:
- Clear description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (OS, Node version, etc.)
- Screenshots if applicable

### Feature Requests
Include:
- Clear description of the feature
- Use case and motivation
- Proposed implementation (if any)
- Examples of similar features in other tools

## Development Guidelines

### Adding New Features

1. **Discuss First**: Open an issue to discuss major changes
2. **Core Library**: Add shared functionality to `packages/core`
3. **CLI**: Implement CLI-specific features in `packages/cli`
5. **Documentation**: Update all relevant documentation

### Code Review Criteria

- Code quality and readability
- Performance implications
- Security considerations
- Cross-platform compatibility
- Backward compatibility
- Test coverage
- Documentation completeness

## Attribution

All contributions must respect the project's MIT License with Attribution Requirement. By contributing, you agree that your contributions will be licensed under the same terms.

Any derivative works or forks must maintain attribution to the original author (Mykyta Grogul) as specified in the LICENSE file.

## Questions?

If you have questions about contributing, please open an issue with the "question" label.

## Thank You

Your contributions help make One-Line better for everyone. Thank you for your time and effort!

---

**Maintainer**: Mykyta Grogul

