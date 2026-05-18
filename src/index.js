import { Command } from 'commander';
import { createRequire } from 'module';
import { showBanner, showFooter } from './ui/banner.js';
import { logger } from './ui/logger.js';
import { createInitCommand } from './commands/init.js';
import { createListCommand } from './commands/list.js';
import { createAddCommand } from './commands/add.js';
import { createRemoveCommand } from './commands/remove.js';
import { createUpdateCommand } from './commands/update.js';
import { createDoctorCommand } from './commands/doctor.js';
import { createConfigCommand } from './commands/config.js';
import { createSpecCommand } from './commands/spec.js';
import { createTestCommand } from './commands/test.js';
import { createReviewCommand } from './commands/review.js';
import { CLIError } from './errors.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

export function createProgram() {
  const program = new Command();

  program
    .name('csf')
    .description('CLI tool to scaffold and manage .claude AI agent configurations')
    .version(pkg.version)
    .hook('preAction', () => {
      showBanner();
    });

  // Register all commands
  program.addCommand(createInitCommand());
  program.addCommand(createListCommand());
  program.addCommand(createAddCommand());
  program.addCommand(createRemoveCommand());
  program.addCommand(createUpdateCommand());
  program.addCommand(createDoctorCommand());
  program.addCommand(createConfigCommand());
  program.addCommand(createSpecCommand());
  program.addCommand(createTestCommand());
  program.addCommand(createReviewCommand());

  // Show footer in help
  program.addHelpText('after', () => {
    showFooter();
    return '';
  });

  // Global error handler
  program.exitOverride();

  return program;
}

export async function run() {
  const program = createProgram();

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.newline();
    if (err instanceof CLIError) {
      logger.error(err.message);
      process.exit(err.exitCode);
    } else {
      logger.error(`Unexpected error: ${err.message}`);
      if (process.env.DEBUG) {
        console.error(err.stack);
      }
      process.exit(1);
    }
  });

  process.on('unhandledRejection', (err) => {
    logger.newline();
    if (err instanceof CLIError) {
      logger.error(err.message);
      process.exit(err.exitCode);
    } else {
      logger.error(`Unexpected error: ${err.message}`);
      if (process.env.DEBUG) {
        console.error(err.stack);
      }
      process.exit(1);
    }
  });

  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    if (err.code === 'commander.helpDisplayed' || err.code === 'commander.version') {
      process.exit(0);
    }
    if (err instanceof CLIError) {
      logger.error(err.message);
      process.exit(err.exitCode);
    }
    if (err.code !== 'commander.executeSubCommandAsync') {
      logger.error(err.message || 'An unexpected error occurred.');
      if (process.env.DEBUG) {
        console.error(err.stack);
      }
      process.exit(1);
    }
  }
}
