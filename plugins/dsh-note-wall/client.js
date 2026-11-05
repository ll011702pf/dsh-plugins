/**
 * Client half of the Note Wall bundle.
 *
 * Registers one global panel entry in the sidebar (`sidebar.panellist`) and its
 * central panel in the layout's `main` keyed slot, both addressed by the id
 * `note-wall`.
 *
 * Data model (v2, stored in localStorage under `dsh.note-wall.state.v2`):
 *   notes[n]   = { id, title, text, color, folder, pinned, archived,
 *                  createdAt, updatedAt, archivedAt }
 *   folders[n] = { id, name, color }
 *
 * "Archived" is the recycle bin: archived notes leave the wall but keep every
 * field, and can be restored or purged. Deleting a collection never deletes its
 * notes — they become unfiled. Notes and collections are browser-owned; the Host
 * half registers nothing.
 */
window.__ModuleLoader__.load({
  id: '@local/dsh-note-wall',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'noteWall';
    const PANEL_ID = 'note-wall';
    const STORAGE_KEY = 'dsh.note-wall.state.v2';
    const LEGACY_KEY = 'dsh.note-wall.notes.v1';

    /* Sticky-note surfaces are the artwork of this panel: notes stay light in
     * either theme, so their palette and ink are literal colors. Every piece of
     * chrome around them (header, buttons, empty state) uses theme tokens. */
    const NOTE_COLORS = [
      { id: 'yellow', value: '#ffe9a8' },
      { id: 'pink', value: '#ffd9e2' },
      { id: 'green', value: '#cdeecb' },
      { id: 'blue', value: '#cfe4ff' },
      { id: 'purple', value: '#e2d9ff' },
      { id: 'orange', value: '#ffddc4' },
    ];
    const DEFAULT_COLOR = 'yellow';
    const NOTE_INK = '#23262b';
    const UNFILED = '__unfiled__';

    const CSS = [
      '.dsh-nw-root{display:flex;flex-direction:column;height:100%;min-height:0;box-sizing:border-box;',
      'background:var(--dsw-alias-bg-base);padding-top:var(--dsh-frame-top-clearance,0px)}',

      /* header */
      '.dsh-nw-header{display:flex;flex:none;align-items:center;gap:8px;padding:20px 24px 12px}',
      '.dsh-nw-mark{display:block;flex:none;color:var(--dsw-alias-label-primary)}',
      '.dsh-nw-title{margin:0;font-size:16px;font-weight:600;line-height:1.3;color:var(--dsw-alias-label-primary)}',
      '.dsh-nw-count{font-size:12px;color:var(--dsw-alias-label-secondary);white-space:nowrap}',
      '.dsh-nw-spacer{flex:1}',
      '.dsh-nw-btn{display:inline-flex;flex:none;align-items:center;justify-content:center;gap:6px;height:30px;',
      'padding:0 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;',
      'background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);',
      'font-family:inherit;font-size:13px;line-height:1;cursor:pointer;transition:background .15s ease}',
      '.dsh-nw-btn:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.dsh-nw-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
      '.dsh-nw-btn[disabled]{opacity:.45;cursor:default}',
      '.dsh-nw-btn-primary{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}',
      '.dsh-nw-btn-icon{width:30px;padding:0}',
      '.dsh-nw-plus{font-size:15px;line-height:1}',

      /* view tabs + search */
      '.dsh-nw-toolbar{display:flex;flex:none;align-items:center;gap:8px;padding:0 24px 12px;flex-wrap:wrap}',
      '.dsh-nw-tabs{display:inline-flex;flex:none;padding:2px;border-radius:9px;',
      'background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1)}',
      '.dsh-nw-tab{height:26px;padding:0 12px;border:0;border-radius:7px;background:transparent;',
      'color:var(--dsw-alias-label-secondary);font-family:inherit;font-size:12.5px;cursor:pointer;',
      'white-space:nowrap;transition:background .15s ease,color .15s ease}',
      '.dsh-nw-tab:hover{color:var(--dsw-alias-label-primary)}',
      '.dsh-nw-tab[aria-selected="true"]{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);',
      'font-weight:600;box-shadow:0 1px 2px rgba(0,0,0,.12)}',
      '.dsh-nw-tab:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dsh-nw-search{display:flex;align-items:center;gap:6px;flex:1;min-width:150px;max-width:300px;height:30px;',
      'padding:0 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;',
      'background:var(--dsw-alias-bg-layer-1)}',
      '.dsh-nw-search:focus-within{border-color:var(--dsw-alias-brand-primary)}',
      '.dsh-nw-search svg{flex:none;color:var(--dsw-alias-label-secondary)}',
      '.dsh-nw-input{flex:1;min-width:0;border:0;background:transparent;outline:none;font-family:inherit;',
      'font-size:12.5px;color:var(--dsw-alias-label-primary)}',
      '.dsh-nw-input::placeholder{color:var(--dsw-alias-label-secondary)}',
      '.dsh-nw-input-clear{padding:0;border:0;background:transparent;color:var(--dsw-alias-label-secondary);',
      'font-size:14px;line-height:1;cursor:pointer}',
      '.dsh-nw-notice{flex:none;font-size:11.5px;color:var(--dsw-alias-label-secondary);white-space:nowrap}',

      /* repository: rail + wall */
      '.dsh-nw-body{flex:1;min-height:0;display:flex;min-width:0;border-top:1px solid var(--dsw-alias-border-l1)}',
      '.dsh-nw-rail{flex:none;width:200px;display:flex;flex-direction:column;min-height:0;box-sizing:border-box;',
      'border-right:1px solid var(--dsw-alias-border-l1);padding:10px 8px 14px;overflow:auto;',
      'background:var(--dsw-alias-bg-layer-1)}',
      '.dsh-nw-rail-head{display:flex;align-items:center;gap:6px;padding:2px 6px 8px}',
      '.dsh-nw-rail-label{flex:1;font-size:11.5px;font-weight:600;letter-spacing:.02em;',
      'color:var(--dsw-alias-label-secondary)}',
      '.dsh-nw-rail-add{display:grid;place-items:center;width:22px;height:22px;padding:0;border:0;border-radius:6px;',
      'background:transparent;color:var(--dsw-alias-label-secondary);font-size:15px;line-height:1;cursor:pointer}',
      '.dsh-nw-rail-add:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}',
      '.dsh-nw-rail-add:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dsh-nw-row{display:flex;align-items:center;gap:2px;margin:1px 0;border-radius:7px}',
      '.dsh-nw-row:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.dsh-nw-row[data-active="true"]{background:var(--dsw-alias-bg-layer-2)}',
      '.dsh-nw-folder{display:flex;align-items:center;gap:7px;flex:1;min-width:0;height:30px;',
      'padding:0 8px;border:0;border-radius:7px;background:transparent;text-align:left;cursor:pointer;',
      'font-family:inherit;font-size:12.5px;color:var(--dsw-alias-label-primary)}',
      '.dsh-nw-folder[data-active="true"]{font-weight:600}',
      '.dsh-nw-folder:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dsh-nw-folder-dot{width:8px;height:8px;flex:none;border-radius:50%}',
      '.dsh-nw-folder-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.dsh-nw-folder-count{flex:none;padding:0 4px;font-size:11px;color:var(--dsw-alias-label-secondary);',
      'font-variant-numeric:tabular-nums}',
      '.dsh-nw-rail-sep{height:1px;flex:none;margin:8px 6px;background:var(--dsw-alias-border-l1)}',
      '.dsh-nw-folder-input{display:flex;gap:5px;padding:2px 4px 6px}',
      '.dsh-nw-mini{flex:1;min-width:0;height:26px;padding:0 7px;border:1px solid var(--dsw-alias-border-l2);',
      'border-radius:6px;background:var(--dsw-alias-bg-base);outline:none;font-family:inherit;',
      'font-size:12px;color:var(--dsw-alias-label-primary)}',
      '.dsh-nw-mini:focus{border-color:var(--dsw-alias-brand-primary)}',
      '.dsh-nw-row-x{display:none;place-items:center;width:20px;height:20px;padding:0;border:0;border-radius:5px;',
      'background:transparent;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1;cursor:pointer}',
      '.dsh-nw-row:hover .dsh-nw-row-x,.dsh-nw-row:focus-within .dsh-nw-row-x{display:grid}',
      '.dsh-nw-row-x:hover{background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary)}',
      '.dsh-nw-row-x:focus-visible{display:grid;outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',

      /* wall */
      '.dsh-nw-wall{flex:1;min-width:0;min-height:0;overflow:auto;padding:14px 20px 28px}',
      '.dsh-nw-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(216px,1fr));gap:14px;align-items:start}',
      '.dsh-nw-note{position:relative;display:flex;flex-direction:column;gap:5px;min-height:158px;',
      'padding:11px 12px 8px;border-radius:6px;',
      'box-shadow:0 1px 2px rgba(0,0,0,.16),0 8px 16px -12px rgba(0,0,0,.45);',
      'transition:box-shadow .18s ease}',
      '.dsh-nw-note:hover{box-shadow:0 2px 5px rgba(0,0,0,.2),0 12px 22px -12px rgba(0,0,0,.5)}',
      '.dsh-nw-note:focus-within{box-shadow:0 2px 5px rgba(0,0,0,.2),0 0 0 2px var(--dsw-alias-brand-primary)}',
      '.dsh-nw-note[data-archived="true"]{opacity:.86}',
      '.dsh-nw-note-head{display:flex;align-items:center;gap:6px;flex:none}',
      '.dsh-nw-check{display:grid;place-items:center;width:17px;height:17px;flex:none;padding:0;border-radius:5px;',
      'border:1px solid rgba(35,38,43,.24);background:rgba(255,255,255,.5);color:transparent;',
      'font-size:11px;line-height:1;cursor:pointer;opacity:0;transition:opacity .15s ease}',
      '.dsh-nw-note:hover .dsh-nw-check,.dsh-nw-note:focus-within .dsh-nw-check,',
      '.dsh-nw-check[aria-pressed="true"]{opacity:1}',
      '.dsh-nw-check[aria-pressed="true"]{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:#fff}',
      '.dsh-nw-check:focus-visible{opacity:1;outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dsh-nw-note-title{flex:1;min-width:0;padding:0 0 3px;border:0;border-bottom:1px solid rgba(35,38,43,.16);',
      'background:transparent;outline:none;font-family:inherit;font-size:13.5px;font-weight:700;',
      'line-height:1.4;color:' + NOTE_INK + ';caret-color:' + NOTE_INK + '}',
      '.dsh-nw-note-title::placeholder{font-weight:600;color:rgba(35,38,43,.4)}',
      '.dsh-nw-pin{flex:none;width:20px;height:20px;padding:0;border:0;background:transparent;font-size:13px;',
      'line-height:1;cursor:pointer;color:rgba(35,38,43,.5);opacity:.75;transition:opacity .15s ease}',
      '.dsh-nw-pin[aria-pressed="true"]{color:#8a6b12;opacity:1}',
      '.dsh-nw-pin:hover,.dsh-nw-pin:focus-visible{opacity:1}',
      '.dsh-nw-pin:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px;border-radius:4px}',
      '.dsh-nw-text{flex:1;width:100%;min-height:76px;padding:0;border:0;background:transparent;resize:none;',
      'outline:none;font-family:inherit;font-size:12.5px;line-height:1.55;color:' + NOTE_INK + ';caret-color:' + NOTE_INK + '}',
      '.dsh-nw-text::placeholder{color:rgba(35,38,43,.42)}',
      '.dsh-nw-foot{display:flex;align-items:center;gap:5px;flex:none;padding-top:3px;min-height:19px}',
      '.dsh-nw-swatches{display:flex;align-items:center;gap:5px;flex:none}',
      '.dsh-nw-swatch{width:12px;height:12px;flex:none;padding:0;border:1px solid rgba(0,0,0,.16);',
      'border-radius:50%;cursor:pointer}',
      '.dsh-nw-swatch[aria-pressed="true"]{box-shadow:0 0 0 2px rgba(255,255,255,.9),0 0 0 3px rgba(0,0,0,.3)}',
      '.dsh-nw-swatch:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
      '.dsh-nw-tag{display:inline-flex;align-items:center;gap:4px;max-width:104px;height:18px;padding:0 6px;',
      'border-radius:9px;background:rgba(255,255,255,.62);font-size:10.5px;color:#3b3f47;',
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:none}',
      '.dsh-nw-time{margin-left:auto;flex:none;font-size:10.5px;color:rgba(35,38,43,.55);white-space:nowrap}',
      '.dsh-nw-note-act{display:grid;place-items:center;width:19px;height:19px;flex:none;padding:0;border:0;',
      'border-radius:50%;background:transparent;color:rgba(35,38,43,.5);line-height:1;cursor:pointer;',
      'opacity:0;transition:opacity .15s ease,background .15s ease}',
      '.dsh-nw-note:hover .dsh-nw-note-act,.dsh-nw-note:focus-within .dsh-nw-note-act{opacity:1}',
      '.dsh-nw-note-act:hover{background:rgba(0,0,0,.09);color:rgba(35,38,43,.8)}',
      '.dsh-nw-note-act:focus-visible{opacity:1;outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',

      /* empty state */
      '.dsh-nw-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;',
      'min-height:220px;border:1px dashed var(--dsw-alias-border-l2);border-radius:10px;',
      'color:var(--dsw-alias-label-secondary);text-align:center}',
      '.dsh-nw-empty-title{font-size:14px;color:var(--dsw-alias-label-primary)}',
      '.dsh-nw-empty-hint{font-size:12.5px}',

      /* bulk bar */
      '.dsh-nw-bulk{display:flex;flex:none;align-items:center;gap:8px;margin:0 20px 12px;padding:8px 10px;',
      'border:1px solid var(--dsw-alias-border-l2);border-radius:9px;background:var(--dsw-alias-bg-layer-1);flex-wrap:wrap}',
      '.dsh-nw-bulk-text{font-size:12.5px;color:var(--dsw-alias-label-primary);white-space:nowrap}',
      '.dsh-nw-bulk .dsh-nw-btn{height:26px;padding:0 9px;font-size:12px}',
      '.dsh-nw-bulk .dsh-nw-mini{flex:none;width:150px;height:26px}',

      '@media (max-width:820px){.dsh-nw-rail{width:150px}.dsh-nw-grid{grid-template-columns:repeat(auto-fill,minmax(180px,1fr))}}',
      '@media (prefers-reduced-motion: reduce){.dsh-nw-note,.dsh-nw-btn,.dsh-nw-note-act,.dsh-nw-check{transition:none}}',
    ].join('');

    function colorValue(id) {
      for (let i = 0; i < NOTE_COLORS.length; i += 1) {
        if (NOTE_COLORS[i].id === id) return NOTE_COLORS[i].value;
      }
      return NOTE_COLORS[0].value;
    }

    function newId(prefix) {
      return (prefix || 'n') + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    /** Keep only well-formed records so stale or hand-edited payloads cannot break the view. */
    function sanitize(raw) {
      const source = raw && typeof raw === 'object' ? raw : {};
      const folders = [];
      const folderIds = {};
      if (Array.isArray(source.folders)) {
        for (let i = 0; i < source.folders.length; i += 1) {
          const item = source.folders[i];
          if (!item || typeof item !== 'object' || typeof item.id !== 'string' || !item.id) continue;
          if (folderIds[item.id]) continue;
          folderIds[item.id] = true;
          folders.push({
            id: item.id,
            name: typeof item.name === 'string' && item.name ? item.name : '',
            color: typeof item.color === 'string' ? item.color : DEFAULT_COLOR,
          });
        }
      }
      const notes = [];
      const noteIds = {};
      if (Array.isArray(source.notes)) {
        for (let i = 0; i < source.notes.length; i += 1) {
          const item = source.notes[i];
          if (!item || typeof item !== 'object') continue;
          const id = typeof item.id === 'string' && item.id ? item.id : newId();
          if (noteIds[id]) continue;
          noteIds[id] = true;
          const created = typeof item.createdAt === 'number' ? item.createdAt : Date.now();
          /* A collection that no longer exists degrades to unfiled, never to a phantom entry. */
          const folder = typeof item.folder === 'string' && folderIds[item.folder] ? item.folder : null;
          notes.push({
            id,
            title: typeof item.title === 'string' ? item.title : '',
            text: typeof item.text === 'string' ? item.text : '',
            color: typeof item.color === 'string' ? item.color : DEFAULT_COLOR,
            folder,
            pinned: item.pinned === true,
            archived: item.archived === true,
            createdAt: created,
            updatedAt: typeof item.updatedAt === 'number' ? item.updatedAt : created,
            archivedAt: typeof item.archivedAt === 'number' ? item.archivedAt : null,
          });
        }
      }
      return { notes, folders };
    }

    /** v1 stored a bare array of notes; lift them into the v2 shape once. */
    function readLegacy() {
      try {
        const raw = window.localStorage.getItem(LEGACY_KEY);
        if (!raw) return null;
        const list = JSON.parse(raw);
        if (!Array.isArray(list) || list.length === 0) return null;
        return sanitize({ notes: list, folders: [] });
      } catch (error) {
        return null;
      }
    }

    function loadState() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) return sanitize(JSON.parse(raw));
      } catch (error) {
        /* fall through to the legacy read */
      }
      const legacy = readLegacy();
      if (legacy) return legacy;
      return sanitize(null);
    }

    function saveState(state) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        /* Storage is unavailable; the wall keeps working for this page. */
      }
    }

    /** A small fixed tilt per note, so the wall reads as paper without hurting legibility. */
    function tiltFor(id) {
      let hash = 0;
      for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) % 997;
      return ((hash % 5) - 2) * 0.35;
    }

    function formatTime(timestamp, locale) {
      const date = new Date(timestamp);
      try {
        return date.toLocaleString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      } catch (error) {
        return date.toLocaleString();
      }
    }

    function matches(note, query) {
      if (!query) return true;
      const needle = query.toLowerCase();
      if (note.title.toLowerCase().indexOf(needle) >= 0) return true;
      return note.text.toLowerCase().indexOf(needle) >= 0;
    }

    /** The sticky-note glyph, inherited in `currentColor` so the host colors it. */
    function glyph(size, active) {
      const stroke = active ? 1.6 : 1.4;
      const line = { fill: 'none', stroke: 'currentColor', strokeWidth: stroke, strokeLinejoin: 'round' };
      return h(
        'svg',
        { viewBox: '0 0 20 20', width: size, height: size, 'aria-hidden': 'true', style: { display: 'block' } },
        h('path', Object.assign({ d: 'M3.6 3.6h12.8v8.1l-4.7 4.7H3.6z' }, line)),
        h('path', Object.assign({ d: 'M16.4 11.7h-4.7v4.7' }, line)),
        h('path', {
          d: 'M6.3 7.1h7.4M6.3 9.9h4.9',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: stroke,
          strokeLinecap: 'round',
        }),
      );
    }

    function iconSearch() {
      return h(
        'svg',
        { viewBox: '0 0 16 16', width: 13, height: 13, 'aria-hidden': 'true', style: { display: 'block' } },
        h('circle', { cx: 6.8, cy: 6.8, r: 4.5, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 }),
        h('path', { d: 'M10.3 10.3l3.2 3.2', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' }),
      );
    }

    function iconDownload() {
      return h(
        'svg',
        { viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': 'true', style: { display: 'block' } },
        h('path', { d: 'M8 2v7.2', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' }),
        h('path', { d: 'M4.9 6.4L8 9.6l3.1-3.2', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' }),
        h('path', { d: 'M3 12.6h10', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' }),
      );
    }

    function iconUpload() {
      return h(
        'svg',
        { viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': 'true', style: { display: 'block' } },
        h('path', { d: 'M8 9.4V2.2', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' }),
        h('path', { d: 'M4.9 5.4L8 2.2l3.1 3.2', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' }),
        h('path', { d: 'M3 12.6h10', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' }),
      );
    }

    function iconArchive() {
      return h(
        'svg',
        { viewBox: '0 0 16 16', width: 12, height: 12, 'aria-hidden': 'true', style: { display: 'block' } },
        h('rect', { x: 2, y: 3, width: 12, height: 3, fill: 'none', stroke: 'currentColor', strokeWidth: 1.4 }),
        h('path', { d: 'M3.2 6v7h9.6V6', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4 }),
        h('path', { d: 'M6.3 9h3.4', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' }),
      );
    }

    function iconRestore() {
      return h(
        'svg',
        { viewBox: '0 0 16 16', width: 12, height: 12, 'aria-hidden': 'true', style: { display: 'block' } },
        h('path', {
          d: 'M7.2 4.1a4.5 4.5 0 1 1-3 1.2M7.2 4.1H3.2V.9',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.4,
          strokeLinecap: 'round',
        }),
      );
    }

    function iconTrash() {
      return h(
        'svg',
        { viewBox: '0 0 16 16', width: 12, height: 12, 'aria-hidden': 'true', style: { display: 'block' } },
        h('path', { d: 'M2.6 4.2h10.8', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' }),
        h('path', { d: 'M4.4 4.2l.6 8.6h6l.6-8.6', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4 }),
        h('path', { d: 'M6.3 2.2h3.4', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' }),
      );
    }

    /** Owner props of `sidebar.panellist`: the row supplies the requested square edge. */
    function PanelIcon(props) {
      const size = props && typeof props.size === 'number' && props.size > 0 ? props.size : 20;
      return glyph(size, !!(props && props.active));
    }

    const DICT = {
      zh: {
        'panel.title': '便签墙',
        'panel.unit': '张便签',
        'panel.add': '新建便签',
        'view.all': '全部',
        'view.archived': '归档',
        'search.placeholder': '搜索主题或内容',
        'search.clear': '清除搜索',
        'rail.title': '分类',
        'rail.add': '新建分类',
        'rail.unfiled': '未分类',
        'rail.create': '新建',
        'rail.rename': '重命名分类',
        'rail.delete': '删除分类',
        'rail.namePlaceholder': '分类名称',
        'note.titlePlaceholder': '主题',
        'note.placeholder': '写点什么…',
        'note.pin': '置顶',
        'note.unpin': '取消置顶',
        'note.archive': '归档',
        'note.restore': '还原',
        'note.purge': '彻底删除',
        'note.color': '便签颜色',
        'note.updated': '更新于',
        'note.select': '选择便签',
        'note.subject': '主题',
        'bulk.selected': '已选',
        'bulk.archive': '归档',
        'bulk.restore': '还原',
        'bulk.purge': '彻底删除',
        'bulk.move': '移到分类',
        'bulk.clear': '取消选择',
        'empty.title': '还没有便签',
        'empty.hint': '点击「新建便签」，把想法贴到墙上',
        'empty.search': '没有匹配的便签',
        'empty.searchHint': '换个关键词，或清空搜索再看看',
        'empty.archived': '归档里还没有便签',
        'empty.archivedHint': '在墙上点「归档」，便签会先放到这里',
        'empty.folder': '这个分类下还没有便签',
        'empty.folderHint': '新建便签时会自动归到这个分类',
        'color.yellow': '黄色',
        'color.pink': '粉色',
        'color.green': '绿色',
        'color.blue': '蓝色',
        'color.purple': '紫色',
        'color.orange': '橙色',
        'folder.empty': '分类名称不能为空',
        'action.archived': '已归档',
        'action.restored': '已还原',
        'action.purged': '已彻底删除',
        'io.export': '导出 JSON',
        'io.exportTitle': '把全部便签和分类导出为 JSON 备份',
        'io.import': '导入 JSON',
        'io.importTitle': '从 JSON 备份导入便签',
        'io.importFail': '导入失败：不是便签墙的备份文件',
        'io.imported': '已导入',
      },
      en: {
        'panel.title': 'Note Wall',
        'panel.unit': 'notes',
        'panel.add': 'New note',
        'view.all': 'All',
        'view.archived': 'Archived',
        'search.placeholder': 'Search subject or text',
        'search.clear': 'Clear search',
        'rail.title': 'Collections',
        'rail.add': 'New collection',
        'rail.unfiled': 'Unfiled',
        'rail.create': 'Create',
        'rail.rename': 'Rename collection',
        'rail.delete': 'Delete collection',
        'rail.namePlaceholder': 'Collection name',
        'note.titlePlaceholder': 'Subject',
        'note.placeholder': 'Write something…',
        'note.pin': 'Pin',
        'note.unpin': 'Unpin',
        'note.archive': 'Archive',
        'note.restore': 'Restore',
        'note.purge': 'Delete permanently',
        'note.color': 'Note color',
        'note.updated': 'Updated',
        'note.select': 'Select note',
        'note.subject': 'Subject',
        'bulk.selected': 'selected',
        'bulk.archive': 'Archive',
        'bulk.restore': 'Restore',
        'bulk.purge': 'Delete permanently',
        'bulk.move': 'Move to',
        'bulk.clear': 'Clear',
        'empty.title': 'No notes yet',
        'empty.hint': 'Select “New note” to pin your first one',
        'empty.search': 'No notes match',
        'empty.searchHint': 'Try another keyword, or clear the search',
        'empty.archived': 'Nothing is archived yet',
        'empty.archivedHint': 'Archiving a note moves it here first',
        'empty.folder': 'This collection is empty',
        'empty.folderHint': 'A note created here is filed into it automatically',
        'color.yellow': 'Yellow',
        'color.pink': 'Pink',
        'color.green': 'Green',
        'color.blue': 'Blue',
        'color.purple': 'Purple',
        'color.orange': 'Orange',
        'folder.empty': 'A collection needs a name',
        'action.archived': 'Archived',
        'action.restored': 'Restored',
        'action.purged': 'Deleted permanently',
        'io.export': 'Export JSON',
        'io.exportTitle': 'Export every note and collection as a JSON backup',
        'io.import': 'Import JSON',
        'io.importTitle': 'Import notes from a JSON backup',
        'io.importFail': 'Import failed: not a note-wall backup',
        'io.imported': 'Imported',
      },
    };

    return {
      inject: ['slots', 'locale'],

      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, DICT), 'note-wall: dictionaries');

        const t = ctx.locale.bind(NS);

        function NoteWallPanel() {
          const activeLocale = ctx.locale.getLocale().active;
          const [state, setState] = React.useState(loadState);
          const [view, setView] = React.useState('all');
          const [folder, setFolder] = React.useState('all');
          const [query, setQuery] = React.useState('');
          const [selected, setSelected] = React.useState({});
          const [drafting, setDrafting] = React.useState(false);
          const [draftName, setDraftName] = React.useState('');
          const [renaming, setRenaming] = React.useState(null);
          const [renameValue, setRenameValue] = React.useState('');
          const [pendingFocus, setPendingFocus] = React.useState(null);
          const [notice, setNotice] = React.useState(null);
          const textRefs = React.useRef({});
          const fileRef = React.useRef(null);

          React.useEffect(() => {
            saveState(state);
          }, [state]);

          React.useEffect(() => {
            if (!pendingFocus) return;
            const element = textRefs.current[pendingFocus];
            if (element) {
              element.focus();
              const end = element.value.length;
              try {
                element.setSelectionRange(end, end);
              } catch (error) {
                /* Selection is a nicety; focus alone is enough. */
              }
            }
            setPendingFocus(null);
          }, [pendingFocus]);

          React.useEffect(() => {
            if (!notice) return;
            const handle = setTimeout(() => setNotice(null), 2400);
            return () => clearTimeout(handle);
          }, [notice]);

          /* Selection follows the visible set: hiding a note must not leave it bulk-acted on. */
          React.useEffect(() => {
            setSelected({});
          }, [view, folder, query]);

          const notes = state.notes;
          const folders = state.folders;

          const liveNotes = notes.filter((note) => !note.archived);
          const archivedNotes = notes.filter((note) => note.archived);

          const scoped = view === 'archived' ? archivedNotes : liveNotes.filter((note) => {
            if (folder === UNFILED) return note.folder === null;
            if (folder !== 'all') return note.folder === folder;
            return true;
          });
          const filtered = scoped.filter((note) => matches(note, query));
          const pinned = filtered.filter((note) => note.pinned);
          const ordinary = filtered.filter((note) => !note.pinned);
          const ordered = pinned.concat(ordinary);

          /* Counts drive labels only, so they ignore the search box but honor the view. */
          const counts = {};
          for (let i = 0; i < folders.length; i += 1) counts[folders[i].id] = 0;
          counts[UNFILED] = 0;
          for (let i = 0; i < liveNotes.length; i += 1) {
            const note = liveNotes[i];
            if (note.folder && counts[note.folder] !== undefined) counts[note.folder] += 1;
            else counts[UNFILED] += 1;
          }

          function patchNote(id, patch) {
            setState((previous) =>
              Object.assign({}, previous, {
                notes: previous.notes.map((note) => (note.id === id ? Object.assign({}, note, patch) : note)),
              }),
            );
          }

          function patchNotes(ids, patch) {
            const target = {};
            for (let i = 0; i < ids.length; i += 1) target[ids[i]] = true;
            setState((previous) =>
              Object.assign({}, previous, {
                notes: previous.notes.map((note) => (target[note.id] ? Object.assign({}, note, patch) : note)),
              }),
            );
          }

          function addNote() {
            const now = Date.now();
            const targetFolder = folder !== 'all' && folder !== UNFILED ? folder : null;
            const note = {
              id: newId('n'),
              title: '',
              text: '',
              color: DEFAULT_COLOR,
              folder: targetFolder,
              pinned: false,
              archived: false,
              createdAt: now,
              updatedAt: now,
              archivedAt: null,
            };
            setState((previous) => Object.assign({}, previous, { notes: [note].concat(previous.notes) }));
            setDrafting(false);
            setPendingFocus(note.id);
            setQuery('');
            setView('all');
          }

          function archiveNotes(ids) {
            const now = Date.now();
            patchNotes(ids, { archived: true, pinned: false, archivedAt: now });
            setSelected({});
            setNotice(t('action.archived') + ' · ' + ids.length);
          }

          function restoreNotes(ids) {
            patchNotes(ids, { archived: false, archivedAt: null });
            setSelected({});
            setNotice(t('action.restored') + ' · ' + ids.length);
          }

          function purgeNotes(ids) {
            const target = {};
            for (let i = 0; i < ids.length; i += 1) target[ids[i]] = true;
            setState((previous) =>
              Object.assign({}, previous, {
                notes: previous.notes.filter((note) => !target[note.id]),
              }),
            );
            setSelected({});
            setNotice(t('action.purged') + ' · ' + ids.length);
          }

          function moveNotes(ids, target) {
            patchNotes(ids, { folder: target });
            setSelected({});
          }

          function commitDraft() {
            const name = draftName.trim();
            if (!name) {
              setDrafting(false);
              setDraftName('');
              setNotice(t('folder.empty'));
              return;
            }
            const id = newId('f');
            setState((previous) =>
              Object.assign({}, previous, {
                folders: previous.folders.concat([{ id, name, color: DEFAULT_COLOR }]),
              }),
            );
            setDrafting(false);
            setDraftName('');
            setFolder(id);
            setView('all');
          }

          function commitRename(id) {
            const next = renameValue.trim();
            if (!next) {
              setNotice(t('folder.empty'));
              return;
            }
            setState((previous) =>
              Object.assign({}, previous, {
                folders: previous.folders.map((item) => (item.id === id ? Object.assign({}, item, { name: next }) : item)),
              }),
            );
            setRenaming(null);
            setRenameValue('');
          }

          function deleteFolder(id) {
            /* Deleting a collection never deletes notes: they become unfiled. */
            setState((previous) =>
              Object.assign({}, previous, {
                folders: previous.folders.filter((item) => item.id !== id),
                notes: previous.notes.map((note) => (note.folder === id ? Object.assign({}, note, { folder: null }) : note)),
              }),
            );
            if (folder === id) setFolder('all');
            if (renaming === id) setRenaming(null);
          }

          function exportAll() {
            const payload = {
              kind: 'dsh.note-wall',
              version: 2,
              exportedAt: new Date().toISOString(),
              folders: state.folders,
              notes: state.notes,
            };
            try {
              const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'note-wall-' + new Date().toISOString().slice(0, 10) + '.json';
              /* A detached anchor still triggers the download; the plugin writes no host DOM. */
              link.click();
              setTimeout(() => URL.revokeObjectURL(url), 0);
            } catch (error) {
              setNotice(t('io.importFail'));
            }
          }

          function importAll(file) {
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const parsed = JSON.parse(String(reader.result));
                const incoming = sanitize(parsed && parsed.notes ? parsed : { notes: parsed });
                if (!incoming.notes.length) {
                  setNotice(t('io.importFail'));
                  return;
                }
                /* Merge without duplicating: an existing id wins, so a re-import is idempotent. */
                const knownNote = {};
                const knownFolder = {};
                for (let i = 0; i < state.notes.length; i += 1) knownNote[state.notes[i].id] = true;
                for (let i = 0; i < state.folders.length; i += 1) knownFolder[state.folders[i].id] = true;
                const addedFolders = incoming.folders.filter((item) => !knownFolder[item.id]);
                const addedNotes = incoming.notes.filter((note) => !knownNote[note.id]);
                setState((previous) =>
                  Object.assign({}, previous, {
                    folders: previous.folders.concat(addedFolders),
                    notes: previous.notes.concat(addedNotes),
                  }),
                );
                setNotice(t('io.imported') + ' · ' + addedNotes.length);
              } catch (error) {
                setNotice(t('io.importFail'));
              }
            };
            reader.readAsText(file);
          }

          /* ---------- rendering ---------- */

          function renderSwatches(note) {
            return NOTE_COLORS.map((color) =>
              h('button', {
                key: color.id,
                type: 'button',
                className: 'dsh-nw-swatch',
                style: { background: color.value },
                title: t('color.' + color.id),
                'aria-label': t('color.' + color.id),
                'aria-pressed': note.color === color.id ? 'true' : 'false',
                onClick: () => patchNote(note.id, { color: color.id }),
              }),
            );
          }

          function renderFolderTag(note) {
            if (!note.folder) return null;
            for (let i = 0; i < folders.length; i += 1) {
              if (folders[i].id === note.folder) {
                return h(
                  'span',
                  { className: 'dsh-nw-tag', title: folders[i].name },
                  h('span', {
                    className: 'dsh-nw-folder-dot',
                    style: { width: 6, height: 6, background: colorValue(folders[i].color) },
                  }),
                  folders[i].name,
                );
              }
            }
            return null;
          }

          function renderNote(note) {
            const isSelected = !!selected[note.id];
            const isArchived = note.archived;

            const actions = isArchived
              ? [
                  h(
                    'button',
                    {
                      key: 'restore',
                      type: 'button',
                      className: 'dsh-nw-note-act',
                      title: t('note.restore'),
                      'aria-label': t('note.restore'),
                      onClick: () => restoreNotes([note.id]),
                    },
                    iconRestore(),
                  ),
                  h(
                    'button',
                    {
                      key: 'purge',
                      type: 'button',
                      className: 'dsh-nw-note-act',
                      title: t('note.purge'),
                      'aria-label': t('note.purge'),
                      onClick: () => purgeNotes([note.id]),
                    },
                    iconTrash(),
                  ),
                ]
              : [
                  h(
                    'button',
                    {
                      key: 'archive',
                      type: 'button',
                      className: 'dsh-nw-note-act',
                      title: t('note.archive'),
                      'aria-label': t('note.archive'),
                      onClick: () => archiveNotes([note.id]),
                    },
                    iconArchive(),
                  ),
                  h(
                    'button',
                    {
                      key: 'purge',
                      type: 'button',
                      className: 'dsh-nw-note-act',
                      title: t('note.purge'),
                      'aria-label': t('note.purge'),
                      onClick: () => purgeNotes([note.id]),
                    },
                    iconTrash(),
                  ),
                ];

            return h(
              'article',
              {
                key: note.id,
                className: 'dsh-nw-note',
                'data-archived': isArchived ? 'true' : 'false',
                style: {
                  background: colorValue(note.color),
                  color: NOTE_INK,
                  transform: 'rotate(' + tiltFor(note.id) + 'deg)',
                },
              },
              h(
                'div',
                { className: 'dsh-nw-note-head' },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-nw-check',
                    'aria-pressed': isSelected ? 'true' : 'false',
                    'aria-label': t('note.select'),
                    onClick: () =>
                      setSelected((previous) => {
                        const next = Object.assign({}, previous);
                        if (next[note.id]) delete next[note.id];
                        else next[note.id] = true;
                        return next;
                      }),
                  },
                  '\u2713',
                ),
                h('input', {
                  className: 'dsh-nw-note-title',
                  value: note.title,
                  placeholder: t('note.titlePlaceholder'),
                  'aria-label': t('note.subject'),
                  spellCheck: 'false',
                  readOnly: isArchived,
                  onChange: (event) => patchNote(note.id, { title: event.target.value, updatedAt: Date.now() }),
                  onKeyDown: (event) => {
                    if (event.key === 'Escape') event.currentTarget.blur();
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      event.currentTarget.blur();
                    }
                  },
                }),
                isArchived
                  ? null
                  : h(
                      'button',
                      {
                        type: 'button',
                        className: 'dsh-nw-pin',
                        'aria-pressed': note.pinned ? 'true' : 'false',
                        title: note.pinned ? t('note.unpin') : t('note.pin'),
                        'aria-label': note.pinned ? t('note.unpin') : t('note.pin'),
                        onClick: () => patchNote(note.id, { pinned: !note.pinned }),
                      },
                      note.pinned ? '\u2605' : '\u2606',
                    ),
              ),
              h('textarea', {
                className: 'dsh-nw-text',
                value: note.text,
                placeholder: t('note.placeholder'),
                'aria-label': t('note.placeholder'),
                spellCheck: 'false',
                readOnly: isArchived,
                ref: (element) => {
                  textRefs.current[note.id] = element;
                },
                onChange: (event) => patchNote(note.id, { text: event.target.value, updatedAt: Date.now() }),
                onKeyDown: (event) => {
                  if (event.key === 'Escape') event.currentTarget.blur();
                },
              }),
              h(
                'div',
                { className: 'dsh-nw-foot' },
                isArchived ? null : h('div', { className: 'dsh-nw-swatches', role: 'group', 'aria-label': t('note.color') }, renderSwatches(note)),
                renderFolderTag(note),
                h('span', { className: 'dsh-nw-time' }, t('note.updated') + ' ' + formatTime(note.updatedAt, activeLocale)),
                actions,
              ),
            );
          }

          function renderCollectionRow(item) {
            const isActive = view === 'all' && folder === item.id;
            const isRenaming = renaming === item.id;

            if (isRenaming) {
              return h(
                'div',
                { key: item.id, className: 'dsh-nw-folder-input' },
                h('input', {
                  className: 'dsh-nw-mini',
                  value: renameValue,
                  'aria-label': t('rail.namePlaceholder'),
                  autoFocus: true,
                  onChange: (event) => setRenameValue(event.target.value),
                  onKeyDown: (event) => {
                    if (event.key === 'Enter') commitRename(item.id);
                    if (event.key === 'Escape') {
                      setRenaming(null);
                      setRenameValue('');
                    }
                  },
                }),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-nw-btn',
                    style: { height: 26, padding: '0 7px', fontSize: 12 },
                    onClick: () => commitRename(item.id),
                  },
                  t('rail.create'),
                ),
              );
            }

            return h(
              'div',
              { key: item.id, className: 'dsh-nw-row', 'data-active': isActive ? 'true' : 'false' },
              h(
                'button',
                {
                  type: 'button',
                  className: 'dsh-nw-folder',
                  'data-active': isActive ? 'true' : 'false',
                  'aria-current': isActive ? 'true' : 'false',
                  onClick: () => {
                    setFolder(item.id);
                    setView('all');
                  },
                },
                h('span', { className: 'dsh-nw-folder-dot', style: { background: colorValue(item.color) } }),
                h('span', { className: 'dsh-nw-folder-name' }, item.name || '—'),
              ),
              h('span', { className: 'dsh-nw-folder-count' }, String(counts[item.id] || 0)),
              h(
                'button',
                {
                  type: 'button',
                  className: 'dsh-nw-row-x',
                  title: t('rail.rename'),
                  'aria-label': t('rail.rename'),
                  onClick: () => {
                    setRenaming(item.id);
                    setRenameValue(item.name);
                  },
                },
                '\u270e',
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'dsh-nw-row-x',
                  title: t('rail.delete'),
                  'aria-label': t('rail.delete'),
                  onClick: () => deleteFolder(item.id),
                },
                '\u2715',
              ),
            );
          }

          function renderRail() {
            const allActive = view === 'all' && folder === 'all';
            const unfiledActive = view === 'all' && folder === UNFILED;

            return h(
              'nav',
              { className: 'dsh-nw-rail', 'aria-label': t('rail.title') },
              h(
                'div',
                { className: 'dsh-nw-rail-head' },
                h('span', { className: 'dsh-nw-rail-label' }, t('rail.title')),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-nw-rail-add',
                    title: t('rail.add'),
                    'aria-label': t('rail.add'),
                    onClick: () => {
                      setDrafting(true);
                      setDraftName('');
                    },
                  },
                  '+',
                ),
              ),
              drafting
                ? h(
                    'div',
                    { className: 'dsh-nw-folder-input' },
                    h('input', {
                      className: 'dsh-nw-mini',
                      value: draftName,
                      placeholder: t('rail.namePlaceholder'),
                      'aria-label': t('rail.namePlaceholder'),
                      autoFocus: true,
                      onChange: (event) => setDraftName(event.target.value),
                      onKeyDown: (event) => {
                        if (event.key === 'Enter') commitDraft();
                        if (event.key === 'Escape') {
                          setDrafting(false);
                          setDraftName('');
                        }
                      },
                    }),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'dsh-nw-btn',
                        style: { height: 26, padding: '0 7px', fontSize: 12 },
                        onClick: commitDraft,
                      },
                      t('rail.create'),
                    ),
                  )
                : null,
              h(
                'div',
                { className: 'dsh-nw-row', 'data-active': allActive ? 'true' : 'false' },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-nw-folder',
                    'data-active': allActive ? 'true' : 'false',
                    'aria-current': allActive ? 'true' : 'false',
                    onClick: () => {
                      setFolder('all');
                      setView('all');
                    },
                  },
                  h('span', { className: 'dsh-nw-folder-dot', style: { background: 'var(--dsw-alias-brand-primary)' } }),
                  h('span', { className: 'dsh-nw-folder-name' }, t('view.all')),
                ),
                h('span', { className: 'dsh-nw-folder-count' }, String(liveNotes.length)),
              ),
              folders.map(renderCollectionRow),
              h(
                'div',
                { className: 'dsh-nw-row', 'data-active': unfiledActive ? 'true' : 'false' },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-nw-folder',
                    'data-active': unfiledActive ? 'true' : 'false',
                    'aria-current': unfiledActive ? 'true' : 'false',
                    onClick: () => {
                      setFolder(UNFILED);
                      setView('all');
                    },
                  },
                  h('span', { className: 'dsh-nw-folder-dot', style: { background: 'var(--dsw-alias-border-l2)' } }),
                  h('span', { className: 'dsh-nw-folder-name' }, t('rail.unfiled')),
                ),
                h('span', { className: 'dsh-nw-folder-count' }, String(counts[UNFILED] || 0)),
              ),
              h('div', { className: 'dsh-nw-rail-sep' }),
              h(
                'div',
                { className: 'dsh-nw-row', 'data-active': view === 'archived' ? 'true' : 'false' },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-nw-folder',
                    'data-active': view === 'archived' ? 'true' : 'false',
                    'aria-current': view === 'archived' ? 'true' : 'false',
                    onClick: () => {
                      setView('archived');
                      setFolder('all');
                    },
                  },
                  h('span', { className: 'dsh-nw-folder-name' }, t('view.archived')),
                ),
                h('span', { className: 'dsh-nw-folder-count' }, String(archivedNotes.length)),
              ),
            );
          }

          function renderEmpty() {
            if (query) {
              return h(
                'div',
                { className: 'dsh-nw-empty' },
                h('div', { className: 'dsh-nw-empty-title' }, t('empty.search')),
                h('div', { className: 'dsh-nw-empty-hint' }, t('empty.searchHint')),
              );
            }
            if (view === 'archived') {
              return h(
                'div',
                { className: 'dsh-nw-empty' },
                h('div', { className: 'dsh-nw-empty-title' }, t('empty.archived')),
                h('div', { className: 'dsh-nw-empty-hint' }, t('empty.archivedHint')),
              );
            }
            if (folder !== 'all' && folder !== UNFILED) {
              return h(
                'div',
                { className: 'dsh-nw-empty' },
                h('div', { className: 'dsh-nw-empty-title' }, t('empty.folder')),
                h('div', { className: 'dsh-nw-empty-hint' }, t('empty.folderHint')),
              );
            }
            if (folder === UNFILED) {
              return h(
                'div',
                { className: 'dsh-nw-empty' },
                h('div', { className: 'dsh-nw-empty-title' }, t('rail.unfiled')),
                h('div', { className: 'dsh-nw-empty-hint' }, t('empty.folderHint')),
              );
            }
            return h(
              'div',
              { className: 'dsh-nw-empty' },
              h('div', { className: 'dsh-nw-empty-title' }, t('empty.title')),
              h('div', { className: 'dsh-nw-empty-hint' }, t('empty.hint')),
            );
          }

          const selectedIds = Object.keys(selected);
          const selectedCount = selectedIds.length;

          const bulkBar =
            selectedCount === 0
              ? null
              : h(
                  'div',
                  { className: 'dsh-nw-bulk' },
                  h('span', { className: 'dsh-nw-bulk-text' }, t('bulk.selected') + ' ' + selectedCount),
                  view === 'archived'
                    ? h(
                        'button',
                        { type: 'button', className: 'dsh-nw-btn', onClick: () => restoreNotes(selectedIds) },
                        t('bulk.restore'),
                      )
                    : h(
                        'button',
                        { type: 'button', className: 'dsh-nw-btn', onClick: () => archiveNotes(selectedIds) },
                        t('bulk.archive'),
                      ),
                  view === 'archived'
                    ? h(
                        'button',
                        { type: 'button', className: 'dsh-nw-btn', onClick: () => purgeNotes(selectedIds) },
                        t('bulk.purge'),
                      )
                    : h(
                        'span',
                        { style: { display: 'inline-flex', alignItems: 'center', gap: 6 } },
                        h('span', { className: 'dsh-nw-bulk-text' }, t('bulk.move')),
                        h(
                          'select',
                          {
                            className: 'dsh-nw-mini',
                            defaultValue: '',
                            'aria-label': t('bulk.move'),
                            onChange: (event) => {
                              const value = event.target.value;
                              if (!value) return;
                              moveNotes(selectedIds, value === UNFILED ? null : value);
                            },
                          },
                          h('option', { value: '' }, '—'),
                          h('option', { value: UNFILED }, t('rail.unfiled')),
                          folders.map((item) => h('option', { key: item.id, value: item.id }, item.name)),
                        ),
                      ),
                  h('span', { style: { flex: 1 } }),
                  h(
                    'button',
                    { type: 'button', className: 'dsh-nw-btn', onClick: () => setSelected({}) },
                    t('bulk.clear'),
                  ),
                );

          return h(
            'div',
            { className: 'dsh-nw-root' },
            h('style', { key: 'styles' }, CSS),
            h(
              'header',
              { className: 'dsh-nw-header', key: 'header' },
              h('span', { className: 'dsh-nw-mark', 'aria-hidden': 'true' }, glyph(18, true)),
              h('h1', { className: 'dsh-nw-title' }, t('panel.title')),
              h('span', { className: 'dsh-nw-count' }, String(liveNotes.length) + ' ' + t('panel.unit')),
              h('span', { className: 'dsh-nw-spacer' }),
              h(
                'button',
                {
                  type: 'button',
                  className: 'dsh-nw-btn dsh-nw-btn-icon',
                  title: t('io.exportTitle'),
                  'aria-label': t('io.export'),
                  onClick: exportAll,
                },
                iconDownload(),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'dsh-nw-btn dsh-nw-btn-icon',
                  title: t('io.importTitle'),
                  'aria-label': t('io.import'),
                  onClick: () => fileRef.current && fileRef.current.click(),
                },
                iconUpload(),
              ),
              h('input', {
                key: 'file',
                ref: fileRef,
                type: 'file',
                accept: 'application/json,.json',
                style: { display: 'none' },
                onChange: (event) => {
                  const file = event.target.files && event.target.files[0];
                  if (file) importAll(file);
                  event.target.value = '';
                },
              }),
              h(
                'button',
                { type: 'button', className: 'dsh-nw-btn dsh-nw-btn-primary', onClick: addNote },
                h('span', { className: 'dsh-nw-plus', 'aria-hidden': 'true' }, '+'),
                t('panel.add'),
              ),
            ),
            h(
              'div',
              { className: 'dsh-nw-toolbar', key: 'toolbar' },
              h(
                'div',
                { className: 'dsh-nw-tabs', role: 'tablist', 'aria-label': t('rail.title') },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-nw-tab',
                    role: 'tab',
                    'aria-selected': view === 'all' ? 'true' : 'false',
                    onClick: () => {
                      setView('all');
                      setFolder('all');
                    },
                  },
                  t('view.all'),
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-nw-tab',
                    role: 'tab',
                    'aria-selected': view === 'archived' ? 'true' : 'false',
                    onClick: () => {
                      setView('archived');
                      setFolder('all');
                    },
                  },
                  t('view.archived'),
                ),
              ),
              h(
                'div',
                { className: 'dsh-nw-search' },
                iconSearch(),
                h('input', {
                  className: 'dsh-nw-input',
                  value: query,
                  placeholder: t('search.placeholder'),
                  'aria-label': t('search.placeholder'),
                  onChange: (event) => setQuery(event.target.value),
                }),
                query
                  ? h(
                      'button',
                      {
                        type: 'button',
                        className: 'dsh-nw-input-clear',
                        title: t('search.clear'),
                        'aria-label': t('search.clear'),
                        onClick: () => setQuery(''),
                      },
                      '\u2715',
                    )
                  : null,
              ),
              notice ? h('span', { className: 'dsh-nw-notice' }, notice) : null,
            ),
            bulkBar,
            h(
              'div',
              { className: 'dsh-nw-body', key: 'body' },
              renderRail(),
              h(
                'div',
                { className: 'dsh-nw-wall' },
                ordered.length === 0 ? renderEmpty() : h('div', { className: 'dsh-nw-grid' }, ordered.map(renderNote)),
              ),
            ),
          );
        }

        /* The panel row: the label doubles as visible text, accessible name and rail tooltip. */
        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            { name: 'sidebar.panellist', id: PANEL_ID, order: 20, label: () => t('panel.title') },
            PanelIcon,
          ),
        );

        /* The same id addresses this central panel; a missing entry would throw on selection. */
        ctx.slots.inject('main', () =>
          ctx.slots.register({ name: 'main', key: PANEL_ID }, NoteWallPanel),
        );
      },
    };
  },
});