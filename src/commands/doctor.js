import { Command } from 'commander';
import { Validator } from '../services/validator.js';
import { logger } from '../ui/logger.js';
import { createSpinner } from '../ui/spinner.js';

export function createDoctorCommand() {
  const cmd = new Command('doctor')
    .description('Check configuration health and report issues')
    .action(async () => {
      const projectDir = process.cwd();
      const validator = new Validator(projectDir);

      const spinner = createSpinner('Running diagnostics...');
      spinner.start();

      const result = await validator.validate();

      spinner.stop();
      logger.newline();

      if (result.valid) {
        logger.success('No issues found. Configuration is healthy!');
      } else {
        logger.warn(`Found ${result.issues.length} issue${result.issues.length > 1 ? 's' : ''}:`);
        logger.newline();

        for (const issue of result.issues) {
          logger.error(`${issue.path}: ${issue.message}`);
          if (issue.fix) {
            logger.plain(`    Fix: ${issue.fix}`);
          }
        }
        logger.newline();
        process.exitCode = 1;
      }
    });

  return cmd;
}
