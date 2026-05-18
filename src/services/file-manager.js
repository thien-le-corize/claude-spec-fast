import fs from 'fs/promises';
import path from 'path';
import { PermissionError } from '../errors.js';

export class FileManager {
  constructor() {
    this.createdFiles = [];
    this.createdDirs = [];
    this.backups = new Map();
  }

  async checkWritePermission(dir) {
    try {
      await fs.access(dir, fs.constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }

  async ensureDir(dir) {
    try {
      await fs.mkdir(dir, { recursive: true });
      this.createdDirs.push(dir);
    } catch (err) {
      if (err.code === 'EACCES') {
        throw new PermissionError(dir);
      }
      throw err;
    }
  }

  async copyFile(src, dest) {
    try {
      const destDir = path.dirname(dest);
      await this.ensureDir(destDir);
      await fs.copyFile(src, dest);
      this.createdFiles.push(dest);
    } catch (err) {
      if (err.code === 'EACCES') {
        throw new PermissionError(dest);
      }
      throw err;
    }
  }

  async removeFile(filePath) {
    try {
      await fs.unlink(filePath);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async dirExists(dirPath) {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  async readFile(filePath) {
    return fs.readFile(filePath, 'utf-8');
  }

  async writeFile(filePath, content) {
    try {
      const destDir = path.dirname(filePath);
      await this.ensureDir(destDir);
      await fs.writeFile(filePath, content, 'utf-8');
      this.createdFiles.push(filePath);
    } catch (err) {
      if (err.code === 'EACCES') {
        throw new PermissionError(filePath);
      }
      throw err;
    }
  }

  async compareFiles(file1, file2) {
    try {
      const [content1, content2] = await Promise.all([
        fs.readFile(file1, 'utf-8'),
        fs.readFile(file2, 'utf-8'),
      ]);
      return content1 === content2;
    } catch {
      return false;
    }
  }

  async backupFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      this.backups.set(filePath, content);
    } catch {
      // File doesn't exist, no backup needed
    }
  }

  async rollback() {
    // Remove created files
    for (const file of this.createdFiles.reverse()) {
      try {
        await fs.unlink(file);
      } catch {
        // Ignore errors during rollback
      }
    }

    // Restore backups
    for (const [filePath, content] of this.backups) {
      try {
        await fs.writeFile(filePath, content, 'utf-8');
      } catch {
        // Ignore errors during rollback
      }
    }

    // Remove created directories (only empty ones)
    for (const dir of this.createdDirs.reverse()) {
      try {
        await fs.rmdir(dir);
      } catch {
        // Directory not empty or doesn't exist
      }
    }

    this.reset();
  }

  reset() {
    this.createdFiles = [];
    this.createdDirs = [];
    this.backups.clear();
  }

  async listFiles(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      return entries.filter(e => e.isFile()).map(e => e.name);
    } catch {
      return [];
    }
  }

  async listDirs(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      return entries.filter(e => e.isDirectory()).map(e => e.name);
    } catch {
      return [];
    }
  }
}
