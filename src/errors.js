export class CLIError extends Error {
  constructor(message, exitCode = 1) {
    super(message);
    this.name = 'CLIError';
    this.exitCode = exitCode;
  }
}

export class PermissionError extends CLIError {
  constructor(filePath) {
    super(`Permission denied: ${filePath}\nTry running with elevated privileges (sudo).`);
    this.name = 'PermissionError';
  }
}

export class ConfigNotFoundError extends CLIError {
  constructor() {
    super('No .claude configuration found.\nRun `csf init` to create one.');
    this.name = 'ConfigNotFoundError';
  }
}

export class InvalidCategoryError extends CLIError {
  constructor(category, validCategories) {
    super(`Invalid category: "${category}"\nValid categories: ${validCategories.join(', ')}`);
    this.name = 'InvalidCategoryError';
  }
}

export class ItemNotFoundError extends CLIError {
  constructor(item, category, availableItems) {
    super(`Item "${item}" not found in ${category}.\nAvailable: ${availableItems.join(', ')}`);
    this.name = 'ItemNotFoundError';
  }
}

export class SpecNotFoundError extends CLIError {
  constructor(specName) {
    super(`Spec "${specName}" not found.\nRun \`csf spec requirements ${specName}\` to create one.`);
    this.name = 'SpecNotFoundError';
  }
}

export class TasksNotFoundError extends CLIError {
  constructor(specName) {
    super(`No tasks.md found for spec "${specName}".\nRun \`csf spec task ${specName}\` to create one.`);
    this.name = 'TasksNotFoundError';
  }
}

export class TestRunnerNotFoundError extends CLIError {
  constructor() {
    super('No test runner detected.\nSupported: vitest, jest.\nAdd a "test" script to package.json.');
    this.name = 'TestRunnerNotFoundError';
  }
}
