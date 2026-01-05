import * as vscode from 'vscode';
import { CommandPaletteHandler } from './commandPalette';
import { CommandTreeDataProvider, CommandTreeItem } from './treeView';
import { TerminalHandler } from './terminalHandler';

export function activate(context: vscode.ExtensionContext) {
  console.log('One-Line extension is now active!');

  // Initialize handlers
  const paletteHandler = new CommandPaletteHandler(context);
  const terminalHandler = new TerminalHandler();
  
  // Initialize tree view
  const treeDataProvider = new CommandTreeDataProvider();
  const treeView = vscode.window.createTreeView('one-line-commands', {
    treeDataProvider: treeDataProvider
  });

  context.subscriptions.push(treeView);

  // Command Palette Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('one-line.runCommand', async () => {
      await paletteHandler.runCommand();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('one-line.addCommand', async () => {
      await paletteHandler.addCommand();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('one-line.deleteCommand', async () => {
      await paletteHandler.deleteCommand();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('one-line.editCommand', async () => {
      await paletteHandler.editCommand();
    })
  );

  // Tree View Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('one-line.refreshCommands', () => {
      treeDataProvider.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('one-line.runCommandFromTree', async (item: CommandTreeItem) => {
      await terminalHandler.executeCommand(item.commandData);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('one-line.editCommandFromTree', async (item: CommandTreeItem) => {
      await paletteHandler.editCommand(item.commandData);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('one-line.deleteCommandFromTree', async (item: CommandTreeItem) => {
      const confirm = await vscode.window.showWarningMessage(
        `Delete command "${item.commandData.name}"?`,
        { modal: true },
        'Delete'
      );

      if (confirm === 'Delete') {
        const { CommandManager } = require('@one-line/core');
        const manager = new CommandManager();
        if (manager.deleteCommand(item.commandData.id)) {
          vscode.window.showInformationMessage(`Command "${item.commandData.name}" deleted`);
          treeDataProvider.refresh();
        }
      }
    })
  );

  // Show welcome message on first activation
  const hasShownWelcome = context.globalState.get('one-line.hasShownWelcome', false);
  if (!hasShownWelcome) {
    vscode.window.showInformationMessage(
      'One-Line extension activated! Use the sidebar or command palette to manage your commands.',
      'Got it'
    ).then(() => {
      context.globalState.update('one-line.hasShownWelcome', true);
    });
  }
}

export function deactivate() {
  console.log('One-Line extension is now deactivated');
}

