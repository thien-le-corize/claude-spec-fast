import chalk from 'chalk';

const isTTY = process.stdout.isTTY;

export const logger = {
  success(msg) {
    console.log(isTTY ? chalk.green(`  ✓ ${msg}`) : `  ✓ ${msg}`);
  },

  error(msg) {
    console.error(isTTY ? chalk.red(`  ✗ ${msg}`) : `  ✗ ${msg}`);
  },

  warn(msg) {
    console.log(isTTY ? chalk.yellow(`  ⚠ ${msg}`) : `  ⚠ ${msg}`);
  },

  info(msg) {
    console.log(isTTY ? chalk.blue(`  ℹ ${msg}`) : `  ℹ ${msg}`);
  },

  plain(msg) {
    console.log(`  ${msg}`);
  },

  newline() {
    console.log('');
  },

  table(rows) {
    for (const row of rows) {
      console.log(`  ${row}`);
    }
  },
};
