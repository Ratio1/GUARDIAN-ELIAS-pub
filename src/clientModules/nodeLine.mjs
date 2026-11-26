// Fills the footer paragraph with the line that names the Ratio1 Edge Node the
// site runs on. The production server answers GET /node-line.json with
// {"running_on": "<sentence>"} or {"running_on": null}; the sentence is
// inserted as plain text. Without JavaScript the paragraph stays empty and
// hidden. The request is made again on every page change; an answer that
// arrives after the visitor has moved on is dropped, and a missing line or a
// failed request clears and hides the paragraph.

import {NODE_LINE_ELEMENT_ID} from './nodeLineElement.mjs';

let latest = 0;

// Asks for the line and shows it in the footer paragraph of `document`.
export async function updateNodeLine(document, fetchFn) {
  const request = ++latest;
  let line = null;
  try {
    const response = await fetchFn('/node-line.json', {cache: 'no-store'});
    if (response.ok) {
      const text = (await response.json())?.running_on;
      if (typeof text === 'string' && text.length > 0 && text.length < 200) line = text;
    }
  } catch {
    line = null;
  }
  if (request !== latest) return;
  const paragraph = document.getElementById(NODE_LINE_ELEMENT_ID);
  if (!paragraph) return;
  paragraph.textContent = line ?? '';
  paragraph.hidden = line === null;
}

const clientModule = {
  // Docusaurus calls this after every page change, the first page included.
  onRouteDidUpdate() {
    if (typeof document === 'undefined' || typeof fetch === 'undefined') return undefined;
    return updateNodeLine(document, (...args) => fetch(...args));
  },
};

export default clientModule;
