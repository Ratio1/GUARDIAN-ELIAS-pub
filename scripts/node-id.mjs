// The id of the Ratio1 Edge Node that builds the site, for the footer line
// "Running on Ratio1 low-resource edge-node <id>".
//
// The node's runner sets R1EN_HOST_ID in the job container; EE_HOST_ID is the
// older name for the same value. The first of the two that is valid is used,
// in that order. Valid means 1 to 64 characters of the ASCII letters A-Z and
// a-z, the digits 0-9, `.`, `_` and `-`. When neither is valid there is no id,
// and the footer shows no line. A local or CI build normally sets neither.
//
// The id ends up in the page HTML, and the footer text is raw HTML (the
// server's content security policy admits the inline scripts found in the
// build). The pattern is the guard that keeps markup out of it: it admits no
// character that has a meaning in HTML. The value is HTML-escaped as well where
// it is put into the footer, as a second line of defence.

const NODE_ID_PATTERN = /^[A-Za-z0-9._-]{1,64}$/;

export function nodeIdFromEnv(env) {
  return [env.R1EN_HOST_ID, env.EE_HOST_ID].find(
    (value) => typeof value === 'string' && NODE_ID_PATTERN.test(value),
  );
}

export function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// The footer paragraph for the node's id, or an empty string when there is none.
export function nodeFooterHtml(env) {
  const id = nodeIdFromEnv(env);
  return id === undefined
    ? ''
    : `<p class="footer__node">Running on Ratio1 low-resource edge-node ${escapeHtml(id)}</p>`;
}
