export interface Command {
  id: string;
  name: string;
  alias: string;
  steps: string[];
  createdAt: string;
  usageCount?: number; // Track how many times the command has been run
}

export interface CommandsData {
  commands: Command[];
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  failedStep?: number;
}

