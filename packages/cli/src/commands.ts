import chalk from 'chalk';
import inquirer from 'inquirer';
import { 
  CommandManager, 
  sanitizeCommandName, 
  needsSanitization, 
  validateAlias,
  suggestAlternatives,
  checkCommandInPath
} from './core';

const manager = new CommandManager();

export async function listCommands(): Promise<void> {
  const commands = manager.getAllCommands();

  if (commands.length === 0) {
    console.log(chalk.yellow('No commands saved yet.'));
    return;
  }

  console.log(chalk.bold.cyan('\nSaved Commands:\n'));
  commands.forEach((cmd, index) => {
    console.log(chalk.bold.cyan(`${index + 1}. ${cmd.name} ${chalk.gray(`(alias: ${cmd.alias})`)}`));
    cmd.steps.forEach((step, stepIndex) => {
      console.log(chalk.gray(`   ${stepIndex + 1}) ${step}`));
    });
    console.log();
  });
}

export async function addCommand(): Promise<void> {
  console.log(chalk.bold.blue('\nAdd New Command\n'));
  console.log(chalk.yellow('Note: Command names will be converted to shell-safe aliases.'));
  console.log(chalk.yellow('Spaces and special characters will be replaced with hyphens.\n'));

  const { name } = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Command name:',
      validate: (input: string) => {
        if (!input.trim()) return 'Name cannot be empty';
        if (manager.getCommandByName(input)) {
          return 'A command with this name already exists';
        }
        return true;
      }
    }
  ]);

  // Generate and validate alias
  const alias = sanitizeCommandName(name);
  const existingAliases = manager.getAllCommands().map(cmd => cmd.alias);
  const validation = validateAlias(alias, existingAliases);

  // Show alias info
  if (needsSanitization(name)) {
    console.log(chalk.cyan(`\nGenerated alias: ${chalk.bold(alias)}`));
  } else {
    console.log(chalk.cyan(`\nAlias: ${chalk.bold(alias)}`));
  }

  // Handle validation errors
  if (!validation.valid) {
    console.log(chalk.bold.red(`\n[ERROR] ${validation.error}`));
    if (validation.suggestions && validation.suggestions.length > 0) {
      console.log(chalk.yellow('\nSuggestions:'));
      validation.suggestions.forEach(sug => console.log(chalk.gray(`  - ${sug}`)));
    }
    console.log();
    process.exit(1);
  }

  // Handle PATH warnings
  if (validation.warning) {
    console.log(chalk.yellow(`\n[WARNING] ${validation.warning}`));
    const { proceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Continue anyway?',
        default: false
      }
    ]);

    if (!proceed) {
      console.log(chalk.yellow('\nCancelled.\n'));
      process.exit(0);
    }
  }

  const steps: string[] = [];
  let addingSteps = true;

  console.log(chalk.gray('\nEnter command steps (press Enter on empty line to finish):\n'));

  while (addingSteps) {
    const { step } = await inquirer.prompt([
      {
        type: 'input',
        name: 'step',
        message: `Step ${steps.length + 1}:`,
        validate: (input: string) => {
          if (steps.length === 0 && !input.trim()) {
            return 'At least one command step is required';
          }
          return true;
        }
      }
    ]);

    if (!step.trim() && steps.length > 0) {
      addingSteps = false;
    } else if (step.trim()) {
      steps.push(step.trim());
    }
  }

  try {
    const command = manager.addCommand(name, steps, alias);
    console.log(chalk.bold.green(`\n[SUCCESS] Command "${command.name}" created successfully!`));
    console.log(chalk.gray('\nRun it with any of these:'));
    console.log(chalk.cyan(`  one-line ${command.alias}`));
    console.log(chalk.cyan(`  one-line run "${command.name}"`));
    console.log();
  } catch (error: any) {
    console.log(chalk.bold.red(`\n[ERROR] ${error.message}\n`));
    process.exit(1);
  }
}

