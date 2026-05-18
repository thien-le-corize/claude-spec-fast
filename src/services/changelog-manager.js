import path from 'path';
import { FileManager } from './file-manager.js';
import { SPECS_DIR } from '../constants.js';

export class ChangelogManager {
  constructor(projectDir) {
    this.projectDir = projectDir;
    this.specsDir = path.join(projectDir, SPECS_DIR);
    this.fileManager = new FileManager();
  }

  getChangelogPath(specName) {
    return path.join(this.specsDir, specName, 'changelog.md');
  }

  async exists(specName) {
    return this.fileManager.fileExists(this.getChangelogPath(specName));
  }

  async read(specName) {
    const filePath = this.getChangelogPath(specName);
    if (!(await this.fileManager.fileExists(filePath))) {
      return [];
    }

    const content = await this.fileManager.readFile(filePath);
    const entries = [];
    const entryRegex = /^## \[(.+?)\] (.+)$/;
    const lines = content.split('\n');

    let currentEntry = null;
    for (const line of lines) {
      const match = line.match(entryRegex);
      if (match) {
        if (currentEntry) entries.push(currentEntry);
        currentEntry = {
          timestamp: match[1],
          title: match[2],
          description: '',
        };
      } else if (currentEntry && line.trim()) {
        currentEntry.description += (currentEntry.description ? '\n' : '') + line.trim();
      }
    }
    if (currentEntry) entries.push(currentEntry);

    return entries;
  }

  async append(specName, { taskId, description, message }) {
    const filePath = this.getChangelogPath(specName);
    const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];

    let content = '';
    if (await this.fileManager.fileExists(filePath)) {
      content = await this.fileManager.readFile(filePath);
    } else {
      content = `# Changelog — ${specName}\n\n`;
    }

    const entry = `## [${timestamp}] ${message || `Task ${taskId} completed`}\n${description}\n\n`;
    content += entry;

    await this.fileManager.writeFile(filePath, content);
  }

  async clear(specName) {
    const filePath = this.getChangelogPath(specName);
    await this.fileManager.writeFile(filePath, `# Changelog — ${specName}\n\n`);
  }
}
