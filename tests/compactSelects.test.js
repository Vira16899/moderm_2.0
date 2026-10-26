import test from 'node:test';
import assert from 'node:assert/strict';
import { selectPopupPosition } from '../src/utils/compactSelects.js';

test('shared select menus stay compact and fit narrow screens', () => {
  const position = selectPopupPosition({ left:280, top:100, bottom:148, width:300 },390,800);
  assert.equal(position.height,220);
  assert.ok(position.left >= 8);
  assert.ok(position.left + position.width <= 382);
  assert.equal(position.top,154);
});

test('shared select menus open above their control near the bottom of the screen', () => {
  const position = selectPopupPosition({ left:24, top:620, bottom:668, width:300 },1024,720);
  assert.equal(position.height,220);
  assert.ok(position.top + position.height < 620);
  assert.ok(position.top >= 8);
});
