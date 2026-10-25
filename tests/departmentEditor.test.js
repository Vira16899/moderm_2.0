import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { departmentBody, departmentDetail, validateDepartmentDraft, editorPositions, positionsForEditor, deletePositionAndVerify, positionBody, positionFingerprint, savePositionRows } from '../src/api/departmentEditor.js';

test('department deletion and updates send the backend-required id JSON field', async () => {
  const apiUrl = new URL('../src/api/admin.api.js', import.meta.url);
  const source = (await readFile(apiUrl, 'utf8'))
    .replace("import { apiRequest } from './client';", 'const apiRequest = async (endpoint, options) => ({ endpoint, ...options });')
    .replace(/from '(\.\/[^']+)'/g, (_match, path) => `from '${new URL(path.endsWith('.js') ? path : `${path}.js`, apiUrl).href}'`);
  const { adminApi } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  const request = await adminApi.deleteDepartment('14');
  assert.deepEqual(request.endpoint, { method: 'DELETE', path: '/deleteDepartment' });
  assert.deepEqual(request.body, { id: 14 });
  assert.equal(Object.hasOwn(request.body, 'departmentId'), false);
  assert.throws(() => adminApi.deleteDepartment(''));
  const update = await adminApi.updateDepartment({ departmentId: '14', name: 'Engineering', description: 'Updated description', positions: [{ positionId: '8', name: 'Senior Developer', description: 'Build software' }, { name: 'Designer', description: 'Design products' }], deletedPositionIds: ['9'] });
  assert.deepEqual(update.endpoint, { method: 'PUT', path: '/updateDepartment' });
  assert.deepEqual(update.body, { id: 14, user_id: null, name: 'Engineering', description: 'Updated description', positions: [{ positionId: '8', name: 'Senior Developer', description: 'Build software' }, { name: 'Designer', description: 'Design products' }], deletedPositionIds: ['9'] });
  const assignment = await adminApi.updateDepartment({ id: '14', nameKh: 'Engineering', descriptionKh: 'Updated description' }, '6');
  assert.deepEqual(assignment.body, { id: 14, name: 'Engineering', description: 'Updated description', user_id: 6 });
  assert.equal(Object.hasOwn(update.body, 'departmentId'), false);
  assert.equal(Object.hasOwn(assignment.body, 'departmentId'), false);
  const created = await adminApi.createDepartment({ name: 'Engineering', description: 'Software', user_id: '6', positions: [{ name: 'Developer', description: 'Build software' }] });
  assert.deepEqual(created.body, { name: 'Engineering', description: 'Software', user_id: 6, positions: [{ name: 'Developer', description: 'Build software' }] });
  assert.deepEqual((await adminApi.deletePosition('8', '14')).body, { id: 8 });
  const removal = await adminApi.removeEmployeeFromDepartment('1', '3');
  assert.deepEqual(removal.endpoint, {method:'DELETE',path:'/removeEmployeeFromDepartment'});
  assert.deepEqual(removal.body, {department_id:1,user_id:3});
  assert.throws(() => adminApi.removeEmployeeFromDepartment('', '3'));
  assert.deepEqual((await adminApi.getPosition('8')).body, { id: 8 });
  assert.deepEqual((await adminApi.getDepartment('14')).body, { id: 14 });
  assert.equal((await adminApi.getDepartment('14')).query, undefined);
  assert.throws(() => adminApi.getDepartment(''));
  assert.deepEqual((await adminApi.createPosition({ name: ' Developer ', description: ' Build software ', department_id: '14' })).body, { name: 'Developer', description: 'Build software', department_id: 14 });
  assert.deepEqual((await adminApi.updatePosition({ positionId: '8', name: 'Developer', description: 'Build software', departmentId: '14' })).body, { id: 8, name: 'Developer', description: 'Build software', department_id: 14 });
  assert.deepEqual((await adminApi.updateDepartment({ id: '14', name: 'Engineering', description: 'Software', user_id: null })).body, { id: 14, name: 'Engineering', description: 'Software', user_id: null });
  for (const managerId of [null, '']) {
    assert.deepEqual((await adminApi.updateDepartment({ id:'14', name:'Engineering', description:'Software' },managerId)).body, {id:14,name:'Engineering',description:'Software',user_id:null});
  }

});

