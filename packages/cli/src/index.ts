#!/usr/bin/env node

import { Command } from 'commander';
import { InteractiveMenu } from './interactive';
import { listCommands, addCommand, runCommand, deleteCommand, editCommand } from './commands';
import { CommandManager } from './core';

const program = new Command();

program
  .name('one-line')
  .description('Combine multiple terminal commands into single named shortcuts')
  .version('1.0.0')
  .argument('[command-name]', 'Name or alias of command to run (optional)');

// Default action - show interactive menu or run command if name provided
program
  .action(async (commandName?: string) => {
    if (commandName) {
      // Try to run the command directly by name or alias
      const manager = new CommandManager();
      const command = manager.getCommandByName(commandName) || manager.getCommandByAlias(commandName);
      
      if (command) {
        await runCommand(commandName);
        return;
      } else {
        console.log(`Command "${commandName}" not found. Opening interactive menu...`);
      }
    }
    
    // Show interactive menu
    const menu = new InteractiveMenu();
    await menu.show();
  });

// List all commands
program
  .command('list')
  .alias('ls')
  .description('List all saved commands')
  .action(async () => {
    await listCommands();
  });

// Add new command
program
  .command('add')
  .description('Add a new command interactively')
  .action(async () => {
    await addCommand();
  });

// Run a command
program
  .command('run <name>')
  .description('Run a saved command by name or ID')
  .action(async (name: string) => {
    await runCommand(name);
  });

// Delete a command
program
  .command('delete <name>')
  .alias('rm')
  .description('Delete a saved command by name or ID')
  .action(async (name: string) => {
    await deleteCommand(name);
  });

// Edit a command
program
  .command('edit <name>')
  .description('Edit a saved command by name or ID')
  .action(async (name: string) => {
    await editCommand(name);
  });

program.parse(process.argv);

