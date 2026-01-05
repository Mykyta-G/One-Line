import * as vscode from 'vscode';
import { Command } from '@one-line/core';

export class TerminalHandler {
  private terminals: Map<string, vscode.Terminal> = new Map();

  constructor() {
    // Clean up terminals when they are closed
    vscode.window.onDidCloseTerminal(terminal => {
      for (const [key, term] of this.terminals.entries()) {
        if (term === terminal) {
          this.terminals.delete(key);
          break;
        }
      }
    });
  }

  public async executeCommand(command: Command): Promise<void> {
    const terminal = this.getOrCreateTerminal(command.name);
    terminal.show();

    // Get the workspace folder path or use undefined
    const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    // Show header
    terminal.sendText(`echo ""`);
    terminal.sendText(`echo "One-Line: ${command.name}"`);
    terminal.sendText(`echo "================================================================================"`);
    terminal.sendText(`echo ""`);

    // Execute each step sequentially
    for (let i = 0; i < command.steps.length; i++) {
      const step = command.steps[i];
      terminal.sendText(`echo "[Step ${i + 1}/${command.steps.length}] ${step}"`);
      
      // For Windows, use cmd /c to ensure proper command execution
      // For Unix, commands execute directly
      if (process.platform === 'win32') {
        // On Windows, we need to handle command chaining differently
        terminal.sendText(step);
      } else {
        // On Unix, use && to chain commands and stop on error
        if (i === 0) {
          terminal.sendText(step);
        } else {
          terminal.sendText(`if [ $? -eq 0 ]; then ${step}; fi`);
        }
      }
    }

    terminal.sendText(`echo ""`);
    terminal.sendText(`echo "================================================================================"`);
    terminal.sendText(`echo "[COMPLETE] Command sequence finished"`);
    terminal.sendText(`echo ""`);

    vscode.window.showInformationMessage(`Running: ${command.name}`);
  }

  private getOrCreateTerminal(name: string): vscode.Terminal {
    const terminalName = `One-Line: ${name}`;
    
    // Check if terminal already exists
    let terminal = this.terminals.get(name);
    
    if (!terminal || terminal.exitStatus !== undefined) {
      // Create new terminal if it doesn't exist or was closed
      terminal = vscode.window.createTerminal({
        name: terminalName,
        cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
      });
      this.terminals.set(name, terminal);
    }

    return terminal;
  }

  public dispose(): void {
    // Close all managed terminals
    for (const terminal of this.terminals.values()) {
      terminal.dispose();
    }
    this.terminals.clear();
  }
}

