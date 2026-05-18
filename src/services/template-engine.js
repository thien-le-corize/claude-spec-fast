import path from 'path';
import { fileURLToPath } from 'url';
import { CATEGORIES } from '../constants.js';
import { FileManager } from './file-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATE_ROOT = path.resolve(__dirname, '..', '..', 'templates', '.claude');
const SPEC_TEMPLATE_ROOT = path.resolve(__dirname, '..', '..', 'templates', 'specs');

export class TemplateEngine {
  constructor() {
    this.templateRoot = TEMPLATE_ROOT;
    this.specTemplateRoot = SPEC_TEMPLATE_ROOT;
    this.fileManager = new FileManager();
  }

  getTemplatePath(category, itemName) {
    const cat = CATEGORIES[category];
    if (!cat) return null;

    if (category === 'skills') {
      return path.join(this.templateRoot, cat.dir, itemName, 'SKILL.md');
    }
    return path.join(this.templateRoot, cat.dir, `${itemName}.md`);
  }

  getSpecTemplatePath(docType) {
    return path.join(this.specTemplateRoot, `${docType}.md`);
  }

  listAvailableItems(category) {
    const cat = CATEGORIES[category];
    return cat ? cat.items : [];
  }

  async scaffoldAll(targetDir) {
    const createdFiles = [];

    // Copy CLAUDE.md
    const claudeSrc = path.join(this.templateRoot, 'CLAUDE.md');
    const claudeDest = path.join(targetDir, 'CLAUDE.md');
    await this.fileManager.copyFile(claudeSrc, claudeDest);
    createdFiles.push('CLAUDE.md');

    // Copy settings.json
    const settingsSrc = path.join(this.templateRoot, 'settings.json');
    const settingsDest = path.join(targetDir, 'settings.json');
    await this.fileManager.copyFile(settingsSrc, settingsDest);
    createdFiles.push('settings.json');

    // Copy all categories
    for (const [category, config] of Object.entries(CATEGORIES)) {
      for (const item of config.items) {
        const src = this.getTemplatePath(category, item);
        let dest;
        if (category === 'skills') {
          dest = path.join(targetDir, config.dir, item, 'SKILL.md');
        } else {
          dest = path.join(targetDir, config.dir, `${item}.md`);
        }
        await this.fileManager.copyFile(src, dest);
        createdFiles.push(path.relative(targetDir, dest));
      }
    }

    return createdFiles;
  }

  async scaffoldSelected(targetDir, selections) {
    const createdFiles = [];

    // Always copy settings.json
    const settingsSrc = path.join(this.templateRoot, 'settings.json');
    const settingsDest = path.join(targetDir, 'settings.json');
    await this.fileManager.copyFile(settingsSrc, settingsDest);
    createdFiles.push('settings.json');

    // Copy selected items per category
    for (const [category, items] of Object.entries(selections)) {
      const config = CATEGORIES[category];
      if (!config) continue;

      for (const item of items) {
        const src = this.getTemplatePath(category, item);
        let dest;
        if (category === 'skills') {
          dest = path.join(targetDir, config.dir, item, 'SKILL.md');
        } else {
          dest = path.join(targetDir, config.dir, `${item}.md`);
        }
        await this.fileManager.copyFile(src, dest);
        createdFiles.push(path.relative(targetDir, dest));
      }
    }

    // Generate CLAUDE.md referencing only selected items
    await this.generateClaudeMd(targetDir, selections);
    createdFiles.push('CLAUDE.md');

    return createdFiles;
  }

  async copyItem(category, itemName, targetDir) {
    const config = CATEGORIES[category];
    const src = this.getTemplatePath(category, itemName);
    let dest;
    if (category === 'skills') {
      dest = path.join(targetDir, config.dir, itemName, 'SKILL.md');
    } else {
      dest = path.join(targetDir, config.dir, `${itemName}.md`);
    }
    await this.fileManager.copyFile(src, dest);
    return dest;
  }

  async generateClaudeMd(targetDir, selections) {
    let content = '# Claude AI Agent Configuration\n\n';
    content += '## Overview\n\n';
    content += 'This project uses Claude AI as an intelligent development agent.\n\n';

    if (selections) {
      for (const [category, items] of Object.entries(selections)) {
        if (items.length === 0) continue;
        content += `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
        for (const item of items) {
          content += `- ${item}\n`;
        }
        content += '\n';
      }
    } else {
      for (const [category, config] of Object.entries(CATEGORIES)) {
        content += `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
        for (const item of config.items) {
          content += `- ${item}\n`;
        }
        content += '\n';
      }
    }

    const dest = path.join(targetDir, 'CLAUDE.md');
    await this.fileManager.writeFile(dest, content);
  }

  getFileManager() {
    return this.fileManager;
  }
}
