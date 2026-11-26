// The id of the Ratio1 Edge Node that runs the site, for the footer line
// "Running on Ratio1 low-resource edge-node <id>".
//
// The node's runner sets R1EN_HOST_ID in the job container; EE_HOST_ID is the
// older name for the same value. The first of the two that is valid is used,
// in that order. Valid means 1 to 64 characters of the ASCII letters A-Z and
// a-z, the digits 0-9, `.`, `_` and `-`. When neither is valid there is no id,
// and the footer shows no line. A local or CI run normally sets neither.
//
// The server reads the id when it starts and answers GET /node-line.json with
// the line; a small script in the page puts it into the footer as plain text.
// The pattern admits no character that has a meaning in HTML or JSON, so the
// value is safe in both.

const NODE_ID_PATTERN = /^[A-Za-z0-9._-]{1,64}$/;

export function nodeIdFromEnv(env) {
  return [env.R1EN_HOST_ID, env.EE_HOST_ID].find(
    (value) => typeof value === 'string' && NODE_ID_PATTERN.test(value),
  );
}

// The sentence for the node's id, or null when there is none.
export function nodeLineFromEnv(env) {
  const id = nodeIdFromEnv(env);
  return id === undefined ? null : `Running on Ratio1 low-resource edge-node ${id}`;
}
