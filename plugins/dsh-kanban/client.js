/**
 * Client half of the Kanban bundle.
 *
 * Registers one global panel entry in the sidebar (`sidebar.panellist`) and its
 * central panel in the layout's `main` keyed slot, both addressed by the id
 * `kanban`. The board is browser-owned: it loads from and saves to localStorage,
 * so the Host half registers nothing.
 *
 * The module is plain browser JavaScript loaded by the harness module loader.
 * `require` is only ever called with 'react'.
 */
window.__ModuleLoader__.load({
  id: '@local/dsh-kanban',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'kanban';
    const PANEL_ID = 'kanban';
    const STORAGE_KEY = 'dsh.kanban.board.v1';
    const BOARD_VERSION = 1;

    /* Priority accents and the board glyph are the artwork of this panel, so per
     * SPEC section 5 they may carry literal colors. Every piece of chrome around
     * them (surfaces, borders, labels, focus rings, empty states) uses the host
     * theme tokens instead. */
    const accent = {
      low: '#8a94a6',
      medium: '#4a86e8',
      high: '#e8890c',
      urgent: '#d93b3b',
    };
    const priorityIds = ['low', 'medium', 'high', 'urgent'];
    const defaultPriority = 'medium';

    /* Frozen column ids and WIP limits; array index inside a column is the order. */
    const columnDefs = [
      { id: 'backlog', limit: null },
      { id: 'progress', limit: 3 },
      { id: 'review', limit: 2 },
      { id: 'done', limit: null },
    ];
    const columnIds = [];
    const columnIndex = {};
    for (let i = 0; i < columnDefs.length; i += 1) {
      columnIds.push(columnDefs[i].id);
      columnIndex[columnDefs[i].id] = i;
    }

    const CSS = [
      '.dsh-kb-root{position:relative;display:flex;flex-direction:column;height:100%;min-height:0;box-sizing:border-box;',
      'background:var(--dsw-alias-bg-base);padding-top:var(--dsh-frame-top-clearance,0px);color:var(--dsw-alias-label-primary)}',
      '.dsh-kb-header{display:flex;flex:none;align-items:center;gap:12px;padding:18px 24px 12px}',
      '.dsh-kb-mark{display:block;flex:none;color:var(--dsw-alias-label-primary)}',
      '.dsh-kb-titles{display:flex;flex-direction:column;gap:2px;min-width:0}',
      '.dsh-kb-title{margin:0;font-size:16px;font-weight:600;line-height:1.3;color:var(--dsw-alias-label-primary)}',
      '.dsh-kb-subtitle{font-size:12px;line-height:1.4;color:var(--dsw-alias-label-secondary)}',
      '.dsh-kb-count{font-size:12px;color:var(--dsw-alias-label-secondary);white-space:nowrap}',
      '.dsh-kb-spacer{flex:1;min-width:0}',
      '.dsh-kb-action{display:inline-flex;flex:none;align-items:center;gap:6px;height:30px;padding:0 12px;',
      'border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);',
      'color:var(--dsw-alias-label-primary);font-family:inherit;font-size:13px;cursor:pointer;',
      'transition:background .15s ease,border-color .15s ease}',
      '.dsh-kb-action:hover{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-brand-primary)}',
      '.dsh-kb-action:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
      '.dsh-kb-plus{font-size:15px;line-height:1}',
      '.dsh-kb-empty{display:flex;flex:none;flex-direction:column;align-items:center;gap:6px;margin:0 24px 16px;',
      'padding:20px;border:1px dashed var(--dsw-alias-border-l2);border-radius:10px;',
      'color:var(--dsw-alias-label-secondary);text-align:center}',
      '.dsh-kb-empty-title{font-size:14px;color:var(--dsw-alias-label-primary)}',
      '.dsh-kb-empty-hint{font-size:12.5px}',
      '.dsh-kb-scroll{flex:1;min-height:0;display:flex;align-items:stretch;gap:14px;',
      'overflow-x:auto;overflow-y:hidden;padding:0 24px 24px}',
      '.dsh-kb-col{display:flex;flex:0 0 272px;width:272px;flex-direction:column;min-height:0;',
      'border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-layer-1);',
      'transition:background .15s ease,border-color .15s ease}',
      '.dsh-kb-col.is-drop{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-2)}',
      '.dsh-kb-col-head{display:flex;flex:none;align-items:center;gap:8px;padding:10px 12px;',
      'border-bottom:1px solid var(--dsw-alias-border-l2)}',
      '.dsh-kb-col-title{margin:0;font-size:13px;font-weight:600;line-height:1.3;',
      'color:var(--dsw-alias-label-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.dsh-kb-col-count{flex:none;font-size:11.5px;color:var(--dsw-alias-label-secondary)}',
      '.dsh-kb-wip{flex:none;padding:1px 6px;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;',
      'font-size:11px;color:var(--dsw-alias-label-secondary);white-space:nowrap}',
      '.dsh-kb-wip.is-over{border-color:' + accent.urgent + ';color:' + accent.urgent + '}',
      '.dsh-kb-cards{flex:1;min-height:64px;overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column;',
      'gap:8px;padding:10px}',
      '.dsh-kb-col-empty{display:flex;align-items:center;justify-content:center;min-height:56px;',
      'border:1px dashed var(--dsw-alias-border-l2);border-radius:8px;font-size:12px;',
      'color:var(--dsw-alias-label-secondary)}',
      '.dsh-kb-drop{flex:none;height:2px;margin:1px 2px;border-radius:2px;background:var(--dsw-alias-brand-primary)}',
      '.dsh-kb-card{position:relative;display:flex;flex-direction:column;gap:5px;padding:9px 10px 8px;',
      'border:1px solid var(--dsw-alias-border-l2);border-left-width:3px;border-left-style:solid;',
      'border-radius:8px;background:var(--dsw-alias-bg-layer-2);transition:border-color .15s ease}',
      '.dsh-kb-card:hover{border-color:var(--dsw-alias-brand-primary)}',
      '.dsh-kb-card.is-drag{opacity:.5}',
      '.dsh-kb-open{display:flex;flex-direction:column;gap:4px;width:100%;box-sizing:border-box;',
      'padding:0 22px 0 0;border:0;background:transparent;text-align:left;font-family:inherit;cursor:grab}',
      '.dsh-kb-open:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;border-radius:4px}',
      '.dsh-kb-card-title{margin:0;font-size:13px;font-weight:600;line-height:1.35;',
      'color:var(--dsw-alias-label-primary);overflow-wrap:break-word}',
      '.dsh-kb-card-title.is-untitled{font-style:italic;font-weight:500;color:var(--dsw-alias-label-secondary)}',
      '.dsh-kb-card-detail{margin:0;font-size:11.5px;line-height:1.45;color:var(--dsw-alias-label-secondary);',
      'white-space:pre-wrap;overflow-wrap:break-word;max-height:34px;overflow:hidden}',
      '.dsh-kb-card-foot{display:flex;align-items:center;gap:6px}',
      '.dsh-kb-prio{display:inline-flex;flex:none;align-items:center;gap:4px;font-size:10.5px;',
      'color:var(--dsw-alias-label-secondary)}',
      '.dsh-kb-dot{width:8px;height:8px;flex:none;border-radius:50%}',
      '.dsh-kb-time{flex:1 1 auto;min-width:0;font-size:10.5px;color:var(--dsw-alias-label-secondary);',
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:right}',
      '.dsh-kb-icon-btn{display:grid;place-items:center;flex:none;width:22px;height:22px;padding:0;',
      'border:1px solid transparent;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);',
      'cursor:pointer;transition:background .15s ease,color .15s ease}',
      '.dsh-kb-icon-btn:hover:not(:disabled){background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}',
      '.dsh-kb-icon-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dsh-kb-icon-btn:disabled{opacity:.35;cursor:default}',
      '.dsh-kb-del{position:absolute;top:3px;right:3px;display:grid;place-items:center;width:20px;height:20px;',
      'padding:0;border:0;border-radius:6px;background:var(--dsw-alias-bg-layer-2);',
      'color:var(--dsw-alias-label-secondary);cursor:pointer;opacity:0;visibility:hidden;',
      'transition:opacity .15s ease,color .15s ease}',
      '.dsh-kb-card:hover .dsh-kb-del,.dsh-kb-card:focus-within .dsh-kb-del{opacity:1;visibility:visible}',
      '.dsh-kb-del:hover{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}',
      '.dsh-kb-del:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dsh-kb-overlay{position:absolute;inset:0;z-index:20;display:flex;align-items:center;justify-content:center;',
      'padding:20px;background:var(--dsw-alias-bg-base);',
      'background:color-mix(in srgb,var(--dsw-alias-label-primary) 42%,transparent)}',
      '.dsh-kb-dialog{display:flex;flex-direction:column;gap:12px;width:100%;max-width:440px;max-height:100%;',
      'overflow:auto;box-sizing:border-box;padding:18px;border:1px solid var(--dsw-alias-border-l2);',
      'border-radius:12px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}',
      '.dsh-kb-dialog-title{margin:0;font-size:15px;font-weight:600;color:var(--dsw-alias-label-primary)}',
      '.dsh-kb-field{display:flex;flex-direction:column;gap:5px;min-width:0}',
      '.dsh-kb-field-row{display:flex;gap:10px}',
      '.dsh-kb-field-row .dsh-kb-field{flex:1 1 0}',
      '.dsh-kb-label{font-size:11.5px;color:var(--dsw-alias-label-secondary)}',
      '.dsh-kb-input,.dsh-kb-textarea,.dsh-kb-select{width:100%;box-sizing:border-box;padding:7px 9px;',
      'border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-base);',
      'color:var(--dsw-alias-label-primary);font-family:inherit;font-size:13px}',
      '.dsh-kb-textarea{min-height:84px;resize:vertical;line-height:1.5}',
      '.dsh-kb-input:focus-visible,.dsh-kb-textarea:focus-visible,.dsh-kb-select:focus-visible{',
      'outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dsh-kb-dialog-foot{display:flex;align-items:center;gap:8px}',
      '.dsh-kb-btn{height:30px;padding:0 13px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;',
      'background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-family:inherit;',
      'font-size:13px;cursor:pointer;transition:background .15s ease,border-color .15s ease}',
      '.dsh-kb-btn:hover{background:var(--dsw-alias-bg-base)}',
      '.dsh-kb-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
      '.dsh-kb-btn.is-primary{border-color:var(--dsw-alias-brand-primary);font-weight:600}',
      '.dsh-kb-btn.is-danger{border-color:' + accent.urgent + ';color:' + accent.urgent + '}',
      '.dsh-kb-sr-only{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;',
      'clip:rect(0 0 0 0);white-space:nowrap;border:0}',
      '@media (prefers-reduced-motion: reduce){',
      '.dsh-kb-action,.dsh-kb-col,.dsh-kb-card,.dsh-kb-icon-btn,.dsh-kb-del,.dsh-kb-btn{transition:none}}',
    ].join('');

    function newId() {
      return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    function emptyColumns() {
      const columns = {};
      for (let i = 0; i < columnIds.length; i += 1) columns[columnIds[i]] = [];
      return columns;
    }

    function emptyBoard() {
      return { version: BOARD_VERSION, columns: emptyColumns() };
    }

    function priorityColor(id) {
      return accent[id] || accent[defaultPriority];
    }

    /** Repair one card, or return null when the entry is not a usable object. */
    function sanitizeCard(item, seen) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      let id = typeof item.id === 'string' ? item.id : '';
      if (!id || seen.has(id)) id = newId();
      seen.add(id);
      const created = Number.isFinite(item.createdAt) ? item.createdAt : Date.now();
      return {
        id: id,
        title: typeof item.title === 'string' ? item.title : '',
        detail: typeof item.detail === 'string' ? item.detail : '',
        priority: priorityIds.indexOf(item.priority) >= 0 ? item.priority : defaultPriority,
        createdAt: created,
        updatedAt: Number.isFinite(item.updatedAt) ? item.updatedAt : created,
      };
    }

    /**
     * Accept any hand-edited or stale localStorage payload and return a
     * well-formed model without throwing: unknown columns are dropped, unknown
     * priorities become `medium`, non-object cards disappear, and missing ids or
     * timestamps are repaired.
     */
    function sanitize(raw) {
      try {
        let source = raw;
        if (typeof source === 'string') {
          try {
            source = JSON.parse(source);
          } catch (error) {
            source = null;
          }
        }
        const columns = emptyColumns();
        if (!source || typeof source !== 'object' || Array.isArray(source)) {
          return { version: BOARD_VERSION, columns: columns };
        }
        const input = source.columns;
        if (!input || typeof input !== 'object' || Array.isArray(input)) {
          return { version: BOARD_VERSION, columns: columns };
        }
        const seen = new Set();
        for (let i = 0; i < columnIds.length; i += 1) {
          const columnId = columnIds[i];
          const list = input[columnId];
          if (!Array.isArray(list)) continue;
          for (let j = 0; j < list.length; j += 1) {
            const card = sanitizeCard(list[j], seen);
            if (card) columns[columnId].push(card);
          }
        }
        return { version: BOARD_VERSION, columns: columns };
      } catch (error) {
        return emptyBoard();
      }
    }

    function loadBoard() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? sanitize(JSON.parse(raw)) : emptyBoard();
      } catch (error) {
        /* Storage is blocked or the payload is unreadable; start from an empty board. */
        return emptyBoard();
      }
    }

    function saveBoard(board) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
      } catch (error) {
        /* Storage is unavailable; the board keeps working in memory. */
      }
    }

    /** Card order inside a column, used by every move path. */
    function locateCard(columns, id) {
      for (let i = 0; i < columnIds.length; i += 1) {
        const columnId = columnIds[i];
        const list = columns[columnId];
        for (let j = 0; j < list.length; j += 1) {
          if (list[j].id === id) return { column: columnId, index: j, card: list[j] };
        }
      }
      return null;
    }

    function cloneColumns(columns) {
      const next = {};
      for (let i = 0; i < columnIds.length; i += 1) {
        const columnId = columnIds[i];
        next[columnId] = columns[columnId].slice();
      }
      return next;
    }

    function formatTime(timestamp, locale) {
      const date = new Date(timestamp);
      try {
        return date.toLocaleString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      } catch (error) {
        try {
          return date.toLocaleString();
        } catch (inner) {
          return '';
        }
      }
    }

    /** The board glyph: a framed three-column board, drawn in `currentColor`. */
    function glyph(size, active) {
      const stroke = active ? 1.6 : 1.4;
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
        h('rect', Object.assign({ x: 2.6, y: 3.4, width: 14.8, height: 13.2, rx: 2.2 }, line)),
        h('path', Object.assign({ d: 'M2.6 7.4h14.8M7.6 7.4v9.2M12.4 7.4v9.2' }, line)),
      );
    }

    function closeGlyph() {
      return h(
        'svg',
        { viewBox: '0 0 12 12', width: 12, height: 12, 'aria-hidden': 'true', style: { display: 'block' } },
        h('path', {
          d: 'M2.5 2.5l7 7M9.5 2.5l-7 7',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.5,
          strokeLinecap: 'round',
        }),
      );
    }

    function chevronGlyph(direction) {
      const d = direction < 0 ? 'M7.6 2.6L3.2 7l4.4 4.4M3.6 7h5.2' : 'M4.4 2.6L8.8 7l-4.4 4.4M3.2 7h5.2';
      return h(
        'svg',
        { viewBox: '0 0 12 14', width: 12, height: 12, 'aria-hidden': 'true', style: { display: 'block' } },
        h('path', { d: d, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }),
      );
    }

    /** Owner props of `sidebar.panellist`: the row supplies the requested square edge. */
    function PanelIcon(props) {
      const size = props && typeof props.size === 'number' && props.size > 0 ? props.size : 20;
      return glyph(size, !!(props && props.active));
    }

    const DICT = {
      zh: {
        'panel.title': '敏捷看板',
        'panel.subtitle': '拖动卡片，在待办、进行中、评审与完成之间流转',
        'panel.newCard': '新建卡片',
        'panel.unit': '张卡片',
        'panel.wip': 'WIP 上限',
        'panel.wipExceeded': '已超出 WIP 上限',
        'column.backlog': '待办',
        'column.progress': '进行中',
        'column.review': '评审中',
        'column.done': '已完成',
        'column.addCard': '新建卡片',
        'column.empty': '暂无卡片',
        'card.untitled': '未命名卡片',
        'card.priority': '优先级',
        'priority.low': '低',
        'priority.medium': '中',
        'priority.high': '高',
        'priority.urgent': '紧急',
        'card.movePrev': '移到上一列',
        'card.moveNext': '移到下一列',
        'card.delete': '删除卡片',
        'card.edit': '编辑卡片',
        'card.updated': '更新于',
        'editor.title': '编辑卡片',
        'editor.newTitle': '新建卡片',
        'editor.fieldTitle': '标题',
        'editor.fieldDetail': '详情',
        'editor.fieldPriority': '优先级',
        'editor.fieldColumn': '所在列',
        'editor.detailPlaceholder': '补充说明…',
        'editor.save': '保存',
        'editor.cancel': '取消',
        'editor.delete': '删除',
        'empty.title': '看板还是空的',
        'empty.hint': '点击「新建卡片」，或用任意一列标题栏上的 + 添加第一张卡片',
        'aria.board': '敏捷看板',
        'aria.column': '看板列',
        'aria.dragging': '正在拖动卡片',
      },
      en: {
        'panel.title': 'Agile Board',
        'panel.subtitle': 'Drag cards across backlog, in progress, review and done',
        'panel.newCard': 'New card',
        'panel.unit': 'cards',
        'panel.wip': 'WIP limit',
        'panel.wipExceeded': 'Over the WIP limit',
        'column.backlog': 'Backlog',
        'column.progress': 'In Progress',
        'column.review': 'Review',
        'column.done': 'Done',
        'column.addCard': 'Add card',
        'column.empty': 'No cards',
        'card.untitled': 'Untitled card',
        'card.priority': 'Priority',
        'priority.low': 'Low',
        'priority.medium': 'Medium',
        'priority.high': 'High',
        'priority.urgent': 'Urgent',
        'card.movePrev': 'Move to previous column',
        'card.moveNext': 'Move to next column',
        'card.delete': 'Delete card',
        'card.edit': 'Edit card',
        'card.updated': 'Updated',
        'editor.title': 'Edit card',
        'editor.newTitle': 'New card',
        'editor.fieldTitle': 'Title',
        'editor.fieldDetail': 'Details',
        'editor.fieldPriority': 'Priority',
        'editor.fieldColumn': 'Column',
        'editor.detailPlaceholder': 'Add more context…',
        'editor.save': 'Save',
        'editor.cancel': 'Cancel',
        'editor.delete': 'Delete',
        'empty.title': 'The board is empty',
        'empty.hint': 'Select “New card”, or use the + in any column header, to add your first card',
        'aria.board': 'Agile board',
        'aria.column': 'Board column',
        'aria.dragging': 'Dragging a card',
      },
    };

    return {
      inject: ['slots', 'locale'],

      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, DICT), 'kanban: dictionaries');

        const t = ctx.locale.bind(NS);

        function KanbanPanel() {
          const [board, setBoard] = React.useState(loadBoard);
          const [editing, setEditing] = React.useState(null);
          const [dragId, setDragId] = React.useState(null);
          const [dropTarget, setDropTarget] = React.useState(null);
          const cardRefs = React.useRef({});
          const titleRef = React.useRef(null);

          let activeLocale;
          try {
            const localeState = ctx.locale.getLocale();
            activeLocale = localeState && localeState.active ? localeState.active : undefined;
          } catch (error) {
            activeLocale = undefined;
          }

          const editingId = editing ? editing.id : null;

          /* Every state change lands in localStorage; a fresh load restores it. */
          React.useEffect(() => {
            saveBoard(board);
          }, [board]);

          /* `Esc` closes the editor without saving. */
          React.useEffect(() => {
            if (!editingId) return undefined;
            function onKeyDown(event) {
              if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                setEditing(null);
              }
            }
            document.addEventListener('keydown', onKeyDown, true);
            return () => document.removeEventListener('keydown', onKeyDown, true);
          }, [editingId]);

          /* A freshly opened editor starts in the title field. */
          React.useEffect(() => {
            if (!editingId) return;
            const input = titleRef.current;
            if (!input) return;
            input.focus();
            const end = input.value.length;
            try {
              input.setSelectionRange(end, end);
            } catch (error) {
              /* Selection is a nicety; focus alone is enough. */
            }
          }, [editingId]);

          function patchEditing(patch) {
            setEditing((previous) => (previous ? Object.assign({}, previous, patch) : previous));
          }

          function openEditor(card, columnId) {
            setEditing({
              id: card.id,
              column: columnId,
              title: card.title,
              detail: card.detail,
              priority: card.priority,
              mode: 'edit',
            });
          }

          function addCard(columnId) {
            const now = Date.now();
            const card = {
              id: newId(),
              title: '',
              detail: '',
              priority: defaultPriority,
              createdAt: now,
              updatedAt: now,
            };
            setBoard((previous) => {
              const columns = cloneColumns(previous.columns);
              columns[columnId].unshift(card);
              return { version: BOARD_VERSION, columns: columns };
            });
            setEditing({
              id: card.id,
              column: columnId,
              title: '',
              detail: '',
              priority: defaultPriority,
              mode: 'new',
            });
          }

          function removeCard(id) {
            if (dragId === id) {
              setDragId(null);
              setDropTarget(null);
            }
            setBoard((previous) => {
              const found = locateCard(previous.columns, id);
              if (!found) return previous;
              const columns = cloneColumns(previous.columns);
              columns[found.column].splice(found.index, 1);
              return { version: BOARD_VERSION, columns: columns };
            });
          }

          /**
           * The one move operation behind both drag & drop and the keyboard
           * controls. `toIndex` is an insertion index in the target column as it
           * is currently displayed; a move back onto the same slot is a no-op.
           */
          function moveCard(id, toColumnId, toIndex) {
            setBoard((previous) => {
              const found = locateCard(previous.columns, id);
              if (!found) return previous;
              if (!columnIndex.hasOwnProperty(toColumnId)) return previous;
              const columns = cloneColumns(previous.columns);
              const source = columns[found.column];
              source.splice(found.index, 1);
              let index = toIndex;
              if (found.column === toColumnId) {
                if (index > found.index) index -= 1;
                if (index === found.index) return previous;
              }
              const target = columns[toColumnId];
              if (index < 0) index = 0;
              if (index > target.length) index = target.length;
              const card = Object.assign({}, found.card, { updatedAt: Date.now() });
              target.splice(index, 0, card);
              return { version: BOARD_VERSION, columns: columns };
            });
          }

          /** Keyboard path: same `moveCard` as drag & drop, one column sideways. */
          function stepColumn(id, direction) {
            const found = locateCard(board.columns, id);
            if (!found) return;
            const next = columnIndex[found.column] + direction;
            if (next < 0 || next >= columnIds.length) return;
            moveCard(id, columnIds[next], found.index);
          }

          function saveEditor() {
            if (!editing) return;
            const draft = editing;
            const now = Date.now();
            setBoard((previous) => {
              const found = locateCard(previous.columns, draft.id);
              if (!found) return previous;
              if (!columnIndex.hasOwnProperty(draft.column)) return previous;
              const columns = cloneColumns(previous.columns);
              const updated = Object.assign({}, found.card, {
                title: draft.title,
                detail: draft.detail,
                priority: draft.priority,
                updatedAt: now,
              });
              columns[found.column][found.index] = updated;
              if (draft.column !== found.column) {
                columns[found.column].splice(found.index, 1);
                columns[draft.column].unshift(updated);
              }
              return { version: BOARD_VERSION, columns: columns };
            });
            setEditing(null);
          }

          function deleteEditing() {
            if (!editing) return;
            removeCard(editing.id);
            setEditing(null);
          }

          /** Insertion index from the pointer against card midpoints. */
          function computeDropIndex(columnId, clientY) {
            const list = board.columns[columnId];
            let index = list.length;
            for (let i = 0; i < list.length; i += 1) {
              const element = cardRefs.current[list[i].id];
              if (!element) continue;
              const rect = element.getBoundingClientRect();
              if (clientY < rect.top + rect.height / 2) {
                index = i;
                break;
              }
            }
            return index;
          }

          function handleDragStart(event, card) {
            setDragId(card.id);
            try {
              event.dataTransfer.effectAllowed = 'move';
              /* Kept only for engines that require a payload; the source of
               * truth is React state, because getData is unreadable in dragover. */
              event.dataTransfer.setData('text/plain', card.id);
            } catch (error) {
              /* A drag without a dataTransfer payload is still driven by state. */
            }
          }

          function handleDragEnd() {
            setDragId(null);
            setDropTarget(null);
          }

          function handleDragOver(event, columnId) {
            if (!dragId) return;
            event.preventDefault();
            try {
              event.dataTransfer.dropEffect = 'move';
            } catch (error) {
              /* Ignored: the drop still works. */
            }
            const index = computeDropIndex(columnId, event.clientY);
            setDropTarget((previous) =>
              previous && previous.column === columnId && previous.index === index
                ? previous
                : { column: columnId, index: index },
            );
          }

          function handleDragLeave(event, columnId) {
            const next = event.relatedTarget;
            if (next && event.currentTarget.contains(next)) return;
            setDropTarget((previous) => (previous && previous.column === columnId ? null : previous));
          }

          function handleDrop(event, columnId) {
            if (!dragId) return;
            event.preventDefault();
            const index = computeDropIndex(columnId, event.clientY);
            moveCard(dragId, columnId, index);
            setDragId(null);
            setDropTarget(null);
          }

          function cardTitle(card) {
            return typeof card.title === 'string' && card.title.length > 0 ? card.title : t('card.untitled');
          }

          function renderCard(card, columnId, index) {
            const label = cardTitle(card);
            const untitled = !(typeof card.title === 'string' && card.title.length > 0);
            const isDragging = dragId === card.id;
            const atFirstColumn = columnIndex[columnId] === 0;
            const atLastColumn = columnIndex[columnId] === columnIds.length - 1;
            return h(
              'article',
              {
                key: card.id,
                className: 'dsh-kb-card' + (isDragging ? ' is-drag' : ''),
                draggable: true,
                style: { borderLeftColor: priorityColor(card.priority) },
                ref: (element) => {
                  if (element) {
                    cardRefs.current[card.id] = element;
                  } else {
                    delete cardRefs.current[card.id];
                  }
                },
                onDragStart: (event) => handleDragStart(event, card),
                onDragEnd: handleDragEnd,
              },
              h(
                'button',
                {
                  type: 'button',
                  className: 'dsh-kb-del',
                  title: t('card.delete'),
                  'aria-label': t('card.delete') + ': ' + label,
                  onClick: () => removeCard(card.id),
                },
                closeGlyph(),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'dsh-kb-open',
                  'aria-label': t('card.edit') + ': ' + label,
                  onClick: () => openEditor(card, columnId),
                },
                /* Phrasing content only: `<button>` may not contain a heading or paragraph. */
                h('span', { className: 'dsh-kb-card-title' + (untitled ? ' is-untitled' : '') }, label),
                typeof card.detail === 'string' && card.detail.length > 0
                  ? h('span', { className: 'dsh-kb-card-detail' }, card.detail)
                  : null,
              ),
              h(
                'div',
                { className: 'dsh-kb-card-foot' },
                h(
                  'span',
                  { className: 'dsh-kb-prio', title: t('card.priority') + ': ' + t('priority.' + card.priority) },
                  h('span', {
                    className: 'dsh-kb-dot',
                    style: { background: priorityColor(card.priority) },
                    'aria-hidden': 'true',
                  }),
                  t('priority.' + card.priority),
                ),
                h('span', { className: 'dsh-kb-time' }, t('card.updated') + ' ' + formatTime(card.updatedAt, activeLocale)),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-kb-icon-btn',
                    disabled: atFirstColumn,
                    title: t('card.movePrev'),
                    'aria-label': t('card.movePrev') + ': ' + label,
                    onClick: () => stepColumn(card.id, -1),
                  },
                  chevronGlyph(-1),
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-kb-icon-btn',
                    disabled: atLastColumn,
                    title: t('card.moveNext'),
                    'aria-label': t('card.moveNext') + ': ' + label,
                    onClick: () => stepColumn(card.id, 1),
                  },
                  chevronGlyph(1),
                ),
              ),
            );
          }

          function renderColumn(column) {
            const list = board.columns[column.id];
            const over = column.limit !== null && list.length > column.limit;
            const dropping = !!dragId && !!dropTarget && dropTarget.column === column.id;
            const dropIndex = dropping ? dropTarget.index : -1;
            const items = [];
            for (let i = 0; i < list.length; i += 1) {
              if (dropping && dropIndex === i) {
                items.push(h('div', { key: 'drop-' + i, className: 'dsh-kb-drop', 'aria-hidden': 'true' }));
              }
              items.push(renderCard(list[i], column.id, i));
            }
            if (dropping && dropIndex >= list.length) {
              items.push(h('div', { key: 'drop-end', className: 'dsh-kb-drop', 'aria-hidden': 'true' }));
            }
            if (list.length === 0 && !dropping) {
              items.push(h('div', { key: 'empty', className: 'dsh-kb-col-empty' }, t('column.empty')));
            }
            const wipLabel = over ? t('panel.wipExceeded') : t('panel.wip');
            return h(
              'div',
              { key: column.id, className: 'dsh-kb-col' + (dropping ? ' is-drop' : ''), role: 'listitem' },
              h(
                'div',
                { className: 'dsh-kb-col-head' },
                h('h2', { className: 'dsh-kb-col-title' }, t('column.' + column.id)),
                h('span', { className: 'dsh-kb-col-count' }, String(list.length)),
                column.limit === null
                  ? null
                  : h(
                      'span',
                      {
                        className: 'dsh-kb-wip' + (over ? ' is-over' : ''),
                        title: wipLabel,
                        'aria-label': wipLabel,
                      },
                      list.length + '/' + column.limit,
                    ),
                h('span', { className: 'dsh-kb-spacer' }),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-kb-icon-btn',
                    title: t('column.addCard') + ': ' + t('column.' + column.id),
                    'aria-label': t('column.addCard') + ': ' + t('column.' + column.id),
                    onClick: () => addCard(column.id),
                  },
                  h('span', { className: 'dsh-kb-plus', 'aria-hidden': 'true' }, '+'),
                ),
              ),
              h(
                'div',
                {
                  className: 'dsh-kb-cards',
                  role: 'group',
                  'aria-label': t('aria.column') + ': ' + t('column.' + column.id),
                  onDragOver: (event) => handleDragOver(event, column.id),
                  onDragLeave: (event) => handleDragLeave(event, column.id),
                  onDrop: (event) => handleDrop(event, column.id),
                },
                items,
              ),
            );
          }

          function renderEditor() {
            if (!editing) return null;
            const isNew = editing.mode === 'new';
            const heading = isNew ? t('editor.newTitle') : t('editor.title');
            const priorityOptions = priorityIds.map((id) =>
              h('option', { key: id, value: id }, t('priority.' + id)),
            );
            const columnOptions = columnIds.map((id) =>
              h('option', { key: id, value: id }, t('column.' + id)),
            );
            return h(
              'div',
              {
                className: 'dsh-kb-overlay',
                onMouseDown: (event) => {
                  if (event.target === event.currentTarget) setEditing(null);
                },
              },
              h(
                'div',
                {
                  className: 'dsh-kb-dialog',
                  role: 'dialog',
                  'aria-modal': 'true',
                  'aria-label': heading,
                },
                h('h2', { className: 'dsh-kb-dialog-title' }, heading),
                h(
                  'div',
                  { className: 'dsh-kb-field' },
                  h('label', { className: 'dsh-kb-label', htmlFor: 'dsh-kb-field-title' }, t('editor.fieldTitle')),
                  h('input', {
                    id: 'dsh-kb-field-title',
                    ref: titleRef,
                    className: 'dsh-kb-input',
                    type: 'text',
                    value: editing.title,
                    placeholder: t('card.untitled'),
                    spellCheck: 'false',
                    onChange: (event) => patchEditing({ title: event.target.value }),
                    onKeyDown: (event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        saveEditor();
                      }
                    },
                  }),
                ),
                h(
                  'div',
                  { className: 'dsh-kb-field' },
                  h('label', { className: 'dsh-kb-label', htmlFor: 'dsh-kb-field-detail' }, t('editor.fieldDetail')),
                  h('textarea', {
                    id: 'dsh-kb-field-detail',
                    className: 'dsh-kb-textarea',
                    value: editing.detail,
                    placeholder: t('editor.detailPlaceholder'),
                    spellCheck: 'false',
                    onChange: (event) => patchEditing({ detail: event.target.value }),
                  }),
                ),
                h(
                  'div',
                  { className: 'dsh-kb-field-row' },
                  h(
                    'div',
                    { className: 'dsh-kb-field' },
                    h('label', { className: 'dsh-kb-label', htmlFor: 'dsh-kb-field-priority' }, t('editor.fieldPriority')),
                    h(
                      'select',
                      {
                        id: 'dsh-kb-field-priority',
                        className: 'dsh-kb-select',
                        value: editing.priority,
                        onChange: (event) => patchEditing({ priority: event.target.value }),
                      },
                      priorityOptions,
                    ),
                  ),
                  h(
                    'div',
                    { className: 'dsh-kb-field' },
                    h('label', { className: 'dsh-kb-label', htmlFor: 'dsh-kb-field-column' }, t('editor.fieldColumn')),
                    h(
                      'select',
                      {
                        id: 'dsh-kb-field-column',
                        className: 'dsh-kb-select',
                        value: editing.column,
                        onChange: (event) => patchEditing({ column: event.target.value }),
                      },
                      columnOptions,
                    ),
                  ),
                ),
                h(
                  'div',
                  { className: 'dsh-kb-dialog-foot' },
                  h(
                    'button',
                    { type: 'button', className: 'dsh-kb-btn is-danger', onClick: deleteEditing },
                    t('editor.delete'),
                  ),
                  h('span', { className: 'dsh-kb-spacer' }),
                  h(
                    'button',
                    { type: 'button', className: 'dsh-kb-btn', onClick: () => setEditing(null) },
                    t('editor.cancel'),
                  ),
                  h(
                    'button',
                    { type: 'button', className: 'dsh-kb-btn is-primary', onClick: saveEditor },
                    t('editor.save'),
                  ),
                ),
              ),
            );
          }

          let total = 0;
          for (let i = 0; i < columnIds.length; i += 1) total += board.columns[columnIds[i]].length;

          return h(
            'div',
            { className: 'dsh-kb-root' },
            h('style', { key: 'styles' }, CSS),
            h(
              'header',
              { className: 'dsh-kb-header', key: 'header' },
              h('span', { className: 'dsh-kb-mark', 'aria-hidden': 'true' }, glyph(20, true)),
              h(
                'div',
                { className: 'dsh-kb-titles' },
                h('h1', { className: 'dsh-kb-title' }, t('panel.title')),
                h('div', { className: 'dsh-kb-subtitle' }, t('panel.subtitle')),
              ),
              h('span', { className: 'dsh-kb-spacer' }),
              h('span', { className: 'dsh-kb-count' }, total + ' ' + t('panel.unit')),
              h(
                'button',
                { type: 'button', className: 'dsh-kb-action', onClick: () => addCard(columnIds[0]) },
                h('span', { className: 'dsh-kb-plus', 'aria-hidden': 'true' }, '+'),
                t('panel.newCard'),
              ),
            ),
            total === 0
              ? h(
                  'div',
                  { className: 'dsh-kb-empty', key: 'empty' },
                  h('div', { className: 'dsh-kb-empty-title' }, t('empty.title')),
                  h('div', { className: 'dsh-kb-empty-hint' }, t('empty.hint')),
                )
              : null,
            h(
              'div',
              { className: 'dsh-kb-scroll', key: 'scroll', role: 'list', 'aria-label': t('aria.board') },
              columnDefs.map(renderColumn),
            ),
            h(
              'div',
              { className: 'dsh-kb-sr-only', key: 'status', role: 'status', 'aria-live': 'polite' },
              dragId ? t('aria.dragging') : '',
            ),
            renderEditor(),
          );
        }

        /* The panel row: the label doubles as visible text, accessible name and rail tooltip. */
        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            { name: 'sidebar.panellist', id: PANEL_ID, order: 30, label: () => t('panel.title') },
            PanelIcon,
          ),
        );

        /* The same id addresses this central panel; a missing entry would throw on selection. */
        ctx.slots.inject('main', () =>
          ctx.slots.register({ name: 'main', key: PANEL_ID }, KanbanPanel),
        );
      },
    };
  },
});