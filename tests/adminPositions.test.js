import test from 'node:test';
import assert from 'node:assert/strict';
import { positionList } from '../src/api/adminPositions.js';
import { API_ENDPOINTS } from '../src/api/endpoints.js';

test('position endpoint uses GET /getAllPositions', () => {
  assert.deepEqual(API_ENDPOINTS.positions.getAll, { method: 'GET', path: '/getAllPositions' });
});

test('position responses retain backend IDs without static fallback options', () => {
  const records = [{ id: 42, name: 'Warehouse' }, { position_id: 77, position_name: 'Tailor' }];
  for (const payload of [records, { data: records }, { positions: records }, { data: { positions: records } }, { data: { data: records } }]) {
    assert.deepEqual(positionList(payload), [
      { id: '42', nameKh: 'Warehouse', nameEn: '' },
      { id: '77', nameKh: 'Tailor', nameEn: '' },
    ]);
  }
  assert.deepEqual(positionList({ data: [] }), []);
  assert.throws(() => positionList({ message: 'Unexpected response' }));
});

test('position options deduplicate IDs and omit invalid IDs', () => {
  assert.deepEqual(positionList([{ id: 42, name: 'Old' }, { id: '042', nameKh: 'Updated' }, { name: 'Missing ID' }, { id: 0, name: 'Invalid' }]), [
    { id: '42', nameKh: 'Updated', nameEn: '' },
  ]);
});
