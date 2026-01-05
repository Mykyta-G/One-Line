import { CommandStorage } from './storage';
import { CommandExecutor } from './executor';
import { Command, ExecutionResult } from './types';

export class CommandManager {
  private storage: CommandStorage;
  private executor: CommandExecutor;

  constructor() {
    this.storage = new CommandStorage();
    this.executor = new CommandExecutor();
  }

  // Storage operations
  public getAllCommands(): Command[] {
    return this.storage.getAllCommands();
  }

  public getCommandById(id: string): Command | undefined {
    return this.storage.getCommandById(id);
  }

  public getCommandByName(name: string): Command | undefined {
    return this.storage.getCommandByName(name);
  }

  public getCommandByAlias(alias: string): Command | undefined {
    return this.storage.getCommandByAlias(alias);
  }

  public addCommand(name: string, steps: string[], alias?: string): Command {
    return this.storage.addCommand(name, steps, alias);
  }

  public updateCommand(id: string, updates: Partial<Omit<Command, 'id' | 'createdAt'>>): Command {
    return this.storage.updateCommand(id, updates);
  }

  public deleteCommand(id: string): boolean {
    return this.storage.deleteCommand(id);
  }

  public deleteCommandByName(name: string): boolean {
    return this.storage.deleteCommandByName(name);
  }

  // Execution operations
  public async runCommandById(
    id: string,
    cwd?: string,
    onStepComplete?: (stepIndex: number, output: string) => void
  ): Promise<ExecutionResult> {
    const command = this.storage.getCommandById(id);
    if (!command) {
      return {
        success: false,
        output: '',
        error: `Command with id "${id}" not found`
      };
    }
    return this.executor.executeCommand_obj(command, cwd, onStepComplete);
  }

  public async runCommandByName(
    name: string,
    cwd?: string,
    onStepComplete?: (stepIndex: number, output: string) => void
  ): Promise<ExecutionResult> {
    // Try to find by name first, then by alias
    let command = this.storage.getCommandByName(name);
    if (!command) {
      command = this.storage.getCommandByAlias(name);
    }
    
    if (!command) {
      return {
        success: false,
        output: '',
        error: `Command with name or alias "${name}" not found`
      };
    }
    return this.executor.executeCommand_obj(command, cwd, onStepComplete);
  }

  public async runSteps(
    steps: string[],
    cwd?: string,
    onStepComplete?: (stepIndex: number, output: string) => void
  ): Promise<ExecutionResult> {
    return this.executor.executeSequence(steps, cwd, onStepComplete);
  }
}

