// Run with `npm run test:node-id` (node --test).
import assert from 'node:assert/strict';
import test from 'node:test';
import {nodeIdFromEnv, nodeLineFromEnv} from './node-id.mjs';

test('a valid id is accepted', () => {
  assert.equal(nodeIdFromEnv({R1EN_HOST_ID: 'test-node-01'}), 'test-node-01');
  assert.equal(nodeIdFromEnv({R1EN_HOST_ID: 'A.b_c-9'}), 'A.b_c-9');
});

test('both names are read', () => {
  assert.equal(nodeIdFromEnv({EE_HOST_ID: 'old-name'}), 'old-name');
  assert.equal(nodeIdFromEnv({R1EN_HOST_ID: 'new-name'}), 'new-name');
});

test('R1EN_HOST_ID comes before EE_HOST_ID', () => {
  assert.equal(nodeIdFromEnv({R1EN_HOST_ID: 'first', EE_HOST_ID: 'second'}), 'first');
});

test('an invalid R1EN_HOST_ID falls back to a valid EE_HOST_ID', () => {
  assert.equal(nodeIdFromEnv({R1EN_HOST_ID: 'a b', EE_HOST_ID: 'second'}), 'second');
});

test('nothing set gives no id and no line', () => {
  assert.equal(nodeIdFromEnv({}), undefined);
  assert.equal(nodeLineFromEnv({}), null);
});

test('values that are not valid are rejected', () => {
  const rejected = {
    'an empty value': '',
    'a space': 'node 01',
    'a slash': 'node/01',
    'HTML characters': '<script>x</script>',
    'a quote': 'a"b',
    'an ampersand': 'a&b',
    'a non-ASCII letter': 'nöde-01',
    'a trailing newline': 'node-01\n',
    '65 characters': 'a'.repeat(65),
  };
  for (const [name, value] of Object.entries(rejected)) {
    assert.equal(nodeIdFromEnv({R1EN_HOST_ID: value}), undefined, name);
    assert.equal(nodeIdFromEnv({EE_HOST_ID: value}), undefined, name);
    assert.equal(nodeLineFromEnv({R1EN_HOST_ID: value}), null, name);
  }
});

test('64 characters are accepted', () => {
  const id = 'a'.repeat(64);
  assert.equal(nodeIdFromEnv({R1EN_HOST_ID: id}), id);
});

test('the line holds the exact sentence', () => {
  assert.equal(
    nodeLineFromEnv({R1EN_HOST_ID: 'test-node-01'}),
    'Running on Ratio1 low-resource edge-node test-node-01',
  );
});
