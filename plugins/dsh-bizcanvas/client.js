/**
 * Client half of the Business Model Canvas bundle.
 *
 * Registers one global panel entry in the sidebar (`sidebar.panellist`) and its
 * central panel in the layout's `main` keyed slot, both addressed by the id
 * `bizcanvas`. The canvas document — its named canvases, the nine Osterwalder
 * blocks, their notes and every export — is browser-owned and persists in
 * localStorage; the Host half registers nothing.
 *
 * Plain browser JavaScript loaded by the harness module loader; `require` is
 * only ever called with 'react'.
 */
window.__ModuleLoader__.load({
  id: '@local/dsh-bizcanvas',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'bizcanvas';
    const PANEL_ID = 'bizcanvas';
    const STORAGE_KEY = 'dsh.bizcanvas.doc.v1';
    const DOC_VERSION = 1;
    const TOAST_MS = 2600;

    /* ---- artwork ------------------------------------------------------------
     * The nine block accents and the six sticky-note tints are the artwork of
     * this panel, so they carry literal colours. Every piece of chrome around
     * them (surfaces, borders, labels, buttons, the drop indicator, focus rings,
     * empty states) uses host theme tokens. */
    const BLOCKS = [
      { id: 'keyPartners', accent: '#4a6fa5', col: '1 / 3', row: '1 / 3' },
      { id: 'keyActivities', accent: '#3f7d6a', col: '3 / 5', row: '1 / 2' },
      { id: 'keyResources', accent: '#2f8f8f', col: '3 / 5', row: '2 / 3' },
      { id: 'valuePropositions', accent: '#c9772f', col: '5 / 7', row: '1 / 3' },
      { id: 'customerRelationships', accent: '#8a5fb0', col: '7 / 9', row: '1 / 2' },
      { id: 'channels', accent: '#3d7bb8', col: '7 / 9', row: '2 / 3' },
      { id: 'customerSegments', accent: '#b3543f', col: '9 / 11', row: '1 / 3' },
      { id: 'costStructure', accent: '#6b6f7d', col: '1 / 6', row: '3 / 4' },
      { id: 'revenueStreams', accent: '#2f8a52', col: '6 / 11', row: '3 / 4' },
    ];
    const BLOCK_IDS = [];
    const BLOCK_BY_ID = {};
    for (let i = 0; i < BLOCKS.length; i += 1) {
      BLOCK_IDS.push(BLOCKS[i].id);
      BLOCK_BY_ID[BLOCKS[i].id] = BLOCKS[i];
    }

    /** `color: null` means "no tint": the note uses theme tokens instead. */
    const TINTS = [
      { id: null, key: 'color.default', value: null },
      { id: 'yellow', key: 'color.yellow', value: '#ffe9a8' },
      { id: 'pink', key: 'color.pink', value: '#ffd9e2' },
      { id: 'green', key: 'color.green', value: '#cdeecb' },
      { id: 'blue', key: 'color.blue', value: '#cfe4ff' },
      { id: 'purple', key: 'color.purple', value: '#e2d9ff' },
      { id: 'orange', key: 'color.orange', value: '#ffddc4' },
    ];
    const TINT_BY_ID = {};
    for (let i = 0; i < TINTS.length; i += 1) TINT_BY_ID[String(TINTS[i].id)] = TINTS[i].value;
    /* Sticky-note surfaces stay light in either theme, so their ink is fixed. */
    const NOTE_INK = '#23262b';

    const GRID_CSS = BLOCKS.map(function (block) {
      return (
        '.dsh-bc-grid>.dsh-bc-block.is-' +
        block.id +
        '{grid-column:' +
        block.col +
        ';grid-row:' +
        block.row +
        '}'
      );
    }).join('');

    const CSS = [
      '.dsh-bc-root{position:relative;display:flex;flex-direction:column;height:100%;min-height:0;box-sizing:border-box;',
      'background:var(--dsw-alias-bg-base);padding-top:var(--dsh-frame-top-clearance,0px);color:var(--dsw-alias-label-primary)}',
      '.dsh-bc-header{display:flex;flex:none;align-items:center;gap:12px;padding:18px 24px 10px}',
      '.dsh-bc-mark{display:block;flex:none;color:var(--dsw-alias-label-primary)}',
      '.dsh-bc-titles{display:flex;flex-direction:column;gap:2px;min-width:0}',
      '.dsh-bc-title{margin:0;font-size:16px;font-weight:600;line-height:1.3;color:var(--dsw-alias-label-primary)}',
      '.dsh-bc-subtitle{font-size:12px;line-height:1.4;color:var(--dsw-alias-label-secondary)}',
      '.dsh-bc-spacer{flex:1;min-width:0}',
      '.dsh-bc-action{display:inline-flex;flex:none;align-items:center;gap:6px;height:30px;padding:0 12px;',
      'border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);',
      'color:var(--dsw-alias-label-primary);font-family:inherit;font-size:13px;cursor:pointer;',
      'transition:background .15s ease,border-color .15s ease}',
      '.dsh-bc-action:hover{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-brand-primary)}',
      '.dsh-bc-action:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
      '.dsh-bc-plus{font-size:15px;line-height:1}',
      '.dsh-bc-menu-wrap{position:relative;flex:none}',
      '.dsh-bc-menu{position:absolute;top:calc(100% + 5px);right:0;z-index:20;display:flex;flex-direction:column;',
      'min-width:172px;padding:5px;border:1px solid var(--dsw-alias-border-l2);border-radius:9px;',
      'background:var(--dsw-alias-bg-layer-2);box-shadow:0 10px 24px -14px rgba(0,0,0,.5)}',
      '.dsh-bc-menu-item{display:flex;align-items:center;width:100%;box-sizing:border-box;padding:7px 9px;',
      'border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-primary);',
      'font-family:inherit;font-size:13px;text-align:left;cursor:pointer;white-space:nowrap}',
      '.dsh-bc-menu-item:hover{background:var(--dsw-alias-bg-layer-1)}',
      '.dsh-bc-menu-item:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}',
      '.dsh-bc-bar{display:flex;flex:none;align-items:center;gap:10px;padding:0 24px 10px;flex-wrap:wrap}',
      '.dsh-bc-tabs{display:flex;align-items:center;gap:4px;min-width:0;overflow-x:auto;padding-bottom:1px}',
      '.dsh-bc-tab{flex:none;max-width:168px;padding:5px 11px;border:1px solid var(--dsw-alias-border-l2);',
      'border-radius:999px;background:transparent;color:var(--dsw-alias-label-secondary);font-family:inherit;',
      'font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;',
      'transition:background .15s ease,color .15s ease,border-color .15s ease}',
      '.dsh-bc-tab:hover{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}',
      '.dsh-bc-tab[aria-selected="true"]{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);',
      'border-color:var(--dsw-alias-brand-primary);font-weight:600}',
      '.dsh-bc-tab:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dsh-bc-tab-new{flex:none;display:grid;place-items:center;width:26px;height:26px;padding:0;',
      'border:1px dashed var(--dsw-alias-border-l2);border-radius:999px;background:transparent;',
      'color:var(--dsw-alias-label-secondary);font-family:inherit;font-size:15px;line-height:1;cursor:pointer}',
      '.dsh-bc-tab-new:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-brand-primary)}',
      '.dsh-bc-tab-new:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dsh-bc-name{flex:1 1 150px;min-width:120px;max-width:300px;height:28px;box-sizing:border-box;padding:0 9px;',
      'border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:var(--dsw-alias-bg-layer-1);',
      'color:var(--dsw-alias-label-primary);font-family:inherit;font-size:12.5px}',
      '.dsh-bc-name:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-1px}',
      '.dsh-bc-icon-btn{display:grid;place-items:center;flex:none;width:24px;height:24px;padding:0;',
      'border:1px solid transparent;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);',
      'cursor:pointer;transition:background .15s ease,color .15s ease}',
      '.dsh-bc-icon-btn:hover{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}',
      '.dsh-bc-icon-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dsh-bc-scroll{flex:1;min-height:0;overflow:auto;padding:0 24px 24px}',
      '.dsh-bc-grid{display:grid;grid-template-columns:repeat(11,minmax(0,1fr));',
      'grid-template-rows:minmax(176px,1fr) minmax(176px,1fr) minmax(132px,0.8fr);',
      'gap:10px;min-width:940px;align-items:stretch}',
      '.dsh-bc-block{display:flex;flex-direction:column;min-width:0;min-height:0;box-sizing:border-box;',
      'border:1px solid var(--dsw-alias-border-l2);border-radius:9px;background:var(--dsw-alias-bg-layer-1);',
      'overflow:hidden;transition:border-color .15s ease,background .15s ease}',
      '.dsh-bc-block.is-target{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-2)}',
      '.dsh-bc-block-head{display:flex;flex:none;align-items:center;gap:6px;padding:8px 8px 6px 10px;',
      'border-bottom:1px solid var(--dsw-alias-border-l2)}',
      '.dsh-bc-block-rule{flex:none;width:3px;height:15px;border-radius:2px}',
      '.dsh-bc-block-title{margin:0;flex:1;min-width:0;font-size:12.5px;font-weight:600;line-height:1.35;',
      'color:var(--dsw-alias-label-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.dsh-bc-block-count{flex:none;font-size:10.5px;color:var(--dsw-alias-label-secondary);white-space:nowrap}',
      '.dsh-bc-block-q{flex:none;margin:0;padding:6px 10px 0;font-size:11px;line-height:1.4;',
      'color:var(--dsw-alias-label-secondary)}',
      '.dsh-bc-items{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column;',
      'gap:6px;padding:8px}',
      '.dsh-bc-block-empty{padding:10px 8px;border:1px dashed var(--dsw-alias-border-l2);border-radius:7px;',
      'font-size:11.5px;line-height:1.45;color:var(--dsw-alias-label-secondary);text-align:center}',
      '.dsh-bc-drop{flex:none;height:2px;margin:1px 2px;border-radius:2px;background:var(--dsw-alias-brand-primary)}',
      '.dsh-bc-item{position:relative;display:flex;flex-direction:column;gap:4px;padding:7px 8px 6px;',
      'border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:var(--dsw-alias-bg-layer-2);',
      'transition:border-color .15s ease,opacity .15s ease}',
      '.dsh-bc-item.is-tinted{border-color:rgba(0,0,0,.14)}',
      '.dsh-bc-item:hover{border-color:var(--dsw-alias-brand-primary)}',
      '.dsh-bc-item.is-drag{opacity:.45}',
      '.dsh-bc-item-open{display:block;width:100%;box-sizing:border-box;padding:0 20px 0 0;border:0;',
      'background:transparent;text-align:left;font-family:inherit;font-size:12px;line-height:1.45;',
      'color:inherit;cursor:grab;overflow-wrap:anywhere;white-space:pre-wrap}',
      '.dsh-bc-item-open:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;',
      'border-radius:4px}',
      '.dsh-bc-item-open.is-untitled{font-style:italic;opacity:.72}',
      '.dsh-bc-item-actions{display:flex;align-items:center;gap:2px;opacity:0;visibility:hidden;',
      'transition:opacity .15s ease}',
      '.dsh-bc-item:hover .dsh-bc-item-actions,.dsh-bc-item:focus-within .dsh-bc-item-actions{opacity:1;visibility:visible}',
      '.dsh-bc-mini{display:grid;place-items:center;flex:none;width:20px;height:20px;padding:0;border:0;',
      'border-radius:5px;background:transparent;color:inherit;opacity:.72;cursor:pointer}',
      '.dsh-bc-mini:hover:not(:disabled){background:rgba(0,0,0,.08);opacity:1}',
      '.dsh-bc-mini:focus-visible{opacity:1;outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dsh-bc-mini:disabled{opacity:.24;cursor:default}',
      '.dsh-bc-item-del{margin-left:auto}',
      '.dsh-bc-scrim{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;',
      'padding:24px;background:rgba(0,0,0,.42)}',
      '.dsh-bc-dialog{display:flex;flex-direction:column;gap:12px;width:min(440px,100%);max-height:100%;',
      'box-sizing:border-box;padding:18px 18px 14px;border:1px solid var(--dsw-alias-border-l2);',
      'border-radius:12px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);',
      'box-shadow:0 24px 48px -24px rgba(0,0,0,.6);overflow:auto}',
      '.dsh-bc-dialog-title{margin:0;font-size:14px;font-weight:600;line-height:1.3}',
      '.dsh-bc-field{display:flex;flex-direction:column;gap:5px}',
      '.dsh-bc-label{font-size:11.5px;color:var(--dsw-alias-label-secondary)}',
      '.dsh-bc-input,.dsh-bc-textarea,.dsh-bc-select{width:100%;box-sizing:border-box;padding:7px 9px;',
      'border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:var(--dsw-alias-bg-layer-1);',
      'color:var(--dsw-alias-label-primary);font-family:inherit;font-size:13px}',
      '.dsh-bc-textarea{min-height:96px;resize:vertical;line-height:1.5}',
      '.dsh-bc-input:focus-visible,.dsh-bc-textarea:focus-visible,.dsh-bc-select:focus-visible{',
      'outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-1px}',
      '.dsh-bc-swatches{display:flex;align-items:center;gap:7px;flex-wrap:wrap}',
      '.dsh-bc-swatch{width:20px;height:20px;flex:none;padding:0;border:1px solid var(--dsw-alias-border-l2);',
      'border-radius:50%;cursor:pointer;transition:transform .12s ease}',
      '.dsh-bc-swatch[aria-pressed="true"]{box-shadow:0 0 0 2px var(--dsw-alias-bg-base),0 0 0 3px var(--dsw-alias-brand-primary)}',
      '.dsh-bc-swatch:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
      '.dsh-bc-dialog-foot{display:flex;align-items:center;gap:8px;padding-top:2px}',
      '.dsh-bc-btn{display:inline-flex;align-items:center;justify-content:center;height:30px;padding:0 13px;',
      'border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);',
      'color:var(--dsw-alias-label-primary);font-family:inherit;font-size:13px;cursor:pointer}',
      '.dsh-bc-btn:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.dsh-bc-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
      '.dsh-bc-btn.is-primary{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);',
      'color:var(--dsw-alias-bg-base);font-weight:600}',
      '.dsh-bc-btn.is-primary:hover{filter:brightness(1.06)}',
      '.dsh-bc-btn.is-danger{border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary)}',
      '.dsh-bc-btn.is-danger:hover{color:var(--dsw-alias-label-primary)}',
      '.dsh-bc-dialog-foot-spacer{flex:1}',
      '.dsh-bc-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;',
      'min-height:260px;margin:6px 0;border:1px dashed var(--dsw-alias-border-l2);border-radius:10px;',
      'color:var(--dsw-alias-label-secondary);text-align:center}',
      '.dsh-bc-empty-title{font-size:14px;color:var(--dsw-alias-label-primary)}',
      '.dsh-bc-empty-hint{font-size:12.5px;max-width:340px;line-height:1.5}',
      '.dsh-bc-toast{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);z-index:70;',
      'padding:7px 14px;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;',
      'background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-size:12.5px;',
      'box-shadow:0 8px 20px -12px rgba(0,0,0,.5);white-space:nowrap}',
      '.dsh-bc-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;',
      'clip:rect(0,0,0,0);white-space:nowrap;border:0}',
      '@media (prefers-reduced-motion: reduce){.dsh-bc-action,.dsh-bc-tab,.dsh-bc-block,.dsh-bc-item,',
      '.dsh-bc-item-actions,.dsh-bc-icon-btn,.dsh-bc-swatch{transition:none}}',
      /* Narrow panels stack the nine blocks in the frozen reading order. This
       * rule is last so it wins over the per-block grid placement above. */
      '@media (max-width: 900px){.dsh-bc-root .dsh-bc-grid>.dsh-bc-block{grid-column:1 / -1;grid-row:auto;',
      'min-height:132px}.dsh-bc-root .dsh-bc-grid{grid-template-columns:1fr;grid-template-rows:none;min-width:0}}',
      GRID_CSS,
    ].join('');

    /* ---- model --------------------------------------------------------------
     * A document is { version, activeId, canvases }. A canvas is
     * { id, name, blocks, createdAt, updatedAt }, where `blocks` always holds
     * all nine frozen block ids, each an array of items. An item is
     * { id, text, color, createdAt, updatedAt }; array index is its order. */

    function uid(prefix) {
      return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    function nowMs() {
      return Date.now();
    }

    function emptyBlocks() {
      const blocks = {};
      for (let i = 0; i < BLOCK_IDS.length; i += 1) blocks[BLOCK_IDS[i]] = [];
      return blocks;
    }

    function makeCanvas(name) {
      const stamp = nowMs();
      return {
        id: uid('c'),
        name: typeof name === 'string' ? name : '',
        blocks: emptyBlocks(),
        createdAt: stamp,
        updatedAt: stamp,
      };
    }

    function makeItem(text, color) {
      const stamp = nowMs();
      return {
        id: uid('i'),
        text: typeof text === 'string' ? text : '',
        color: typeof color === 'string' && TINT_BY_ID[color] ? color : null,
        createdAt: stamp,
        updatedAt: stamp,
      };
    }

    function bootstrapDoc() {
      const canvas = makeCanvas('');
      return { version: DOC_VERSION, activeId: canvas.id, canvases: [canvas] };
    }

    function isBlockId(value) {
      return typeof value === 'string' && Object.prototype.hasOwnProperty.call(BLOCK_BY_ID, value);
    }

    /** Keep only well-formed items, so stale or hand-edited storage cannot break a block. */
    function sanitizeItems(raw, seen) {
      if (!Array.isArray(raw)) return [];
      const items = [];
      for (let i = 0; i < raw.length; i += 1) {
        const entry = raw[i];
        if (!entry || typeof entry !== 'object') continue;
        let id = typeof entry.id === 'string' && entry.id ? entry.id : uid('i');
        if (seen[id]) id = uid('i');
        seen[id] = true;
        const created = typeof entry.createdAt === 'number' ? entry.createdAt : nowMs();
        items.push({
          id: id,
          text: typeof entry.text === 'string' ? entry.text : '',
          color: typeof entry.color === 'string' && TINT_BY_ID[entry.color] ? entry.color : null,
          createdAt: created,
          updatedAt: typeof entry.updatedAt === 'number' ? entry.updatedAt : created,
        });
      }
      return items;
    }

    /** Accepts any payload; returns a well-formed document or null when unusable. */
    function sanitizeDoc(raw) {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
      if (!Array.isArray(raw.canvases)) return null;
      const canvases = [];
      const seenCanvas = {};
      for (let i = 0; i < raw.canvases.length; i += 1) {
        const entry = raw.canvases[i];
        if (!entry || typeof entry !== 'object') continue;
        let id = typeof entry.id === 'string' && entry.id ? entry.id : uid('c');
        if (seenCanvas[id]) id = uid('c');
        seenCanvas[id] = true;
        const sourceBlocks = entry.blocks && typeof entry.blocks === 'object' ? entry.blocks : {};
        const seenItem = {};
        const blocks = {};
        for (let b = 0; b < BLOCK_IDS.length; b += 1) {
          const key = BLOCK_IDS[b];
          blocks[key] = sanitizeItems(sourceBlocks[key], seenItem);
        }
        const created = typeof entry.createdAt === 'number' ? entry.createdAt : nowMs();
        canvases.push({
          id: id,
          name: typeof entry.name === 'string' ? entry.name : '',
          blocks: blocks,
          createdAt: created,
          updatedAt: typeof entry.updatedAt === 'number' ? entry.updatedAt : created,
        });
      }
      if (canvases.length === 0) return { version: DOC_VERSION, activeId: '', canvases: [] };
      let activeId = typeof raw.activeId === 'string' ? raw.activeId : '';
      let matched = false;
      for (let i = 0; i < canvases.length; i += 1) {
        if (canvases[i].id === activeId) {
          matched = true;
          break;
        }
      }
      if (!matched) activeId = canvases[0].id;
      return { version: DOC_VERSION, activeId: activeId, canvases: canvases };
    }

    function cloneDoc(doc) {
      const canvases = [];
      for (let i = 0; i < doc.canvases.length; i += 1) {
        const canvas = doc.canvases[i];
        const blocks = {};
        for (let b = 0; b < BLOCK_IDS.length; b += 1) {
          blocks[BLOCK_IDS[b]] = canvas.blocks[BLOCK_IDS[b]].map(function (item) {
            return {
              id: item.id,
              text: item.text,
              color: item.color,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
            };
          });
        }
        canvases.push({
          id: canvas.id,
          name: canvas.name,
          blocks: blocks,
          createdAt: canvas.createdAt,
          updatedAt: canvas.updatedAt,
        });
      }
      return { version: DOC_VERSION, activeId: doc.activeId, canvases: canvases };
    }

    function loadDoc() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return sanitizeDoc(JSON.parse(raw));
      } catch (error) {
        return null;
      }
    }

    function saveDoc(doc) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
      } catch (error) {
        /* Storage is unavailable; the canvas keeps working for this page. */
      }
    }

    function activeCanvasOf(doc) {
      if (!doc || doc.canvases.length === 0) return null;
      for (let i = 0; i < doc.canvases.length; i += 1) {
        if (doc.canvases[i].id === doc.activeId) return doc.canvases[i];
      }
      return doc.canvases[0];
    }

    function findBlockOf(canvas, itemId) {
      for (let b = 0; b < BLOCK_IDS.length; b += 1) {
        const list = canvas.blocks[BLOCK_IDS[b]];
        for (let i = 0; i < list.length; i += 1) {
          if (list[i].id === itemId) return { block: BLOCK_IDS[b], index: i };
        }
      }
      return null;
    }

    /** A filename-safe stem from the canvas name; falls back to a stable literal. */
    function slugOf(name) {
      const source = typeof name === 'string' ? name.trim() : '';
      if (!source) return 'canvas';
      const slug = source
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48);
      return slug || 'canvas';
    }

    function dateStamp(date) {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return (
        String(date.getFullYear()) +
        (month < 10 ? '0' : '') +
        month +
        (day < 10 ? '0' : '') +
        day
      );
    }

    /** Blob download; the object URL is always revoked. */
    function downloadText(filename, text, mime) {
      try {
        const blob = new Blob([text], { type: mime });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.rel = 'noopener';
        anchor.click();
        URL.revokeObjectURL(url);
        return true;
      } catch (error) {
        return false;
      }
    }

    /** The 3x3 canvas glyph, inherited in `currentColor` so the host colors it. */
    function glyph(size, active) {
      const edge = active ? 1.7 : 1.5;
      const line = { fill: 'none', stroke: 'currentColor', strokeWidth: edge, strokeLinejoin: 'round' };
      return h(
        'svg',
        { viewBox: '0 0 20 20', width: size, height: size, 'aria-hidden': 'true', style: { display: 'block' } },
        h('rect', Object.assign({ x: 2.4, y: 3.4, width: 15.2, height: 13.2, rx: 1.6 }, line)),
        h('path', Object.assign({ d: 'M7.5 3.4v13.2M12.5 3.4v13.2M2.4 9.9h15.2' }, line)),
      );
    }

    /** Owner props of `sidebar.panellist`: the row supplies the requested square edge. */
    function PanelIcon(props) {
      const size = props && typeof props.size === 'number' && props.size > 0 ? props.size : 20;
      return glyph(size, !!(props && props.active));
    }

    const DICT = {
      zh: {
        'panel.title': '商业画布',
        'panel.subtitle': '九个模块，一页想清楚商业模式',
        'panel.newCanvas': '新建画布',
        'panel.unit': '张画布',
        'panel.rename': '画布名称',
        'panel.export': '导出',
        'panel.deleteCanvas': '删除当前画布',
        'panel.canvasList': '画布列表',
        'panel.exportMarkdown': '导出 Markdown',
        'panel.exportJson': '导出 JSON',
        'panel.copyMarkdown': '复制 Markdown',

        'block.keyPartners': '重要合作',
        'block.keyActivities': '关键业务',
        'block.keyResources': '核心资源',
        'block.valuePropositions': '价值主张',
        'block.customerRelationships': '客户关系',
        'block.channels': '渠道通路',
        'block.customerSegments': '客户细分',
        'block.costStructure': '成本结构',
        'block.revenueStreams': '收入来源',
        'block.addItem': '添加条目',
        'block.empty': '还没有条目',
        'block.unit': '条',

        'question.keyPartners': '谁是我们最重要的合作伙伴与供应商？',
        'question.keyActivities': '价值主张需要哪些关键业务活动？',
        'question.keyResources': '价值主张需要哪些核心资源？',
        'question.valuePropositions': '我们为客户解决什么问题、创造什么价值？',
        'question.customerRelationships': '我们与每类客户建立什么样的关系？',
        'question.channels': '我们通过哪些渠道触达客户？',
        'question.customerSegments': '我们为谁创造价值？谁是最重要的客户？',
        'question.costStructure': '商业模式中最重要的成本是什么？',
        'question.revenueStreams': '客户愿意为什么付费？如何付费？',

        'item.untitled': '未命名条目',
        'item.edit': '编辑条目',
        'item.delete': '删除条目',
        'item.movePrev': '移到上一个模块',
        'item.moveNext': '移到下一个模块',
        'item.color': '条目颜色',
        'color.default': '默认',
        'color.yellow': '黄色',
        'color.pink': '粉色',
        'color.green': '绿色',
        'color.blue': '蓝色',
        'color.purple': '紫色',
        'color.orange': '橙色',

        'editor.title': '编辑条目',
        'editor.newTitle': '新建条目',
        'editor.fieldText': '内容',
        'editor.fieldBlock': '所属模块',
        'editor.fieldColor': '颜色',
        'editor.textPlaceholder': '写清楚这条要说的是什么…',
        'editor.save': '保存',
        'editor.cancel': '取消',
        'editor.delete': '删除',

        'empty.title': '还没有画布',
        'empty.hint': '新建一张商业画布，从九个模块开始梳理你的商业模式',
        'empty.create': '新建画布',

        'canvas.untitled': '未命名画布',
        'confirm.deleteCanvas': '删除后无法恢复。确定删除当前画布吗？',
        'export.empty': '（这张画布还没有任何条目）',

        'toast.copied': '已复制到剪贴板',
        'toast.copyFailed': '复制失败，请手动保存',
        'toast.exported': '已导出',

        'aria.canvas': '商业模式画布',
        'aria.block': '模块',
        'aria.dragging': '正在拖动',
        'aria.item': '条目',
        'aria.tabs': '画布标签',
      },
      en: {
        'panel.title': 'Business Model Canvas',
        'panel.subtitle': 'Nine blocks to work out a business model on one page',
        'panel.newCanvas': 'New canvas',
        'panel.unit': 'canvases',
        'panel.rename': 'Canvas name',
        'panel.export': 'Export',
        'panel.deleteCanvas': 'Delete current canvas',
        'panel.canvasList': 'Canvas list',
        'panel.exportMarkdown': 'Export Markdown',
        'panel.exportJson': 'Export JSON',
        'panel.copyMarkdown': 'Copy Markdown',

        'block.keyPartners': 'Key Partners',
        'block.keyActivities': 'Key Activities',
        'block.keyResources': 'Key Resources',
        'block.valuePropositions': 'Value Propositions',
        'block.customerRelationships': 'Customer Relationships',
        'block.channels': 'Channels',
        'block.customerSegments': 'Customer Segments',
        'block.costStructure': 'Cost Structure',
        'block.revenueStreams': 'Revenue Streams',
        'block.addItem': 'Add item',
        'block.empty': 'No items yet',
        'block.unit': 'items',

        'question.keyPartners': 'Who are our key partners and suppliers?',
        'question.keyActivities': 'Which key activities does our value proposition need?',
        'question.keyResources': 'Which key resources does our value proposition need?',
        'question.valuePropositions': 'What problem do we solve, and what value do we create?',
        'question.customerRelationships': 'What relationship does each customer segment expect?',
        'question.channels': 'Through which channels do we reach customers?',
        'question.customerSegments': 'For whom do we create value? Who are our most important customers?',
        'question.costStructure': 'What are the most important costs in our model?',
        'question.revenueStreams': 'For what value are customers willing to pay, and how?',

        'item.untitled': 'Untitled item',
        'item.edit': 'Edit item',
        'item.delete': 'Delete item',
        'item.movePrev': 'Move to previous block',
        'item.moveNext': 'Move to next block',
        'item.color': 'Item colour',
        'color.default': 'Default',
        'color.yellow': 'Yellow',
        'color.pink': 'Pink',
        'color.green': 'Green',
        'color.blue': 'Blue',
        'color.purple': 'Purple',
        'color.orange': 'Orange',

        'editor.title': 'Edit item',
        'editor.newTitle': 'New item',
        'editor.fieldText': 'Text',
        'editor.fieldBlock': 'Block',
        'editor.fieldColor': 'Colour',
        'editor.textPlaceholder': 'Say plainly what this note is…',
        'editor.save': 'Save',
        'editor.cancel': 'Cancel',
        'editor.delete': 'Delete',

        'empty.title': 'No canvases yet',
        'empty.hint': 'Create a business model canvas and start with the nine blocks',
        'empty.create': 'New canvas',

        'canvas.untitled': 'Untitled canvas',
        'confirm.deleteCanvas': 'This cannot be undone. Delete the current canvas?',
        'export.empty': '(This canvas has no items yet)',

        'toast.copied': 'Copied to clipboard',
        'toast.copyFailed': 'Copy failed — save it manually',
        'toast.exported': 'Exported',

        'aria.canvas': 'Business model canvas',
        'aria.block': 'Block',
        'aria.dragging': 'Dragging',
        'aria.item': 'Item',
        'aria.tabs': 'Canvas tabs',
      },
    };

    return {
      inject: ['slots', 'locale'],

      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, DICT), 'bizcanvas: dictionaries');

        const t = ctx.locale.bind(NS);

        /* ---- document operations (pure) ---------------------------------- */

        /** Replace the active canvas through `mutate`; returns the same doc on no change. */
        function withCanvas(doc, mutate) {
          const index = (function () {
            for (let i = 0; i < doc.canvases.length; i += 1) {
              if (doc.canvases[i].id === doc.activeId) return i;
            }
            return -1;
          })();
          if (index < 0) return doc;
          const canvas = doc.canvases[index];
          const next = mutate(canvas);
          if (!next || next === canvas) return doc;
          const canvases = doc.canvases.slice();
          canvases[index] = Object.assign({}, next, { updatedAt: nowMs() });
          return Object.assign({}, doc, { canvases: canvases });
        }

        /** Move one item to `toBlock` at `targetIndex`; dropping on its own slot is a no-op. */
        function moveItemIn(doc, itemId, toBlock, targetIndex) {
          if (!isBlockId(toBlock)) return doc;
          return withCanvas(doc, function (canvas) {
            const found = findBlockOf(canvas, itemId);
            if (!found) return null;
            const target = canvas.blocks[toBlock];
            let index = Math.max(0, Math.min(Math.round(targetIndex), target.length));
            /* Both of these land the item exactly where it already is. */
            if (found.block === toBlock && (index === found.index || index === found.index + 1)) return null;
            const blocks = Object.assign({}, canvas.blocks);
            const source = blocks[found.block].slice();
            source.splice(found.index, 1);
            blocks[found.block] = source;
            const destination = blocks[toBlock].slice();
            let insertAt = index;
            if (found.block === toBlock && index > found.index) insertAt = index - 1;
            destination.splice(insertAt, 0, canvas.blocks[found.block][found.index]);
            blocks[toBlock] = destination;
            return Object.assign({}, canvas, { blocks: blocks });
          });
        }

        function patchItemIn(doc, itemId, patch) {
          return withCanvas(doc, function (canvas) {
            const found = findBlockOf(canvas, itemId);
            if (!found) return null;
            const blocks = Object.assign({}, canvas.blocks);
            const list = blocks[found.block].slice();
            list[found.index] = Object.assign({}, list[found.index], patch, { updatedAt: nowMs() });
            blocks[found.block] = list;
            return Object.assign({}, canvas, { blocks: blocks });
          });
        }

        function removeItemIn(doc, itemId) {
          return withCanvas(doc, function (canvas) {
            const found = findBlockOf(canvas, itemId);
            if (!found) return null;
            const blocks = Object.assign({}, canvas.blocks);
            blocks[found.block] = blocks[found.block].filter(function (item) {
              return item.id !== itemId;
            });
            return Object.assign({}, canvas, { blocks: blocks });
          });
        }

        function addItemIn(doc, blockId) {
          let created = null;
          const next = withCanvas(doc, function (canvas) {
            if (!isBlockId(blockId)) return null;
            const item = makeItem('', null);
            created = item;
            const blocks = Object.assign({}, canvas.blocks);
            blocks[blockId] = blocks[blockId].concat([item]);
            return Object.assign({}, canvas, { blocks: blocks });
          });
          return { doc: next, item: created };
        }

        function BizCanvasPanel() {
          const bootRef = React.useRef(null);
          if (!bootRef.current) bootRef.current = loadDoc() || bootstrapDoc();

          const [doc, setDoc] = React.useState(bootRef.current);
          const [editing, setEditing] = React.useState(null);
          const [dragId, setDragId] = React.useState(null);
          const [dropTarget, setDropTarget] = React.useState(null);
          const [menuOpen, setMenuOpen] = React.useState(false);
          const [toast, setToast] = React.useState(null);

          const textRef = React.useRef(null);
          const itemRefs = React.useRef({});
          const toastTimer = React.useRef(null);
          const menuRef = React.useRef(null);

          /* Re-render when the locale revision changes, so every projected label
           * follows a language switch without re-registering the dictionary. */
          const localeTick = React.useState(0);
          const bumpLocale = localeTick[1];
          React.useEffect(
            function () {
              if (!ctx.locale.subscribe) return undefined;
              return ctx.locale.subscribe(function () {
                bumpLocale(function (n) {
                  return n + 1;
                });
              });
            },
            [],
          );

          /* Every document change lands in localStorage; a fresh load restores it. */
          React.useEffect(
            function () {
              saveDoc(doc);
            },
            [doc],
          );

          React.useEffect(
            function () {
              return function () {
                if (toastTimer.current) clearTimeout(toastTimer.current);
              };
            },
            [],
          );

          function flash(message) {
            setToast(message);
            if (toastTimer.current) clearTimeout(toastTimer.current);
            toastTimer.current = setTimeout(function () {
              setToast(null);
              toastTimer.current = null;
            }, TOAST_MS);
          }

          const canvas = activeCanvasOf(doc);
          const canvasName = canvas && canvas.name ? canvas.name : t('canvas.untitled');

          function itemText(item) {
            return item.text ? item.text : t('item.untitled');
          }

          /* ---- editor --------------------------------------------------- */

          function openEditor(item, block, isNew) {
            setEditing({ id: item.id, block: block, isNew: !!isNew, text: item.text, color: item.color });
          }

          function closeEditor() {
            setEditing(null);
          }

          /* `Esc` closes the editor without saving. Capture phase, so the host
           * shell does not also act on the key while the dialog is up. */
          React.useEffect(
            function () {
              if (!editing) return undefined;
              function onKeyDown(event) {
                if (event.key === 'Escape') {
                  event.preventDefault();
                  event.stopPropagation();
                  closeEditor();
                }
              }
              document.addEventListener('keydown', onKeyDown, true);
              return function () {
                document.removeEventListener('keydown', onKeyDown, true);
              };
            },
            [editing ? editing.id : null],
          );

          /* A freshly opened editor starts in the text field. */
          React.useEffect(
            function () {
              if (!editing) return;
              const element = textRef.current;
              if (!element) return;
              element.focus();
              const end = element.value.length;
              try {
                element.setSelectionRange(end, end);
              } catch (error) {
                /* Selection is a nicety; focus alone is enough. */
              }
            },
            [editing ? editing.id : null],
          );

          function saveEditor() {
            if (!editing) return;
            const id = editing.id;
            const nextBlock = editing.block;
            setDoc(function (previous) {
              const patched = patchItemIn(previous, id, { text: editing.text, color: editing.color });
              const current = activeCanvasOf(patched);
              if (!current) return patched;
              const found = findBlockOf(current, id);
              if (!found || found.block === nextBlock) return patched;
              /* A block change appends the item to the end of the new block. */
              return moveItemIn(patched, id, nextBlock, current.blocks[nextBlock].length);
            });
            closeEditor();
          }

          function deleteEditing() {
            if (!editing) return;
            const id = editing.id;
            setDoc(function (previous) {
              return removeItemIn(previous, id);
            });
            closeEditor();
          }

          function addItem(blockId) {
            let created = null;
            setDoc(function (previous) {
              const result = addItemIn(previous, blockId);
              created = result.item;
              return result.doc;
            });
            if (created) openEditor(created, blockId, true);
          }

          function deleteItem(itemId) {
            setDoc(function (previous) {
              return removeItemIn(previous, itemId);
            });
          }

          function moveItem(itemId, toBlock, index) {
            setDoc(function (previous) {
              return moveItemIn(previous, itemId, toBlock, index);
            });
          }

          function moveItemByStep(itemId, step) {
            setDoc(function (previous) {
              const current = activeCanvasOf(previous);
              if (!current) return previous;
              const found = findBlockOf(current, itemId);
              if (!found) return previous;
              const from = BLOCK_IDS.indexOf(found.block);
              const to = from + step;
              if (to < 0 || to >= BLOCK_IDS.length) return previous;
              const targetBlock = BLOCK_IDS[to];
              return moveItemIn(previous, itemId, targetBlock, current.blocks[targetBlock].length);
            });
          }

          /* ---- canvases ------------------------------------------------- */

          function createCanvas() {
            const next = makeCanvas('');
            setDoc(function (previous) {
              return Object.assign({}, previous, {
                canvases: previous.canvases.concat([next]),
                activeId: next.id,
              });
            });
          }

          function selectCanvas(canvasId) {
            setDoc(function (previous) {
              if (previous.activeId === canvasId) return previous;
              return Object.assign({}, previous, { activeId: canvasId });
            });
          }

          function renameCanvas(name) {
            setDoc(function (previous) {
              return withCanvas(previous, function (current) {
                if (current.name === name) return null;
                return Object.assign({}, current, { name: name });
              });
            });
          }

          function deleteCanvas() {
            if (!canvas) return;
            let confirmed = true;
            try {
              confirmed = window.confirm(t('confirm.deleteCanvas'));
            } catch (error) {
              confirmed = true;
            }
            if (!confirmed) return;
            setDoc(function (previous) {
              const remaining = previous.canvases.filter(function (entry) {
                return entry.id !== previous.activeId;
              });
              return Object.assign({}, previous, {
                canvases: remaining,
                activeId: remaining.length ? remaining[0].id : '',
              });
            });
          }

          /* ---- export --------------------------------------------------- */

          function buildMarkdown(sourceCanvas, sourceName) {
            const lines = ['# ' + sourceName, ''];
            let total = 0;
            for (let b = 0; b < BLOCK_IDS.length; b += 1) {
              const key = BLOCK_IDS[b];
              const items = sourceCanvas.blocks[key];
              if (!items.length) continue;
              lines.push('## ' + t('block.' + key));
              for (let i = 0; i < items.length; i += 1) {
                lines.push('- ' + itemText(items[i]));
                total += 1;
              }
              lines.push('');
            }
            if (!total) {
              lines.push(t('export.empty'));
              lines.push('');
            }
            return lines.join('\n');
          }

          function exportMarkdown() {
            if (!canvas) return;
            setMenuOpen(false);
            const markdown = buildMarkdown(canvas, canvasName);
            const ok = downloadText('bizcanvas-' + slugOf(canvas.name) + '.md', markdown, 'text/markdown;charset=utf-8');
            if (ok) flash(t('toast.exported'));
          }

          function exportJson() {
            if (!canvas) return;
            setMenuOpen(false);
            const payload = { version: DOC_VERSION, exportedAt: nowMs(), canvases: cloneDoc(doc).canvases };
            const ok = downloadText(
              'bizcanvas-' + dateStamp(new Date()) + '.json',
              JSON.stringify(payload, null, 2),
              'application/json;charset=utf-8',
            );
            if (ok) flash(t('toast.exported'));
          }

          function copyMarkdown() {
            if (!canvas) return;
            setMenuOpen(false);
            const markdown = buildMarkdown(canvas, canvasName);
            const clipboard = window.navigator && window.navigator.clipboard;
            if (!clipboard || typeof clipboard.writeText !== 'function') {
              flash(t('toast.copyFailed'));
              return;
            }
            let pending;
            try {
              pending = clipboard.writeText(markdown);
            } catch (error) {
              flash(t('toast.copyFailed'));
              return;
            }
            if (!pending || typeof pending.then !== 'function') {
              flash(t('toast.copied'));
              return;
            }
            pending.then(
              function () {
                flash(t('toast.copied'));
              },
              function () {
                flash(t('toast.copyFailed'));
              },
            );
          }

          /* The export menu closes on an outside pointer press. */
          React.useEffect(
            function () {
              if (!menuOpen) return undefined;
              function onPointerDown(event) {
                const element = menuRef.current;
                if (element && typeof element.contains === 'function' && element.contains(event.target)) return;
                setMenuOpen(false);
              }
              function onKeyDown(event) {
                if (event.key === 'Escape') setMenuOpen(false);
              }
              document.addEventListener('pointerdown', onPointerDown, true);
              document.addEventListener('keydown', onKeyDown, true);
              return function () {
                document.removeEventListener('pointerdown', onPointerDown, true);
                document.removeEventListener('keydown', onKeyDown, true);
              };
            },
            [menuOpen],
          );

          /* ---- drag & drop ----------------------------------------------
           * The drag source lives in React state: `dataTransfer.getData` is not
           * readable during `dragover`, so it cannot drive the indicator. */

          function dropIndexFor(blockId, clientY) {
            if (!canvas) return 0;
            const list = canvas.blocks[blockId];
            let index = list.length;
            for (let i = 0; i < list.length; i += 1) {
              const element = itemRefs.current[list[i].id];
              if (!element || typeof element.getBoundingClientRect !== 'function') continue;
              const rect = element.getBoundingClientRect();
              if (clientY < rect.top + rect.height / 2) {
                index = i;
                break;
              }
            }
            return index;
          }

          function handleDragStart(event, item) {
            setDragId(item.id);
            try {
              event.dataTransfer.effectAllowed = 'move';
              /* Only for engines that insist on a payload; state drives the rest. */
              event.dataTransfer.setData('text/plain', item.id);
            } catch (error) {
              /* A drag without a payload is still driven by state. */
            }
          }

          function handleDragEnd() {
            setDragId(null);
            setDropTarget(null);
          }

          function handleDragOver(event, blockId) {
            if (!dragId) return;
            event.preventDefault();
            try {
              event.dataTransfer.dropEffect = 'move';
            } catch (error) {
              /* Ignored: the drop still works. */
            }
            const index = dropIndexFor(blockId, event.clientY);
            setDropTarget(function (previous) {
              if (previous && previous.block === blockId && previous.index === index) return previous;
              return { block: blockId, index: index };
            });
          }

          function handleDragLeave(event, blockId) {
            const next = event.relatedTarget;
            if (next && event.currentTarget && event.currentTarget.contains(next)) return;
            setDropTarget(function (previous) {
              return previous && previous.block === blockId ? null : previous;
            });
          }

          function handleDrop(event, blockId) {
            if (!dragId) return;
            event.preventDefault();
            const index = dropIndexFor(blockId, event.clientY);
            const itemId = dragId;
            moveItem(itemId, blockId, index);
            setDragId(null);
            setDropTarget(null);
          }

          /* ---- rendering ------------------------------------------------ */

          function blockAccent(blockId) {
            const block = BLOCK_BY_ID[blockId];
            return block ? block.accent : 'currentColor';
          }

          function itemStyle(item) {
            const tint = TINT_BY_ID[String(item.color)];
            if (!tint) return undefined;
            return { background: tint, color: NOTE_INK };
          }

          function renderItem(item, blockId, index) {
            const untitled = !item.text;
            const isDrag = dragId === item.id;
            const position = BLOCK_IDS.indexOf(blockId);
            const atFirst = position === 0;
            const atLast = position === BLOCK_IDS.length - 1;
            return h(
              'div',
              {
                key: item.id,
                className:
                  'dsh-bc-item' + (isDrag ? ' is-drag' : '') + (TINT_BY_ID[String(item.color)] ? ' is-tinted' : ''),
                style: itemStyle(item),
                draggable: true,
                ref: function (element) {
                  if (element) {
                    itemRefs.current[item.id] = element;
                  } else {
                    delete itemRefs.current[item.id];
                  }
                },
                'aria-label': t('aria.item') + ' ' + (index + 1),
                onDragStart: function (event) {
                  handleDragStart(event, item);
                },
                onDragEnd: handleDragEnd,
              },
              h(
                'button',
                {
                  type: 'button',
                  className: 'dsh-bc-item-open' + (untitled ? ' is-untitled' : ''),
                  title: t('item.edit'),
                  onClick: function () {
                    openEditor(item, blockId, false);
                  },
                },
                itemText(item),
              ),
              h(
                'div',
                { className: 'dsh-bc-item-actions' },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-bc-mini',
                    title: t('item.movePrev'),
                    'aria-label': t('item.movePrev'),
                    disabled: atFirst,
                    onClick: function () {
                      moveItemByStep(item.id, -1);
                    },
                  },
                  '\u2191',
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-bc-mini',
                    title: t('item.moveNext'),
                    'aria-label': t('item.moveNext'),
                    disabled: atLast,
                    onClick: function () {
                      moveItemByStep(item.id, 1);
                    },
                  },
                  '\u2193',
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-bc-mini dsh-bc-item-del',
                    title: t('item.delete'),
                    'aria-label': t('item.delete'),
                    onClick: function () {
                      deleteItem(item.id);
                    },
                  },
                  h(
                    'svg',
                    { viewBox: '0 0 12 12', width: 11, height: 11, 'aria-hidden': 'true', style: { display: 'block' } },
                    h('path', {
                      d: 'M2.6 2.6l6.8 6.8M9.4 2.6l-6.8 6.8',
                      fill: 'none',
                      stroke: 'currentColor',
                      strokeWidth: 1.5,
                      strokeLinecap: 'round',
                    }),
                  ),
                ),
              ),
            );
          }

          function renderBlock(blockDef) {
            const blockId = blockDef.id;
            const items = canvas.blocks[blockId];
            const isTarget = !!(dropTarget && dropTarget.block === blockId);
            const showDrop = isTarget && !!dragId;

            const children = [];
            for (let i = 0; i < items.length; i += 1) {
              if (showDrop && dropTarget.index === i) {
                children.push(h('div', { key: 'drop-' + i, className: 'dsh-bc-drop' }));
              }
              children.push(renderItem(items[i], blockId, i));
            }
            if (showDrop && dropTarget.index >= items.length) {
              children.push(h('div', { key: 'drop-end', className: 'dsh-bc-drop' }));
            }
            if (items.length === 0 && !showDrop) {
              children.push(h('div', { key: 'empty', className: 'dsh-bc-block-empty' }, t('block.empty')));
            }

            return h(
              'section',
              {
                key: blockId,
                className: 'dsh-bc-block is-' + blockId + (isTarget ? ' is-target' : ''),
                'aria-label': t('aria.block') + ': ' + t('block.' + blockId),
              },
              h(
                'div',
                { className: 'dsh-bc-block-head' },
                h('span', { className: 'dsh-bc-block-rule', style: { background: blockDef.accent }, 'aria-hidden': 'true' }),
                h('span', { className: 'dsh-bc-block-title' }, t('block.' + blockId)),
                h('span', { className: 'dsh-bc-block-count' }, items.length + ' ' + t('block.unit')),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-bc-icon-btn',
                    title: t('block.addItem'),
                    'aria-label': t('block.addItem') + ' — ' + t('block.' + blockId),
                    onClick: function () {
                      addItem(blockId);
                    },
                  },
                  h('span', { className: 'dsh-bc-plus', 'aria-hidden': 'true' }, '+'),
                ),
              ),
              h('p', { className: 'dsh-bc-block-q' }, t('question.' + blockId)),
              h(
                'div',
                {
                  className: 'dsh-bc-items',
                  onDragOver: function (event) {
                    handleDragOver(event, blockId);
                  },
                  onDragLeave: function (event) {
                    handleDragLeave(event, blockId);
                  },
                  onDrop: function (event) {
                    handleDrop(event, blockId);
                  },
                },
                children,
              ),
            );
          }

          const blockDefs = BLOCKS;
          const gridView = !canvas
            ? null
            : h('div', { className: 'dsh-bc-grid', role: 'group', 'aria-label': t('aria.canvas') }, blockDefs.map(renderBlock));

          const emptyView = h(
            'div',
            { className: 'dsh-bc-empty' },
            h('div', { className: 'dsh-bc-empty-title' }, t('empty.title')),
            h('div', { className: 'dsh-bc-empty-hint' }, t('empty.hint')),
            h(
              'button',
              { type: 'button', className: 'dsh-bc-btn is-primary', onClick: createCanvas },
              t('empty.create'),
            ),
          );

          const tabs = h(
            'div',
            { className: 'dsh-bc-tabs', role: 'tablist', 'aria-label': t('aria.tabs') },
            doc.canvases.map(function (entry) {
              const selected = canvas && entry.id === canvas.id;
              return h(
                'button',
                {
                  key: entry.id,
                  type: 'button',
                  role: 'tab',
                  className: 'dsh-bc-tab',
                  'aria-selected': selected ? 'true' : 'false',
                  title: entry.name ? entry.name : t('canvas.untitled'),
                  onClick: function () {
                    selectCanvas(entry.id);
                  },
                },
                entry.name ? entry.name : t('canvas.untitled'),
              );
            }),
            h(
              'button',
              {
                type: 'button',
                className: 'dsh-bc-tab-new',
                title: t('panel.newCanvas'),
                'aria-label': t('panel.newCanvas'),
                onClick: createCanvas,
              },
              '+',
            ),
          );

          const menu = !menuOpen
            ? null
            : h(
                'div',
                { className: 'dsh-bc-menu', role: 'menu' },
                h(
                  'button',
                  {
                    type: 'button',
                    role: 'menuitem',
                    className: 'dsh-bc-menu-item',
                    onClick: exportMarkdown,
                  },
                  t('panel.exportMarkdown'),
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    role: 'menuitem',
                    className: 'dsh-bc-menu-item',
                    onClick: exportJson,
                  },
                  t('panel.exportJson'),
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    role: 'menuitem',
                    className: 'dsh-bc-menu-item',
                    onClick: copyMarkdown,
                  },
                  t('panel.copyMarkdown'),
                ),
              );

          const toastView = toast ? h('div', { className: 'dsh-bc-toast', role: 'status' }, toast) : null;

          const dragStatus = !dragId
            ? null
            : h('div', { className: 'dsh-bc-sr', role: 'status' }, t('aria.dragging'));

          const dialog = !editing
            ? null
            : h(
                'div',
                {
                  className: 'dsh-bc-scrim',
                  onClick: function (event) {
                    if (event.target === event.currentTarget) closeEditor();
                  },
                },
                h(
                  'div',
                  {
                    className: 'dsh-bc-dialog',
                    role: 'dialog',
                    'aria-modal': 'true',
                    'aria-label': editing.isNew ? t('editor.newTitle') : t('editor.title'),
                  },
                  h('h2', { className: 'dsh-bc-dialog-title' }, editing.isNew ? t('editor.newTitle') : t('editor.title')),
                  h(
                    'div',
                    { className: 'dsh-bc-field' },
                    h('label', { className: 'dsh-bc-label', htmlFor: 'dsh-bc-editor-text' }, t('editor.fieldText')),
                    h('textarea', {
                      id: 'dsh-bc-editor-text',
                      className: 'dsh-bc-textarea',
                      value: editing.text,
                      placeholder: t('editor.textPlaceholder'),
                      ref: textRef,
                      onChange: function (event) {
                        const value = event.target.value;
                        setEditing(function (previous) {
                          return previous ? Object.assign({}, previous, { text: value }) : previous;
                        });
                      },
                    }),
                  ),
                  h(
                    'div',
                    { className: 'dsh-bc-field' },
                    h('label', { className: 'dsh-bc-label', htmlFor: 'dsh-bc-editor-block' }, t('editor.fieldBlock')),
                    h(
                      'select',
                      {
                        id: 'dsh-bc-editor-block',
                        className: 'dsh-bc-select',
                        value: editing.block,
                        onChange: function (event) {
                          const value = event.target.value;
                          setEditing(function (previous) {
                            return previous ? Object.assign({}, previous, { block: value }) : previous;
                          });
                        },
                      },
                      BLOCK_IDS.map(function (blockId) {
                        return h('option', { key: blockId, value: blockId }, t('block.' + blockId));
                      }),
                    ),
                  ),
                  h(
                    'div',
                    { className: 'dsh-bc-field' },
                    h('div', { className: 'dsh-bc-label' }, t('editor.fieldColor')),
                    h(
                      'div',
                      { className: 'dsh-bc-swatches', role: 'group', 'aria-label': t('item.color') },
                      TINTS.map(function (tint) {
                        const selected = (editing.color || null) === tint.id;
                        return h('button', {
                          key: tint.key,
                          type: 'button',
                          className: 'dsh-bc-swatch',
                          style: tint.value
                            ? { background: tint.value }
                            : { background: 'var(--dsw-alias-bg-layer-1)' },
                          title: t(tint.key),
                          'aria-label': t(tint.key),
                          'aria-pressed': selected ? 'true' : 'false',
                          onClick: function () {
                            setEditing(function (previous) {
                              return previous ? Object.assign({}, previous, { color: tint.id }) : previous;
                            });
                          },
                        });
                      }),
                    ),
                  ),
                  h(
                    'div',
                    { className: 'dsh-bc-dialog-foot' },
                    h(
                      'button',
                      { type: 'button', className: 'dsh-bc-btn is-danger', onClick: deleteEditing },
                      t('editor.delete'),
                    ),
                    h('span', { className: 'dsh-bc-dialog-foot-spacer' }),
                    h(
                      'button',
                      { type: 'button', className: 'dsh-bc-btn', onClick: closeEditor },
                      t('editor.cancel'),
                    ),
                    h(
                      'button',
                      { type: 'button', className: 'dsh-bc-btn is-primary', onClick: saveEditor },
                      t('editor.save'),
                    ),
                  ),
                ),
              );

          return h(
            'div',
            { className: 'dsh-bc-root' },
            h('style', { key: 'styles' }, CSS),
            h(
              'header',
              { className: 'dsh-bc-header', key: 'header' },
              h('span', { className: 'dsh-bc-mark', 'aria-hidden': 'true' }, glyph(18, true)),
              h(
                'div',
                { className: 'dsh-bc-titles' },
                h('h1', { className: 'dsh-bc-title' }, t('panel.title')),
                h('span', { className: 'dsh-bc-subtitle' }, t('panel.subtitle')),
              ),
              h('span', { className: 'dsh-bc-spacer' }),
              h(
                'button',
                { type: 'button', className: 'dsh-bc-action', onClick: createCanvas },
                h('span', { className: 'dsh-bc-plus', 'aria-hidden': 'true' }, '+'),
                t('panel.newCanvas'),
              ),
              h(
                'div',
                { className: 'dsh-bc-menu-wrap', ref: menuRef },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-bc-action',
                    'aria-haspopup': 'menu',
                    'aria-expanded': menuOpen ? 'true' : 'false',
                    onClick: function () {
                      setMenuOpen(function (previous) {
                        return !previous;
                      });
                    },
                  },
                  t('panel.export'),
                ),
                menu,
              ),
            ),
            h(
              'div',
              { className: 'dsh-bc-bar', key: 'bar' },
              h('div', { role: 'navigation', 'aria-label': t('panel.canvasList') }, tabs),
              canvas
                ? h('input', {
                    className: 'dsh-bc-name',
                    type: 'text',
                    value: canvas.name,
                    placeholder: t('panel.rename'),
                    'aria-label': t('panel.rename'),
                    onChange: function (event) {
                      renameCanvas(event.target.value);
                    },
                  })
                : null,
              canvas
                ? h(
                    'button',
                    {
                      type: 'button',
                      className: 'dsh-bc-icon-btn',
                      title: t('panel.deleteCanvas'),
                      'aria-label': t('panel.deleteCanvas'),
                      onClick: deleteCanvas,
                    },
                    h(
                      'svg',
                      { viewBox: '0 0 14 14', width: 13, height: 13, 'aria-hidden': 'true', style: { display: 'block' } },
                      h('path', {
                        d: 'M2.5 3.7h9M5.6 3.7V2.3h2.8v1.4M3.7 3.7l.6 8h5.4l.6-8',
                        fill: 'none',
                        stroke: 'currentColor',
                        strokeWidth: 1.3,
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                      }),
                    ),
                  )
                : null,
            ),
            h('div', { className: 'dsh-bc-scroll', key: 'scroll' }, gridView || emptyView),
            dragStatus,
            toastView,
            dialog,
          );
        }

        /* The panel row: the label doubles as visible text, accessible name and rail tooltip. */
        ctx.slots.inject('sidebar.panellist', function () {
          return ctx.slots.register(
            { name: 'sidebar.panellist', id: PANEL_ID, order: 35, label: function () { return t('panel.title'); } },
            PanelIcon,
          );
        });

        /* The same id addresses this central panel; a missing entry would throw on selection. */
        ctx.slots.inject('main', function () {
          return ctx.slots.register({ name: 'main', key: PANEL_ID }, BizCanvasPanel);
        });
      },
    };
  },
});
