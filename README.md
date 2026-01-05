# One-Line

**Command Line Tool To Combine Commands Into One**

[![npm version](https://img.shields.io/npm/v/one-line-cli.svg)](https://www.npmjs.com/package/one-line-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Have you ever got tired of typing in the same commands in the same way for to long time such as npm build -> npm run dev -> ... repeat

One Line Solves That!

One-Line is a production-ready CLI tool that enables developers to create, manage, and execute command sequences through an terminal based menu. Built with TypeScript, it provides a quick and easy solution for repetitive development workflows.

**🚀 Now available on npm!** Install with: `npm install -g one-line-cli`

## Quick Install

```bash
npm install -g one-line-cli
```

Then run `one-line` to get started!

## Features

- **Save Command Sequences**: Combine multiple commands into one named shortcut
- **Sequential Execution**: Commands run one after another, stopping on failure (like `&&`)
- **Interactive Management**: Easy-to-use menus for viewing, running, and managing commands
- **Cross-Platform**: Works on macOS, Linux, and Windows

## Installation

### CLI Tool

**Install from npm (Recommended):**

```bash
npm install -g one-line-cli
```

That's it! Now you can use `one-line` from anywhere in your terminal.

**Or install from source:**

```bash
git clone https://github.com/Mykyta-G/One-Line.git
cd One-Line
npm run build
cd packages/cli
npm link
```

### VS Code Extension

**Coming Soon to VS Code Marketplace!**

## Quick Start

### CLI Usage

**Interactive Mode** (recommended for beginners):
```bash
one-line
```

This opens an interactive menu where you can:
- View all saved commands
- Run a command
- Add new commands
- Delete commands
- View command details

**Command Line Mode**:
```bash
# Add a new command
one-line add

# List all commands
one-line list

# Run a command by alias (fastest)
one-line build

# Or run by full name
one-line run "Build my program"

# Delete a command
one-line delete "Build my program"

# Edit a command
one-line edit "Build my program"
```

### Command Aliases

One-Line automatically creates shell-safe aliases for your commands:
- **"Build My Program"** → alias: `build-my-program`
- **"Deploy to prod"** → alias: `deploy-to-prod`
- **"Test & Deploy!"** → alias: `test-deploy`

**Run commands directly by alias:**
```bash
one-line build-my-program
one-line deploy-to-prod
```

### Safety Features

One-Line protects you from accidentally overwriting system commands:

- **Reserved Commands**: Cannot use aliases like `ls`, `git`, `npm`, `cd`, etc.
- **PATH Checking**: Warns if alias conflicts with existing commands
- **Smart Suggestions**: Offers alternatives when conflicts detected

## Architecture

```
One-Line/
├── packages/
│   ├── core/          # Shared library for command management
│   ├── cli/           # Standalone CLI application
│   └── vscode/        # VS Code extension
├── scripts/           # Build and packaging scripts
└── README.md
```

## Development

### Prerequisites

- Node.js 18+ and npm
- TypeScript knowledge for contributions

### Build from Source

```bash
# Clone the repository
git clone https://github.com/yourusername/One-Line.git
cd One-Line

# Install dependencies and build
npm run build

# Test CLI locally
cd packages/cli
npm link

# Test VS Code extension
cd packages/vscode
# Press F5 in VS Code to open Extension Development Host
```

### Package for Distribution

```bash
# Package CLI
npm run package:cli

# Package VS Code extension
npm run package:vscode
```

## Command Storage

Commands are stored in `~/.one-line/commands.json` as JSON:

```json
{
  "commands": [
    {
      "id": "uuid-here",
      "name": "Build my program",
      "steps": ["npm run build", "npm run dev"],
      "createdAt": "2024-01-05T12:00:00.000Z"
    }
  ]
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License with Attribution Required - see the [LICENSE](LICENSE) file for details. Any derivative works must provide clear attribution to the original author.

## Best Practices

- **Use descriptive names** for your commands - they'll be converted to safe aliases
- **Avoid reserved words** like "git", "npm", "docker" as command names
- **Keep sequences focused** - one command = one workflow
- **Use interactive mode** when you're unsure of exact command names
- **Commands run in CWD** - current working directory
- **Sequential execution** - stops on first failure (like using `&&` in shell)
- **Aliases are faster** - use `one-line build` instead of `one-line run "Build"`

## Author

Created and maintained by Mykyta Grogul

## Acknowledgments

This project was built with a focus on developer productivity and workflow optimization. Special thanks to the open-source community for the excellent tools and libraries that made this possible.

