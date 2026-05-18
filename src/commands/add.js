import { Command } from 'commander';
import path from 'path';
import { TemplateEngine } from '../services/template-engine.js';
import { FileManager } from '../services/file-manager.js';
import { logger } from '../ui/logger.js';
import { confirmOverwrite } from '../ui/prompts.js';
import { CATEGORIES, VALID_CATEGORIES, CLAUDE_DIR } from '../constants.js';
import { InvalidCategoryError, ItemNotFoundError, ConfigNotFoundError } from '../errors.js';

export function createAddCommand() {
  const cmd = new Command('add')
    .description('Add an item to a category')
    .argument('<category>', 'Category (agents, commands, rules, skills, references)')
    .argument('<item>', 'Item name to add')
    .option('-f, --force', 'Overwrite without prompting')
    .action(async (category, item, options) => {
      const projectDir = process.cwd();
      const claudeDir = path.join(projectDir, CLAUDE_DIR);
      const fileManager = new FileManager();
      const templateEngine = new TemplateEngine();

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

      // Check if file already exists
      let destPath;
      if (category === 'skills') {
        destPath = path.join(claudeDir, config.dir, item, 'SKILL.md');
      } else {
        destPath = path.join(claudeDir, config.dir, `${item}.md`);
      }

      if (await fileManager.fileExists(destPath)) {
        if (!options.force) {
          const isTTY = process.stdout.isTTY;
          if (!isTTY) {
            logger.error(`${item} already exists. Use --force to overwrite.`);
            process.exitCode = 1;
            return;
          }
          const overwrite = await confirmOverwrite(item);
          if (!overwrite) {
            logger.info('Aborted.');
            return;
          }
        }
      }

      // Copy from template
      await templateEngine.copyItem(category, item, claudeDir);
      logger.success(`Added ${category}/${item}`);
    });

  return cmd;
}
