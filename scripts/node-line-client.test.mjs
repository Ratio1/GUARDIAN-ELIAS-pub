// Run with `npm test` (node --test). Tests the footer script with a small fake
// document and a fake fetch, without a browser.
import assert from 'node:assert/strict';
import test from 'node:test';
import clientModule, {updateNodeLine} from '../src/clientModules/nodeLine.mjs';
import {NODE_LINE_ELEMENT_ID} from '../src/clientModules/nodeLineElement.mjs';

function fakeDocument() {
  const paragraph = {textContent: '', hidden: true};
  return {
    paragraph,
    document: {getElementById: (id) => (id === NODE_LINE_ELEMENT_ID ? paragraph : null)},
  };
}

const answer = (body, ok = true) => Promise.resolve({ok, json: () => Promise.resolve(body)});

test('the hook Docusaurus calls makes the request and shows the returned text', async () => {
  const {document, paragraph} = fakeDocument();
  const seen = [];
  const saved = {document: globalThis.document, fetch: globalThis.fetch};
  globalThis.document = document;
  globalThis.fetch = (...args) => (seen.push(args), answer({running_on: 'Running on Ratio1 low-resource edge-node n1'}));
  try {
    assert.equal(typeof clientModule.onRouteDidUpdate, 'function');
    await clientModule.onRouteDidUpdate();
  } finally {
    globalThis.document = saved.document;
    globalThis.fetch = saved.fetch;
  }
  assert.deepEqual(seen, [['/node-line.json', {cache: 'no-store'}]]);
  assert.equal(paragraph.textContent, 'Running on Ratio1 low-resource edge-node n1');
  assert.equal(paragraph.hidden, false);
});

test('the hook does nothing outside a browser', () => {
  assert.equal(clientModule.onRouteDidUpdate(), undefined);
});

test('the line is put into the element as text and the element is shown', async () => {
  const {document, paragraph} = fakeDocument();
  await updateNodeLine(document, () => answer({running_on: 'Running on Ratio1 low-resource edge-node n1'}));
  assert.equal(paragraph.textContent, 'Running on Ratio1 low-resource edge-node n1');
  assert.equal(paragraph.hidden, false);
});

test('a null answer, a bad answer or a failed request clears and hides the element', async () => {
  const cases = {
    'null': () => answer({running_on: null}),
    'not ok': () => answer({running_on: 'x'}, false),
    'wrong type': () => answer({running_on: 5}),
    'rejected': () => Promise.reject(new Error('down')),
  };
  for (const [name, fetchFn] of Object.entries(cases)) {
    const {document, paragraph} = fakeDocument();
    paragraph.textContent = 'old line';
    paragraph.hidden = false;
    await updateNodeLine(document, fetchFn);
    assert.equal(paragraph.textContent, '', name);
    assert.equal(paragraph.hidden, true, name);
  }
});

test('a failure is not kept: the next request asks again', async () => {
  const {document, paragraph} = fakeDocument();
  let calls = 0;
  const fetchFn = () => (++calls === 1 ? Promise.reject(new Error('down')) : answer({running_on: 'line'}));
  await updateNodeLine(document, fetchFn);
  assert.equal(paragraph.hidden, true);
  await updateNodeLine(document, fetchFn);
  assert.equal(calls, 2);
  assert.equal(paragraph.textContent, 'line');
});

test('an answer that arrives after a newer request is dropped', async () => {
  const {document, paragraph} = fakeDocument();
  const resolvers = [];
  const fetchFn = () => new Promise((resolve) => resolvers.push(resolve));
  const first = updateNodeLine(document, fetchFn);
  const second = updateNodeLine(document, fetchFn);
  resolvers[1]({ok: true, json: () => Promise.resolve({running_on: 'new'})});
  await second;
  resolvers[0]({ok: true, json: () => Promise.resolve({running_on: 'old'})});
  await first;
  assert.equal(paragraph.textContent, 'new');
});

test('a page without the element is left alone', async () => {
  await updateNodeLine({getElementById: () => null}, () => answer({running_on: 'x'}));
});

test('the markup check wants a hidden paragraph with exactly the right id inside the footer', async () => {
  const {pageHasNodeLineElement} = await import('./check-footer.mjs');
  const id = NODE_LINE_ELEMENT_ID;
  assert.equal(pageHasNodeLineElement(`<footer class=f><p class=x id=${id} hidden></p></footer>`), true);
  assert.equal(pageHasNodeLineElement(`<footer><p id="${id}" hidden></footer>`), true);
  assert.equal(pageHasNodeLineElement(`<footer><p data-id=${id} hidden></p></footer>`), false);
  assert.equal(pageHasNodeLineElement(`<footer><p id=${id}x hidden></p></footer>`), false);
  assert.equal(pageHasNodeLineElement(`<footer><p id=${id}></p></footer>`), false);
  assert.equal(pageHasNodeLineElement(`<footer><div id=${id} hidden></div></footer>`), false);
  assert.equal(pageHasNodeLineElement(`<p id=${id} hidden></p><footer></footer>`), false);
});
