import test from 'node:test';
import assert from 'node:assert/strict';
import { newestLeaveRequests, splitLeaveRequests } from '../src/api/leaveRequestHistory.js';

test('main list keeps the latest submission per employee and previous requests go to history', () => {
  const rows = [
    { id: '1', employeeId: '16', created_at: '2026-10-23', startDate: '2026-12-01' },
    { id: '2', employeeId: '16', created_at: '2026-10-24', startDate: '2026-10-25' },
    { id: '3', employeeId: '17', created_at: '2026-10-24' },
  ];
  const { recent, history } = splitLeaveRequests(rows);
  assert.deepEqual(recent.map(row => row.id), ['3', '2']);
  assert.deepEqual(history.map(row => row.id), ['1']);
  assert.deepEqual(rows.map(row => row.id), ['1', '2', '3']);
});

test('history sorting handles equal timestamps, empty lists and missing employee IDs', () => {
  assert.deepEqual(splitLeaveRequests([]), { recent: [], history: [] });
  assert.equal(splitLeaveRequests([{ id: 1 }, { id: 2 }]).recent.length, 2);
  assert.deepEqual(newestLeaveRequests([{ id: 1, createdAt: 'bad' }, { id: 2, createdAt: 'bad' }]).map(row => row.id), [2, 1]);
  assert.equal(splitLeaveRequests([{ id: 1, user_id: 16 }, { id: 2, employeeId: '16' }]).history.length, 1);
});
