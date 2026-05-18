import { Command } from 'commander';
import path from 'path';
import { checkbox } from '@inquirer/prompts';
import { FileManager } from '../services/file-manager.js';
import { logger } from '../ui/logger.js';
import { SPECS_DIR } from '../constants.js';

const REVIEW_AXES = [
  {
    name: 'Correctness',
    items: [
      'Logic is correct and handles edge cases',
      'No off-by-one errors or boundary issues',
      'Error handling covers failure scenarios',
      'Data validation is thorough',
    ],
  },
  {
    name: 'Readability',
    items: [
      'Code is self-documenting with clear naming',
      'Functions are small and focused',
      'Comments explain "why" not "what"',
      'Consistent formatting and style',
    ],
  },
  {
    name: 'Architecture',
    items: [
      'Follows SOLID principles',
      'Proper separation of concerns',
      'No unnecessary coupling',
      'Extensible without modification',
    ],
  },
  {
    name: 'Security',
    items: [
      'Input is validated and sanitized',
      'No hardcoded secrets or credentials',
      'Proper authentication/authorization',
      'No injection vulnerabilities',
    ],
  },
  {
    name: 'Performance',
    items: [
      'No unnecessary computations or loops',
      'Efficient data structures used',
      'Async operations handled properly',
      'No memory leaks or resource issues',
    ],
  },
];

export function createReviewCommand() {
  const cmd = new Command('review')
    .description('Run a five-axis code review checklist')
    .option('-s, --spec <name>', 'Associate review with a spec')
    .option('--save', 'Save review results to spec changelog')
    .action(async (options) => {
      const projectDir = process.cwd();
      const fileManager = new FileManager();

      logger.newline();
      logger.info('Code Review — Five-Axis Checklist');
      logger.newline();

      let totalChecked = 0;
      let totalItems = 0;
      const results = {};

      for (const axis of REVIEW_AXES) {
        const selected = await checkbox({
          message: `${axis.name}:`,
          choices: axis.items.map(item => ({ name: item, value: item })),
        });

        results[axis.name] = {
          checked: selected.length,
          total: axis.items.length,
        };
        totalChecked += selected.length;
        totalItems += axis.items.length;
      }

      // Calculate score
      const score = Math.round((totalChecked / totalItems) * 100);

      logger.newline();
      logger.info('Review Results:');
      logger.newline();

      for (const [axis, { checked, total }] of Object.entries(results)) {
        const pct = Math.round((checked / total) * 100);
        const bar = '█'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10));
        logger.plain(`  ${axis.padEnd(14)} ${bar} ${pct}% (${checked}/${total})`);
      }

      logger.newline();
      logger.plain(`  Overall Score: ${score}%`);
      logger.newline();

      if (score < 80) {
        logger.warn('Score below 80%. Consider addressing unchecked items before merging.');
      } else {
        logger.success('Review passed!');
      }

      // Save to changelog if requested
      if (options.save && options.spec) {
        const changelogPath = path.join(projectDir, SPECS_DIR, options.spec, 'changelog.md');
        const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
        let content = '';

        if (await fileManager.fileExists(changelogPath)) {
          content = await fileManager.readFile(changelogPath);
        } else {
          content = `# Changelog — ${options.spec}\n\n`;
        }

        let entry = `## [${timestamp}] Code Review — Score: ${score}%\n`;
        for (const [axis, { checked, total }] of Object.entries(results)) {
          entry += `- ${axis}: ${checked}/${total}\n`;
        }
        entry += '\n';

        content += entry;
        await fileManager.writeFile(changelogPath, content);
        logger.success(`Review saved to ${options.spec}/changelog.md`);
      }
    });

  return cmd;
}
