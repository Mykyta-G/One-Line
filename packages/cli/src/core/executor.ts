import { exec } from 'child_process';
import { promisify } from 'util';
import { Command, ExecutionResult } from './types';

const execAsync = promisify(exec);

export class CommandExecutor {
  /**
   * Execute a single command
   */
  public async executeCommand(command: string, cwd?: string): Promise<{ stdout: string; stderr: string }> {
    try {
      const result = await execAsync(command, {
        cwd: cwd || process.cwd(),
        shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh'
      });
      return result;
    } catch (error: any) {
      throw new Error(`Command failed: ${error.message}`);
    }
  }

  /**
   * Execute a sequence of commands, stopping on first failure
   */
  public async executeSequence(
    steps: string[],
    cwd?: string,
    onStepComplete?: (stepIndex: number, output: string) => void
  ): Promise<ExecutionResult> {
    let fullOutput = '';

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      try {
        const { stdout, stderr } = await this.executeCommand(step, cwd);
        const output = stdout + stderr;
        fullOutput += `\n[Step ${i + 1}/${steps.length}] ${step}\n${output}\n`;
        
        if (onStepComplete) {
          onStepComplete(i, output);
        }
      } catch (error: any) {
        fullOutput += `\n[Step ${i + 1}/${steps.length}] ${step}\nError: ${error.message}\n`;
        return {
          success: false,
          output: fullOutput,
          error: error.message,
          failedStep: i
        };
      }
    }

    return {
      success: true,
      output: fullOutput
    };
  }

  /**
   * Execute a saved command
   */
  public async executeCommand_obj(
    command: Command,
    cwd?: string,
    onStepComplete?: (stepIndex: number, output: string) => void
  ): Promise<ExecutionResult> {
    return this.executeSequence(command.steps, cwd, onStepComplete);
  }
}

