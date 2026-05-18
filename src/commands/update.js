import { Command } from 'commander';
import path from 'path';
import { TemplateEngine } from '../services/template-engine.js';
import { FileManager } from '../services/file-manager.js';
import { logger } from '../ui/logger.js';
import { createSpinner } from '../ui/spinner.js';
import { confirmAction } from '../ui/prompts.js';
import { CATEGORIES, CLAUDE_DIR } from '../constants.js';
import { ConfigNotFoundError } from '../errors.js';

export function createUpdateCommand() {
  const cmd = new Command('update')
    .description('Update outdated files from templates')
    .option('--dry-run', 'Show what would be updated without making changes')
    .action(async (options) => {
      const projectDir = process.cwd();
      const claudeDir = path.join(projectDir, CLAUDE_DIR);
      const fileManager = new FileManager();
      const templateEngine = new TemplateEngine();

      // Check .claude/ exists
      if (!(await fileManager.dirExists(claudeDir))) {
        throw new ConfigNotFoundError();
      }

      const spinner = createSpinner('Checking for updates...');
      spinner.start();

      const outdated = [];

      // Compare each installed file with its template
      for (const [category, config] of Object.entries(CATEGORIES)) {
        for (const item of config.items) {
          let installedPath;
          if (category === 'skills') {
            installedPath = path.join(claudeDir, config.dir, item, 'SKILL.md');
          } else {
            installedPath = path.join(claudeDir, config.dir, `${item}.md`);
          }

          // Skip if not installed
          if (!(await fileManager.fileExists(installedPath))) continue;

          const templatePath = templateEngine.getTemplatePath(category, item);
          if (!templatePath) continue;

          // Skip if template doesn't exist
          if (!(await fileManager.fileExists(templatePath))) continue;

          // Compare
          const isSame = await fileManager.compareFiles(installedPath, templatePath);
          if (!isSame) {
            outdated.push({ category, item, installedPath, templatePath });
          }
        }
      }

      spinner.stop();

      if (outdated.length === 0) {
        logger.success('All files are up to date!');
        return;
      }

      logger.newline();
      logger.info(`Found ${outdated.length} outdated file${outdated.length > 1 ? 's' : ''}:`);
      logger.newline();

      for (const { category, item } of outdated) {
        logger.plain(`  • ${category}/${item}`);
      }
      logger.newline();

      if (options.dryRun) {
        logger.info('Dry run — no changes made.');
        return;
      }

      // Confirm update
      const confirmed = await confirmAction(`Update ${outdated.length} file${outdated.length > 1 ? 's' : ''}?`);
      if (!confirmed) {
        logger.info('Aborted.');
        return;
      }

      const updateSpinner = createSpinner('Updating files...');
      updateSpinner.start();

      let updated = 0;
      for (const { installedPath, templatePath } of outdated) {
        await fileManager.copyFile(templatePath, installedPath);
        updated++;
      }

      updateSpinner.succeed(`Updated ${updated} file${updated > 1 ? 's' : ''}.`);
    });

  return cmd;
}
