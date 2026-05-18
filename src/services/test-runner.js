import path from 'path';
import { spawn } from 'child_process';
import { FileManager } from './file-manager.js';

export class TestRunner {
  constructor(projectDir) {
    this.projectDir = projectDir;
    this.fileManager = new FileManager();
  }

  async detect() {
    // Check vitest
    const vitestConfig = ['vitest.config.ts', 'vitest.config.js', 'vitest.config.mts'];
    for (const config of vitestConfig) {
      if (await this.fileManager.fileExists(path.join(this.projectDir, config))) {
        return { name: 'vitest', command: 'npx vitest run', watchCommand: 'npx vitest' };
      }
    }

    // Check jest
    const jestConfig = ['jest.config.ts', 'jest.config.js', 'jest.config.mjs'];
    for (const config of jestConfig) {
      if (await this.fileManager.fileExists(path.join(this.projectDir, config))) {
        return { name: 'jest', command: 'npx jest', watchCommand: 'npx jest --watch' };
      }
    }

    // Check package.json scripts
    const pkgPath = path.join(this.projectDir, 'package.json');
    if (await this.fileManager.fileExists(pkgPath)) {
      const content = await this.fileManager.readFile(pkgPath);
      try {
        const pkg = JSON.parse(content);
        if (pkg.scripts && pkg.scripts.test && pkg.scripts.test !== 'echo "Error: no test specified" && exit 1') {
          return { name: 'npm', command: 'npm test', watchCommand: 'npm test -- --watch' };
        }
      } catch {
        // Invalid package.json
      }
    }

    return null;
  }

  run(command, options = {}) {
    return new Promise((resolve) => {
      const [cmd, ...args] = command.split(' ');
      const child = spawn(cmd, args, {
        cwd: this.projectDir,
        stdio: 'inherit',
        shell: true,
        ...options,
      });

      child.on('close', (code) => {
        resolve({ exitCode: code || 0 });
      });

      child.on('error', () => {
        resolve({ exitCode: 1 });
      });
    });
  }
}
