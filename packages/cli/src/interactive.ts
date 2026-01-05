import inquirer from 'inquirer';
import chalk from 'chalk';
import { CommandManager, Command } from '@one-line/core';

export class InteractiveMenu {
  private manager: CommandManager;

  constructor() {
    this.manager = new CommandManager();
  }

  public async show(): Promise<void> {
    while (true) {
      console.clear();
      console.log(chalk.bold.cyan('\nOne-Line - Command Manager\n'));

      const commands = this.manager.getAllCommands();

      if (commands.length === 0) {
        console.log(chalk.yellow('No commands saved yet.\n'));
      } else {
        console.log(chalk.bold('Saved Commands:\n'));
        commands.forEach((cmd, index) => {
          console.log(chalk.cyan(`${index + 1}. ${cmd.name}`));
          cmd.steps.forEach((step, stepIndex) => {
            console.log(chalk.gray(`   ${stepIndex + 1}) ${step}`));
          });
          console.log();
        });
      }

      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: '\nWhat would you like to do?\n',
          choices: [
            { name: 'Run a command', value: 'run' },
            { name: 'Add new command', value: 'add' },
            { name: 'Delete a command', value: 'delete' },
            { name: 'View command details', value: 'view' },
            { name: 'Exit', value: 'exit' }
          ]
        }
      ]);

      if (action === 'exit') {
        console.log(chalk.green('\nGoodbye!\n'));
        break;
      }

      switch (action) {
        case 'run':
          await this.runCommand();
          break;
        case 'add':
          await this.addCommand();
          break;
        case 'delete':
          await this.deleteCommand();
          break;
        case 'view':
          await this.viewCommand();
          break;
      }
    }
  }

  private async runCommand(): Promise<void> {
    const commands = this.manager.getAllCommands();

    if (commands.length === 0) {
      console.log(chalk.yellow('\nNo commands to run.\n'));
      await this.pressEnterToContinue();
      return;
    }

    const choices: any[] = commands.map(cmd => ({
      name: `${cmd.name} (${cmd.steps.length} step${cmd.steps.length > 1 ? 's' : ''})`,
      value: cmd.id
    }));
    choices.push({ name: chalk.gray('← Cancel'), value: '__cancel__' });

    const { commandId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'commandId',
        message: '\nSelect command to run:\n',
        choices: choices
      }
    ]);

    if (commandId === '__cancel__') {
      return;
    }

    const command = this.manager.getCommandById(commandId);
    if (!command) return;

    console.log(chalk.bold.blue(`\nRunning: ${command.name}\n`));

    const result = await this.manager.runCommandById(
      commandId,
      process.cwd(),
      (stepIndex, output) => {
        console.log(chalk.gray(`✓ Step ${stepIndex + 1} completed`));
      }
    );

    if (result.success) {
      console.log(chalk.bold.green('\n[SUCCESS] All commands completed successfully!\n'));
    } else {
      console.log(chalk.bold.red(`\n[ERROR] Command failed at step ${(result.failedStep || 0) + 1}\n`));
      console.log(chalk.red(result.error));
    }

    console.log(chalk.gray('\nOutput:'));
    console.log(result.output);

    await this.pressEnterToContinue();
  }

  private async addCommand(): Promise<void> {
    console.log(chalk.bold.blue('\nAdd New Command\n'));

    const { name } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: '\nCommand name:',
        validate: (input: string) => {
          if (!input.trim()) return 'Name cannot be empty';
          if (this.manager.getCommandByName(input)) {
            return 'A command with this name already exists';
          }
          return true;
        }
      }
    ]);

    const steps: string[] = [];
    let addingSteps = true;

    while (addingSteps) {
      const { step } = await inquirer.prompt([
        {
          type: 'input',
          name: 'step',
          message: `Enter command step ${steps.length + 1} (or press Enter to finish):`,
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
        console.log(chalk.gray(`  Added: ${step.trim()}`));
      }
    }

    try {
      const command = this.manager.addCommand(name, steps);
      console.log(chalk.bold.green(`\n[SUCCESS] Command "${command.name}" created successfully!\n`));
    } catch (error: any) {
      console.log(chalk.bold.red(`\n[ERROR] ${error.message}\n`));
    }

    await this.pressEnterToContinue();
  }

  private async deleteCommand(): Promise<void> {
    const commands = this.manager.getAllCommands();

    if (commands.length === 0) {
      console.log(chalk.yellow('\nNo commands to delete.\n'));
      await this.pressEnterToContinue();
      return;
    }

    console.log(chalk.gray('\nUse Space to select commands, then press Enter\n'));

    const choices = commands.map(cmd => ({
      name: cmd.name,
      value: cmd.id
    }));
    
    // Add cancel option
    choices.push({
      name: chalk.gray('← Cancel (select this to cancel)'),
      value: '__cancel__'
    });

    const { commandIds } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'commandIds',
        message: 'Select commands to delete:',
        choices: choices
      }
    ]);

    // Check if user selected cancel
    if (commandIds.includes('__cancel__') || commandIds.length === 0) {
      console.log(chalk.yellow('\nCancelled.\n'));
      await this.pressEnterToContinue();
      return;
    }

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `\nDelete ${commandIds.length} command${commandIds.length > 1 ? 's' : ''}?`,
        default: false
      }
    ]);

    if (confirm) {
      let deleted = 0;
      for (const id of commandIds) {
        if (this.manager.deleteCommand(id)) {
          deleted++;
        }
      }
      console.log(chalk.bold.green(`\n[SUCCESS] Deleted ${deleted} command${deleted > 1 ? 's' : ''}\n`));
    } else {
      console.log(chalk.yellow('\nCancelled.\n'));
    }

    await this.pressEnterToContinue();
  }

  private async viewCommand(): Promise<void> {
    const commands = this.manager.getAllCommands();

    if (commands.length === 0) {
      console.log(chalk.yellow('\nNo commands to view.\n'));
      await this.pressEnterToContinue();
      return;
    }

    const choices: any[] = commands.map(cmd => ({
      name: cmd.name,
      value: cmd.id
    }));
    choices.push({ name: chalk.gray('← Back to main menu'), value: '__back__' });

    const { commandId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'commandId',
        message: '\nSelect command to view:\n',
        choices: choices
      }
    ]);

    if (commandId === '__back__') {
      return;
    }

    const command = this.manager.getCommandById(commandId);
    if (!command) return;

    let viewing = true;
    while (viewing) {
      console.clear();
      console.log(chalk.bold.blue(`\nCommand Details\n`));
      console.log(chalk.bold('Name:'), command.name);
      console.log(chalk.bold('Alias:'), command.alias);
      console.log(chalk.bold('Created:'), new Date(command.createdAt).toLocaleString());
      console.log(chalk.bold('Steps:'));
      command.steps.forEach((step, index) => {
        console.log(chalk.cyan(`  ${index + 1}. ${step}`));
      });
      console.log();

      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: '\nWhat would you like to do?\n',
          choices: [
            { name: 'Run this command', value: 'run' },
            { name: 'Edit this command', value: 'edit' },
            { name: 'Delete this command', value: 'delete' },
            { name: chalk.gray('← Back to main menu'), value: 'back' }
          ]
        }
      ]);

      switch (action) {
        case 'run':
          console.log(chalk.bold.blue(`\nRunning: ${command.name}\n`));
          const result = await this.manager.runCommandById(command.id, process.cwd());
          if (result.success) {
            console.log(chalk.bold.green('\n[SUCCESS] All commands completed successfully!\n'));
          } else {
            console.log(chalk.bold.red(`\n[ERROR] Command failed at step ${(result.failedStep || 0) + 1}\n`));
            console.log(chalk.red(result.error));
          }
          console.log(chalk.gray('\nOutput:'));
          console.log(result.output);
          await this.pressEnterToContinue();
          break;
        case 'edit':
          viewing = false;
          // TODO: Implement edit flow
          console.log(chalk.yellow('\nEdit feature coming soon!\n'));
          await this.pressEnterToContinue();
          break;
        case 'delete':
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Delete command "${command.name}"?`,
              default: false
            }
          ]);
          if (confirm) {
            this.manager.deleteCommand(command.id);
            console.log(chalk.bold.green(`\n[SUCCESS] Command "${command.name}" deleted\n`));
            viewing = false;
          }
          break;
        case 'back':
          viewing = false;
          break;
      }
    }
  }

  private async pressEnterToContinue(): Promise<void> {
    await inquirer.prompt([
      {
        type: 'input',
        name: 'continue',
        message: 'Press Enter to continue...'
      }
    ]);
  }
}

