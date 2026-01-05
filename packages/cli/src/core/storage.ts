import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { Command, CommandsData } from './types';
import { sanitizeCommandName, validateAlias } from './utils';

export class CommandStorage {
  private configDir: string;
  private configFile: string;

  constructor() {
    this.configDir = path.join(os.homedir(), '.one-line');
    this.configFile = path.join(this.configDir, 'commands.json');
    this.ensureConfigDir();
  }

  private ensureConfigDir(): void {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
    if (!fs.existsSync(this.configFile)) {
      this.saveData({ commands: [] });
    }
  }

  private loadData(): CommandsData {
    try {
      const data = fs.readFileSync(this.configFile, 'utf-8');
      const parsed = JSON.parse(data);
      
      // Migrate old commands without aliases
      if (parsed.commands) {
        parsed.commands = parsed.commands.map((cmd: any) => {
          if (!cmd.alias) {
            return {
              ...cmd,
              alias: sanitizeCommandName(cmd.name)
            };
          }
          return cmd;
        });
      }
      
      return parsed;
    } catch (error) {
      return { commands: [] };
    }
  }

  private saveData(data: CommandsData): void {
    fs.writeFileSync(this.configFile, JSON.stringify(data, null, 2), 'utf-8');
  }

  public getAllCommands(): Command[] {
    const data = this.loadData();
    return data.commands;
  }

  public getCommandById(id: string): Command | undefined {
    const commands = this.getAllCommands();
    return commands.find(cmd => cmd.id === id);
  }

  public getCommandByName(name: string): Command | undefined {
    const commands = this.getAllCommands();
    return commands.find(cmd => cmd.name.toLowerCase() === name.toLowerCase());
  }

  public getCommandByAlias(alias: string): Command | undefined {
    const commands = this.getAllCommands();
    return commands.find(cmd => cmd.alias === alias.toLowerCase());
  }

  public addCommand(name: string, steps: string[], alias?: string): Command {
    const data = this.loadData();
    
    // Generate alias if not provided
    const commandAlias = alias || sanitizeCommandName(name);
    
    // Check if command with same name exists
    const existingName = data.commands.find(cmd => cmd.name.toLowerCase() === name.toLowerCase());
    if (existingName) {
      throw new Error(`Command with name "${name}" already exists`);
    }

    // Check if alias already exists
    const existingAlias = data.commands.find(cmd => cmd.alias === commandAlias);
    if (existingAlias) {
      throw new Error(`Command with alias "${commandAlias}" already exists`);
    }

    // Validate alias safety
    const existingAliases = data.commands.map(cmd => cmd.alias);
    const validation = validateAlias(commandAlias, existingAliases);
    
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid alias');
    }

    const command: Command = {
      id: uuidv4(),
      name,
      alias: commandAlias,
      steps,
      createdAt: new Date().toISOString(),
      usageCount: 0
    };

    data.commands.push(command);
    this.saveData(data);
    return command;
  }

  public incrementUsageCount(id: string): void {
    const data = this.loadData();
    const index = data.commands.findIndex(cmd => cmd.id === id);
    if (index !== -1) {
      data.commands[index].usageCount = (data.commands[index].usageCount || 0) + 1;
      this.saveData(data);
    }
  }

  public updateCommand(id: string, updates: Partial<Omit<Command, 'id' | 'createdAt'>>): Command {
    const data = this.loadData();
    const index = data.commands.findIndex(cmd => cmd.id === id);
    
    if (index === -1) {
      throw new Error(`Command with id "${id}" not found`);
    }

    // Check if new name conflicts with another command
    if (updates.name) {
      const nameConflict = data.commands.find(
        cmd => cmd.id !== id && cmd.name.toLowerCase() === updates.name!.toLowerCase()
      );
      if (nameConflict) {
        throw new Error(`Command with name "${updates.name}" already exists`);
      }
    }

    data.commands[index] = {
      ...data.commands[index],
      ...updates
    };

    this.saveData(data);
    return data.commands[index];
  }

  public deleteCommand(id: string): boolean {
    const data = this.loadData();
    const initialLength = data.commands.length;
    data.commands = data.commands.filter(cmd => cmd.id !== id);
    
    if (data.commands.length === initialLength) {
      return false;
    }

    this.saveData(data);
    return true;
  }

  public deleteCommandByName(name: string): boolean {
    const command = this.getCommandByName(name);
    if (!command) {
      return false;
    }
    return this.deleteCommand(command.id);
  }

  public clearAllCommands(): void {
    this.saveData({ commands: [] });
  }
}

