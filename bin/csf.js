#!/usr/bin/env node

// Node.js version check
const [major] = process.versions.node.split('.').map(Number);
if (major < 18) {
  console.error(`Error: Node.js >= 18.0.0 required. Current: ${process.version}`);
  process.exit(1);
}

// Import and run CLI
import('../src/index.js').then(({ run }) => run());
