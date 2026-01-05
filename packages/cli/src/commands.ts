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

