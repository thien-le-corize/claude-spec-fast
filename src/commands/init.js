import { Command } from 'commander';
import path from 'path';
import { TemplateEngine } from '../services/template-engine.js';
import { FileManager } from '../services/file-manager.js';
import { logger } from '../ui/logger.js';
import { createSpinner } from '../ui/spinner.js';
import { confirmOverwrite, selectPreset, selectItems } from '../ui/prompts.js';
import { CATEGORIES, PRESETS, CLAUDE_DIR } from '../constants.js';

export function createInitCommand() {
  const cmd = new Command('init')
    .description('Initialize .claude/ configuration in current project')
    .option('-f, --force', 'Overwrite existing configuration without prompting')
    .option('-i, --interactive', 'Select preset and items interactively')
    .option('-l, --lang <language>', 'Set response language (vi, en, ja, ko, zh...)', 'vi')
    .action(async (options) => {
      const projectDir = process.cwd();
      const claudeDir = path.join(projectDir, CLAUDE_DIR);
      const fileManager = new FileManager();
      const templateEngine = new TemplateEngine();

      // Check if .claude/ already exists
      if (await fileManager.dirExists(claudeDir)) {
        if (!options.force) {
          const isTTY = process.stdout.isTTY;
          if (!isTTY) {
            logger.error('.claude/ already exists. Use --force to overwrite.');
            process.exitCode = 1;
            return;
          }
          const overwrite = await confirmOverwrite('.claude/');
          if (!overwrite) {
            logger.info('Aborted.');
            return;
          }
        }
      }

      const spinner = createSpinner('Scaffolding .claude/ configuration...');
      let createdFiles = [];

      try {
        if (options.interactive) {
          // Interactive mode: select preset
          const presetName = await selectPreset(PRESETS);
          let selections;

          if (PRESETS[presetName] === null) {
            // Full Stack - select all
            selections = {};
            for (const [category, config] of Object.entries(CATEGORIES)) {
              selections[category] = [...config.items];
            }
          } else {
            // Start with preset defaults, allow customization
            selections = { ...PRESETS[presetName] };
          }

          // Allow per-category customization
          for (const category of Object.keys(CATEGORIES)) {
            const available = CATEGORIES[category].items;
            const preSelected = selections[category] || [];
            const selected = await selectItems(category, available, preSelected);
            selections[category] = selected;
          }

          spinner.start();
          createdFiles = await templateEngine.scaffoldSelected(claudeDir, selections);
        } else {
          // Default: scaffold all
          spinner.start();
          createdFiles = await templateEngine.scaffoldAll(claudeDir);
        }

        spinner.succeed('Configuration created successfully!');

        // Update language in settings.json
        if (options.lang) {
          const settingsPath = path.join(claudeDir, 'settings.json');
          try {
            const content = await fileManager.readFile(settingsPath);
            const settings = JSON.parse(content);
            settings.language = options.lang;
            await fileManager.writeFile(settingsPath, JSON.stringify(settings, null, 2) + '\n');
          } catch {
            // Ignore if settings.json doesn't exist yet
          }
        }

        logger.newline();
        logger.success(`Created ${createdFiles.length} files in .claude/`);
        logger.newline();

        // Summary by category
        const summary = {};
        for (const file of createdFiles) {
          const parts = file.split(path.sep);
          const cat = parts.length > 1 ? parts[0] : 'root';
          summary[cat] = (summary[cat] || 0) + 1;
        }
        for (const [cat, count] of Object.entries(summary)) {
          logger.plain(`  ${cat}: ${count} file${count > 1 ? 's' : ''}`);
        }
        logger.newline();
      } catch (err) {
        spinner.fail('Failed to create configuration.');
        logger.error(err.message);

        // Rollback on error
        await fileManager.rollback();
        logger.warn('Rolled back changes.');
        process.exitCode = 1;
      }
    });

  return cmd;
}
