import { Command } from 'commander';
import { ConfigManager } from '../services/config-manager.js';
import { logger } from '../ui/logger.js';
import { ConfigNotFoundError } from '../errors.js';

export function createConfigCommand() {
  const cmd = new Command('config')
    .description('Manage configuration settings');

  cmd
    .command('get <key>')
    .description('Get a configuration value')
    .action(async (key) => {
      const projectDir = process.cwd();
      const configManager = new ConfigManager(projectDir);

      if (!(await configManager.exists())) {
        throw new ConfigNotFoundError();
      }

      const value = await configManager.get(key);
      if (value === undefined) {
        logger.warn(`Key "${key}" not found.`);
        process.exitCode = 1;
      } else {
        const display = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
        logger.plain(`${key} = ${display}`);
      }
    });

  cmd
    .command('set <key> <value>')
    .description('Set a configuration value')
    .action(async (key, value) => {
      const projectDir = process.cwd();
      const configManager = new ConfigManager(projectDir);

      if (!(await configManager.exists())) {
        throw new ConfigNotFoundError();
      }

      await configManager.set(key, value);
      logger.success(`Set ${key} = ${value}`);
    });

  cmd
    .command('list', { isDefault: true })
    .description('Show all configuration values')
    .action(async () => {
      const projectDir = process.cwd();
      const configManager = new ConfigManager(projectDir);

      if (!(await configManager.exists())) {
        throw new ConfigNotFoundError();
      }

      const settings = await configManager.getAll();
      logger.newline();
      logger.info('Current configuration:');
      logger.newline();
      logger.plain(JSON.stringify(settings, null, 2));
      logger.newline();
    });

  return cmd;
}
