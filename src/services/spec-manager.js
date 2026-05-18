import path from 'path';
import { FileManager } from './file-manager.js';
import { SPECS_DIR, SPEC_DOCUMENTS } from '../constants.js';

export class SpecManager {
  constructor(projectDir) {
    this.projectDir = projectDir;
    this.specsDir = path.join(projectDir, SPECS_DIR);
    this.fileManager = new FileManager();
  }

  getSpecDir(name) {
    return path.join(this.specsDir, name);
  }

  async specExists(name) {
    return this.fileManager.dirExists(this.getSpecDir(name));
  }

  async globalSpecExists() {
    return this.fileManager.fileExists(path.join(this.specsDir, 'requirements.md'));
  }

  async createSpec(name) {
    await this.fileManager.ensureDir(this.getSpecDir(name));
  }

  async createDocument(name, docType, content) {
    const specDir = this.getSpecDir(name);
    await this.fileManager.ensureDir(specDir);
    const filePath = path.join(specDir, `${docType}.md`);
    await this.fileManager.writeFile(filePath, content);
    return filePath;
  }

  async createGlobalDocument(docType, content) {
    await this.fileManager.ensureDir(this.specsDir);
    const filePath = path.join(this.specsDir, `${docType}.md`);
    await this.fileManager.writeFile(filePath, content);
    return filePath;
  }

  async documentExists(name, docType) {
    const filePath = path.join(this.getSpecDir(name), `${docType}.md`);
    return this.fileManager.fileExists(filePath);
  }

  async globalDocumentExists(docType) {
    const filePath = path.join(this.specsDir, `${docType}.md`);
    return this.fileManager.fileExists(filePath);
  }

  async getSpecDocuments(name) {
    const results = [];
    for (const doc of SPEC_DOCUMENTS) {
      const docName = doc.replace('.md', '');
      const exists = await this.documentExists(name, docName);
      results.push({ name: doc, exists });
    }
    return results;
  }

  async listSpecs() {
    const dirs = await this.fileManager.listDirs(this.specsDir);
    const specs = [];

    for (const dir of dirs) {
      const tasksPath = path.join(this.specsDir, dir, 'tasks.md');
      let completion = null;

      if (await this.fileManager.fileExists(tasksPath)) {
        const content = await this.fileManager.readFile(tasksPath);
        const tasks = this.parseTasksFromContent(content);
        if (tasks.length > 0) {
          const done = tasks.filter(t => t.status === 'done').length;
          completion = Math.round((done / tasks.length) * 100);
        }
      }

      specs.push({ name: dir, completion });
    }

    return specs.sort((a, b) => a.name.localeCompare(b.name));
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
}
