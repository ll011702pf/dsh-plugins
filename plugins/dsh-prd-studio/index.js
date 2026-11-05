/**
 * Host half of the PRD Studio bundle.
 *
 * Documents, the sidebar entry, and the central panel are owned by the browser
 * half (`./client.js`), which persists drafts in localStorage. No Host service
 * is involved, so this half registers nothing and exists to carry the bundle
 * patch and its display resources.
 */
export function apply() {}