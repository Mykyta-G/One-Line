import * as vscode from 'vscode';
import { CommandManager, Command } from '@one-line/core';

export class CommandTreeItem extends vscode.TreeItem {
  constructor(
    public readonly commandData: Command,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(commandData.name, collapsibleState);
    
    const alias = commandData.alias || 'no-alias';
    this.tooltip = `${commandData.name}\nAlias: ${alias}\n\nSteps:\n${commandData.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
    this.description = `${commandData.steps.length} step${commandData.steps.length > 1 ? 's' : ''} · ${alias}`;
    this.contextValue = 'command';
    this.iconPath = new vscode.ThemeIcon('symbol-method');
  }
}

export class StepTreeItem extends vscode.TreeItem {
  constructor(
    public readonly step: string,
    public readonly stepIndex: number
  ) {
    super(step, vscode.TreeItemCollapsibleState.None);
    
    this.tooltip = step;
    this.description = `Step ${stepIndex + 1}`;
    this.iconPath = new vscode.ThemeIcon('terminal');
    this.contextValue = 'step';
  }
}

export class CommandTreeDataProvider implements vscode.TreeDataProvider<CommandTreeItem | StepTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<CommandTreeItem | StepTreeItem | undefined | null | void> = 
    new vscode.EventEmitter<CommandTreeItem | StepTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<CommandTreeItem | StepTreeItem | undefined | null | void> = 
    this._onDidChangeTreeData.event;

  private manager: CommandManager;

  constructor() {
    this.manager = new CommandManager();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: CommandTreeItem | StepTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: CommandTreeItem | StepTreeItem): Thenable<(CommandTreeItem | StepTreeItem)[]> {
    if (!element) {
      // Root level - show all commands
      const commands = this.manager.getAllCommands();
      return Promise.resolve(
        commands.map(cmd => new CommandTreeItem(cmd, vscode.TreeItemCollapsibleState.Collapsed))
      );
    } else if (element instanceof CommandTreeItem) {
      // Show steps for a command
      const steps = element.commandData.steps.map((step, index) => new StepTreeItem(step, index));
      return Promise.resolve(steps);
    }
    
    return Promise.resolve([]);
  }

  getParent(element: CommandTreeItem | StepTreeItem): vscode.ProviderResult<CommandTreeItem | StepTreeItem> {
    return null;
  }
}

