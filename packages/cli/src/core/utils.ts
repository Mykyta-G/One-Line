import { execSync } from 'child_process';

/**
 * Reserved system commands that cannot be used as aliases
 */
const RESERVED_COMMANDS = [
  // Shell built-ins
  'cd', 'pwd', 'echo', 'exit', 'source', 'alias', 'export', 'history', 'set', 'unset',
  // File operations
  'ls', 'cat', 'grep', 'find', 'chmod', 'chown', 'sudo', 'su',
  'cp', 'mv', 'rm', 'mkdir', 'rmdir', 'touch', 'ln', 'less', 'more', 'head', 'tail',
  // Development tools
  'git', 'npm', 'node', 'python', 'pip', 'cargo', 'go', 'java', 'ruby', 'php',
  'docker', 'kubectl', 'terraform', 'ansible', 'make', 'cmake',
  // Package managers
  'apt', 'yum', 'brew', 'pacman', 'dnf', 'snap',
  // System utilities
  'kill', 'ps', 'top', 'htop', 'ssh', 'scp', 'curl', 'wget',
  // One-Line itself
  'one-line'
];

/**
 * Convert a command name to a valid shell alias
 * Example: "Build My Program" -> "build-my-program"
 */
export function sanitizeCommandName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')      // Remove leading/trailing hyphens
    .replace(/-+/g, '-');          // Replace multiple hyphens with single
}

/**
 * Check if a name needs sanitization
 */
export function needsSanitization(name: string): boolean {
  return name !== sanitizeCommandName(name);
}

/**
 * Check if an alias is a reserved system command
 */
export function isReservedCommand(alias: string): boolean {
  return RESERVED_COMMANDS.includes(alias.toLowerCase());
}

/**
 * Check if a command exists in the user's PATH
 * Returns true if command exists, false otherwise
 */
export function checkCommandInPath(alias: string): boolean {
  try {
    const command = process.platform === 'win32' ? 'where' : 'which';
    execSync(`${command} ${alias}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate alternative alias suggestions
 */
export function suggestAlternatives(originalAlias: string): string[] {
  const suggestions: string[] = [];
  
  // Remove common prefixes from problematic aliases
  if (originalAlias.startsWith('git')) {
    suggestions.push('my' + originalAlias, originalAlias.replace('git', 'g'));
  } else if (originalAlias.startsWith('npm')) {
    suggestions.push('my' + originalAlias, originalAlias.replace('npm', 'n'));
  }
  
  // Generic suggestions
  suggestions.push(`my-${originalAlias}`);
  suggestions.push(`${originalAlias}-cmd`);
  suggestions.push(`${originalAlias}1`);
  
  // Abbreviate if possible
  if (originalAlias.includes('-')) {
    const parts = originalAlias.split('-');
    const abbreviated = parts.map(p => p[0]).join('');
    if (abbreviated.length >= 2 && abbreviated !== originalAlias) {
      suggestions.push(abbreviated);
    }
  }
  
  // Remove duplicates and return top 3
  return [...new Set(suggestions)].slice(0, 3);
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
  suggestions?: string[];
}

/**
 * Validate an alias for safety and conflicts
 */
export function validateAlias(alias: string, existingAliases: string[]): ValidationResult {
  // Check if empty
  if (!alias || alias.trim().length === 0) {
    return {
      valid: false,
      error: 'Alias cannot be empty'
    };
  }

  // Check if reserved command
  if (isReservedCommand(alias)) {
    return {
      valid: false,
      error: `Cannot use '${alias}' as alias - it's a system command`,
      suggestions: suggestAlternatives(alias)
    };
  }

  // Check if alias already exists in One-Line
  if (existingAliases.includes(alias)) {
    return {
      valid: false,
      error: `A command with alias '${alias}' already exists`
    };
  }

  // Check if exists in PATH (warning, not blocking)
  if (checkCommandInPath(alias)) {
    return {
      valid: true,
      warning: `Command '${alias}' already exists in your PATH`
    };
  }

  return { valid: true };
}

