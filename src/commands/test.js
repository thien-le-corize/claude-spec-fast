import { Command } from 'commander';
import { TestRunner } from '../services/test-runner.js';
import { logger } from '../ui/logger.js';
import { createSpinner } from '../ui/spinner.js';
import { TestRunnerNotFoundError } from '../errors.js';

export function createTestCommand() {
  const cmd = new Command('test')
    .description('Detect and run project tests')
    .option('-w, --watch', 'Run tests in watch mode')
    .action(async (options) => {
      const projectDir = process.cwd();
      const testRunner = new TestRunner(projectDir);

      const spinner = createSpinner('Detecting test runner...');
      spinner.start();

      const runner = await testRunner.detect();

      if (!runner) {
        spinner.fail('No test runner detected.');
        throw new TestRunnerNotFoundError();
      }

      spinner.succeed(`Detected: ${runner.name}`);
      logger.newline();

      const command = options.watch ? runner.watchCommand : runner.command;
      logger.info(`Running: ${command}`);
      logger.newline();

      const result = await testRunner.run(command);

      if (result.exitCode !== 0) {
        process.exitCode = result.exitCode;
      }
    });

  return cmd;
}
