export interface Command {
  id: string;
  name: string;
  alias: string;
  steps: string[];
  createdAt: string;
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

