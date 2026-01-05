#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get the shell from environment
const shell = process.env.SHELL || '/bin/sh';
const shellName = path.basename(shell);

// Determine which shell and rc file to use
let rcFile;
let shellType;

if (shellName === 'zsh' || shellName.includes('zsh')) {
  shellType = 'zsh';
  rcFile = path.join(process.env.HOME, '.zshrc');
} else if (shellName === 'bash' || shellName.includes('bash')) {
  shellType = 'bash';
  rcFile = path.join(process.env.HOME, '.bashrc');
} else {
  // Default to zsh on macOS, bash on Linux
  if (process.platform === 'darwin') {
    shellType = 'zsh';
    rcFile = path.join(process.env.HOME, '.zshrc');
  } else {
    shellType = 'bash';
    rcFile = path.join(process.env.HOME, '.bashrc');
  }
}

// Check if completion is already installed
function isCompletionInstalled(rcFile) {
  if (!fs.existsSync(rcFile)) {
    return false;
  }
  
  const content = fs.readFileSync(rcFile, 'utf8');
  return content.includes('_one-line_completion') || content.includes('_one-line()');
}

// Get the completion script
function getCompletionScript(shellType) {
  // Try multiple paths - local build, global install, or via npm bin
  const possiblePaths = [
    path.join(__dirname, '..', 'dist', 'index.js'),
    path.join(__dirname, '..', '..', '..', 'node_modules', '.bin', 'one-line'),
    require.resolve('one-line-cli/dist/index.js'),
  ];

  // Also try to find via which/where
  try {
    const whichOutput = execSync('which one-line 2>/dev/null || where one-line 2>/dev/null', {
      encoding: 'utf8',
      stdio: 'pipe'
    }).trim();
    if (whichOutput) {
      possiblePaths.unshift(whichOutput);
    }
  } catch (e) {
    // Ignore
  }

  for (const oneLinePath of possiblePaths) {
    try {
      if (fs.existsSync(oneLinePath)) {
        const output = execSync(`node "${oneLinePath}" completion ${shellType}`, {
          encoding: 'utf8',
          stdio: 'pipe'
        });
        return output;
      }
    } catch (error) {
      // Try next path
      continue;
    }
  }
  
  return null;
}

// Install completion
function installCompletion() {
  // Only install if we can detect the shell and the CLI is built
  if (!shellType || !rcFile) {
    return;
  }

  // Check if already installed
  if (isCompletionInstalled(rcFile)) {
    return; // Already installed, skip
  }

  // Get completion script
  const completionScript = getCompletionScript(shellType);
  if (!completionScript) {
    return; // Can't generate script, skip silently
  }

  // Append to rc file
  try {
    const separator = '\n# One-Line tab completion\n';
    fs.appendFileSync(rcFile, separator + completionScript + '\n', 'utf8');
  } catch (error) {
    // Silently fail if we can't write (permissions, etc.)
  }
}

// Only run if this is a global install or if explicitly requested
// Skip if running in CI or if npm_config_global is not set (local install)
if (process.env.CI !== 'true' && (process.env.npm_config_global === 'true' || process.argv.includes('--force'))) {
  installCompletion();
}