export async function runCommand(nameOrId: string): Promise<void> {
  const command = manager.getCommandByName(nameOrId) || manager.getCommandById(nameOrId);

  if (!command) {
    console.log(chalk.bold.red(`[ERROR] Command "${nameOrId}" not found\n`));
    process.exit(1);
  }

  console.log(chalk.bold.blue(`\nRunning: ${command.name}\n`));
  
  let currentStep = 0;
  const result = await manager.runCommandById(
    command.id,
    process.cwd(),
    (stepIndex, output) => {
      currentStep = stepIndex + 1;
      console.log(chalk.green(`✓ Step ${currentStep}/${command.steps.length} completed`));
    }
  );

  if (result.success) {
    console.log(chalk.bold.green('\n[SUCCESS] All commands completed successfully!\n'));
  } else {
    console.log(chalk.bold.red(`\n[ERROR] Command failed at step ${(result.failedStep || 0) + 1}\n`));
    console.log(chalk.red(result.error));
    console.log(chalk.gray('\nOutput:'));
    console.log(result.output);
    process.exit(1);
  }
}

export async function deleteCommand(nameOrId: string): Promise<void> {
  const command = manager.getCommandByName(nameOrId) || manager.getCommandById(nameOrId);

  if (!command) {
    console.log(chalk.bold.red(`[ERROR] Command "${nameOrId}" not found\n`));
    process.exit(1);
  }

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Delete command "${command.name}"?`,
      default: false
    }
  ]);

  if (confirm) {
    if (manager.deleteCommand(command.id)) {
      console.log(chalk.bold.green(`\n[SUCCESS] Command "${command.name}" deleted successfully!\n`));
    } else {
      console.log(chalk.bold.red(`\n[ERROR] Failed to delete command\n`));
      process.exit(1);
    }
  } else {
    console.log(chalk.yellow('\nCancelled.\n'));
  }
}

export async function editCommand(nameOrId: string): Promise<void> {
  const command = manager.getCommandByName(nameOrId) || manager.getCommandById(nameOrId);

  if (!command) {
    console.log(chalk.bold.red(`[ERROR] Command "${nameOrId}" not found\n`));
    process.exit(1);
  }

  console.log(chalk.bold.blue(`\nEdit Command: ${command.name}\n`));

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What do you want to edit?',
      choices: [
        { name: 'Name', value: 'name' },
        { name: 'Steps', value: 'steps' },
        { name: 'Cancel', value: 'cancel' }
      ]
    }
  ]);

  if (action === 'cancel') {
    console.log(chalk.yellow('Cancelled.\n'));
    return;
  }

  if (action === 'name') {
    const { newName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'newName',
        message: 'New name:',
        default: command.name,
        validate: (input: string) => {
          if (!input.trim()) return 'Name cannot be empty';
          const existing = manager.getCommandByName(input);
          if (existing && existing.id !== command.id) {
            return 'A command with this name already exists';
          }
          return true;
        }
      }
    ]);

    manager.updateCommand(command.id, { name: newName });
    console.log(chalk.bold.green(`\n[SUCCESS] Command renamed to "${newName}"\n`));
  } else if (action === 'steps') {
    const steps: string[] = [];
    let addingSteps = true;

    console.log(chalk.gray('Enter new command steps (press Enter on empty line to finish):\n'));
    console.log(chalk.gray('Current steps:'));
    command.steps.forEach((step, index) => {
      console.log(chalk.gray(`  ${index + 1}. ${step}`));
    });
    console.log();

    while (addingSteps) {
      const { step } = await inquirer.prompt([
        {
          type: 'input',
          name: 'step',
          message: `Step ${steps.length + 1}:`,
          validate: (input: string) => {
            if (steps.length === 0 && !input.trim()) {
              return 'At least one command step is required';
            }
            return true;
          }
        }
      ]);

      if (!step.trim() && steps.length > 0) {
        addingSteps = false;
      } else if (step.trim()) {
        steps.push(step.trim());
      }
    }

    manager.updateCommand(command.id, { steps });
    console.log(chalk.bold.green(`\n[SUCCESS] Command steps updated!\n`));
  }
}

export async function generateCompletion(shell: string): Promise<void> {
  if (shell !== 'bash' && shell !== 'zsh') {
    console.log(chalk.bold.red(`\n[ERROR] Unsupported shell: ${shell}\n`));
    console.log(chalk.yellow('Supported shells: bash, zsh\n'));
    process.exit(1);
  }

  // No need to read commands here - the completion script reads them dynamically at runtime

  if (shell === 'bash') {
    // Generate bash completion script
    const bashScript = `# Bash completion for one-line
_one-line_completion() {
    local cur prev opts
    COMPREPLY=()
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"
    
    # Main commands
    opts="add list ls run delete rm edit completion"
    
    # Helper function to get saved commands
    _get_saved_commands() {
        if [ -f "$HOME/.one-line/commands.json" ]; then
            node -e "
                try {
                    const fs = require('fs');
                    const data = JSON.parse(fs.readFileSync('$HOME/.one-line/commands.json', 'utf8'));
                    const names = [];
                    if (data.commands) {
                        data.commands.forEach(cmd => {
                            names.push(cmd.alias);
                        });
                    }
                    console.log(names.join(' '));
                } catch(e) {}
            " 2>/dev/null
        fi
    }
    
    # If we're completing the first argument after 'one-line'
    if [ $COMP_CWORD -eq 1 ]; then
        local saved_commands
        saved_commands=$(_get_saved_commands)
        COMPREPLY=( $(compgen -W "\${opts} \${saved_commands}" -- "\${cur}") )
        return 0
    fi
    
    # If we're completing after a subcommand that takes a command name
    if [[ "\${prev}" == "run" ]] || [[ "\${prev}" == "delete" ]] || [[ "\${prev}" == "rm" ]] || [[ "\${prev}" == "edit" ]]; then
        local saved_commands
        saved_commands=$(_get_saved_commands)
        COMPREPLY=( $(compgen -W "\${saved_commands}" -- "\${cur}") )
        return 0
    fi
}
complete -F _one-line_completion one-line
`;
    console.log(bashScript);
  } else if (shell === 'zsh') {
    // Generate zsh completion script
    const zshScript = `# Zsh completion for one-line
_one-line() {
    local -a saved_commands
    
    # Get saved commands from ~/.one-line/commands.json, sorted by usage count (most used first)
    if [ -f "\$HOME/.one-line/commands.json" ]; then
        saved_commands=(\$(node -e "
            try {
                const fs = require('fs');
                const data = JSON.parse(fs.readFileSync('\$HOME/.one-line/commands.json', 'utf8'));
                const commands = [];
                if (data.commands) {
                    data.commands.forEach(cmd => {
                        commands.push({
                            alias: cmd.alias,
                            usageCount: cmd.usageCount || 0
                        });
                    });
                    commands.sort((a, b) => {
                        if (b.usageCount !== a.usageCount) {
                            return b.usageCount - a.usageCount;
                        }
                        return a.alias.localeCompare(b.alias);
                    });
                    console.log(commands.map(c => c.alias).join(' '));
                }
            } catch(e) {}
        " 2>/dev/null))
    fi
    
    # Configure completion: menu select, column format
    zstyle ':completion:*:one-line:*' menu select
    zstyle ':completion:*:one-line:*' list-colors ''
    
    _arguments \\
        '1: :->command' \\
        '*:: :->args'
    
    case $state in
        command)
            # Only show saved commands, sorted by usage (most used first)
            if [ \${#saved_commands[@]} -gt 0 ]; then
                _describe -V 'saved commands' saved_commands
            fi
            ;;
        args)
            case $words[1] in
                run|delete|rm|edit)
                    if [ \${#saved_commands[@]} -gt 0 ]; then
                        _describe -V 'saved commands' saved_commands
                    fi
                    ;;
            esac
            ;;
    esac
}

compdef _one-line one-line
`;
    console.log(zshScript);
  }
}

export async function installCompletion(): Promise<void> {
  const fs = require('fs');
  const path = require('path');
  const { execSync } = require('child_process');

  // Get the shell from environment
  const shell = process.env.SHELL || '/bin/sh';
  const shellName = path.basename(shell);

  // Check for Oh My Zsh
  const ohMyZshPath = process.env.ZSH || path.join(process.env.HOME || '', '.oh-my-zsh');
  const ohMyZshCompletionsDir = path.join(ohMyZshPath, 'custom', 'completions');
  const hasOhMyZsh = fs.existsSync(ohMyZshPath);

  // Determine which shell and rc file to use
  let rcFile: string;
  let shellType: string;
  let useOhMyZsh = false;

  if (shellName === 'zsh' || shellName.includes('zsh')) {
    shellType = 'zsh';
    if (hasOhMyZsh) {
      useOhMyZsh = true;
      rcFile = path.join(ohMyZshCompletionsDir, '_one-line');
    } else {
      // For regular zsh, use ~/.zsh/completions/ directory
      const zshCompletionsDir = path.join(process.env.HOME || '', '.zsh', 'completions');
      rcFile = path.join(zshCompletionsDir, '_one-line');
    }
  } else if (shellName === 'bash' || shellName.includes('bash')) {
    shellType = 'bash';
    rcFile = path.join(process.env.HOME || '', '.bashrc');
  } else {
    // Default to zsh on macOS, bash on Linux
    if (process.platform === 'darwin') {
      shellType = 'zsh';
      if (hasOhMyZsh) {
        useOhMyZsh = true;
        rcFile = path.join(ohMyZshCompletionsDir, '_one-line');
      } else {
        // For regular zsh, use ~/.zsh/completions/ directory
        const zshCompletionsDir = path.join(process.env.HOME || '', '.zsh', 'completions');
        rcFile = path.join(zshCompletionsDir, '_one-line');
      }
    } else {
      shellType = 'bash';
      rcFile = path.join(process.env.HOME || '', '.bashrc');
    }
  }

  // Check if completion is already installed
  function isCompletionInstalled(rcFile: string, useOhMyZsh: boolean): boolean {
    // For both Oh My Zsh and regular zsh, check if completion file exists
    if (fs.existsSync(rcFile)) {
      return true;
    }
    
    // Also check if it's in .zshrc (for regular zsh fallback)
    if (!useOhMyZsh && shellType === 'zsh') {
      const zshrcPath = path.join(process.env.HOME || '', '.zshrc');
      if (fs.existsSync(zshrcPath)) {
        const content = fs.readFileSync(zshrcPath, 'utf8');
        if (content.includes('_one-line_completion') || content.includes('_one-line()')) {
          return true;
        }
      }
    }
    
    return false;
  }

  // Get the completion script
  function getCompletionScript(shellType: string): string | null {
    try {
      // Get the path to the current one-line executable
      const oneLinePath = process.argv[1] || require.main?.filename || __filename;
      const output = execSync(`node "${oneLinePath}" completion ${shellType}`, {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      return output;
    } catch (error) {
      return null;
    }
  }

  const installLocation = useOhMyZsh ? 'Oh My Zsh completions directory' : rcFile;
  console.log(chalk.bold.blue(`\nInstalling tab completion for ${shellType}...\n`));
  if (useOhMyZsh) {
    console.log(chalk.cyan('Detected Oh My Zsh - installing to completions directory\n'));
  }

  // Check if already installed
  if (isCompletionInstalled(rcFile, useOhMyZsh)) {
    console.log(chalk.yellow(`Tab completion is already installed in ${installLocation}`));
    if (!useOhMyZsh) {
      console.log(chalk.gray('If it\'s not working, try: source ' + rcFile + '\n'));
    } else {
      console.log(chalk.gray('If it\'s not working, restart your terminal or run: exec zsh\n'));
    }
    return;
  }

  // Get completion script
  let completionScript = getCompletionScript(shellType);
  if (!completionScript) {
    console.log(chalk.bold.red('\n[ERROR] Could not generate completion script\n'));
    console.log(chalk.yellow('Try running: one-line completion ' + shellType + ' >> ' + rcFile + '\n'));
    return;
  }

  // Keep compdef line for Oh My Zsh - it's needed for proper registration
  // Oh My Zsh will load the completion but compdef ensures it's registered

  // Write completion script
  try {
    if (useOhMyZsh) {
      // Create completions directory if it doesn't exist
      if (!fs.existsSync(ohMyZshCompletionsDir)) {
        fs.mkdirSync(ohMyZshCompletionsDir, { recursive: true });
      }
      // Write directly to the completions file (no separator needed for Oh My Zsh)
      fs.writeFileSync(rcFile, completionScript, 'utf8');
      
      // Also add explicit registration to .zshrc for better compatibility
      const zshrcPath = path.join(process.env.HOME || '', '.zshrc');
      if (fs.existsSync(zshrcPath)) {
        const zshrcContent = fs.readFileSync(zshrcPath, 'utf8');
        if (!zshrcContent.includes('compdef _one-line one-line')) {
          const registration = '\n# One-Line tab completion\nfpath=(~/.oh-my-zsh/custom/completions $fpath)\nautoload -Uz _one-line\ncompdef _one-line one-line 2>/dev/null\n';
          fs.appendFileSync(zshrcPath, registration, 'utf8');
        }
      }
      
      console.log(chalk.bold.green(`[SUCCESS] Tab completion installed in ${rcFile}!`));
      console.log(chalk.cyan('\nCompletion registered in .zshrc for better compatibility.'));
      console.log(chalk.gray('Restart your terminal or run: source ~/.zshrc\n'));
    } else if (shellType === 'zsh') {
      // For regular zsh (not Oh My Zsh)
      // Create ~/.zsh/completions/ directory if it doesn't exist
      const zshCompletionsDir = path.dirname(rcFile);
      if (!fs.existsSync(zshCompletionsDir)) {
        fs.mkdirSync(zshCompletionsDir, { recursive: true });
      }
      // Write completion file
      fs.writeFileSync(rcFile, completionScript, 'utf8');
      
      // Add to .zshrc to load completions from this directory
      const zshrcPath = path.join(process.env.HOME || '', '.zshrc');
      if (fs.existsSync(zshrcPath)) {
        const zshrcContent = fs.readFileSync(zshrcPath, 'utf8');
        // Check if fpath is already configured
        if (!zshrcContent.includes('~/.zsh/completions') && !zshrcContent.includes('$HOME/.zsh/completions')) {
          const registration = '\n# One-Line tab completion\nfpath=(~/.zsh/completions $fpath)\nautoload -Uz compinit\ncompinit\n';
          fs.appendFileSync(zshrcPath, registration, 'utf8');
        }
        // Register the completion
        if (!zshrcContent.includes('compdef _one-line one-line')) {
          const compdefLine = '\ncompdef _one-line one-line\n';
          fs.appendFileSync(zshrcPath, compdefLine, 'utf8');
        }
      }
      
      console.log(chalk.bold.green(`[SUCCESS] Tab completion installed in ${rcFile}!`));
      console.log(chalk.cyan('\nCompletion registered in .zshrc.'));
      console.log(chalk.gray('Restart your terminal or run: source ~/.zshrc\n'));
    } else {
      // Append to rc file
      const separator = '\n# One-Line tab completion\n';
      fs.appendFileSync(rcFile, separator + completionScript + '\n', 'utf8');
      console.log(chalk.bold.green(`[SUCCESS] Tab completion installed in ${rcFile}!`));
      console.log(chalk.cyan('\nTo activate, run:'));
      console.log(chalk.bold(`  source ${rcFile}`));
      console.log(chalk.gray('\nOr open a new terminal window.\n'));
    }
  } catch (error: any) {
    console.log(chalk.bold.red(`\n[ERROR] Could not write to ${rcFile}`));
    console.log(chalk.yellow('You may need to run with sudo or check file permissions.\n'));
    console.log(chalk.gray('Alternatively, you can manually install:'));
    if (useOhMyZsh) {
      console.log(chalk.cyan(`  one-line completion ${shellType} > ${rcFile}\n`));
    } else {
      console.log(chalk.cyan(`  one-line completion ${shellType} >> ${rcFile}\n`));
    }
  }
}

