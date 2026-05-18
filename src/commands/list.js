import { Command } from 'commander';
import path from 'path';
import { FileManager } from '../services/file-manager.js';
import { logger } from '../ui/logger.js';
import { CATEGORIES, VALID_CATEGORIES, CLAUDE_DIR } from '../constants.js';
import { InvalidCategoryError, ConfigNotFoundError } from '../errors.js';

export function createListCommand() {
  const cmd = new Command('list')
    .alias('ls')
    .description('List categories or items within a category')
    .argument('[category]', 'Category to list items from')
    .action(async (category) => {
      const projectDir = process.cwd();
      const claudeDir = path.join(projectDir, CLAUDE_DIR);
      const fileManager = new FileManager();

      // Check .claude/ exists
      if (!(await fileManager.dirExists(claudeDir))) {
        throw new ConfigNotFoundError();
      }

      if (!category) {
        // Show all categories with counts
        logger.newline();
        logger.info('Available categories:');
        logger.newline();

        for (const [name, config] of Object.entries(CATEGORIES)) {
          const dirPath = path.join(claudeDir, config.dir);
          let count = 0;

          if (await fileManager.dirExists(dirPath)) {
            if (name === 'skills') {
              const dirs = await fileManager.listDirs(dirPath);
              count = dirs.length;
            } else {
              const files = await fileManager.listFiles(dirPath);
              count = files.filter(f => f.endsWith('.md')).length;
            }
          }

          const total = config.items.length;
          logger.plain(`  ${name.padEnd(12)} ${count}/${total} items`);
        }
        logger.newline();
      } else {
        // Validate category
        if (!VALID_CATEGORIES.includes(category)) {
          throw new InvalidCategoryError(category, VALID_CATEGORIES);
        }

        const config = CATEGORIES[category];
        const dirPath = path.join(claudeDir, config.dir);

        logger.newline();
        logger.info(`Items in "${category}":`);
        logger.newline();

        for (const item of config.items) {
          let filePath;
          if (category === 'skills') {
            filePath = path.join(dirPath, item, 'SKILL.md');
          } else {
            filePath = path.join(dirPath, `${item}.md`);
          }

          const exists = await fileManager.fileExists(filePath);
          let description = '';

          if (exists) {
            try {
              const content = await fileManager.readFile(filePath);
              const firstLine = content.split('\n').find(l => l.trim() && !l.startsWith('#'));
              description = firstLine ? firstLine.trim().slice(0, 60) : '';
            } catch {
              // Ignore read errors
            }
          }

          const status = exists ? '✓' : '○';
          const line = description
            ? `${status} ${item.padEnd(28)} ${description}`
            : `${status} ${item}`;
          logger.plain(line);
        }
        logger.newline();
      }
    });

  return cmd;
}
