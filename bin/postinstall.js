#!/usr/bin/env node

const logo = `
\x1b[37m
   ██████╗  ██████╗ ██████╗ ██╗███████╗███████╗██╗   ██╗███╗   ██╗
  ██╔════╝ ██╔═══██╗██╔══██╗██║╚══███╔╝██╔════╝██║   ██║████╗  ██║
  ██║      ██║   ██║██████╔╝██║  ███╔╝ █████╗  ██║   ██║██╔██╗ ██║
  ██║      ██║   ██║██╔══██╗██║ ███╔╝  ██╔══╝  ╚██╗ ██╔╝██║╚██╗██║
  ╚██████╗ ╚██████╔╝██║  ██║██║███████╗███████╗ ╚████╔╝ ██║ ╚████║
   ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝╚══════╝╚══════╝  ╚═══╝  ╚═╝  ╚═══╝
\x1b[0m
\x1b[33m  Claude Spec Fast CLI v1.2.2\x1b[0m
\x1b[90m  ─────────────────────────────────────────\x1b[0m
\x1b[32m  ✓ Installed successfully!\x1b[0m

  Get started:
    \x1b[36mcsf init\x1b[0m              Scaffold .claude/ config
    \x1b[36mcsf spec create ""\x1b[0m    Generate full spec
    \x1b[36mcsf --help\x1b[0m            Show all commands

\x1b[90m  github.com/thien-le-corize/claude-spec-fast\x1b[0m
`;

console.log(logo);
