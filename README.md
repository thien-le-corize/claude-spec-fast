# @jack96dev/claude-spec-fast

<div align="center">
  <h3>🚀 Claude Spec Fast CLI</h3>
  <p>Scaffold production-grade .claude AI agent configurations with spec-driven development workflow</p>

  ![Version](https://img.shields.io/badge/version-1.0.0-blue?style=flat-square)
  ![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green?style=flat-square)
  ![License](https://img.shields.io/badge/license-MIT-yellow?style=flat-square)
</div>

---

## Installation

```bash
npm install -g @jack96dev/claude-spec-fast
```

## Quick Start

```bash
# Initialize .claude/ configuration in your project
csf init

# Create a full spec from a description
csf spec create "E-commerce platform with auth, products, cart, payment"

# Start executing tasks (creates child specs lazily)
csf spec execute --next

# Mark current task as done
csf spec execute auth --done

# Check progress
csf spec status auth

# Run tests
csf test

# Code review
csf review
```

## Commands

### Configuration Management

| Command | Description |
|---------|-------------|
| `csf init` | Scaffold .claude/ directory with all configurations |
| `csf init --interactive` | Choose preset and select items interactively |
| `csf list [category]` | List categories or items within a category |
| `csf add <category> <item>` | Add a single item from templates |
| `csf remove <category> <item>` | Remove an item from configuration |
| `csf update` | Update outdated files to latest templates |
| `csf doctor` | Validate configuration health |
| `csf config get <key>` | Get a configuration value |
| `csf config set <key> <value>` | Set a configuration value |

### Spec Workflow

| Command | Description |
|---------|-------------|
| `csf spec create "<desc>"` | Generate global spec (requirements, design, tasks) |
| `csf spec requirements <name>` | Create requirements.md for a spec |
| `csf spec design <name>` | Create design.md for a spec |
| `csf spec plan <name>` | Create plan.md for a spec |
| `csf spec task <name>` | Create tasks.md for a spec |
| `csf spec execute --next` | Start next pending task (creates child spec) |
| `csf spec execute <name> --done` | Mark current task as done |
| `csf spec status <name>` | Show spec progress |
| `csf spec list` | List all specs with completion % |
| `csf spec changelog <name>` | View changelog |

### Dev Workflow

| Command | Description |
|---------|-------------|
| `csf test` | Detect and run project tests |
| `csf test --watch` | Run tests in watch mode |
| `csf review` | Five-axis code review checklist |
| `csf review --spec <name> --save` | Review with spec compliance |

## Spec Workflow

The spec workflow uses a **global + lazy child** architecture:

```
.claude/specs/
├── requirements.md          ← Global requirements
├── design.md                ← System design
├── tasks.md                 ← Master task list (1 task = 1 module)
│
├── auth/                    ← Created when "csf spec execute --next" picks auth
│   ├── requirements.md
│   ├── design.md
│   ├── tasks.md
│   └── changelog.md
│
└── products/                ← Created when auth is done and next is called
    └── ...
```

**Benefits:**
- Only load context for the module you're working on
- Child specs created on-demand (lazy)
- Progress tracked at both module and project level

## Presets

When using `csf init --interactive`:

| Preset | Description |
|--------|-------------|
| Full Stack | All agents, commands, rules, skills, references |
| Frontend Only | Frontend-focused subset |
| Backend Only | Backend-focused subset |
| Minimal | Essential items only (≤3 per category) |

## Categories

| Category | Items |
|----------|-------|
| agents | 10 specialized AI agents |
| commands | 9 slash commands |
| rules | 14 mandatory coding rules |
| skills | 5 advanced skills |
| references | 4 quick checklists |

## Author

**jack96dev**

- 📦 npm: [@jack96devcodon/claude-spec-fast](https://www.npmjs.com/package/@jack96devcodon/claude-spec-fast)
- 🐙 GitHub: [github.com/thien-le-corize/claude-spec-fast](https://github.com/thien-le-corize/claude-spec-fast)

## License

MIT
