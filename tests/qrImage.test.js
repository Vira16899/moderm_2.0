import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeQrImage, qrImageError } from '../src/utils/qrImage.js';

const image = () => new File(['mock-image'], 'qr.png', { type: 'image/png' });
test('QR image input rejects unsupported, empty and oversized files before decoding', async () => {
  assert.ok(qrImageError(null));
  assert.ok(qrImageError(new File(['data'], 'document.pdf', { type: 'application/pdf' })));
  assert.ok(qrImageError(new File([], 'empty.png', { type: 'image/png' })));
  assert.ok(qrImageError(new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' })));
  let called = false;
  await assert.rejects(decodeQrImage(new File(['x'], 'bad.txt'), () => { called = true; }));
  assert.equal(called, false);
});
test('image QR detection returns exactly one original token and rejects unreadable or ambiguous images', async () => {
  const file = image();
  assert.equal(await decodeQrImage(file, () => ({ detect: async value => { assert.equal(value, file); return [{ rawValue: 'test-token' }]; } })), 'test-token');
  assert.equal(await decodeQrImage(file, () => ({ detect: async () => [{ rawValue: 'same' }, { rawValue: 'same' }] })), 'same');
  await assert.rejects(decodeQrImage(file, () => ({ detect: async () => [] })), /QR/);
  await assert.rejects(decodeQrImage(file, () => ({ detect: async () => [{ rawValue: 'one' }, { rawValue: 'two' }] })), /ច្រើន/);
  await assert.rejects(decodeQrImage(file, () => ({ detect: async () => { throw new Error('Image could not be decoded'); } })), /PNG/);
});