test('department details preserve an explicit empty employee list after removal',()=>{
  const result=departmentDetail({data:{id:1,name:'Department',employees:[]}},{id:1,nameKh:'Department',employees:[{id:3}]});
  assert.deepEqual(result.employees,[]);
  assert.equal(result.employeesProvided,true);
  const missing=departmentDetail({data:{id:1,name:'Department'}},{id:1,nameKh:'Department'});
  assert.equal(missing.employeesProvided,false);
  assert.equal(departmentDetail(missing,{id:1,nameKh:'Department'}).employeesProvided,false);
});

test('department details unwrap records and arrays without losing identity or manager fields', () => {
  const selected = { id: '14', code: 'QA', nameKh: 'Selected department', managerId: '6', managerNameKh: 'Previous manager' };
  for (const payload of [{ data: [{ id_department: 14, department_name: 'Warehouse', description: 'BB', user_id: 7 }] }, { data: { department: { departmentId: 14, name: 'Warehouse', description: 'BB', user_id: 7 } } }]) {
    const result = departmentDetail(payload, selected);
    assert.equal(result.id, '14'); assert.equal(result.nameKh, 'Warehouse'); assert.equal(result.descriptionKh, 'BB'); assert.equal(result.managerId, '7'); assert.equal(result.managerNameKh, '');
  }
  const partial = departmentDetail({ data: { description: 'BB' } }, selected);
  assert.equal(partial.id, '14'); assert.equal(partial.nameKh, selected.nameKh);
  const cleared = departmentDetail({ id: 14, name: 'Warehouse', user_id: null }, selected);
  assert.equal(cleared.managerId, ''); assert.equal(cleared.managerNameKh, '');
  assert.throws(() => departmentDetail({ data: [] }, selected));
  assert.throws(() => departmentDetail({ id: 99, name: 'Wrong department' }, selected));
  assert.throws(() => departmentDetail({ message: 'malformed' }, selected));
});

test('department payloads match nested create and update contracts and preserve server IDs', () => {
  const draft = { departmentId: 'dep-7', name: ' Engineering ', description: ' Software ', positions: [{ positionId: 'pos-9', name: ' Senior Frontend ', description: ' Build UI ' }, { name: 'DevOps', description: 'Operations' }], deletedPositionIds: ['pos-8'] };
  assert.deepEqual(departmentBody(draft, true), { departmentId: 'dep-7', user_id: null, name: 'Engineering', description: 'Software', positions: [{ positionId: 'pos-9', name: 'Senior Frontend', description: 'Build UI' }, { name: 'DevOps', description: 'Operations' }], deletedPositionIds: ['pos-8'] });
  assert.deepEqual(departmentBody({ name: 'Engineering', description: 'Software', positions: [{ name: 'Frontend', description: 'Build UI' }] }), { name: 'Engineering', description: 'Software', user_id: null, positions: [{ name: 'Frontend', description: 'Build UI' }] });
  assert.throws(() => departmentBody({ ...draft, departmentId: '' }, true));
});
test('department validation rejects required fields and duplicate normalized names', () => {
  const errors = validateDepartmentDraft({ name: '', description: '', positions: [{ name: '  FRONTEND   Developer ' }, { name: 'frontend developer' }, { name: '' }] });
  for (const key of ['name', 'description', 'position-0', 'position-1', 'position-2']) assert.ok(errors[key]);
  assert.deepEqual(validateDepartmentDraft({ name: 'Engineering', description: 'Software', positions: [{ name: 'Frontend', description: 'Build UI' }] }), {});
});
test('editor loads department positions and owned catalogue records without foreign positions', () => {
  const all = editorPositions({ data: [{ positionId: 'p1', departmentId: 'd1', name: 'Frontend' }, { id: 'p2', department_id: 'd2', name: 'Foreign' }] });
  assert.deepEqual(positionsForEditor({ id: 'd1', positions: [{ positionId: 'p1', name: 'Frontend updated' }, { id: 'p3', name: 'Backend' }] }, all), [{ positionId: 'p1', name: 'Frontend updated', description: undefined }, { positionId: 'p3', name: 'Backend', description: undefined }]);
  assert.throws(() => editorPositions({ message: 'malformed' }));
  assert.throws(() => positionsForEditor({ id: 'd1', positions: [{ name: 'Missing identity' }] }, []));
});
test('position deletion passes both IDs and verifies the refreshed relation', async () => {
  const calls = [];
  const api = { deletePosition: async (...ids) => { calls.push(ids); return { result: true }; }, getPositions: async () => ({ data: [] }), getDepartment: async () => ({ id: 'd1', positions: [], employees: [] }) };
  await deletePositionAndVerify(api, 'p1', 'd1');
  assert.deepEqual(calls, [['p1', 'd1']]);
});
test('failed cascading deletion stays visible and retry verifies without deleting twice', async () => {
  let deletes = 0, orphaned = true;
  const api = { deletePosition: async () => { deletes++; return { result: true }; }, getPositions: async () => [], getDepartment: async () => ({ positions: orphaned ? [{ positionId: 'p1', name: 'Frontend', description: 'Build UI' }] : [] }) };
  await assert.rejects(deletePositionAndVerify(api, 'p1', 'd1'), error => error.deletionAcknowledged === true && /backend/.test(error.message));
  orphaned = false;
  await deletePositionAndVerify(api, 'p1', 'd1', true);
  assert.equal(deletes, 1);
});
test('position deletion propagates API errors and rejects unverifiable or retained references', async () => {
  await assert.rejects(deletePositionAndVerify({ deletePosition: async () => { throw Error('Foreign key constraint'); } }, 1, 2), /Foreign key constraint/);
  const base = { deletePosition: async () => ({ result: true }), getPositions: async () => [], getDepartment: async () => ({}) };
  await assert.rejects(deletePositionAndVerify(base, 1, 2), error => error.deletionAcknowledged);
  await assert.rejects(deletePositionAndVerify({ ...base, getDepartment: async () => ({ positions: [], employees: [{ position_id: 1 }] }) }, 1, 2));
});

