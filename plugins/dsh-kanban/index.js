/**
 * Host half of the Kanban bundle.
 *
 * The board — columns, cards, drag & drop and persistence — is entirely owned
 * by the browser half (`./client.js`), which registers the sidebar entry and the
 * central panel. Nothing on the Host plane needs a service, so this half
 * registers nothing.
 */
export function apply() {}