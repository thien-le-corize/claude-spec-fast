import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pkg = require('../../package.json');

export function showBanner() {
  const banner = `
╔══════════════════════════════════════════╗
║     🚀 Claude Spec Fast CLI             ║
║     csf v${pkg.version.padEnd(22)}║
╚══════════════════════════════════════════╝`;
  console.log(banner);
}

export function showFooter() {
  console.log('');
  console.log('  📦 npm: @jack96dev/claude-spec-fast');
  console.log('  🐙 GitHub: github.com/jack96dev/claude-spec-fast');
  console.log('');
}
