import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPositionOptions, defaultUserDepartment, mergePositionOptions, positionsForDepartment } from '../src/data/positionOptions.js';

test('create defaults to the first department with actual positions', () => {
  const departments = [{ id: 1 }, { id: 3 }, { id: 4 }];
  const positions = [{ id: '8', departmentId: '3' }, { id: '9', departmentId: '4' }];
  assert.equal(defaultUserDepartment(departments, positions), '3');
  assert.equal(defaultUserDepartment(departments, []), '');
  assert.equal(defaultUserDepartment(departments, [], 'MANAGER'), '1');
  assert.deepEqual(positionsForDepartment(positions, 4).map(item => item.id), ['9']);
  assert.deepEqual(positionsForDepartment(positions, ''), []);
});

test('catalogue ownership can be enriched without restoring deleted positions', () => {
  const departments = [{ id: 3, positions: [{ id: 8, name: 'Old' }, { id: 9, name: 'Deleted' }] }];
  assert.deepEqual(mergePositionOptions([{ id: '8', nameKh: 'Current' }], departments), [{ id: '8', nameKh: 'Current', nameEn: '', departmentId: '3' }]);
});

test('position options do not resurrect deleted positions from a static catalogue', () => {
  assert.deepEqual(buildPositionOptions(), []);
  assert.deepEqual(buildPositionOptions([{ id: '4', positions: [{ positionId: 42, name: 'Engineer' }] }]).map(row => row.id), ['42']);
});

test('API position names override fallback labels and duplicate IDs produce one option', () => {
  const options = buildPositionOptions([
    { positions: [{ id: 1, name: 'Warehouse supervisor' }], employees: [{ position_id: 2, position_name: 'Warehouse staff' }] },
  ], [{ position: { id: 1, name: 'Old supervisor name' } }, { positionId: '13', positionKh: 'New position' }]);
  assert.equal(options.find((item) => item.id === '1').nameKh, 'Warehouse supervisor');
  assert.equal(options.find((item) => item.id === '2').nameKh, 'Warehouse staff');
  assert.equal(options.find((item) => item.id === '13').nameKh, 'New position');
  assert.equal(options.filter((item) => item.id === '1').length, 1);
});
