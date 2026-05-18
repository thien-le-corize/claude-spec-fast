import { Command } from 'commander';
import path from 'path';
import { SpecManager } from '../services/spec-manager.js';
import { TaskRunner } from '../services/task-runner.js';
import { ChangelogManager } from '../services/changelog-manager.js';
import { FileManager } from '../services/file-manager.js';
import { logger } from '../ui/logger.js';
import { createSpinner } from '../ui/spinner.js';
import { confirmAction, selectModules } from '../ui/prompts.js';
import { SPECS_DIR } from '../constants.js';
import { SpecNotFoundError, TasksNotFoundError } from '../errors.js';

export function createSpecCommand() {
  const cmd = new Command('spec')
    .description('Manage spec-driven development workflow');

  // spec requirements <name> [--force]
  cmd
    .command('requirements <name>')
    .description('Create requirements.md for a spec')
    .option('-f, --force', 'Overwrite existing file')
    .action(async (name, options) => {
      const projectDir = process.cwd();
      const specManager = new SpecManager(projectDir);

      if (await specManager.documentExists(name, 'requirements')) {
        if (!options.force) {
          logger.warn(`requirements.md already exists for "${name}". Use --force to overwrite.`);
          return;
        }
      }

      const content = generateRequirementsTemplate(name);
      const filePath = await specManager.createDocument(name, 'requirements', content);
      logger.success(`Created ${path.relative(projectDir, filePath)}`);
    });

  // spec design <name> [--force]
  cmd
    .command('design <name>')
    .description('Create design.md for a spec')
    .option('-f, --force', 'Overwrite existing file')
    .action(async (name, options) => {
      const projectDir = process.cwd();
      const specManager = new SpecManager(projectDir);

      if (await specManager.documentExists(name, 'design')) {
        if (!options.force) {
          logger.warn(`design.md already exists for "${name}". Use --force to overwrite.`);
          return;
        }
      }

      const content = generateDesignTemplate(name);
      const filePath = await specManager.createDocument(name, 'design', content);
      logger.success(`Created ${path.relative(projectDir, filePath)}`);
    });

  // spec plan <name> [--force]
  cmd
    .command('plan <name>')
    .description('Create plan.md for a spec')
    .option('-f, --force', 'Overwrite existing file')
    .action(async (name, options) => {
      const projectDir = process.cwd();
      const specManager = new SpecManager(projectDir);

      if (await specManager.documentExists(name, 'plan')) {
        if (!options.force) {
          logger.warn(`plan.md already exists for "${name}". Use --force to overwrite.`);
          return;
        }
      }

      const content = generatePlanTemplate(name);
      const filePath = await specManager.createDocument(name, 'plan', content);
      logger.success(`Created ${path.relative(projectDir, filePath)}`);
    });

  // spec task <name> [--force]
  cmd
    .command('task <name>')
    .description('Create tasks.md for a spec')
    .option('-f, --force', 'Overwrite existing file')
    .action(async (name, options) => {
      const projectDir = process.cwd();
      const specManager = new SpecManager(projectDir);

      if (await specManager.documentExists(name, 'tasks')) {
        if (!options.force) {
          logger.warn(`tasks.md already exists for "${name}". Use --force to overwrite.`);
          return;
        }
      }

      const content = generateTasksTemplate(name);
      const filePath = await specManager.createDocument(name, 'tasks', content);
      logger.success(`Created ${path.relative(projectDir, filePath)}`);
    });

  // spec execute <name> [--next] [--done] [--complete] [--all]
  cmd
    .command('execute [name]')
    .description('Execute spec tasks')
    .option('--next', 'Start next pending task (global if no name)')
    .option('--done', 'Mark current in-progress task as done')
    .option('--complete', 'Mark task as complete and log to changelog')
    .option('--all', 'Show all tasks with status')
    .action(async (name, options) => {
      const projectDir = process.cwd();
      const taskRunner = new TaskRunner(projectDir);
      const specManager = new SpecManager(projectDir);
      const changelogManager = new ChangelogManager(projectDir);

      if (options.next && !name) {
        // Global --next: read global tasks.md, find first pending, create child spec
        const globalTasksPath = path.join(projectDir, SPECS_DIR, 'tasks.md');
        const fileManager = new FileManager();

        if (!(await fileManager.fileExists(globalTasksPath))) {
          throw new TasksNotFoundError('global');
        }

        const nextTask = await taskRunner.getNextPending(null);
        if (!nextTask) {
          logger.success('All global tasks are complete!');
          return;
        }

        // Create child spec folder
        const childName = nextTask.description.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const childDir = path.join(projectDir, SPECS_DIR, childName);

        if (!(await fileManager.dirExists(childDir))) {
          await fileManager.ensureDir(childDir);
          await specManager.createDocument(childName, 'requirements', generateRequirementsTemplate(childName));
          await specManager.createDocument(childName, 'design', generateDesignTemplate(childName));
          await specManager.createDocument(childName, 'tasks', generateTasksTemplate(childName));
          await specManager.createDocument(childName, 'changelog', `# Changelog — ${childName}\n\n`);
        }

        // Mark task as in-progress in global tasks.md
        await taskRunner.updateTaskStatus(null, nextTask.id, 'in-progress');

        logger.success(`Started task ${nextTask.id}: ${nextTask.description}`);
        logger.info(`Child spec created: ${SPECS_DIR}/${childName}/`);
        return;
      }

      if (options.next && name) {
        // Named spec --next
        if (!(await specManager.specExists(name))) {
          throw new SpecNotFoundError(name);
        }

        const nextTask = await taskRunner.getNextPending(name);
        if (!nextTask) {
          logger.success(`All tasks in "${name}" are complete!`);
          return;
        }

        await taskRunner.updateTaskStatus(name, nextTask.id, 'in-progress');
        logger.success(`Started task ${nextTask.id}: ${nextTask.description}`);
        return;
      }

      if (options.done) {
        const specName = name || null;
        const current = await taskRunner.getCurrentInProgress(specName);

        if (!current) {
          logger.warn('No task currently in-progress.');
          return;
        }

        await taskRunner.updateTaskStatus(specName, current.id, 'done');
        logger.success(`Completed task ${current.id}: ${current.description}`);

        // Log to changelog if spec name provided
        if (name) {
          await changelogManager.append(name, {
            taskId: current.id,
            description: current.description,
          });
        }
        return;
      }

      if (options.complete) {
        const specName = name || null;
        const current = await taskRunner.getCurrentInProgress(specName);

        if (!current) {
          logger.warn('No task currently in-progress.');
          return;
        }

        await taskRunner.updateTaskStatus(specName, current.id, 'done');
        if (name) {
          await changelogManager.append(name, {
            taskId: current.id,
            description: current.description,
            message: `Task ${current.id} completed: ${current.description}`,
          });
        }
        logger.success(`Completed and logged task ${current.id}: ${current.description}`);
        return;
      }

      if (options.all || (!options.next && !options.done && !options.complete)) {
        // Show all tasks
        const specName = name || null;
        let tasks;
        try {
          tasks = await taskRunner.parseTasks(specName);
        } catch {
          const label = name || 'global';
          throw new TasksNotFoundError(label);
        }

        if (tasks.length === 0) {
          logger.info('No tasks found.');
          return;
        }

        logger.newline();
        logger.info(`Tasks${name ? ` for "${name}"` : ' (global)'}:`);
        logger.newline();

        for (const task of tasks) {
          const icon = task.status === 'done' ? '✓' : task.status === 'in-progress' ? '▶' : '○';
          logger.plain(`  ${icon} ${task.id} ${task.description} [${task.status}]`);
        }

        const progress = await taskRunner.getProgress(specName);
        logger.newline();
        logger.plain(`  Progress: ${progress.done}/${progress.total} done, ${progress.inProgress} in-progress, ${progress.pending} pending`);
        logger.newline();
      }
    });

  // spec status <name> [--verbose]
  cmd
    .command('status <name>')
    .description('Show spec status and progress')
    .option('-v, --verbose', 'Show detailed task list')
    .action(async (name, options) => {
      const projectDir = process.cwd();
      const specManager = new SpecManager(projectDir);
      const taskRunner = new TaskRunner(projectDir);

      if (!(await specManager.specExists(name))) {
        throw new SpecNotFoundError(name);
      }

      const docs = await specManager.getSpecDocuments(name);
      const progress = await taskRunner.getProgress(name);

      logger.newline();
      logger.info(`Spec: ${name}`);
      logger.newline();

      // Documents
      logger.plain('  Documents:');
      for (const doc of docs) {
        const icon = doc.exists ? '✓' : '○';
        logger.plain(`    ${icon} ${doc.name}`);
      }
      logger.newline();

      // Progress
      if (progress.total > 0) {
        const pct = Math.round((progress.done / progress.total) * 100);
        const bar = '█'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10));
        logger.plain(`  Progress: ${bar} ${pct}% (${progress.done}/${progress.total})`);
        logger.plain(`  In-progress: ${progress.inProgress} | Pending: ${progress.pending}`);
      } else {
        logger.plain('  No tasks defined yet.');
      }
      logger.newline();

      // Verbose: show task list
      if (options.verbose && progress.total > 0) {
        const tasks = await taskRunner.parseTasks(name);
        logger.plain('  Tasks:');
        for (const task of tasks) {
          const icon = task.status === 'done' ? '✓' : task.status === 'in-progress' ? '▶' : '○';
          logger.plain(`    ${icon} ${task.id} ${task.description} [${task.status}]`);
        }
        logger.newline();
      }
    });

  // spec list
  cmd
    .command('list')
    .description('List all specs')
    .action(async () => {
      const projectDir = process.cwd();
      const specManager = new SpecManager(projectDir);

      const specs = await specManager.listSpecs();

      if (specs.length === 0) {
        logger.info('No specs found. Create one with `csf spec create "<description>"`');
        return;
      }

      logger.newline();
      logger.info('Specs:');
      logger.newline();

      for (const spec of specs) {
        const progress = spec.completion !== null ? `${spec.completion}%` : 'no tasks';
        logger.plain(`  • ${spec.name.padEnd(30)} ${progress}`);
      }
      logger.newline();
    });

  // spec changelog <name> [--add <msg>] [--clear]
  cmd
    .command('changelog <name>')
    .description('View or manage spec changelog')
    .option('-a, --add <message>', 'Add an entry to the changelog')
    .option('--clear', 'Clear the changelog')
    .action(async (name, options) => {
      const projectDir = process.cwd();
      const specManager = new SpecManager(projectDir);
      const changelogManager = new ChangelogManager(projectDir);

      if (!(await specManager.specExists(name))) {
        throw new SpecNotFoundError(name);
      }

      if (options.clear) {
        const confirmed = await confirmAction(`Clear changelog for "${name}"?`);
        if (!confirmed) {
          logger.info('Aborted.');
          return;
        }
        await changelogManager.clear(name);
        logger.success(`Changelog cleared for "${name}".`);
        return;
      }

      if (options.add) {
        await changelogManager.append(name, {
          description: options.add,
          message: options.add,
        });
        logger.success(`Added entry to ${name}/changelog.md`);
        return;
      }

      // Show changelog
      const entries = await changelogManager.read(name);

      if (entries.length === 0) {
        logger.info(`No changelog entries for "${name}".`);
        return;
      }

      logger.newline();
      logger.info(`Changelog — ${name}:`);
      logger.newline();

      for (const entry of entries) {
        logger.plain(`  [${entry.timestamp}] ${entry.title}`);
        if (entry.description) {
          logger.plain(`    ${entry.description}`);
        }
      }
      logger.newline();
    });

  // spec create "<description>" [--interactive] [--force]
  cmd
    .command('create <description>')
    .description('Create a new spec from description')
    .option('-i, --interactive', 'Interactively confirm modules')
    .option('-f, --force', 'Overwrite existing global spec files')
    .action(async (description, options) => {
      const projectDir = process.cwd();
      const specManager = new SpecManager(projectDir);
      const fileManager = new FileManager();

      // Parse description to identify modules
      let modules = parseModules(description);

      if (options.interactive && modules.length > 1) {
        modules = await selectModules(modules);
      }

      // Check if global spec files exist
      if (await specManager.globalDocumentExists('requirements')) {
        if (!options.force) {
          logger.warn('Global spec files already exist. Use --force to overwrite.');
          return;
        }
      }

      const spinner = createSpinner('Generating spec documents...');
      spinner.start();

      // Generate global requirements.md
      const requirementsContent = generateGlobalRequirements(description, modules);
      await specManager.createGlobalDocument('requirements', requirementsContent);

      // Generate global design.md
      const designContent = generateGlobalDesign(description, modules);
      await specManager.createGlobalDocument('design', designContent);

      // Generate global tasks.md
      const tasksContent = generateGlobalTasks(modules);
      await specManager.createGlobalDocument('tasks', tasksContent);

      spinner.succeed('Spec documents created!');
      logger.newline();
      logger.success(`Created global spec at ${SPECS_DIR}/`);
      logger.plain(`  • requirements.md`);
      logger.plain(`  • design.md`);
      logger.plain(`  • tasks.md`);

      if (modules.length > 0) {
        logger.newline();
        logger.info(`Modules identified (${modules.length}):`);
        for (const mod of modules) {
          logger.plain(`  • ${mod}`);
        }
      }
      logger.newline();
      logger.info('Next: run `csf spec execute --next` to start the first task.');
    });

  return cmd;
}

