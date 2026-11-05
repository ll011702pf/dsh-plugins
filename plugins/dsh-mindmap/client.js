/**
 * Client half of the Mind Map bundle.
 *
 * Registers one global panel entry in the sidebar (`sidebar.panellist`) and its
 * central panel in the layout's `main` keyed slot, both addressed by the id
 * `mindmap`. Maps are browser-owned and persist in localStorage; the Host half
 * registers nothing.
 *
 * Plain browser JavaScript loaded by the harness module loader; `require` is
 * only ever called with 'react'.
 */
window.__ModuleLoader__.load({
  id: '@local/dsh-mindmap',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'mindmap';
    const PANEL_ID = 'mindmap';
    const STORAGE_KEY = 'dsh.mindmap.maps.v1';
    const ROOT_ID = 'root';
    const TOAST_MS = 2800;

    /* ---- geometry ----------------------------------------------------------
     * The map is laid out in its own coordinates and drawn into an SVG canvas;
     * pan and zoom transform the view only, never the model. Branch colours are
     * the artwork of this panel, so they carry literal colours; every piece of
     * chrome around them (header, buttons, toolbar, inspector, empty states,
     * focus rings) uses host theme tokens. */
    const NODE_H = 34;
    const ROOT_W = 168;
    const ROOT_H = 46;
    const HGAP = 52;
    const VGAP = 12;
    const PAD = 32;
    const PALETTE = ['#2f6bd8', '#1f9d74', '#e0870f', '#c2459b', '#6b57d8', '#0f8ea8', '#c4442f'];
    const INK = '#f7f9fc';

    /* ---- model -------------------------------------------------------------
     * A map is { id, title, root, createdAt, updatedAt }; a node is
     * { id, text, color, collapsed, children }. `color` is an index into
     * PALETTE or null, meaning "inherit the parent branch colour". */

    function uid(prefix) {
      return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    function newNode(id, text, color) {
      return {
        id: id || uid('n'),
        text: typeof text === 'string' ? text : '',
        color: typeof color === 'number' ? color : null,
        collapsed: false,
        children: [],
      };
    }

    function seenColor(value) {
      return typeof value === 'number' && value >= 0 && value < PALETTE.length ? value : null;
    }

    /** Keep only well-formed nodes, so stale or hand-edited storage cannot break the canvas. */
    function sanitizeNode(raw, seen) {
      if (!raw || typeof raw !== 'object') return null;
      let id = typeof raw.id === 'string' && raw.id ? raw.id : uid('n');
      if (seen[id]) id = uid('n');
      seen[id] = true;
      const node = newNode(id, raw.text, seenColor(raw.color));
      node.collapsed = raw.collapsed === true;
      const children = Array.isArray(raw.children) ? raw.children : [];
      for (let i = 0; i < children.length; i += 1) {
        const child = sanitizeNode(children[i], seen);
        if (child) node.children.push(child);
      }
      return node;
    }

    function sanitizeMap(raw) {
      if (!raw || typeof raw !== 'object') return null;
      const root = sanitizeNode(raw.root, {});
      if (!root) return null;
      const createdAt = typeof raw.createdAt === 'number' ? raw.createdAt : Date.now();
      return {
        id: typeof raw.id === 'string' && raw.id ? raw.id : uid('m'),
        title: typeof raw.title === 'string' ? raw.title : '',
        root,
        createdAt,
        updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : createdAt,
      };
    }

    function countNodes(node) {
      let total = 1;
      for (let i = 0; i < node.children.length; i += 1) total += countNodes(node.children[i]);
      return total;
    }

    function cloneTree(node) {
      const copy = newNode(node.id, node.text, node.color);
      copy.collapsed = node.collapsed;
      for (let i = 0; i < node.children.length; i += 1) copy.children.push(cloneTree(node.children[i]));
      return copy;
    }

    function cloneMaps(maps) {
      const copy = [];
      for (let i = 0; i < maps.length; i += 1) {
        const source = maps[i];
        copy.push({
          id: source.id,
          title: source.title,
          root: cloneTree(source.root),
          createdAt: source.createdAt,
          updatedAt: source.updatedAt,
        });
      }
      return copy;
    }

    function stripVolatile(node) {
      return {
        id: node.id,
        text: node.text,
        color: node.color,
        collapsed: node.collapsed,
        children: node.children.map(stripVolatile),
      };
    }

    /** Depth-first walk; `visit` may return true to stop. Collapsed nodes hide their subtree. */
    function walk(node, visit) {
      if (visit(node) === true) return true;
      if (node.collapsed) return false;
      for (let i = 0; i < node.children.length; i += 1) {
        if (walk(node.children[i], visit)) return true;
      }
      return false;
    }

    function findNode(root, id) {
      let found = null;
      walk(root, (node) => {
        if (node.id === id) {
          found = node;
          return true;
        }
        return false;
      });
      return found;
    }

    function findParent(root, id) {
      let found = null;
      walk(root, (node) => {
        if (node.id === id) return true;
        const children = node.children;
        for (let i = 0; i < children.length; i += 1) {
          if (children[i].id === id) {
            found = node;
            return true;
          }
        }
        return false;
      });
      return found;
    }

    /** The root-to-node path, or null when the node is not in this tree. */
    function findPath(node, id) {
      const path = [node];
      if (node.id === id) return path;
      for (let i = 0; i < node.children.length; i += 1) {
        const deeper = findPath(node.children[i], id);
        if (deeper) return path.concat(deeper);
      }
      return null;
    }

    function descendantCount(node) {
      return countNodes(node) - 1;
    }

    /* ---- layout ------------------------------------------------------------
     * A one-sided tidy tree: branches flow right, subtrees never overlap, and a
     * parent is vertically centred on its children. It is recomputed from the
     * model on every change, so the drawing can never go stale. */
    function layout(root, measure) {
      const boxes = [];
      const edges = [];
      let cursorY = 0;

      function place(node, depth, inherited) {
        const isRoot = depth === 0;
        const size = measure(node.text || '', isRoot);
        const height = size.height;
        let width = isRoot ? Math.max(size.width, ROOT_W) : size.width;
        const color = node.color == null ? inherited : node.color;
        const childBoxes = [];
        if (!node.collapsed) {
          for (let i = 0; i < node.children.length; i += 1) {
            childBoxes.push(place(node.children[i], depth + 1, color));
          }
        }
        let centreY;
        if (childBoxes.length === 0) {
          centreY = cursorY + height / 2;
          cursorY += height + VGAP;
        } else {
          centreY = (childBoxes[0].centreY + childBoxes[childBoxes.length - 1].centreY) / 2;
        }
        const box = {
          node,
          depth,
          color,
          isRoot,
          width,
          height,
          centreY,
          top: centreY - height / 2,
          x: 0,
          y: 0,
        };
        boxes.push(box);
        for (let i = 0; i < childBoxes.length; i += 1) edges.push({ from: box, to: childBoxes[i], color: childBoxes[i].color });
        return box;
      }

      place(root, 0, 0);

      const columnWidths = [];
      for (let i = 0; i < boxes.length; i += 1) {
        const box = boxes[i];
        const current = columnWidths[box.depth];
        columnWidths[box.depth] = current == null ? box.width : Math.max(current, box.width);
      }
      const columnX = [];
      let x = PAD;
      for (let i = 0; i < columnWidths.length; i += 1) {
        columnX[i] = x;
        x += columnWidths[i] + HGAP;
      }

      let minTop = Infinity;
      let maxBottom = -Infinity;
      for (let i = 0; i < boxes.length; i += 1) {
        const box = boxes[i];
        box.x = columnX[box.depth];
        if (box.top < minTop) minTop = box.top;
        if (box.top + box.height > maxBottom) maxBottom = box.top + box.height;
      }
      const shift = boxes.length ? PAD - minTop : 0;
      for (let i = 0; i < boxes.length; i += 1) {
        boxes[i].top += shift;
        boxes[i].y = boxes[i].top;
        boxes[i].centreY += shift;
      }
      return {
        boxes,
        edges,
        width: boxes.length ? x - HGAP + PAD : 2 * PAD,
        height: boxes.length ? maxBottom - minTop + 2 * PAD : 2 * PAD,
      };
    }

    /* Text width is only knowable in the page; the canvas measure matches the
     * node CSS font, and the fallback keeps layout sane without a 2D context. */
    function measureWithCanvas() {
      if (typeof document === 'undefined' || !document.createElement) return null;
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
        if (!ctx || typeof ctx.measureText !== 'function') return null;
        return (text, isRoot) => {
          ctx.font = (isRoot ? '600 14px ' : '500 13px ') + 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
          const lines = String(text || '').split('\n');
          let widest = 0;
          for (let i = 0; i < lines.length; i += 1) {
            const measured = ctx.measureText(lines[i]).width;
            if (measured > widest) widest = measured;
          }
          return {
            width: Math.round(widest + (isRoot ? 34 : 24)),
            height: isRoot
              ? Math.max(ROOT_H, lines.length * 19 + 20)
              : Math.max(NODE_H, lines.length * 18 + 14),
          };
        };
      } catch (error) {
        return null;
      }
    }

    function measureFallback(text, isRoot) {
      const lines = String(text || '').split('\n');
      let longest = 1;
      for (let i = 0; i < lines.length; i += 1) longest = Math.max(longest, lines[i].length);
      const perLine = Math.min(longest, isRoot ? 11 : 14);
      return {
        width: Math.round((isRoot ? 132 : 118) + perLine * 6.6),
        height: isRoot ? Math.max(ROOT_H, lines.length * 19 + 20) : Math.max(NODE_H, lines.length * 18 + 14),
      };
    }

    /* ---- export ------------------------------------------------------------ */

    function escapeXml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function toMarkdown(node) {
      const lines = [];
      function visit(current, level) {
        lines.push('  '.repeat(level) + '- ' + (current.text || '').replace(/\n/g, ' '));
        if (current.collapsed) return;
        for (let i = 0; i < current.children.length; i += 1) visit(current.children[i], level + 1);
      }
      visit(node, 0);
      return lines.join('\n');
    }

    function round(value) {
      return Math.round(value * 10) / 10;
    }

    /** The branch curve: a cubic that leaves the parent horizontally and arrives horizontally. */
    function branchPath(edge) {
      const from = edge.from;
      const to = edge.to;
      const x1 = from.x + from.width;
      const y1 = from.top + from.height / 2;
      const x2 = to.x;
      const y2 = to.top + to.height / 2;
      const mid = x1 + (x2 - x1) * 0.55;
      return {
        d:
          'M' + round(x1) + ' ' + round(y1) + 'C' + round(mid) + ' ' + round(y1) + ',' +
          round(mid) + ' ' + round(y2) + ',' + round(x2) + ' ' + round(y2),
        width: to.depth <= 1 ? 2.4 : to.depth === 2 ? 1.9 : 1.5,
      };
    }

    function nodeSvg(box) {
      const color = PALETTE[box.color % PALETTE.length];
      const parts = [
        '<g>',
        '<rect x="' + round(box.x) + '" y="' + round(box.top) + '" width="' + round(box.width) +
          '" height="' + round(box.height) + '" rx="' + (box.isRoot ? 11 : 8) + '" fill="' + color + '"' +
          (box.isRoot ? ' stroke="rgba(0,0,0,0.32)" stroke-width="1"' : '') + '/>',
      ];
      const lines = String(box.node.text || '').split('\n');
      const lineHeight = box.isRoot ? 19 : 18;
      const startY = box.top + box.height / 2 - ((lines.length - 1) * lineHeight) / 2 + (box.isRoot ? 5 : 4.7);
      for (let i = 0; i < lines.length; i += 1) {
        parts.push(
          '<text x="' + round(box.x + box.width / 2) + '" y="' + round(startY + i * lineHeight) +
            '" font-size="' + (box.isRoot ? 14 : 13) + '" font-weight="' + (box.isRoot ? 600 : 500) +
            '" text-anchor="middle" fill="' + INK + '">' + escapeXml(lines[i]) + '</text>',
        );
      }
      return parts.join('') + '</g>';
    }

    /** Triggers a browser download from a detached anchor, then revokes the object URL. */
    function downloadBlob(name, blob) {
      try {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = name;
        anchor.rel = 'noopener';
        anchor.click();
        setTimeout(() => {
          try {
            URL.revokeObjectURL(url);
          } catch (error) {
            /* Revoking is best effort. */
          }
        }, 1500);
        return true;
      } catch (error) {
        return false;
      }
    }

    /** The branch glyph, inherited in `currentColor` so the host colours it. */
    function glyph(size, active) {
      const stroke = active ? 1.7 : 1.5;
      const line = {
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: stroke,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      };
      return h(
        'svg',
        { viewBox: '0 0 20 20', width: size, height: size, 'aria-hidden': 'true', style: { display: 'block' } },
        h('circle', { cx: 3.2, cy: 10, r: 2.1, fill: 'currentColor' }),
        h('path', Object.assign({ d: 'M5.3 10h3.4' }, line)),
        h('path', Object.assign({ d: 'M8.7 10l3.6-4.6M8.7 10l3.6 4.6' }, line)),
        h('rect', { x: 12.4, y: 2.9, width: 5.6, height: 4, rx: 1.3, fill: 'currentColor' }),
        h('rect', { x: 12.4, y: 13.1, width: 5.6, height: 4, rx: 1.3, fill: 'currentColor' }),
      );
    }

    /** Owner props of `sidebar.panellist`: the row supplies the requested square edge. */
    function PanelIcon(props) {
      const size = props && typeof props.size === 'number' && props.size > 0 ? props.size : 20;
      return glyph(size, !!(props && props.active));
    }

    const CSS = [
      '.dsh-mm-root{position:relative;display:flex;flex-direction:column;height:100%;min-height:0;box-sizing:border-box;',
      'background:var(--dsw-alias-bg-base);padding-top:var(--dsh-frame-top-clearance,0px);color:var(--dsw-alias-label-primary)}',
      '.dsh-mm-header{display:flex;flex:none;align-items:center;gap:10px;padding:18px 22px 12px;flex-wrap:wrap}',
      '.dsh-mm-mark{display:block;flex:none;color:var(--dsw-alias-label-primary)}',
      '.dsh-mm-heading{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1 1 200px}',
      '.dsh-mm-title{margin:0;font-size:16px;font-weight:600;line-height:1.3;color:var(--dsw-alias-label-primary);',
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.dsh-mm-sub{font-size:12px;line-height:1.4;color:var(--dsw-alias-label-secondary)}',
      '.dsh-mm-toolbar{display:flex;flex:none;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end}',
      '.dsh-mm-btn{display:inline-flex;flex:none;align-items:center;gap:5px;height:30px;padding:0 11px;',
      'border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);',
      'color:var(--dsw-alias-label-primary);font-family:inherit;font-size:13px;line-height:1;cursor:pointer;',
      'transition:background .15s ease,border-color .15s ease,color .15s ease}',
      '.dsh-mm-btn:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-brand-primary)}',
      '.dsh-mm-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
      '.dsh-mm-btn:disabled{opacity:.45;cursor:default}',
      '.dsh-mm-btn.is-primary{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}',
      '.dsh-mm-btn.is-active{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-brand-primary)}',
      '.dsh-mm-sep{flex:none;width:1px;height:20px;background:var(--dsw-alias-border-l1)}',
      '.dsh-mm-body{flex:1;min-height:0;display:flex;align-items:stretch}',
      '.dsh-mm-canvas{position:relative;flex:1;min-width:0;min-height:0;overflow:hidden;',
      'background:var(--dsw-alias-bg-base);touch-action:none}',
      '.dsh-mm-canvas.is-panning{cursor:grabbing}',
      '.dsh-mm-band{position:absolute;z-index:2;pointer-events:none;box-sizing:border-box;',
      'border:1px solid var(--dsw-alias-brand-primary);border-radius:3px;',
      'background:var(--dsw-alias-bg-layer-2);opacity:.85}',
      '.dsh-mm-canvas:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}',
      '.dsh-mm-world{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform}',
      '.dsh-mm-svg{display:block;position:absolute;left:0;top:0;overflow:visible;user-select:none;-webkit-user-select:none}',
      '.dsh-mm-edge{stroke-linecap:round;stroke-linejoin:round;fill:none}',
      '.dsh-mm-node{position:absolute;display:flex;align-items:center;justify-content:center;box-sizing:border-box;',
      'border:1px solid transparent;border-radius:8px;padding:2px 11px;cursor:pointer;',
      'font-size:13px;line-height:1.35;font-weight:500;text-align:center;overflow-wrap:anywhere;',
      'transition:box-shadow .15s ease,border-color .15s ease}',
      '.dsh-mm-node.is-root{font-size:14px;font-weight:600;padding:2px 14px;border-radius:11px;',
      'box-shadow:0 2px 6px -2px rgba(0,0,0,.42)}',
      '.dsh-mm-node:hover{box-shadow:0 3px 10px -4px rgba(0,0,0,.5)}',
      '.dsh-mm-node.is-selected{box-shadow:0 0 0 2px var(--dsw-alias-brand-primary);z-index:2}',
      '.dsh-mm-node:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
      '.dsh-mm-label-text{display:block;max-width:100%;white-space:pre-wrap;overflow-wrap:anywhere}',
      '.dsh-mm-toggle{position:absolute;left:-9px;top:50%;transform:translateY(-50%);display:grid;place-items:center;',
      'width:17px;height:17px;padding:0;border:1px solid var(--dsw-alias-border-l2);border-radius:50%;',
      'background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-size:9px;line-height:1;',
      'cursor:pointer;font-family:inherit;z-index:1}',
      '.dsh-mm-toggle:hover{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-brand-primary)}',
      '.dsh-mm-toggle:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dsh-mm-badge{position:absolute;right:-8px;top:50%;transform:translateY(-50%);padding:0 4px;',
      'min-width:11px;height:15px;display:grid;place-items:center;border:1px solid var(--dsw-alias-border-l2);',
      'border-radius:9px;background:var(--dsw-alias-bg-layer-1);font-size:10px;',
      'color:var(--dsw-alias-label-secondary);z-index:1}',
      '.dsh-mm-input{position:absolute;z-index:3;box-sizing:border-box;border:1px solid var(--dsw-alias-brand-primary);',
      'border-radius:8px;background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);',
      'font-family:inherit;font-size:13px;line-height:1.35;padding:3px 10px;resize:none;outline:none;',
      'box-shadow:0 8px 24px -12px rgba(0,0,0,.6);text-align:center}',
      '.dsh-mm-hint{position:absolute;left:14px;bottom:12px;z-index:1;max-width:min(440px,78%);padding:5px 9px;',
      'border:1px solid var(--dsw-alias-border-l1);border-radius:7px;background:var(--dsw-alias-bg-layer-1);',
      'font-size:11px;line-height:1.45;color:var(--dsw-alias-label-secondary);pointer-events:none}',
      '.dsh-mm-zoom{position:absolute;right:12px;bottom:12px;z-index:1;display:flex;align-items:center;gap:2px;',
      'padding:3px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-1)}',
      '.dsh-mm-zoombtn{display:grid;place-items:center;width:24px;height:24px;padding:0;border:0;border-radius:6px;',
      'background:transparent;color:var(--dsw-alias-label-secondary);font-family:inherit;font-size:13px;cursor:pointer}',
      '.dsh-mm-zoombtn:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}',
      '.dsh-mm-zoombtn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dsh-mm-zoomval{min-width:38px;text-align:center;font-size:11px;color:var(--dsw-alias-label-secondary)}',
      '.dsh-mm-side{flex:none;width:272px;display:flex;flex-direction:column;min-height:0;',
      'border-left:1px solid var(--dsw-alias-border-l1)}',
      '.dsh-mm-side-head{display:flex;flex:none;align-items:center;gap:8px;padding:12px 14px 8px}',
      '.dsh-mm-side-title{margin:0;font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary)}',
      '.dsh-mm-side-count{margin-left:auto;font-size:11px;color:var(--dsw-alias-label-secondary);white-space:nowrap}',
      '.dsh-mm-side-body{flex:1;min-height:0;overflow-y:auto;padding:0 14px 16px;display:flex;flex-direction:column;gap:13px}',
      '.dsh-mm-field{display:flex;flex-direction:column;gap:5px}',
      '.dsh-mm-label{font-size:11.5px;font-weight:600;color:var(--dsw-alias-label-secondary)}',
      '.dsh-mm-intext{box-sizing:border-box;width:100%;padding:7px 9px;border:1px solid var(--dsw-alias-border-l2);',
      'border-radius:7px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);',
      'font-family:inherit;font-size:12.5px;line-height:1.45;outline:none;resize:vertical;min-height:62px}',
      '.dsh-mm-intext:focus-visible{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 2px var(--dsw-alias-brand-primary)}',
      '.dsh-mm-swatches{display:flex;flex-wrap:wrap;gap:6px;align-items:center}',
      '.dsh-mm-swatch{width:20px;height:20px;flex:none;padding:0;border:1px solid var(--dsw-alias-border-l2);',
      'border-radius:5px;cursor:pointer}',
      '.dsh-mm-swatch[aria-pressed="true"]{box-shadow:0 0 0 2px var(--dsw-alias-bg-base),0 0 0 3px var(--dsw-alias-label-primary)}',
      '.dsh-mm-swatch:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dsh-mm-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap}',
      '.dsh-mm-empty{display:flex;flex:1;flex-direction:column;align-items:center;justify-content:center;gap:10px;',
      'margin:16px;border:1px dashed var(--dsw-alias-border-l2);border-radius:12px;text-align:center;',
      'color:var(--dsw-alias-label-secondary)}',
      '.dsh-mm-empty-title{font-size:14px;color:var(--dsw-alias-label-primary)}',
      '.dsh-mm-empty-hint{font-size:12.5px;max-width:360px;line-height:1.5}',
      '.dsh-mm-maps{display:flex;flex-direction:column;gap:6px}',
      '.dsh-mm-maprow{display:flex;align-items:center;gap:4px}',
      '.dsh-mm-map{display:flex;align-items:center;gap:8px;flex:1;min-width:0;box-sizing:border-box;padding:7px 9px;',
      'border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);',
      'color:var(--dsw-alias-label-primary);font-family:inherit;font-size:12.5px;text-align:left;cursor:pointer}',
      '.dsh-mm-map:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.dsh-mm-map.is-current{border-color:var(--dsw-alias-brand-primary)}',
      '.dsh-mm-map:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
      '.dsh-mm-mapname{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.dsh-mm-mapmeta{flex:none;font-size:10.5px;color:var(--dsw-alias-label-secondary)}',
      '.dsh-mm-delmap{display:grid;place-items:center;flex:none;width:26px;height:30px;padding:0;',
      'border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);',
      'color:var(--dsw-alias-label-secondary);cursor:pointer;font-family:inherit;font-size:13px}',
      '.dsh-mm-delmap:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}',
      '.dsh-mm-delmap:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dsh-mm-toast{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);z-index:5;',
      'padding:7px 13px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;',
      'background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);font-size:12px;',
      'box-shadow:0 10px 30px -16px rgba(0,0,0,.7);pointer-events:none;max-width:70%}',
      '@media (max-width: 900px){.dsh-mm-side{display:none}}',
      '@media (prefers-reduced-motion: reduce){.dsh-mm-node,.dsh-mm-btn{transition:none}}',
    ].join('');

    const DICT = {
      zh: {
        'panel.title': '思维导图',
        'panel.sub': '从一个中心主题开始，逐层长出你的思路',
        'panel.unit': '个节点',
        'node.new': '新分支',
        'node.empty': '空白节点',
        'toolbar.newMap': '新建导图',
        'toolbar.addChild': '新建分支',
        'toolbar.addSibling': '同级节点',
        'toolbar.edit': '重命名',
        'toolbar.undo': '撤销',
        'toolbar.redo': '重做',
        'toolbar.fit': '适应画布',
        'toolbar.export': '导出',
        'toolbar.exportSvg': '导出 SVG',
        'toolbar.exportPng': '导出 PNG',
        'toolbar.exportMd': '复制 Markdown',
        'toolbar.exportJson': '复制 JSON',
        'side.title': '节点',
        'side.text': '标题',
        'side.color': '分支颜色',
        'side.inherit': '跟随上级',
        'side.root': '中心节点',
        'side.none': '未选中节点',
        'side.noneHint': '点击画布上的节点即可编辑，或在画布上按 Tab 新建分支。',
        'side.delete': '删除节点',
        'side.collapse': '折叠',
        'side.expand': '展开',
        'side.maps': '我的导图',
        'side.swatch': '分支色',
        'side.multi': '已选中',
        'side.deleteSelected': '删除选中',
        'side.clearSelection': '取消选择',
        'side.multiHint': '按住左键框选，或按住 Shift 点选多个节点，然后一次删除。',
        'maps.new': '新建导图',
        'maps.defaultTitle': '未命名导图',
        'maps.delete': '删除这张导图',
        'maps.rootText': '中心主题',
        'zoom.in': '放大',
        'zoom.out': '缩小',
        'zoom.reset': '适应画布',
        'hint.keys': '拖框或 Shift 点选多个节点 · Tab 新建分支 · Enter 同级 · 双击重命名 · Delete 删除 · Alt 拖动平移',
        'toast.copied': '已复制到剪贴板',
        'toast.copyFailed': '复制失败，请手动保存',
        'toast.exported': '已导出',
        'toast.cantDeleteRoot': '中心节点不能删除',
        'toast.nothingToUndo': '没有可撤销的改动',
        'toast.nothingToRedo': '没有可重做的改动',
        'empty.title': '还没有思维导图',
        'empty.hint': '点击「新建导图」，输入中心主题，然后按 Tab 长出第一条分支。',
        'confirm.deleteMap': '删除后无法恢复，确定删除这张导图吗？',
      },
      en: {
        'panel.title': 'Mind Map',
        'panel.sub': 'Begin with one central idea and grow the branches outward',
        'panel.unit': 'nodes',
        'node.new': 'New branch',
        'node.empty': 'Blank node',
        'toolbar.newMap': 'New map',
        'toolbar.addChild': 'Add branch',
        'toolbar.addSibling': 'Sibling',
        'toolbar.edit': 'Rename',
        'toolbar.undo': 'Undo',
        'toolbar.redo': 'Redo',
        'toolbar.fit': 'Fit canvas',
        'toolbar.export': 'Export',
        'toolbar.exportSvg': 'Export SVG',
        'toolbar.exportPng': 'Export PNG',
        'toolbar.exportMd': 'Copy Markdown',
        'toolbar.exportJson': 'Copy JSON',
        'side.title': 'Node',
        'side.text': 'Text',
        'side.color': 'Branch colour',
        'side.inherit': 'Follow parent',
        'side.root': 'Central node',
        'side.none': 'No node selected',
        'side.noneHint': 'Select a node on the canvas to edit it, or press Tab on the canvas to add a branch.',
        'side.delete': 'Delete node',
        'side.collapse': 'Collapse',
        'side.expand': 'Expand',
        'side.maps': 'My maps',
        'side.swatch': 'Branch colour',
        'side.multi': 'Selected',
        'side.deleteSelected': 'Delete selected',
        'side.clearSelection': 'Clear selection',
        'side.multiHint': 'Drag a box with the left button, or Shift-click several nodes, then delete them together.',
        'maps.new': 'New map',
        'maps.defaultTitle': 'Untitled map',
        'maps.delete': 'Delete this map',
        'maps.rootText': 'Central idea',
        'zoom.in': 'Zoom in',
        'zoom.out': 'Zoom out',
        'zoom.reset': 'Fit canvas',
        'hint.keys': 'Drag a box or Shift-click to select several · Tab adds a branch · Enter adds a sibling · double-click renames · Delete removes · Alt-drag pans',
        'toast.copied': 'Copied to clipboard',
        'toast.copyFailed': 'Copy failed — save it manually',
        'toast.exported': 'Exported',
        'toast.cantDeleteRoot': 'The central node cannot be deleted',
        'toast.nothingToUndo': 'Nothing to undo',
        'toast.nothingToRedo': 'Nothing to redo',
        'empty.title': 'No mind maps yet',
        'empty.hint': 'Select “New map”, type a central idea, then press Tab to grow your first branch.',
        'confirm.deleteMap': 'This cannot be undone. Delete this map?',
      },
    };

    return {
      inject: ['slots', 'locale'],

      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, DICT), 'mindmap: dictionaries');

        const t = ctx.locale.bind(NS);
        const measure = measureWithCanvas() || measureFallback;

        function readStorage() {
          try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed && parsed.maps) ? parsed.maps : [];
            const seen = {};
            const maps = [];
            for (let i = 0; i < list.length; i += 1) {
              const map = sanitizeMap(list[i]);
              if (!map) continue;
              if (seen[map.id]) map.id = uid('m');
              seen[map.id] = true;
              maps.push(map);
            }
            let active = parsed && typeof parsed.active === 'number' ? parsed.active : 0;
            if (!(active >= 0 && active < maps.length)) active = 0;
            return maps.length ? { maps, activeIndex: active } : null;
          } catch (error) {
            return null;
          }
        }

        function writeStorage(maps, activeIndex) {
          try {
            window.localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({
                version: 1,
                active: activeIndex,
                maps: maps.map((map) => ({
                  id: map.id,
                  title: map.title,
                  root: stripVolatile(map.root),
                  createdAt: map.createdAt,
                  updatedAt: map.updatedAt,
                })),
              }),
            );
          } catch (error) {
            /* Storage is unavailable; the studio keeps working for this page. */
          }
        }

        /** A fresh map: the central idea plus one ready branch, so Tab has an obvious target. */
        function createMap(titleText) {
          const now = Date.now();
          const root = newNode(ROOT_ID, titleText, 0);
          root.children.push(newNode(uid('n'), t('node.new'), 1));
          return { id: uid('m'), title: '', root, createdAt: now, updatedAt: now };
        }

        function MindMapPanel() {
          const bootRef = React.useRef(null);
          if (!bootRef.current) {
            const loaded = readStorage();
            bootRef.current = loaded || { maps: [createMap(t('maps.rootText'))], activeIndex: 0 };
          }
          const boot = bootRef.current;

          const [maps, setMaps] = React.useState(boot.maps);
          const [activeIndex, setActiveIndex] = React.useState(boot.activeIndex);
          const [selectedIds, setSelectedIds] = React.useState([]);
          const [editingId, setEditingId] = React.useState(null);
          const [draft, setDraft] = React.useState('');
          const [sideDraft, setSideDraft] = React.useState('');
          const [view, setView] = React.useState({ x: 0, y: 0, k: 1 });
          const [panning, setPanning] = React.useState(false);
          const [toast, setToast] = React.useState(null);
          const [exportOpen, setExportOpen] = React.useState(false);

          /* Re-render when the locale dictionary revision changes, so every
           * projected label follows a language switch without re-registering. */
          const localeState = React.useState(ctx.locale.getLocale());
          const setLocaleSnapshot = localeState[1];
          React.useEffect(() => {
            if (!ctx.locale.subscribe) return undefined;
            return ctx.locale.subscribe(() => setLocaleSnapshot(ctx.locale.getLocale()));
          }, []);

          const historyRef = React.useRef({ past: [], future: [] });
          const canvasRef = React.useRef(null);
          const inputRef = React.useRef(null);
          const viewportRef = React.useRef({ width: 0, height: 0 });
          const [viewport, setViewport] = React.useState({ width: 0, height: 0 });
          const fittedRef = React.useRef(null);
          const panRef = React.useRef(null);
          const bandRef = React.useRef(null);
          const [band, setBand] = React.useState(null);
          const toastTimerRef = React.useRef(null);

          const map = maps.length ? maps[Math.min(activeIndex, maps.length - 1)] || maps[0] : null;
          const root = map ? map.root : null;
          const tree = root ? layout(root, measure) : { boxes: [], edges: [], width: 0, height: 0 };
          const total = root ? countNodes(root) : 0;
          /* The last selected node is the primary one the inspector edits. */
          const primaryId = selectedIds.length ? selectedIds[selectedIds.length - 1] : null;
          const selected = root && primaryId ? findNode(root, primaryId) : null;
          const isSelected = (id) => selectedIds.indexOf(id) >= 0;

          /* Centre and scale the drawing to the canvas once per map; after that
           * the user's pan and zoom win until an explicit fit. */
          function fitToViewport(size, geometry) {
            if (!size.width || !size.height || !geometry.width) return { x: 0, y: 0, k: 1 };
            const pad = 26;
            const k = Math.min(
              1.4,
              Math.max(0.25, Math.min((size.width - pad * 2) / geometry.width, (size.height - pad * 2) / geometry.height)),
            );
            return { x: (size.width - geometry.width * k) / 2, y: (size.height - geometry.height * k) / 2, k };
          }

          /* ---- persistence ---- */
          React.useEffect(() => {
            writeStorage(maps, activeIndex);
          }, [maps, activeIndex]);

          /* ---- resolve the side text draft when the selection changes ---- */
          React.useEffect(() => {
            setSideDraft(selected ? selected.text : '');
          }, [primaryId, selected && selected.text]);

          /* ---- toast lifetime ---- */
          React.useEffect(
            () => () => {
              if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
            },
            [],
          );

          const showToast = React.useCallback((message) => {
            setToast(message);
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
            toastTimerRef.current = setTimeout(() => {
              toastTimerRef.current = null;
              setToast(null);
            }, TOAST_MS);
          }, []);

          /* ---- fit the drawing on first mount, on a map switch and on resize ---- */
          React.useEffect(() => {
            if (!root || !viewport.width || !viewport.height) return;
            const key = map.id + ':' + activeIndex;
            if (fittedRef.current === key) return;
            fittedRef.current = key;
            setView(fitToViewport(viewport, tree));
          }, [root, map && map.id, activeIndex, tree.width, tree.height, viewport.width, viewport.height]);

          /* ---- measure the canvas ---- */
          React.useEffect(() => {
            const element = canvasRef.current;
            if (!element) return undefined;
            function read() {
              if (!element.getBoundingClientRect) return;
              const rect = element.getBoundingClientRect();
              const next = { width: Math.round(rect.width || 0), height: Math.round(rect.height || 0) };
              if (next.width !== viewportRef.current.width || next.height !== viewportRef.current.height) {
                viewportRef.current = next;
                fittedRef.current = null;
                setViewport(next);
              }
            }
            read();
            if (typeof window === 'undefined' || !window.ResizeObserver) return undefined;
            const observer = new window.ResizeObserver(read);
            observer.observe(element);
            return () => {
              observer.disconnect();
            };
          }, []);

          /* ---- focus the inline editor ---- */
          React.useEffect(() => {
            const element = inputRef.current;
            if (!element || !editingId) return;
            if (element.focus) element.focus();
            if (element.select) element.select();
          }, [editingId]);

          /* ---- mutations, each recorded on the undo stack ----
           * The history stacks are written before setMaps rather than inside its
           * updater: an updater may run more than once, which would record the
           * same edit twice. */
          const commit = React.useCallback(
            (mutate) => {
              const current = maps[activeIndex];
              if (!current) return;
              const nextRoot = cloneTree(current.root);
              if (mutate(nextRoot) === false) return;
              historyRef.current.past.push(cloneMaps(maps));
              if (historyRef.current.past.length > 50) historyRef.current.past.shift();
              historyRef.current.future.length = 0;
              const next = maps.slice();
              next[activeIndex] = Object.assign({}, current, { root: nextRoot, updatedAt: Date.now() });
              setMaps(next);
            },
            [activeIndex, maps],
          );

          function startEdit(node) {
            if (!node) return;
            setSelectedIds([node.id]);
            setEditingId(node.id);
            setDraft(node.text);
          }

          function stopEdit(shouldCommit) {
            if (!editingId) return;
            const id = editingId;
            const text = draft;
            setEditingId(null);
            if (shouldCommit === true) {
              commit((nextRoot) => {
                const node = findNode(nextRoot, id);
                if (!node || node.text === text) return false;
                node.text = text;
                return true;
              });
            }
          }

          function nextBranchColor(node) {
            if (node !== root) return null;
            return (node.children.length % (PALETTE.length - 1)) + 1;
          }

          function addChild(parentNode) {
            const parent = parentNode || selected || root;
            if (!parent) return;
            const parentId = parent.id;
            const child = newNode(uid('n'), t('node.new'), nextBranchColor(parent));
            commit((nextRoot) => {
              const target = findNode(nextRoot, parentId);
              if (!target) return false;
              target.collapsed = false;
              target.children = target.children.concat([child]);
              return true;
            });
            setSelectedIds([child.id]);
            setEditingId(child.id);
            setDraft(child.text);
          }

          function addSibling(node) {
            const target = node || selected;
            if (!target || target === root) {
              addChild(root);
              return;
            }
            const parent = findParent(root, target.id);
            if (!parent) return;
            const parentId = parent.id;
            const sibling = newNode(uid('n'), t('node.new'), null);
            commit((nextRoot) => {
              const parentNode = findNode(nextRoot, parentId);
              if (!parentNode) return false;
              const children = parentNode.children.slice();
              let index = -1;
              for (let i = 0; i < children.length; i += 1) {
                if (children[i].id === target.id) {
                  index = i;
                  break;
                }
              }
              if (index < 0) children.push(sibling);
              else children.splice(index + 1, 0, sibling);
              parentNode.children = children;
              return true;
            });
            setSelectedIds([sibling.id]);
            setEditingId(sibling.id);
            setDraft(sibling.text);
          }

          /* Deleting any number of nodes is one undoable edit. A node whose
           * ancestor is also being removed is already gone with that ancestor,
           * so only the outermost members of the target set are pruned. */
          function removeNodes(nodes) {
            if (!nodes || !nodes.length) return;
            if (nodes.some((item) => item === root)) showToast(t('toast.cantDeleteRoot'));
            const targets = nodes.filter((item) => item && item !== root);
            if (!targets.length) return;
            const targetIds = {};
            for (let i = 0; i < targets.length; i += 1) targetIds[targets[i].id] = true;
            const toRemove = {};
            for (let i = 0; i < targets.length; i += 1) {
              const path = findPath(root, targets[i].id);
              /* path[0] is the root; any earlier member that is a target covers this one. */
              let covered = false;
              if (path) {
                for (let j = 1; j < path.length - 1; j += 1) {
                  if (targetIds[path[j].id]) {
                    covered = true;
                    break;
                  }
                }
              }
              if (!covered) toRemove[targets[i].id] = true;
            }
            const ids = Object.keys(toRemove);
            if (!ids.length) return;
            commit((nextRoot) => {
              let changed = false;
              function prune(node) {
                const kept = [];
                for (let i = 0; i < node.children.length; i += 1) {
                  const child = node.children[i];
                  if (toRemove[child.id]) {
                    changed = true;
                    continue;
                  }
                  prune(child);
                  kept.push(child);
                }
                if (kept.length !== node.children.length) {
                  if (kept.length === 0) node.collapsed = false;
                  node.children = kept;
                }
              }
              prune(nextRoot);
              return changed;
            });
            setSelectedIds([]);
            setEditingId(null);
          }

          function removeNode(node) {
            const target = node || selected;
            if (!target) return;
            if (target === root) {
              showToast(t('toast.cantDeleteRoot'));
              return;
            }
            removeNodes([target]);
          }

          function setNodeColor(node, color) {
            if (!node) return;
            const id = node.id;
            commit((nextRoot) => {
              const target = findNode(nextRoot, id);
              if (!target || target.color === color) return false;
              target.color = color;
              return true;
            });
          }

          function setNodeText(node, text) {
            if (!node) return;
            const id = node.id;
            commit((nextRoot) => {
              const target = findNode(nextRoot, id);
              if (!target || target.text === text) return false;
              target.text = text;
              return true;
            });
          }

          function toggleCollapse(node) {
            if (!node || node.children.length === 0) return;
            const id = node.id;
            commit((nextRoot) => {
              const target = findNode(nextRoot, id);
              if (!target) return false;
              target.collapsed = !target.collapsed;
              return true;
            });
          }

          function undo() {
            const previous = historyRef.current.past.pop();
            if (!previous) {
              showToast(t('toast.nothingToUndo'));
              return;
            }
            historyRef.current.future.push(cloneMaps(maps));
            setMaps(previous);
            setSelectedIds([]);
            setEditingId(null);
          }

          function redo() {
            const restored = historyRef.current.future.pop();
            if (!restored) {
              showToast(t('toast.nothingToRedo'));
              return;
            }
            historyRef.current.past.push(cloneMaps(maps));
            setMaps(restored);
            setSelectedIds([]);
            setEditingId(null);
          }

          function addMap() {
            const created = createMap(t('maps.rootText'));
            historyRef.current.past.push(cloneMaps(maps));
            if (historyRef.current.past.length > 50) historyRef.current.past.shift();
            historyRef.current.future.length = 0;
            setMaps(maps.concat([created]));
            setActiveIndex(maps.length);
            fittedRef.current = null;
            setSelectedIds([]);
            setEditingId(null);
            showToast(t('maps.new'));
          }

          function removeMap(index) {
            if (typeof window === 'undefined' || !window.confirm) return;
            if (!window.confirm(t('confirm.deleteMap'))) return;
            setMaps((previous) => previous.filter((item, i) => i !== index));
            setActiveIndex((previous) => {
              if (previous > index) return previous - 1;
              return Math.max(0, Math.min(previous, maps.length - 2));
            });
            setSelectedIds([]);
            setEditingId(null);
            fittedRef.current = null;
          }

          function selectMap(index) {
            if (index === activeIndex) return;
            setActiveIndex(index);
            setSelectedIds([]);
            setEditingId(null);
            fittedRef.current = null;
          }

          /* ---- view ---- */
          function fitView() {
            if (!viewportRef.current.width || !viewportRef.current.height || !tree.width) return;
            fittedRef.current = null;
            setView(fitToViewport(viewportRef.current, tree));
          }

          function zoomBy(factor) {
            setView((previous) => {
              const k = Math.min(2.5, Math.max(0.2, previous.k * factor));
              const viewport = viewportRef.current;
              const cx = (viewport.width || 0) / 2;
              const cy = (viewport.height || 0) / 2;
              const ratio = k / previous.k;
              return { x: cx - (cx - previous.x) * ratio, y: cy - (cy - previous.y) * ratio, k };
            });
          }

          /* ---- keyboard shortcuts ----
           * Bound to the canvas rather than the window: the canvas is a single
           * focusable surface, so Tab and Delete mean "grow the selected node"
           * only while the map has focus and never hijack the rest of the app. */
          function onCanvasKeyDown(event) {
            const target = event.target;
            const tag = target && target.tagName ? String(target.tagName).toLowerCase() : '';
            if (tag === 'input' || tag === 'textarea' || (target && target.isContentEditable)) return;
            if (!root) return;
            const node = selected;
            if (event.key === 'Escape') {
              setSelectedIds([]);
              setEditingId(null);
              return;
            }
            /* With no node selected, Tab and Shift+Tab stay ordinary focus
             * movement: that is the way out of this surface by keyboard. */
            if (event.key === 'Tab') {
              if (!node || event.shiftKey) return;
              if (event.preventDefault) event.preventDefault();
              addChild(node);
            } else if (event.key === 'Enter') {
              if (!node) return;
              if (event.preventDefault) event.preventDefault();
              addSibling(node);
            } else if (event.key === 'Delete') {
              if (!selectedIds.length) return;
              if (event.preventDefault) event.preventDefault();
              const targets = [];
              for (let i = 0; i < selectedIds.length; i += 1) {
                const found = findNode(root, selectedIds[i]);
                if (found) targets.push(found);
              }
              removeNodes(targets);
            } else if (event.key === 'F2') {
              if (!node) return;
              if (event.preventDefault) event.preventDefault();
              startEdit(node);
            } else if ((event.metaKey || event.ctrlKey) && (event.key === 'z' || event.key === 'Z')) {
              if (event.preventDefault) event.preventDefault();
              if (event.shiftKey) redo();
              else undo();
            } else if ((event.metaKey || event.ctrlKey) && (event.key === 'y' || event.key === 'Y')) {
              if (event.preventDefault) event.preventDefault();
              redo();
            }
          }

          /* ---- pointer: plain drag box-selects, alt/middle drag pans, ctrl+wheel zooms ---- */
          function beginPan(event) {
            panRef.current = { x: event.clientX, y: event.clientY, view };
            setPanning(true);
            if (event.preventDefault) event.preventDefault();
          }

          function endPan() {
            if (!panRef.current) return;
            panRef.current = null;
            setPanning(false);
          }

          /* Page coordinates to map coordinates: the canvas is the viewport and
           * the world inside it carries the pan/zoom transform. */
          function toMapPoint(event) {
            const element = canvasRef.current;
            if (!element || !element.getBoundingClientRect) return { x: 0, y: 0 };
            const rect = element.getBoundingClientRect();
            return {
              x: (event.clientX - rect.left - view.x) / view.k,
              y: (event.clientY - rect.top - view.y) / view.k,
            };
          }

          /* Replace, extend or toggle the selection, depending on the modifier. */
          function selectNode(id, additive, toggle) {
            if (!id) {
              setSelectedIds([]);
              return;
            }
            setSelectedIds((previous) => {
              if (!additive && !toggle) return [id];
              const has = previous.indexOf(id) >= 0;
              if (toggle) {
                if (!has) return previous.concat([id]);
                return previous.filter((item) => item !== id);
              }
              if (has) return previous;
              return previous.concat([id]);
            });
            setEditingId(null);
          }

          /* Every visible node whose box intersects the dragged rectangle. */
          function nodesInBox(a, b) {
            const left = Math.min(a.x, b.x);
            const right = Math.max(a.x, b.x);
            const top = Math.min(a.y, b.y);
            const bottom = Math.max(a.y, b.y);
            const hits = [];
            for (let i = 0; i < tree.boxes.length; i += 1) {
              const box = tree.boxes[i];
              if (box.x < right && left < box.x + box.width && box.top < bottom && top < box.top + box.height) {
                hits.push(box.node.id);
              }
            }
            return hits;
          }

          function beginBand(event) {
            const point = toMapPoint(event);
            bandRef.current = { origin: point, rect: { x: point.x, y: point.y, width: 0, height: 0 }, additive: !!(event.shiftKey || event.metaKey || event.ctrlKey) };
            setBand(bandRef.current.rect);
            if (event.preventDefault) event.preventDefault();
          }

          /* Read the live rectangle from the ref, not from the render closure:
           * mouse-up is delivered before React has re-rendered with the last move. */
          function endBand() {
            const state = bandRef.current;
            if (!state) return;
            const rect = state.rect;
            bandRef.current = null;
            setBand(null);
            /* A press that never moved is a plain click on empty canvas. */
            if (Math.abs(rect.width) < 3 && Math.abs(rect.height) < 3) {
              if (!state.additive) setSelectedIds([]);
              return;
            }
            const hits = nodesInBox(state.origin, { x: rect.x + rect.width, y: rect.y + rect.height });
            if (state.additive) {
              setSelectedIds((previous) => {
                const next = previous.slice();
                for (let i = 0; i < hits.length; i += 1) {
                  if (next.indexOf(hits[i]) < 0) next.push(hits[i]);
                }
                return next;
              });
            } else {
              setSelectedIds(hits);
            }
            setEditingId(null);
          }

          function onCanvasMove(event) {
            const panState = panRef.current;
            if (panState) {
              setView({ x: panState.view.x + (event.clientX - panState.x), y: panState.view.y + (event.clientY - panState.y), k: panState.view.k });
              return;
            }
            const bandState = bandRef.current;
            if (!bandState) return;
            const point = toMapPoint(event);
            const rect = {
              x: bandState.origin.x,
              y: bandState.origin.y,
              width: point.x - bandState.origin.x,
              height: point.y - bandState.origin.y,
            };
            bandState.rect = rect;
            setBand(rect);
          }

          function onCanvasWheel(event) {
            if (!root) return;
            if (!event.ctrlKey && !event.metaKey) return;
            if (event.preventDefault) event.preventDefault();
            zoomBy(event.deltaY > 0 ? 0.9 : 1.1);
          }

          /* ---- exports ---- */
          function svgDocument() {
            const parts = [];
            parts.push(
              '<svg xmlns="http://www.w3.org/2000/svg" width="' + tree.width + '" height="' + tree.height +
                '" viewBox="0 0 ' + tree.width + ' ' + tree.height + '">',
            );
            parts.push('<g font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif">');
            for (let i = 0; i < tree.edges.length; i += 1) {
              const edge = tree.edges[i];
              const piece = branchPath(edge);
              parts.push(
                '<path d="' + piece.d + '" fill="none" stroke="' + PALETTE[edge.color % PALETTE.length] +
                  '" stroke-opacity="0.74" stroke-width="' + piece.width + '" stroke-linecap="round"/>',
              );
            }
            for (let i = 0; i < tree.boxes.length; i += 1) parts.push(nodeSvg(tree.boxes[i]));
            parts.push('</g></svg>');
            return parts.join('');
          }

          function copyText(text) {
            try {
              if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(
                  () => showToast(t('toast.copied')),
                  () => showToast(t('toast.copyFailed')),
                );
                return;
              }
            } catch (error) {
              /* Fall through to a file download. */
            }
            if (downloadBlob('mindmap.txt', new Blob([text], { type: 'text/plain;charset=utf-8' }))) {
              showToast(t('toast.exported'));
            } else {
              showToast(t('toast.copyFailed'));
            }
          }

          function downloadSvg() {
            if (downloadBlob(mapName(map) + '.svg', new Blob([svgDocument()], { type: 'image/svg+xml;charset=utf-8' }))) {
              showToast(t('toast.exported'));
            } else {
              showToast(t('toast.copyFailed'));
            }
          }

          function downloadPng() {
            const svg = svgDocument();
            if (typeof Image === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined') {
              showToast(t('toast.copyFailed'));
              return;
            }
            const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
            const image = new Image();
            image.onload = () => {
              try {
                const scale = 2;
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(tree.width * scale);
                canvas.height = Math.round(tree.height * scale);
                const context = canvas.getContext('2d');
                context.fillStyle = '#ffffff';
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.drawImage(image, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                  if (blob && downloadBlob(mapName(map) + '.png', blob)) {
                    showToast(t('toast.exported'));
                  } else {
                    showToast(t('toast.copyFailed'));
                  }
                });
              } catch (error) {
                showToast(t('toast.copyFailed'));
              }
              try {
                URL.revokeObjectURL(url);
              } catch (error) {
                /* Best effort. */
              }
            };
            image.onerror = () => showToast(t('toast.copyFailed'));
            image.src = url;
          }

          function copyMarkdown() {
            if (root) copyText(toMarkdown(root));
          }

          function copyJson() {
            if (!map) return;
            copyText(JSON.stringify({ title: mapName(map), root: stripVolatile(map.root) }, null, 2));
          }

          /* The central idea is the map's name; a blank root falls back to the default label. */
          function mapName(item) {
            const rootNode = item && item.root;
            const text = rootNode && typeof rootNode.text === 'string' ? rootNode.text.trim() : '';
            return text || item.title || t('maps.defaultTitle');
          }

          /* ---- render helpers ---- */
          function nodeElement(box, selectedNow) {
            const color = PALETTE[box.color % PALETTE.length];
            const node = box.node;
            const children = [
              h('span', { key: 'label', className: 'dsh-mm-label-text' }, node.text || t('node.empty')),
            ];
            if (node.children.length) {
              children.push(
                h(
                  'button',
                  {
                    key: 'toggle',
                    type: 'button',
                    className: 'dsh-mm-toggle',
                    title: node.collapsed ? t('side.expand') : t('side.collapse'),
                    'aria-label': node.collapsed ? t('side.expand') : t('side.collapse'),
                    'aria-expanded': node.collapsed ? 'false' : 'true',
                    onClick: (event) => {
                      if (event && event.stopPropagation) event.stopPropagation();
                      toggleCollapse(node);
                    },
                  },
                  node.collapsed ? '\u25B8' : '\u25BE',
                ),
              );
              if (node.collapsed) {
                children.push(h('span', { key: 'badge', className: 'dsh-mm-badge' }, String(descendantCount(node))));
              }
            }
            return h(
              'div',
              {
                key: node.id,
                className: 'dsh-mm-node' + (box.isRoot ? ' is-root' : '') + (selectedNow ? ' is-selected' : ''),
                style: {
                  left: box.x,
                  top: box.top,
                  width: box.width,
                  height: box.height,
                  background: color,
                  color: INK,
                },
                role: 'button',
                tabIndex: 0,
                'aria-label': node.text || t('node.empty'),
                'aria-pressed': selectedNow ? 'true' : 'false',
                onClick: (event) => {
                  if (event && event.stopPropagation) event.stopPropagation();
                  selectNode(node.id, !!(event && (event.shiftKey || event.metaKey)), !!(event && event.ctrlKey));
                },
                onDoubleClick: (event) => {
                  if (event && event.stopPropagation) event.stopPropagation();
                  startEdit(node);
                },
                onFocus: () => {
                  if (!isSelected(node.id)) setSelectedIds([node.id]);
                },
              },
              children,
            );
          }

          function inlineEditor() {
            if (!editingId) return null;
            let box = null;
            for (let i = 0; i < tree.boxes.length; i += 1) {
              if (tree.boxes[i].node.id === editingId) {
                box = tree.boxes[i];
                break;
              }
            }
            if (!box) return null;
            return h('textarea', {
              key: 'editor',
              className: 'dsh-mm-input',
              ref: (element) => {
                inputRef.current = element;
              },
              style: {
                left: box.x,
                top: box.top,
                width: Math.max(box.width, 120),
                height: Math.max(box.height, 34),
              },
              value: draft,
              'aria-label': t('toolbar.edit'),
              spellCheck: 'false',
              onChange: (event) => setDraft(event.target.value),
              onBlur: () => stopEdit(true),
              onKeyDown: (event) => {
                if (event.stopPropagation) event.stopPropagation();
                if (event.key === 'Enter' && !event.shiftKey) {
                  if (event.preventDefault) event.preventDefault();
                  stopEdit(true);
                } else if (event.key === 'Escape') {
                  if (event.preventDefault) event.preventDefault();
                  stopEdit(false);
                }
              },
            });
          }

          function inspector() {
            const node = selected;
            const fields = [];
            if (selectedIds.length > 1) {
              /* Several nodes selected: show the bulk actions instead of one node's fields. */
              const targets = [];
              for (let i = 0; i < selectedIds.length; i += 1) {
                const found = findNode(root, selectedIds[i]);
                if (found && found !== root) targets.push(found);
              }
              fields.push(
                h(
                  'div',
                  { className: 'dsh-mm-field', key: 'multi' },
                  h('div', { className: 'dsh-mm-label' }, t('side.multi') + ' ' + selectedIds.length + ' ' + t('panel.unit')),
                  h(
                    'div',
                    { className: 'dsh-mm-row' },
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'dsh-mm-btn',
                        onClick: () => removeNodes(targets),
                        disabled: targets.length === 0,
                      },
                      t('side.deleteSelected'),
                    ),
                    h('button', { type: 'button', className: 'dsh-mm-btn', onClick: () => setSelectedIds([]) }, t('side.clearSelection')),
                  ),
                ),
              );
              fields.push(
                h(
                  'div',
                  { className: 'dsh-mm-field', key: 'multiHint' },
                  h('div', { className: 'dsh-mm-empty-hint' }, t('side.multiHint')),
                ),
              );
            } else if (!node) {
              fields.push(
                h(
                  'div',
                  { key: 'none' },
                  h('div', { className: 'dsh-mm-label' }, t('side.none')),
                  h('div', { className: 'dsh-mm-empty-hint' }, t('side.noneHint')),
                ),
              );
            } else {
              fields.push(
                h(
                  'div',
                  { className: 'dsh-mm-field', key: 'text' },
                  h('span', { className: 'dsh-mm-label' }, t('side.text')),
                  h('textarea', {
                    className: 'dsh-mm-intext',
                    value: sideDraft,
                    'aria-label': t('side.text'),
                    spellCheck: 'false',
                    onChange: (event) => setSideDraft(event.target.value),
                    onBlur: () => setNodeText(node, sideDraft),
                    onKeyDown: (event) => {
                      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                        if (event.preventDefault) event.preventDefault();
                        setNodeText(node, sideDraft);
                      }
                    },
                  }),
                ),
              );
              const swatches = PALETTE.map((color, index) =>
                h('button', {
                  key: 'c' + index,
                  type: 'button',
                  className: 'dsh-mm-swatch',
                  style: { background: color },
                  title: t('side.swatch'),
                  'aria-label': t('side.swatch'),
                  'aria-pressed': node.color === index ? 'true' : 'false',
                  onClick: () => setNodeColor(node, index),
                }),
              );
              if (node !== root) {
                swatches.push(
                  h(
                    'button',
                    {
                      key: 'inherit',
                      type: 'button',
                      className: 'dsh-mm-btn' + (node.color === null ? ' is-active' : ''),
                      onClick: () => setNodeColor(node, null),
                    },
                    t('side.inherit'),
                  ),
                );
              }
              fields.push(
                h(
                  'div',
                  { className: 'dsh-mm-field', key: 'color' },
                  h('span', { className: 'dsh-mm-label' }, t('side.color')),
                  h('div', { className: 'dsh-mm-swatches', role: 'group', 'aria-label': t('side.color') }, swatches),
                ),
              );
              const actions = [
                h(
                  'button',
                  { key: 'add', type: 'button', className: 'dsh-mm-btn', onClick: () => addChild(node) },
                  t('toolbar.addChild'),
                ),
                h(
                  'button',
                  {
                    key: 'sibling',
                    type: 'button',
                    className: 'dsh-mm-btn',
                    onClick: () => addSibling(node),
                    disabled: node === root,
                  },
                  t('toolbar.addSibling'),
                ),
              ];
              if (node.children.length) {
                actions.push(
                  h(
                    'button',
                    { key: 'collapse', type: 'button', className: 'dsh-mm-btn', onClick: () => toggleCollapse(node) },
                    node.collapsed ? t('side.expand') : t('side.collapse'),
                  ),
                );
              }
              if (node !== root) {
                actions.push(
                  h(
                    'button',
                    { key: 'remove', type: 'button', className: 'dsh-mm-btn', onClick: () => removeNode(node) },
                    t('side.delete'),
                  ),
                );
              }
              fields.push(h('div', { className: 'dsh-mm-row', key: 'actions' }, actions));
            }

            const mapRows = maps.map((item, index) =>
              h(
                'div',
                { key: item.id, className: 'dsh-mm-maprow' },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-mm-map' + (index === activeIndex ? ' is-current' : ''),
                    onClick: () => selectMap(index),
                  },
                  h('span', { className: 'dsh-mm-mapname' }, mapName(item)),
                  h('span', { className: 'dsh-mm-mapmeta' }, String(countNodes(item.root))),
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-mm-delmap',
                    title: t('maps.delete'),
                    'aria-label': t('maps.delete'),
                    onClick: () => removeMap(index),
                  },
                  '\u00D7',
                ),
              ),
            );

            return h(
              'aside',
              { className: 'dsh-mm-side' },
              h(
                'div',
                { className: 'dsh-mm-side-head' },
                h(
                  'h2',
                  { className: 'dsh-mm-side-title' },
                  node ? (node === root ? t('side.root') : t('side.title')) : t('side.title'),
                ),
                h('span', { className: 'dsh-mm-side-count' }, total + ' ' + t('panel.unit')),
              ),
              h(
                'div',
                { className: 'dsh-mm-side-body' },
                fields,
                h(
                  'div',
                  { className: 'dsh-mm-field', key: 'maps' },
                  h('span', { className: 'dsh-mm-label' }, t('side.maps')),
                  h('div', { className: 'dsh-mm-maps' }, mapRows),
                ),
              ),
            );
          }

          function toolbar() {
            const items = [
              h('button', { key: 'new', type: 'button', className: 'dsh-mm-btn is-primary', onClick: addMap }, t('toolbar.newMap')),
              h('span', { key: 'sep1', className: 'dsh-mm-sep', 'aria-hidden': 'true' }),
              h('button', { key: 'add', type: 'button', className: 'dsh-mm-btn', onClick: () => addChild(selected) }, t('toolbar.addChild')),
              h(
                'button',
                {
                  key: 'rename',
                  type: 'button',
                  className: 'dsh-mm-btn',
                  onClick: () => startEdit(selected || root),
                  disabled: !(selected || root),
                },
                t('toolbar.edit'),
              ),
              h('span', { key: 'sep2', className: 'dsh-mm-sep', 'aria-hidden': 'true' }),
              h(
                'button',
                { key: 'undo', type: 'button', className: 'dsh-mm-btn', onClick: undo, disabled: historyRef.current.past.length === 0 },
                t('toolbar.undo'),
              ),
              h(
                'button',
                { key: 'redo', type: 'button', className: 'dsh-mm-btn', onClick: redo, disabled: historyRef.current.future.length === 0 },
                t('toolbar.redo'),
              ),
              h('span', { key: 'sep3', className: 'dsh-mm-sep', 'aria-hidden': 'true' }),
              h('button', { key: 'fit', type: 'button', className: 'dsh-mm-btn', onClick: fitView }, t('toolbar.fit')),
              selectedIds.length > 1
                ? h(
                    'button',
                    {
                      key: 'bulkDelete',
                      type: 'button',
                      className: 'dsh-mm-btn',
                      onClick: () => {
                        const targets = [];
                        for (let i = 0; i < selectedIds.length; i += 1) {
                          const found = findNode(root, selectedIds[i]);
                          if (found) targets.push(found);
                        }
                        removeNodes(targets);
                      },
                    },
                    t('side.deleteSelected') + ' (' + selectedIds.length + ')',
                  )
                : null,
              h(
                'button',
                {
                  key: 'export',
                  type: 'button',
                  className: 'dsh-mm-btn' + (exportOpen ? ' is-active' : ''),
                  onClick: () => setExportOpen((previous) => !previous),
                  'aria-expanded': exportOpen ? 'true' : 'false',
                },
                t('toolbar.export'),
              ),
            ];
            if (exportOpen) {
              items.push(
                h(
                  'div',
                  { key: 'exportmenu', className: 'dsh-mm-row' },
                  h('button', { type: 'button', className: 'dsh-mm-btn', onClick: downloadSvg }, t('toolbar.exportSvg')),
                  h('button', { type: 'button', className: 'dsh-mm-btn', onClick: downloadPng }, t('toolbar.exportPng')),
                  h('button', { type: 'button', className: 'dsh-mm-btn', onClick: copyMarkdown }, t('toolbar.exportMd')),
                  h('button', { type: 'button', className: 'dsh-mm-btn', onClick: copyJson }, t('toolbar.exportJson')),
                ),
              );
            }
            return h('div', { className: 'dsh-mm-toolbar' }, items);
          }

          if (!map) {
            return h(
              'div',
              { className: 'dsh-mm-root' },
              h('style', { key: 'styles' }, CSS),
              h(
                'header',
                { className: 'dsh-mm-header', key: 'header' },
                h('span', { className: 'dsh-mm-mark', 'aria-hidden': 'true' }, glyph(18, true)),
                h(
                  'div',
                  { className: 'dsh-mm-heading' },
                  h('h1', { className: 'dsh-mm-title' }, t('panel.title')),
                  h('span', { className: 'dsh-mm-sub' }, t('panel.sub')),
                ),
                h(
                  'div',
                  { className: 'dsh-mm-toolbar' },
                  h('button', { type: 'button', className: 'dsh-mm-btn is-primary', onClick: addMap }, t('maps.new')),
                ),
              ),
              h(
                'div',
                { className: 'dsh-mm-body', key: 'body' },
                h(
                  'div',
                  { className: 'dsh-mm-empty' },
                  h('div', { className: 'dsh-mm-empty-title' }, t('empty.title')),
                  h('div', { className: 'dsh-mm-empty-hint' }, t('empty.hint')),
                ),
              ),
            );
          }

          const edgeSvg = tree.edges.map((edge) => {
            const piece = branchPath(edge);
            return h('path', {
              key: edge.to.node.id,
              className: 'dsh-mm-edge',
              d: piece.d,
              stroke: PALETTE[edge.color % PALETTE.length],
              strokeOpacity: 0.74,
              strokeWidth: piece.width,
            });
          });

          return h(
            'div',
            { className: 'dsh-mm-root' },
            h('style', { key: 'styles' }, CSS),
            h(
              'header',
              { className: 'dsh-mm-header', key: 'header' },
              h('span', { className: 'dsh-mm-mark', 'aria-hidden': 'true' }, glyph(18, true)),
              h(
                'div',
                { className: 'dsh-mm-heading' },
                h('h1', { className: 'dsh-mm-title' }, mapName(map)),
                h('span', { className: 'dsh-mm-sub' }, total + ' ' + t('panel.unit') + ' · ' + t('panel.sub')),
              ),
              toolbar(),
            ),
            h(
              'div',
              { className: 'dsh-mm-body', key: 'body' },
              h(
                'div',
                {
                  className: 'dsh-mm-canvas' + (panning ? ' is-panning' : ''),
                  ref: (element) => {
                    canvasRef.current = element;
                  },
                  tabIndex: 0,
                  'aria-label': t('panel.title'),
                  onKeyDown: onCanvasKeyDown,
                  onMouseDown: (event) => {
                    const target = event && event.target;
                    const tag = target && target.tagName ? String(target.tagName).toLowerCase() : '';
                    const onSurface = !target || target === canvasRef.current || tag === 'svg';
                    /* Focus the canvas only for a press on bare surface: pressing a
                     * node or the inline editor must keep its own focus. */
                    if (onSurface && canvasRef.current && canvasRef.current.focus) canvasRef.current.focus();
                    if (event.button === 1 || (event.button === 0 && event.altKey)) {
                      beginPan(event);
                      return;
                    }
                    /* A press on the surface itself starts a selection band. */
                    if (event.button === 0 && onSurface) beginBand(event);
                  },
                  onMouseMove: onCanvasMove,
                  onMouseUp: () => {
                    endPan();
                    endBand();
                  },
                  onMouseLeave: () => {
                    endPan();
                    endBand();
                  },
                  onWheel: onCanvasWheel,
                  onDoubleClick: (event) => {
                    const target = event && event.target;
                    if (!target || target === canvasRef.current) addChild(root);
                  },
                },
                h(
                  'div',
                  {
                    className: 'dsh-mm-world',
                    key: 'world',
                    style: {
                      width: tree.width,
                      height: tree.height,
                      transform: 'translate(' + view.x + 'px,' + view.y + 'px) scale(' + view.k + ')',
                      transformOrigin: '0 0',
                    },
                  },
                  h(
                    'svg',
                    {
                      className: 'dsh-mm-svg',
                      key: 'svg',
                      viewBox: '0 0 ' + tree.width + ' ' + tree.height,
                      width: tree.width,
                      height: tree.height,
                      style: { width: tree.width, height: tree.height },
                      'aria-hidden': 'true',
                      focusable: 'false',
                    },
                    edgeSvg,
                  ),
                  tree.boxes.map((box) => nodeElement(box, isSelected(box.node.id))),
                  inlineEditor(),
                ),
                band
                  ? h('div', {
                      key: 'band',
                      className: 'dsh-mm-band',
                      style: {
                        left: (band.width < 0 ? band.x + band.width : band.x) * view.k + view.x,
                        top: (band.height < 0 ? band.y + band.height : band.y) * view.k + view.y,
                        width: Math.abs(band.width) * view.k,
                        height: Math.abs(band.height) * view.k,
                      },
                    })
                  : null,
                h('div', { className: 'dsh-mm-hint', key: 'hint' }, t('hint.keys')),
                h(
                  'div',
                  { className: 'dsh-mm-zoom', key: 'zoom' },
                  h(
                    'button',
                    { type: 'button', className: 'dsh-mm-zoombtn', title: t('zoom.out'), 'aria-label': t('zoom.out'), onClick: () => zoomBy(0.85) },
                    '\u2212',
                  ),
                  h('span', { className: 'dsh-mm-zoomval' }, Math.round(view.k * 100) + '%'),
                  h(
                    'button',
                    { type: 'button', className: 'dsh-mm-zoombtn', title: t('zoom.in'), 'aria-label': t('zoom.in'), onClick: () => zoomBy(1.18) },
                    '+',
                  ),
                  h(
                    'button',
                    { type: 'button', className: 'dsh-mm-zoombtn', title: t('zoom.reset'), 'aria-label': t('zoom.reset'), onClick: fitView },
                    '\u2316',
                  ),
                ),
              ),
              inspector(),
            ),
            toast ? h('div', { key: 'toast', className: 'dsh-mm-toast', role: 'status' }, toast) : null,
          );
        }

        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            { name: 'sidebar.panellist', id: PANEL_ID, order: 25, label: () => t('panel.title') },
            PanelIcon,
          ),
        );

        /* The same id addresses this central panel; a missing entry would throw on selection. */
        ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PANEL_ID }, MindMapPanel));
      },
    };
  },
});
