import path from 'path';
import { FileManager } from './file-manager.js';
import { CATEGORIES } from '../constants.js';

export class Validator {
  constructor(projectDir) {
    this.projectDir = projectDir;
    this.claudeDir = path.join(projectDir, '.claude');
    this.fileManager = new FileManager();
  }

  async validate() {
    const issues = [];

    // Check .claude directory exists
    if (!(await this.fileManager.dirExists(this.claudeDir))) {
      return { valid: false, issues: [{ path: '.claude/', message: 'Directory not found', fix: 'csf init' }] };
    }

    // Check CLAUDE.md
    const claudeMd = path.join(this.claudeDir, 'CLAUDE.md');
    if (!(await this.fileManager.fileExists(claudeMd))) {
      issues.push({ path: 'CLAUDE.md', message: 'File not found', fix: 'csf init' });
    } else {
      const content = await this.fileManager.readFile(claudeMd);
      if (content.trim().length === 0) {
        issues.push({ path: 'CLAUDE.md', message: 'File is empty', fix: 'csf init --force' });
      }
    }

    // Check settings.json
    const settingsJson = path.join(this.claudeDir, 'settings.json');
    if (!(await this.fileManager.fileExists(settingsJson))) {
      issues.push({ path: 'settings.json', message: 'File not found', fix: 'csf init' });
    } else {
      try {
        const content = await this.fileManager.readFile(settingsJson);
        JSON.parse(content);
      } catch {
        issues.push({ path: 'settings.json', message: 'Invalid JSON', fix: 'csf init --force' });
      }
    }

    // Check category directories
    for (const [category, config] of Object.entries(CATEGORIES)) {
      const dirPath = path.join(this.claudeDir, config.dir);
      if (!(await this.fileManager.dirExists(dirPath))) {
        issues.push({ path: `${config.dir}/`, message: 'Directory not found', fix: `csf add ${category} <item>` });
      } else {
        const files = await this.fileManager.listFiles(dirPath);
        const dirs = await this.fileManager.listDirs(dirPath);
        if (files.length === 0 && dirs.length === 0) {
          issues.push({ path: `${config.dir}/`, message: 'Directory is empty', fix: `csf add ${category} <item>` });
        }
      }
    }

    return { valid: issues.length === 0, issues };
  }
}
