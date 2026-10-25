import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse, compileStyle } from '@vue/compiler-sfc';
import { applyTheme } from '../src/utils/theme.js';

test('workspace dark mode can be switched off on login without refreshing', () => {
  const root = new Set();
  const body = new Set();
  const saved = new Map();
  const classList = set => ({ toggle(name, enabled) { enabled ? set.add(name) : set.delete(name); } });
  const environment = {
    storage: { setItem: (key, value) => saved.set(key, value) },
    document: { documentElement: { classList: classList(root) }, body: { classList: classList(body) } },
  };
  for (const theme of ['dark', 'light', 'dark', 'light']) {
    applyTheme(theme, environment);
    assert.equal(root.has('dark'), theme === 'dark');
    assert.equal(body.has('dark'), theme === 'dark');
    assert.equal(saved.get('app_theme'), theme);
  }
});

test('component dark styles cannot leak warning colors onto the root theme', () => {
  function inspect(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) inspect(path);
      else if (path.endsWith('.vue')) {
        const { descriptor } = parse(readFileSync(path, 'utf8'));
        for (const style of descriptor.styles) {
          const result = compileStyle({ source: style.content, filename: path, id: 'data-v-theme-test', scoped: style.scoped });
          assert.equal(result.errors.length, 0, path);
          assert.doesNotMatch(result.code, /(?:^|[},])\s*\.dark\s*\{/m, `${path} must target a component, not the whole dark theme`);
        }
      }
    }
  }
  inspect('src');
});
