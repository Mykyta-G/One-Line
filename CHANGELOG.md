# Changelog

All notable changes to the One-Line project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.6] - 2026-01-XX

### Fixed
- **Command name sanitization**: Command names are now automatically converted to lowercase and spaces are replaced with dashes when creating or editing commands. This ensures consistent naming across all command operations.

## [1.0.5] - 2026-01-XX

## [1.0.0] - 2026-01-05

### Added
- Initial release of One-Line command aliasing tool
- Core library (`@one-line/core`) with command management functionality
- Standalone CLI application with interactive and command-line modes
- VS Code extension with command palette and sidebar integration
- Sequential command execution with stop-on-error behavior
- Cross-platform support (macOS, Linux, Windows)
- Shared JSON-based command storage (`~/.one-line/commands.json`)
- Comprehensive documentation and getting started guide
- Build and packaging scripts for distribution

### Features
- **CLI Tool**:
  - Interactive menu for managing commands
  - Sub-commands: add, run, list, delete, edit
  - Colored terminal output for better readability
  - Global installation support via npm

- **VS Code Extension**:
  - Command palette integration
  - Sidebar tree view with expandable command list
  - Integrated terminal execution
  - Context menus for quick actions
  - Real-time synchronization with CLI

- **Core Library**:
  - CommandStorage: JSON-based persistent storage
  - CommandExecutor: Sequential command execution engine
  - CommandManager: High-level API for command operations
  - Full TypeScript support with type definitions

### Documentation
- Main README with comprehensive project overview
- Package-specific READMEs for core, CLI, and VS Code extension
- Getting Started guide with step-by-step instructions
- License with attribution requirements

### License
- MIT License with Attribution Requirement
- Requires credit to original author (Mykyta Grogul) in derivative works

## Author

Created and maintained by Mykyta Grogul

---

For more information, visit the [GitHub repository](https://github.com/Mykyta-G/One-Line).

