import { confirm, checkbox, select } from '@inquirer/prompts';

export async function confirmOverwrite(filename) {
  return confirm({
    message: `${filename} already exists. Overwrite?`,
    default: false,
  });
}

export async function confirmAction(message) {
  return confirm({ message, default: false });
}

export async function selectPreset(presets) {
  return select({
    message: 'Choose a preset:',
    choices: Object.keys(presets).map(name => ({ name, value: name })),
  });
}

export async function selectItems(category, items) {
  return checkbox({
    message: `Select ${category}:`,
    choices: items.map(item => ({ name: item, value: item, checked: true })),
  });
}

export async function selectModules(modules) {
  return checkbox({
    message: 'Confirm modules to include:',
    choices: modules.map(m => ({ name: m, value: m, checked: true })),
  });
}
