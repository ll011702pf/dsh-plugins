/**
 * Host half of the Note Wall bundle.
 *
 * The page and its notes are owned by the browser half (`./client.js`), which
 * registers the sidebar entry and the central panel. Nothing on the Host plane
 * needs a service, so this half installs no resource.
 */
export function apply() {}