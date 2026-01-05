# One-Line

**A powerful command aliasing and workflow automation tool for developers**

One-Line is a production-ready CLI tool and VS Code extension that enables developers to create, manage, and execute command sequences through an terminal based menu. Built with TypeScript and designed for cross-platform compatibility, it provides a quick and easy solution for repetitive development workflows.

## Features

- **Save Command Sequences**: Combine multiple commands into one named shortcut
- **Sequential Execution**: Commands run one after another, stopping on failure (like `&&`)
- **Interactive Management**: Easy-to-use menus for viewing, running, and managing commands
- **Cross-Platform**: Works on macOS, Linux, and Windows
- **VS Code Integration**: Full integration with VS Code's command palette and sidebar
- **Shared Storage**: CLI and VS Code extension use the same command storage

## Installation

### CLI Tool

```bash
# Install globally via npm
npm install -g one-line-cli

# Or install from source
git clone https://github.com/Mykyta-G/One-Line.git
cd One-Line
npm run build
cd packages/cli
npm link
```

### VS Code Extension

1. Download the `.vsix` file from the releases page
2. Install via VS Code:
   - Open VS Code
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type "Install from VSIX"
   - Select the downloaded file

Or search for "One-Line" in the VS Code Extensions marketplace.

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

**Example:**
```bash
$ one-line add
Name: Git Status
Generated alias: git
[ERROR] Cannot use 'git' as alias - it's a system command
   Suggestions: gitstatus, gs, git-status
```

### VS Code Usage

1. Open the One-Line sidebar (click the link icon in the activity bar)
2. Click the `+` button to add a new command
3. Enter your command name and steps
4. Click on any command to run it in the integrated terminal

**Command Palette**:
- `One-Line: Run Command` - Select and run a saved command
- `One-Line: Add New Command` - Create a new command
- `One-Line: Delete Command` - Delete commands
- `One-Line: Edit Command` - Edit existing commands

## Usage Examples

### Example 1: Build and Run Project

Instead of typing these commands every time:
```bash
npm run build
npm run dev
```

Create a One-Line command:
```bash
one-line add
# Name: Build and Run
# Generated alias: build-and-run
# Step 1: npm run build
# Step 2: npm run dev
# Step 3: (press Enter to finish)
```

Now just run:
```bash
one-line build-and-run
# or
one-line run "Build and Run"
```

### Example 2: Git Workflow

Save your git workflow:
```bash
# Name: Push Changes
# Alias: push-changes
# Steps:
#   1. git add .
#   2. git commit -m "Update"
#   3. git push origin main

# Run with: one-line push-changes
```

### Example 3: Docker Setup

Simplify docker commands:
```bash
# Name: Start Docker Environment
# Alias: start-docker-environment
# Steps:
#   1. docker-compose down
#   2. docker-compose build
#   3. docker-compose up -d
#   4. docker-compose logs -f

# Run with: one-line start-docker-environment
```

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

## Troubleshooting

**CLI not found after installation:**
```bash
npm config get prefix
# Add the bin directory to your PATH
```

**"Cannot use 'X' as alias" error:**
- The alias conflicts with a system command
- Try a different name or use suggested alternatives
- Examples: "my-git-status", "git-st", "gitstatus"

**Commands not syncing between CLI and VS Code:**
- Both tools use `~/.one-line/commands.json`
- Refresh the VS Code sidebar if needed

**Permission errors:**
```bash
chmod +x ~/.one-line/commands.json
```

**Alias doesn't work:**
- Make sure you've rebuilt: `npm run build`
- Try running with full name: `one-line run "Command Name"`
- Check alias with: `one-line list`

## Support

- Report bugs via [GitHub Issues](https://github.com/yourusername/One-Line/issues)
- Feature requests are welcome!

---

## Author

Created and maintained by Mykyta Grogul

## Acknowledgments

This project was built with a focus on developer productivity and workflow optimization. Special thanks to the open-source community for the excellent tools and libraries that made this possible.

