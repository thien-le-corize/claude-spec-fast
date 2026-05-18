import { Command } from 'commander';
import path from 'path';
import { FileManager } from '../services/file-manager.js';
import { logger } from '../ui/logger.js';
import { confirmAction } from '../ui/prompts.js';
import { CATEGORIES, VALID_CATEGORIES, CLAUDE_DIR } from '../constants.js';
import { InvalidCategoryError, ItemNotFoundError, ConfigNotFoundError } from '../errors.js';

export function createRemoveCommand() {
  const cmd = new Command('remove')
    .alias('rm')
    .description('Remove an item from a category')
    .argument('<category>', 'Category (agents, commands, rules, skills, references)')
    .argument('<item>', 'Item name to remove')
    .option('-f, --force', 'Remove without confirmation')
    .action(async (category, item, options) => {
      const projectDir = process.cwd();
      const claudeDir = path.join(projectDir, CLAUDE_DIR);
      const fileManager = new FileManager();

      // Check .claude/ exists
      if (!(await fileManager.dirExists(claudeDir))) {
        throw new ConfigNotFoundError();
      }

      // Validate category
      if (!VALID_CATEGORIES.includes(category)) {
        throw new InvalidCategoryError(category, VALID_CATEGORIES);
      }

      // Validate item
      const config = CATEGORIES[category];
      if (!config.items.includes(item)) {
        throw new ItemNotFoundError(item, category, config.items);
      }

      // Check if file exists
      let filePath;
      if (category === 'skills') {
        filePath = path.join(claudeDir, config.dir, item, 'SKILL.md');
      } else {
        filePath = path.join(claudeDir, config.dir, `${item}.md`);
      }

      if (!(await fileManager.fileExists(filePath))) {
        logger.warn(`${category}/${item} is not installed.`);
        return;
      }

      // Confirm removal
      if (!options.force) {
        const isTTY = process.stdout.isTTY;
        if (!isTTY) {
          logger.error('Cannot confirm in non-TTY. Use --force.');
          process.exitCode = 1;
          return;
        }
        const confirmed = await confirmAction(`Remove ${category}/${item}?`);
        if (!confirmed) {
          logger.info('Aborted.');
          return;
        }
      }

      // Delete file
      await fileManager.removeFile(filePath);

      // For skills, also try to remove the directory if empty
      if (category === 'skills') {
        const skillDir = path.join(claudeDir, config.dir, item);
        try {
          const { rmdir } = await import('fs/promises');
          await rmdir(skillDir);
        } catch {
          // Directory not empty or doesn't exist
        }
      }

      logger.success(`Removed ${category}/${item}`);
    });

  return cmd;
}