// --- Template generators ---

function generateRequirementsTemplate(name) {
  return `# Requirements — ${name}

## Overview
<!-- Describe what this module/feature does -->

## Functional Requirements
- [ ] FR-1: 
- [ ] FR-2: 
- [ ] FR-3: 

## Non-Functional Requirements
- [ ] NFR-1: Performance — 
- [ ] NFR-2: Security — 
- [ ] NFR-3: Accessibility — 

## Acceptance Criteria
- [ ] AC-1: 
- [ ] AC-2: 
- [ ] AC-3: 

## Dependencies
- None

## Notes
- 
`;
}

function generateDesignTemplate(name) {
  return `# Design — ${name}

## Architecture
<!-- Describe the architecture approach -->

## Components
| Component | Responsibility |
|-----------|---------------|
|           |               |

## Data Flow
<!-- Describe how data flows through the system -->

## API / Interface
<!-- Define the public API or interface -->

## Error Handling
<!-- Describe error handling strategy -->

## Testing Strategy
- Unit tests: 
- Integration tests: 
- E2E tests: 

## Notes
- 
`;
}

function generatePlanTemplate(name) {
  return `# Plan — ${name}

## Phases

### Phase 1: Setup
- [ ] 

### Phase 2: Core Implementation
- [ ] 

### Phase 3: Testing
- [ ] 

### Phase 4: Polish & Documentation
- [ ] 

## Timeline
| Phase | Estimated Duration |
|-------|-------------------|
| Setup | |
| Core  | |
| Test  | |
| Polish| |

## Risks
- 

## Notes
- 
`;
}

