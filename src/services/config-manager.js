import path from 'path';
import { FileManager } from './file-manager.js';

export class ConfigManager {
  constructor(projectDir) {
    this.settingsPath = path.join(projectDir, '.claude', 'settings.json');
    this.fileManager = new FileManager();
  }

  async exists() {
    return this.fileManager.fileExists(this.settingsPath);
  }

  async getAll() {
    const content = await this.fileManager.readFile(this.settingsPath);
    return JSON.parse(content);
  }

  async get(key) {
    const settings = await this.getAll();
    if (key.includes('.')) {
      const keys = key.split('.');
      let value = settings;
      for (const k of keys) {
        if (value === undefined || value === null) return undefined;
        value = value[k];
      }
      return value;
    }
    return settings[key];
  }

  async set(key, value) {
    const settings = await this.getAll();

    // Try to parse value as JSON (for booleans, numbers)
    let parsedValue = value;
    try {
      parsedValue = JSON.parse(value);
    } catch {
      // Keep as string
    }

    if (key.includes('.')) {
      const keys = key.split('.');
      let obj = settings;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = parsedValue;
    } else {
      settings[key] = parsedValue;
    }

    await this.fileManager.writeFile(
      this.settingsPath,
      JSON.stringify(settings, null, 2) + '\n'
    );
  }

  async getAvailableKeys() {
    const settings = await this.getAll();
    const keys = [];

    function flatten(obj, prefix = '') {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          flatten(value, fullKey);
        } else {
          keys.push(fullKey);
        }
      }
    }

    flatten(settings);
    return keys;
  }
}