test('one-position request bodies match the backend and reject missing descriptions', () => {
  assert.deepEqual(positionBody({ id: '1', name: 'Production Supervisor', description: 'Supervises production operations', department_id: '2' }, true), { id: 1, name: 'Production Supervisor', description: 'Supervises production operations', department_id: 2 });
  assert.throws(() => positionBody({ name: 'Developer', department_id: 2 }));
  assert.throws(() => positionBody([{ name: 'Developer', description: 'Build', department_id: 2 }]));
  assert.ok(validateDepartmentDraft({ name: 'Engineering', description: 'Software', positions: [{ name: 'Developer' }] })['position-description-0']);
  assert.ok(validateDepartmentDraft({ name: 'Engineering', description: 'Software', user_id: -1, positions: [] }).manager);
});

test('position edits send one request per changed row and retry skips acknowledged creates', async () => {
  const unchanged = { positionId: 1, name: 'Unchanged', description: 'Keep' };
  unchanged.savedFingerprint = positionFingerprint(unchanged);
  const rows = [unchanged, { positionId: 2, name: 'Renamed', description: 'Updated', savedFingerprint: 'old' }, { name: 'First new', description: 'New role' }, { name: 'Second new', description: 'Another role' }];
  const calls = []; let fail = true;
  const api = {
    updatePosition: async body => { calls.push(['update', body]); return { result: true }; },
    createPosition: async body => { calls.push(['create', body]); if (body.name === 'Second new' && fail) throw Error('Temporary API failure'); return { result: true, data: { id: body.name === 'First new' ? 3 : 4 } }; },
  };
  await assert.rejects(savePositionRows(api, rows, 7), /Temporary API failure/);
  assert.equal(rows[2].positionId, 3);
  fail = false; await savePositionRows(api, rows, 7);
  assert.equal(calls.filter(([method]) => method === 'update').length, 1);
  assert.equal(calls.filter(([, body]) => body.name === 'First new').length, 1);
  assert.deepEqual(calls[0], ['update', { id: 2, name: 'Renamed', description: 'Updated', department_id: 7 }]);
});

test('acknowledged creation without an ID is verified before any retry can create again', async () => {
  const row = { name: 'Developer', description: 'Build software' }; let creates = 0, visible = false;
  const api = { createPosition: async () => { creates++; return { result: true }; }, getPositions: async () => visible ? [{ id: 9, department_id: 7, name: 'Developer', description: 'Build software' }] : [] };
  await assert.rejects(savePositionRows(api, [row], 7));
  await assert.rejects(savePositionRows(api, [row], 7));
  visible = true; await savePositionRows(api, [row], 7);
  assert.equal(creates, 1); assert.equal(row.positionId, 9);
});
