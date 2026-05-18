import path from 'path';
import { FileManager } from './file-manager.js';
import { SPECS_DIR } from '../constants.js';

export class TaskRunner {
  constructor(projectDir) {
    this.projectDir = projectDir;
    this.specsDir = path.join(projectDir, SPECS_DIR);
    this.fileManager = new FileManager();
  }

  async parseTasks(specName) {
    const tasksPath = specName
      ? path.join(this.specsDir, specName, 'tasks.md')
      : path.join(this.specsDir, 'tasks.md');

    const content = await this.fileManager.readFile(tasksPath);
    return this.parseTasksFromContent(content);
  }

  parseTasksFromContent(content) {
    const lines = content.split('\n');
    const tasks = [];
    const tableRegex = /^\|\s*(\S+)\s*\|(.+?)\|(.+?)\|(.*?)\|/;

    for (const line of lines) {
      const match = line.match(tableRegex);
      if (match && match[1] !== 'ID' && !match[1].startsWith('-')) {
        tasks.push({
          id: match[1].trim(),
          description: match[2].trim(),
          status: match[3].trim(),
          notes: (match[4] || '').trim(),
        });
      }
    }

    return tasks;
  }

  async getNextPending(specName) {
    const tasks = await this.parseTasks(specName);
    return tasks.find(t => t.status === 'pending') || null;
  }

  async getCurrentInProgress(specName) {
    const tasks = await this.parseTasks(specName);
    return tasks.find(t => t.status === 'in-progress') || null;
  }

  async updateTaskStatus(specName, taskId, newStatus) {
    const tasksPath = specName
      ? path.join(this.specsDir, specName, 'tasks.md')
      : path.join(this.specsDir, 'tasks.md');

    let content = await this.fileManager.readFile(tasksPath);
    const lines = content.split('\n');
    const updatedLines = lines.map(line => {
      const tableRegex = /^\|\s*(\S+)\s*\|(.+?)\|(.+?)\|(.*?)\|/;
      const match = line.match(tableRegex);
      if (match && match[1].trim() === taskId) {
        const id = match[1].trim();
        const desc = match[2].trim();
        const notes = (match[4] || '').trim();
        return `| ${id} | ${desc} | ${newStatus} | ${notes} |`;
      }
      return line;
    });

    await this.fileManager.writeFile(tasksPath, updatedLines.join('\n'));
  }

  async getProgress(specName) {
    const tasks = await this.parseTasks(specName);
    return {
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      done: tasks.filter(t => t.status === 'done').length,
      total: tasks.length,
    };
  }

  async getGlobalProgress() {
    try {
      const tasks = await this.parseTasks(null);
      return {
        pending: tasks.filter(t => t.status === 'pending').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        done: tasks.filter(t => t.status === 'done').length,
        total: tasks.length,
      };
    } catch {
      return null;
    }
  }
}
