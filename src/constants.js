export const CATEGORIES = {
  agents: {
    dir: 'agents',
    items: [
      'frontend', 'backend', 'systems-architect', 'code-reviewer',
      'test-engineer', 'security-auditor', 'qa', 'project-manager',
      'ui-ux-designer', 'copywriter-seo',
    ],
  },
  commands: {
    dir: 'commands',
    items: [
      'spec', 'plan', 'build', 'test', 'review',
      'deploy', 'debug', 'simplify', 'fix-issue',
    ],
  },
  rules: {
    dir: 'rules',
    items: [
      'clean-code', 'code-style', 'error-handling', 'tech-stack',
      'system-design', 'project-structure', 'api-conventions',
      'naming-conventions', 'database', 'security', 'monitoring',
      'testing', 'git-workflow', 'frontend',
    ],
  },
  skills: {
    dir: 'skills',
    items: ['tdd', 'code-review', 'incremental-implementation', 'deploy', 'security-review'],
  },
  references: {
    dir: 'references',
    items: [
      'security-checklist', 'testing-patterns',
      'performance-checklist', 'accessibility-checklist',
    ],
  },
};

export const VALID_CATEGORIES = Object.keys(CATEGORIES);

export const PRESETS = {
  'Full Stack': null, // null means select all
  'Frontend Only': {
    agents: ['frontend', 'ui-ux-designer', 'code-reviewer', 'test-engineer'],
    commands: ['spec', 'plan', 'build', 'test', 'review'],
    rules: ['clean-code', 'code-style', 'frontend', 'testing', 'git-workflow'],
    skills: ['tdd', 'code-review'],
    references: ['performance-checklist', 'accessibility-checklist'],
  },
  'Backend Only': {
    agents: ['backend', 'systems-architect', 'code-reviewer', 'security-auditor'],
    commands: ['spec', 'plan', 'build', 'test', 'review', 'deploy'],
    rules: ['clean-code', 'code-style', 'error-handling', 'api-conventions', 'database', 'security', 'testing'],
    skills: ['tdd', 'code-review', 'security-review'],
    references: ['security-checklist', 'testing-patterns'],
  },
  'Minimal': {
    agents: ['code-reviewer', 'test-engineer'],
    commands: ['build', 'test', 'review'],
    rules: ['clean-code', 'code-style', 'git-workflow'],
    skills: ['tdd'],
    references: ['testing-patterns'],
  },
};

export const SPEC_DOCUMENTS = ['requirements.md', 'design.md', 'plan.md', 'tasks.md', 'changelog.md'];

export const CLAUDE_DIR = '.claude';
export const SPECS_DIR = '.claude/specs';