function generateTasksTemplate(name) {
  return `# Tasks — ${name}

| ID | Description | Status | Notes |
|----|-------------|--------|-------|
| 1  | Setup project structure | pending | |
| 2  | Implement core logic | pending | |
| 3  | Add error handling | pending | |
| 4  | Write tests | pending | |
| 5  | Documentation | pending | |
`;
}

function parseModules(description) {
  // Split by commas, semicolons, "and", or newlines
  const separators = /[,;\n]|\band\b/gi;
  const parts = description.split(separators)
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.length < 100);

  if (parts.length <= 1) {
    return [description.trim()];
  }

  return parts;
}

function generateGlobalRequirements(description, modules) {
  let content = `# Requirements — Project Spec

## Overview
${description}

## Modules
`;

  for (let i = 0; i < modules.length; i++) {
    content += `### Module ${i + 1}: ${modules[i]}\n`;
    content += `- [ ] Define requirements\n`;
    content += `- [ ] Define acceptance criteria\n\n`;
  }

  content += `## Non-Functional Requirements
- [ ] NFR-1: Performance
- [ ] NFR-2: Security
- [ ] NFR-3: Maintainability

## Notes
- Generated by csf spec create
`;

  return content;
}

function generateGlobalDesign(description, modules) {
  let content = `# Design — Project Spec

## Overview
${description}

## Architecture
<!-- High-level architecture for the entire project -->

## Module Breakdown
`;

  for (let i = 0; i < modules.length; i++) {
    content += `### ${modules[i]}\n`;
    content += `- Responsibility: \n`;
    content += `- Dependencies: \n\n`;
  }

  content += `## Integration Points
<!-- How modules connect to each other -->

## Notes
- Generated by csf spec create
`;

  return content;
}

function generateGlobalTasks(modules) {
  let content = `# Tasks — Project Spec

| ID | Description | Status | Notes |
|----|-------------|--------|-------|
`;

  for (let i = 0; i < modules.length; i++) {
    content += `| ${i + 1} | ${modules[i]} | pending | |\n`;
  }

  return content;
}
