/**
 * Host half of the diagram / whiteboard studio bundle.
 *
 * The board document — its boards, nodes, connectors, template library and
 * every export (JSON, SVG, Markdown) — is owned by the browser half
 * (`./client.js`), which registers the sidebar entry and the central panel.
 * Nothing on the Host plane needs a service, so this half installs no resource.
 */
export function apply() {}
