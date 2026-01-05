import * as vscode from 'vscode';
import { CommandManager, Command } from '@one-line/core';

export class CommandPaletteHandler {
  private manager: CommandManager;

  constructor(private context: vscode.ExtensionContext) {
    this.manager = new CommandManager();
  }

  public async runCommand(): Promise<void> {
    const commands = this.manager.getAllCommands();

    if (commands.length === 0) {
      vscode.window.showInformationMessage('No commands saved yet. Create one first!');
      return;
    }

    const items = commands.map(cmd => ({
      label: cmd.name,
      description: `${cmd.steps.length} step${cmd.steps.length > 1 ? 's' : ''}`,
      detail: cmd.steps.join(' → '),
      command: cmd
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a command to run'
    });

    if (selected) {
      await this.executeCommand(selected.command);
    }
  }

  public async addCommand(): Promise<void> {
    const name = await vscode.window.showInputBox({
      prompt: 'Enter command name',
      placeHolder: 'e.g., Build my program',
      validateInput: (value) => {
        if (!value.trim()) {
          return 'Name cannot be empty';
        }
        if (this.manager.getCommandByName(value)) {
          return 'A command with this name already exists';
        }
        return undefined;
      }
    });

    if (!name) return;

    const steps: string[] = [];
    let addingSteps = true;

    while (addingSteps) {
      const step = await vscode.window.showInputBox({
        prompt: `Enter command step ${steps.length + 1} (leave empty to finish)`,
        placeHolder: 'e.g., npm run build',
        validateInput: (value) => {
          if (steps.length === 0 && !value.trim()) {
            return 'At least one command step is required';
          }
          return undefined;
        }
      });

      if (step === undefined) {
        // User cancelled
        return;
      }

      if (!step.trim() && steps.length > 0) {
        addingSteps = false;
      } else if (step.trim()) {
        steps.push(step.trim());
      }
    }

    try {
      const command = this.manager.addCommand(name, steps);
      vscode.window.showInformationMessage(`Command "${command.name}" created successfully!`);
      vscode.commands.executeCommand('one-line.refreshCommands');
    } catch (error: any) {
      vscode.window.showErrorMessage(`Error: ${error.message}`);
    }
  }

  public async deleteCommand(): Promise<void> {
    const commands = this.manager.getAllCommands();

    if (commands.length === 0) {
      vscode.window.showInformationMessage('No commands to delete.');
      return;
    }

    const items = commands.map(cmd => ({
      label: cmd.name,
      description: `${cmd.steps.length} step${cmd.steps.length > 1 ? 's' : ''}`,
      command: cmd
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a command to delete',
      canPickMany: true
    });

    if (!selected || selected.length === 0) return;

    const confirmMessage = `Delete ${selected.length} command${selected.length > 1 ? 's' : ''}?`;
    const confirm = await vscode.window.showWarningMessage(
      confirmMessage,
      { modal: true },
      'Delete'
    );

    if (confirm === 'Delete') {
      let deleted = 0;
      for (const item of selected) {
        if (this.manager.deleteCommand(item.command.id)) {
          deleted++;
        }
      }
      vscode.window.showInformationMessage(`Deleted ${deleted} command${deleted > 1 ? 's' : ''}`);
      vscode.commands.executeCommand('one-line.refreshCommands');
    }
  }

  public async editCommand(command?: Command): Promise<void> {
    let targetCommand = command;

    if (!targetCommand) {
      const commands = this.manager.getAllCommands();

      if (commands.length === 0) {
        vscode.window.showInformationMessage('No commands to edit.');
        return;
      }

      const items = commands.map(cmd => ({
        label: cmd.name,
        description: `${cmd.steps.length} step${cmd.steps.length > 1 ? 's' : ''}`,
        command: cmd
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a command to edit'
      });

      if (!selected) return;
      targetCommand = selected.command;
    }

    const action = await vscode.window.showQuickPick(
      [
        { label: 'Edit Name', value: 'name' },
        { label: 'Edit Steps', value: 'steps' }
      ],
      { placeHolder: 'What do you want to edit?' }
    );

    if (!action) return;

    if (action.value === 'name') {
      const newName = await vscode.window.showInputBox({
        prompt: 'Enter new name',
        value: targetCommand.name,
        validateInput: (value) => {
          if (!value.trim()) return 'Name cannot be empty';
          const existing = this.manager.getCommandByName(value);
          if (existing && existing.id !== targetCommand!.id) {
            return 'A command with this name already exists';
          }
          return undefined;
        }
      });

      if (newName) {
        this.manager.updateCommand(targetCommand.id, { name: newName });
        vscode.window.showInformationMessage(`Command renamed to "${newName}"`);
        vscode.commands.executeCommand('one-line.refreshCommands');
      }
    } else if (action.value === 'steps') {
      const steps: string[] = [];
      let addingSteps = true;

      vscode.window.showInformationMessage('Adding new steps. Leave empty to finish.');

      while (addingSteps) {
        const step = await vscode.window.showInputBox({
          prompt: `Enter command step ${steps.length + 1} (leave empty to finish)`,
          placeHolder: 'e.g., npm run build',
          validateInput: (value) => {
            if (steps.length === 0 && !value.trim()) {
              return 'At least one command step is required';
            }
            return undefined;
          }
        });

        if (step === undefined) {
          return;
        }

        if (!step.trim() && steps.length > 0) {
          addingSteps = false;
        } else if (step.trim()) {
          steps.push(step.trim());
        }
      }

      this.manager.updateCommand(targetCommand.id, { steps });
      vscode.window.showInformationMessage('Command steps updated!');
      vscode.commands.executeCommand('one-line.refreshCommands');
    }
  }

  private async executeCommand(command: Command): Promise<void> {
    const terminal = vscode.window.createTerminal({
      name: `One-Line: ${command.name}`,
      cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
    });

    terminal.show();

    // Execute commands sequentially
    for (let i = 0; i < command.steps.length; i++) {
      const step = command.steps[i];
      terminal.sendText(`echo "▶️ Step ${i + 1}/${command.steps.length}: ${step}"`);
      terminal.sendText(step);
    }

    vscode.window.showInformationMessage(`Running command: ${command.name}`);
  }
}

