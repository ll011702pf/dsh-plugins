    /* ---- localized UI copy -------------------------------------------------
     * Every visible string goes through the Client locale service. Both
     * dictionaries carry the same key set; the verifier asserts that. */
    const DICT = {
      zh: {
        'panel.title': '流程图板',
        'panel.subtitle': '流程图 · 架构图 · 用户旅程 · 泳道图',

        'action.templates': '模板',
        'action.export': '导出',
        'action.undo': '撤销',
        'action.redo': '重做',
        'action.fit': '适应画布',
        'action.newBoard': '新建画布',
        'action.deleteBoard': '删除画布',
        'action.rename': '重命名',
        'action.close': '关闭',

        'palette.title': '绘图',
        'palette.draw': '基本图形',
        'palette.connect': '线条',
        'palette.diagram': '图表元素',
        'palette.layout': '容器',
        'palette.hint': '点击添加，拖动移动，双击改文字。Shift 拖动框选，Shift 点选加选。'
          + '画笔 / 荧光笔 / 橡皮：选中后在画布拖动即可使用，Esc 退出。',

        'type.sticky': '便签',
        'type.rect': '矩形',
        'type.ellipse': '椭圆',
        'type.triangle': '三角形',
        'type.text': '文字',
        'type.line': '直线',
        'type.arrow': '箭头',
        'type.stroke': '画笔',
        'type.highlighter': '荧光笔',
        'type.eraser': '橡皮',
        'type.terminator': '起止',
        'type.step': '步骤',
        'type.decision': '判断',
        'type.data': '数据',
        'type.document': '文档',
        'type.note': '注释',
        'type.actor': '角色',
        'type.service': '服务',
        'type.database': '存储',
        'type.band': '分区',
        'type.frame': '框架',
        'frame.defaultTitle': '未命名分区',
        'type.table': '表格',

        'tone.default': '默认',
        'tone.blue': '蓝',
        'tone.teal': '青',
        'tone.green': '绿',
        'tone.amber': '琥珀',
        'tone.rose': '玫红',
        'tone.violet': '紫',
        'tone.slate': '灰',

        'router.smooth': '曲线',
        'router.elbow': '折线',
        'style.solid': '实线',
        'style.dashed': '虚线',
        'arrow.end': '终点箭头',
        'arrow.both': '双向箭头',
        'arrow.none': '无箭头',

        'inspector.title': '属性',
        'inspector.empty': '选中一个图形或连线后可在此编辑。',
        'inspector.multi': '已选中 {n} 个对象',
        'inspector.align': '对齐',
        'inspector.distribute': '分布',
        'inspector.layer': '图层',
        'table.grid': '{cols} 列 × {rows} 行',
        'table.editHint': '表格在右侧属性面板逐格编辑',
        'table.cell': '单元格',
        'table.addRow': '+ 行',
        'table.removeRow': '− 行',
        'table.addCol': '+ 列',
        'table.removeCol': '− 列',
        'align.left': '左',
        'align.hcenter': '水平居中',
        'align.right': '右',
        'align.top': '上',
        'align.vcenter': '垂直居中',
        'align.bottom': '下',
        'distribute.h': '水平等距',
        'distribute.v': '垂直等距',
        'layer.front': '置顶',
        'layer.forward': '上移',
        'layer.backward': '下移',
        'layer.back': '置底',
        'inspector.text': '文字',
        'inspector.tone': '配色',
        'inspector.label': '连线标注',
        'inspector.router': '走线',
        'inspector.style': '线型',
        'inspector.arrow': '箭头',
        'inspector.delete': '删除选中',
        'inspector.node': '图形',
        'inspector.edge': '连线',

        'template.flowchart.title': '审批流程图',
        'template.flowchart.desc': '从提交到结束的完整审批路径，含一个判断分支。',
        'template.architecture.title': '分层架构图',
        'template.architecture.desc': '客户端、网关、服务与数据四层，适合描述 Web 应用。',
        'template.journey.title': '用户旅程地图',
        'template.journey.desc': '五个阶段与四行体验维度，标出摩擦点与机会。',
        'template.swimlane.title': '泳道流程图',
        'template.swimlane.desc': '客户、客服与系统三条泳道上的工单流转。',
        'template.orgchart.title': '组织架构图',
        'template.orgchart.desc': '产品团队的三层汇报关系。',
        'template.incident.title': '故障响应手册',
        'template.incident.desc': '从告警到复盘的响应流程，含回滚与热修分支。',

        'export.json': '导出 JSON',
        'export.svg': '导出 SVG',
        'export.markdown': '导出 Markdown',
        'export.copy': '复制 Markdown',

        'toast.exported': '已导出',
        'toast.copied': '已复制到剪贴板',
        'toast.copyFailed': '复制失败，请手动保存',
        'toast.template': '已从模板新建画布',
        'toast.storageFailed': '本地存储不可用，改动仅保留在本次会话',
        'toast.boardDeleted': '已删除画布',
        'toast.copiedObjects': '已复制 {n} 个对象',
        'toast.cutObjects': '已剪切 {n} 个对象',
        'toast.pasted': '已粘贴',
        'toast.nothingToPaste': '剪贴板是空的',

        'board.defaultName': '未命名画布',
        'canvas.emptyTitle': '从模板开始，或直接从左侧添加图形',
        'canvas.emptyHint': '滚轮缩放，拖动空白处平移，双击图形改文字。',
        'canvas.pickTemplate': '选择模板',

        'confirm.deleteBoard': '确定删除当前画布？此操作可撤销。',
        'confirm.deleteLastBoard': '这是最后一个画布，删除后将新建一个空白画布。',

        'export.markdownTitle': '流程图板',
        'export.connectors': '连线',

        'aria.board': '画板',
        'aria.canvas': '流程图画布',
        'aria.tabs': '画布标签',
        'aria.palette': '图形面板',
        'aria.selected': '已选中',
        'aria.node': '图形',
        'aria.edge': '连线',
        'aria.port': '连接点',
        'aria.editor': '编辑文字',
      },
      en: {
        'panel.title': 'Diagram Board',
        'panel.subtitle': 'Flowcharts · Architecture · Journeys · Swimlanes',

        'action.templates': 'Templates',
        'action.export': 'Export',
        'action.undo': 'Undo',
        'action.redo': 'Redo',
        'action.fit': 'Fit',
        'action.newBoard': 'New board',
        'action.deleteBoard': 'Delete board',
        'action.rename': 'Rename',
        'action.close': 'Close',

        'palette.title': 'Draw',
        'palette.draw': 'Shapes',
        'palette.connect': 'Lines',
        'palette.diagram': 'Diagram',
        'palette.layout': 'Containers',
        'palette.hint': 'Click to add, drag to move, double-click to edit. Shift-drag to marquee, Shift-click to extend. '
          + 'Pen / Highlighter / Eraser: arm, then drag on the canvas; Esc exits.',

        'type.sticky': 'Sticky note',
        'type.rect': 'Rectangle',
        'type.ellipse': 'Ellipse',
        'type.triangle': 'Triangle',
        'type.text': 'Text',
        'type.line': 'Line',
        'type.arrow': 'Arrow',
        'type.stroke': 'Pen',
        'type.highlighter': 'Highlighter',
        'type.eraser': 'Eraser',
        'type.terminator': 'Start/End',
        'type.step': 'Step',
        'type.decision': 'Decision',
        'type.data': 'Data',
        'type.document': 'Document',
        'type.note': 'Note',
        'type.actor': 'Actor',
        'type.service': 'Service',
        'type.database': 'Store',
        'type.band': 'Region',
        'type.frame': 'Frame',
        'frame.defaultTitle': 'Untitled section',
        'type.table': 'Table',

        'tone.default': 'Default',
        'tone.blue': 'Blue',
        'tone.teal': 'Teal',
        'tone.green': 'Green',
        'tone.amber': 'Amber',
        'tone.rose': 'Rose',
        'tone.violet': 'Violet',
        'tone.slate': 'Slate',

        'router.smooth': 'Curve',
        'router.elbow': 'Elbow',
        'style.solid': 'Solid',
        'style.dashed': 'Dashed',
        'arrow.end': 'End arrow',
        'arrow.both': 'Both arrows',
        'arrow.none': 'No arrow',

        'inspector.title': 'Properties',
        'inspector.empty': 'Select a shape or a connector to edit it here.',
        'inspector.multi': '{n} objects selected',
        'inspector.align': 'Align',
        'inspector.distribute': 'Distribute',
        'inspector.layer': 'Layer',
        'table.grid': '{cols} columns × {rows} rows',
        'table.editHint': 'Edit table cells in the panel on the right',
        'table.cell': 'Cell',
        'table.addRow': '+ row',
        'table.removeRow': '− row',
        'table.addCol': '+ col',
        'table.removeCol': '− col',
        'align.left': 'Left',
        'align.hcenter': 'Centre',
        'align.right': 'Right',
        'align.top': 'Top',
        'align.vcenter': 'Middle',
        'align.bottom': 'Bottom',
        'distribute.h': 'Horizontally',
        'distribute.v': 'Vertically',
        'layer.front': 'Front',
        'layer.forward': 'Forward',
        'layer.backward': 'Backward',
        'layer.back': 'Back',
        'inspector.text': 'Text',
        'inspector.tone': 'Colour',
        'inspector.label': 'Connector label',
        'inspector.router': 'Routing',
        'inspector.style': 'Line',
        'inspector.arrow': 'Arrow',
        'inspector.delete': 'Delete selection',
        'inspector.node': 'Shape',
        'inspector.edge': 'Connector',

        'template.flowchart.title': 'Approval Flowchart',
        'template.flowchart.desc': 'A full approval path from submission to closure, with one decision branch.',
        'template.architecture.title': 'Layered Architecture',
        'template.architecture.desc': 'Client, gateway, services and data layers for a web application.',
        'template.journey.title': 'User Journey Map',
        'template.journey.desc': 'Five stages across four experience rows, marking friction and opportunity.',
        'template.swimlane.title': 'Swimlane Flow',
        'template.swimlane.desc': 'Ticket flow across the customer, agent and system lanes.',
        'template.orgchart.title': 'Org Chart',
        'template.orgchart.desc': 'A three-level reporting structure for a product team.',
        'template.incident.title': 'Incident Runbook',
        'template.incident.desc': 'Response flow from alert to review, with rollback and hotfix branches.',

        'export.json': 'Export JSON',
        'export.svg': 'Export SVG',
        'export.markdown': 'Export Markdown',
        'export.copy': 'Copy Markdown',

        'toast.exported': 'Exported',
        'toast.copied': 'Copied to clipboard',
        'toast.copyFailed': 'Copy failed — save it manually',
        'toast.template': 'New board created from template',
        'toast.storageFailed': 'Local storage unavailable — changes live in this session only',
        'toast.boardDeleted': 'Board deleted',
        'toast.copiedObjects': 'Copied {n} object(s)',
        'toast.cutObjects': 'Cut {n} object(s)',
        'toast.pasted': 'Pasted',
        'toast.nothingToPaste': 'Nothing to paste',

        'board.defaultName': 'Untitled board',
        'canvas.emptyTitle': 'Start from a template, or add shapes from the left',
        'canvas.emptyHint': 'Scroll to zoom, drag the background to pan, double-click a shape to edit its text.',
        'canvas.pickTemplate': 'Pick a template',

        'confirm.deleteBoard': 'Delete the current board? This can be undone.',
        'confirm.deleteLastBoard': 'This is the last board; deleting it creates an empty one.',

        'export.markdownTitle': 'Diagram Board',
        'export.connectors': 'Connectors',

        'aria.board': 'Board',
        'aria.canvas': 'Diagram canvas',
        'aria.tabs': 'Board tabs',
        'aria.palette': 'Shape palette',
        'aria.selected': 'selected',
        'aria.node': 'Shape',
        'aria.edge': 'Connector',
        'aria.port': 'Connection point',
        'aria.editor': 'Edit text',
      },
    };

    /* ---- sticky notes ------------------------------------------------------
     * A note is paper: a light stock colour with fixed dark ink, so it looks the
     * same in light and dark themes. `STICKY_INK` is the only fixed ink here. */
    const STICKY_INK = '#2a2c31';
    const STICKY_PAPER = {
      default: '#fff3b8',
      blue: '#cfe4ff',
      teal: '#c9eef0',
      green: '#d3f0cf',
      amber: '#ffe3b8',
      rose: '#ffd6de',
      violet: '#e4dbff',
      slate: '#e4e6ec',
    };

    /* ---- highlighter -------------------------------------------------------
     * A highlighter is translucent so whatever it crosses stays readable. The
     * colour is fixed artwork, not a theme token, because the point of a
     * highlighter is that it looks like a highlighter in either theme. */
    const HIGHLIGHT_INK = '#ffd83d';

    function stickyFill(tone) {
      return STICKY_PAPER[oneOf(tone, TONE_IDS, 'default')] || STICKY_PAPER.default;
    }

    /* ---- paint constants shared by the screen and the SVG export ----------- */
    const VIS = {
      nodeStroke: 1.6,
      bandStroke: 1.2,
      nodeFont: 12.5,
      bandFont: 13,
      stickyFont: 13.5,
      cellFont: 11.5,
      frameFont: 13,
      highlightWidth: 15,
      lineHeight: 1.4,
      edgeStroke: 1.7,
      arrowSize: 9,
      labelFont: 11,
      gridSize: 24,
      pad: 16,
    };

    /* ---- text measurement ---------------------------------------------------
     * There is no canvas context to measure with, so widths are estimated from
     * per-character advance factors. CJK glyphs are full-width; Latin glyphs
     * are approximated from three advance classes. The estimate only has to be
     * good enough to keep a label inside its shape. */
    const NARROW = 'iljtfrI.,:;!|\'`[](){}';
    const WIDE = 'mwMW@%';

    function charWidth(ch, fontSize) {
      const code = ch.codePointAt(0);
      if (code >= 0x2e80 && code <= 0x9fff) return fontSize;
      if (code >= 0xac00 && code <= 0xd7af) return fontSize;
      if (code >= 0xf900 && code <= 0xfaff) return fontSize;
      if (code >= 0xff01 && code <= 0xff60) return fontSize;
      if (code >= 0x3000 && code <= 0x303f) return fontSize;
      if (ch === ' ') return fontSize * 0.29;
      if (NARROW.indexOf(ch) >= 0) return fontSize * 0.33;
      if (WIDE.indexOf(ch) >= 0) return fontSize * 0.88;
      if (ch >= 'A' && ch <= 'Z') return fontSize * 0.64;
      return fontSize * 0.55;
    }

    function measureWidth(text, fontSize) {
      let total = 0;
      for (const ch of text) total += charWidth(ch, fontSize);
      return total;
    }

    function isCJK(ch) {
      const code = ch.codePointAt(0);
      return (
        (code >= 0x2e80 && code <= 0x9fff) ||
        (code >= 0xac00 && code <= 0xd7af) ||
        (code >= 0xf900 && code <= 0xfaff) ||
        (code >= 0xff01 && code <= 0xff60) ||
        (code >= 0x3000 && code <= 0x303f)
      );
    }

    /** Split into wrap units: one per CJK glyph, one per Latin word, one per space. */
    function tokenize(text) {
      const tokens = [];
      let buffer = '';
      for (const ch of text) {
        if (ch === '\n') {
          if (buffer) tokens.push(buffer);
          buffer = '';
          tokens.push('\n');
        } else if (isCJK(ch) || ch === ' ') {
          if (buffer) tokens.push(buffer);
          buffer = '';
          tokens.push(ch);
        } else {
          buffer += ch;
        }
      }
      if (buffer) tokens.push(buffer);
      return tokens;
    }

    function trimToFit(text, maxWidth, fontSize) {
      let out = '';
      for (const ch of text) {
        if (measureWidth(out + ch, fontSize) > maxWidth) return out;
        out += ch;
      }
      return out;
    }

    /** Greedy wrap with an ellipsis on the last line when the text overflows. */
    function wrapText(text, maxWidth, fontSize, maxLines) {
      if (!text) return [];
      const tokens = tokenize(text);
      const lines = [];
      let line = '';
      for (let i = 0; i < tokens.length; i += 1) {
        const token = tokens[i];
        if (token === '\n') {
          lines.push(line.replace(/\s+$/, ''));
          line = '';
          continue;
        }
        const candidate = line + token;
        if (line === '' || measureWidth(candidate, fontSize) <= maxWidth) {
          line = candidate;
        } else {
          lines.push(line.replace(/\s+$/, ''));
          line = token === ' ' ? '' : token;
        }
      }
      lines.push(line.replace(/\s+$/, ''));
      if (lines.length > maxLines) {
        const kept = lines.slice(0, maxLines);
        kept[maxLines - 1] = trimToFit(kept[maxLines - 1] + '\u2026', maxWidth, fontSize);
        return kept;
      }
      return lines;
    }

    /** The inner text box of a shape, leaving room for its silhouette. */
    function textBox(node) {
      const type = node.type;
      if (type === 'decision') {
        /* A diamond is widest at its middle, so its text box is a band across
         * the centre: wide enough that a short question does not wrap, and no
         * taller than the shape's own taper allows. */
        return { x: node.x + node.w * 0.19, y: node.y + node.h * 0.24, w: node.w * 0.62, h: node.h * 0.52 };
      }
      if (type === 'data') {
        const skew = Math.min(node.h * 0.42, node.w * 0.18);
        return { x: node.x + skew + 10, y: node.y + 8, w: node.w - skew * 2 - 20, h: node.h - 16 };
      }
      if (type === 'frame') {
        /* A frame's own text is its title, in the header band. */
        const head = Math.min(node.h * 0.28, 34);
        return { x: node.x + 12, y: node.y + 6, w: Math.max(40, node.w - 24), h: head - 10 };
      }
      if (type === 'table') {
        /* A table's text box is unused: its cells carry the copy. */
        const head = Math.min(node.h * 0.24, 30);
        return { x: node.x, y: node.y, w: Math.max(8, node.w), h: Math.max(8, head) };
      }
      if (type === 'sticky') {
        /* Notes are read like paper: text starts at the top-left with roomy
         * padding, rather than being centred in the box. */
        return { x: node.x + 14, y: node.y + 13, w: node.w - 28, h: node.h - 26 };
      }
      if (type === 'triangle') {
        /* A triangle is narrow at the top, so its text lives in the wide lower
         * band rather than the centre of the box. */
        return { x: node.x + node.w * 0.16, y: node.y + node.h * 0.52, w: node.w * 0.68, h: node.h * 0.38 };
      }
      if (type === 'text') {
        /* A text node is bare type: its box is its own padding. */
        return { x: node.x + 6, y: node.y + 4, w: node.w - 12, h: node.h - 8 };
      }
      if (type === 'line' || type === 'arrow') {
        /* A rule has almost no height, so its label would be clipped; the
         * caption is allowed to sit above the box instead. */
        return { x: node.x + 8, y: node.y - 22, w: Math.max(24, node.w - 16), h: 20 };
      }
      if (type === 'band') {
        /* A band's title is a legend sitting on its own top border (see
         * `bandLegend`), so its text box is the single line the legend holds. */
        const legend = bandLegend(node);
        return { x: legend.x, y: legend.y, w: legend.w, h: legend.h };
      }
      return { x: node.x + 12, y: node.y + 9, w: node.w - 24, h: node.h - 18 };
    }

    /**
     * A band's title sits on the rectangle's top border, drawn like a fieldset
     * legend. That keeps it out of the region the band groups, so a title can
     * never sit on top of the shapes it labels.
     */
    function bandLegend(node) {
      const fontSize = VIS.bandFont;
      const padX = 7;
      const text = node.text || '';
      const maxText = Math.max(40, node.w - 32);
      const width = Math.min(maxText, measureWidth(text, fontSize)) + padX * 2;
      /* The chip straddles the band's top border. Near the left edge of the
       * board it would hang outside the drawing, so it is pulled inside while
       * staying clear of the border it labels. */
      const edge = 6;
      const x = node.x + 12 < edge ? edge : node.x + 12;
      return {
        x: x,
        y: node.y - fontSize * 0.78,
        w: width,
        h: fontSize * 1.56,
        textX: x + padX,
        baseline: node.y + fontSize * 0.38,
        textWidth: width - padX * 2,
      };
    }

    /** The wrapped lines a node renders, clamped to what its box can hold. */
    function nodeLines(node) {
      const box = textBox(node);
      /* A table draws nothing from `text`: every cell is its own string. */
      if (node.type === 'table') {
        const fontSize = VIS.cellFont;
        return {
          lines: [],
          box: box,
          fontSize: fontSize,
          lineHeight: fontSize * VIS.lineHeight,
        };
      }
      const fontSize = node.type === 'band'
        ? VIS.bandFont
        : node.type === 'sticky'
          ? VIS.stickyFont
          : VIS.nodeFont;
      const lineHeight = fontSize * VIS.lineHeight;
      /* A band legend is a single line clipped to its own chip. */
      const maxLines = node.type === 'band' ? 1 : Math.max(1, Math.floor(box.h / lineHeight));
      return {
        lines: wrapText(node.text, node.type === 'band' ? box.w : box.w, fontSize, maxLines),
        box: box,
        fontSize: fontSize,
        lineHeight: lineHeight,
      };
    }

    /* ---- document transitions ---------------------------------------------- */

    function boardIndex(doc, boardId) {
      for (let i = 0; i < doc.boards.length; i += 1) {
        if (doc.boards[i].id === boardId) return i;
      }
      return -1;
    }

    function activeBoardOf(doc) {
      const index = boardIndex(doc, doc.activeId);
      return index >= 0 ? doc.boards[index] : doc.boards[0];
    }

    /** Replace the active board through `mutate`; returns `null` on no change. */
    function withBoard(doc, mutate) {
      const index = boardIndex(doc, doc.activeId);
      if (index < 0) return null;
      const board = doc.boards[index];
      const next = mutate(board);
      if (!next || next === board) return null;
      const boards = doc.boards.slice();
      boards[index] = next;
      return { version: DOC_VERSION, boards: boards, activeId: doc.activeId };
    }

    function replaceBoard(board, patch) {
      return Object.assign({}, board, patch);
    }

    /** Axis-aligned bounds of every node, used by Fit and by the SVG export. */
    function boardBounds(board) {
      if (!board.nodes.length) return null;
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (let i = 0; i < board.nodes.length; i += 1) {
        const node = board.nodes[i];
        if (node.x < minX) minX = node.x;
        if (node.y < minY) minY = node.y;
        if (node.x + node.w > maxX) maxX = node.x + node.w;
        if (node.y + node.h > maxY) maxY = node.y + node.h;
      }
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }

    /** A camera that centres the whole board inside the viewport. */
    function fitView(board, width, height) {
      const bounds = boardBounds(board);
      if (!bounds || !width || !height) return { x: 0, y: 0, k: 1 };
      const pad = 36;
      const k = clamp(
        Math.min((width - pad * 2) / Math.max(1, bounds.w), (height - pad * 2) / Math.max(1, bounds.h)),
        MIN_ZOOM,
        1.6,
      );
      return { x: (width - bounds.w * k) / 2 - bounds.x * k, y: (height - bounds.h * k) / 2 - bounds.y * k, k: k };
    }

    function screenToBoard(view, x, y) {
      return { x: (x - view.x) / view.k, y: (y - view.y) / view.k };
    }

    /** The topmost non-band node under a board-space point. */
    function nodeAt(board, point) {
      for (let i = board.nodes.length - 1; i >= 0; i -= 1) {
        const node = board.nodes[i];
        if (node.type === 'band') continue;
        if (
          point.x >= node.x && point.x <= node.x + node.w &&
          point.y >= node.y && point.y <= node.y + node.h
        ) {
          /* A frame is grabbable by its title band alone: its interior must let
           * clicks reach the shapes placed inside it. */
          if (node.type === 'frame') {
            const head = Math.min(node.h * 0.28, 34);
            if (point.y - node.y <= head) return node;
            continue;
          }
          return node;
        }
      }
      return null;
    }

    /**
     * Paint order: bands at the back, then highlighter strokes, then everything
     * else. A highlighter drawn over text would defeat its purpose, and a band
     * drawn over a highlight would hide it.
     */
    function nodesInPaintOrder(board) {
      const bands = [];
      const frames = [];
      const highlights = [];
      const rest = [];
      for (let i = 0; i < board.nodes.length; i += 1) {
        const node = board.nodes[i];
        if (node.type === 'band') bands.push(node);
        else if (node.type === 'frame') frames.push(node);
        else if (node.type === 'stroke' && node.ink === 'highlighter') highlights.push(node);
        else rest.push(node);
      }
      /* Regions and frames sit behind their contents; highlights sit above
       * frames but below ordinary shapes so text stays readable. */
      return bands.concat(frames).concat(highlights).concat(rest);
    }

    /* ---- standalone SVG export ---------------------------------------------
     * The export is a real vector drawing on a light background, independent of
     * the host theme: the tone accents composited over white become solid
     * fills, so the file looks the same wherever it is opened. */
    function blendOnWhite(hex, alpha) {
      const value = String(hex || '').replace('#', '');
      if (value.length !== 6) return '#f2f3f5';
      const parts = [0, 2, 4].map(function (offset) {
        const channel = parseInt(value.slice(offset, offset + 2), 16);
        return Math.round(255 - (255 - channel) * alpha);
      });
      return '#' + parts.map(function (c) { return c.toString(16).padStart(2, '0'); }).join('');
    }

    const EXPORT_INK = '#1f2328';
    const EXPORT_MUTED = '#6b7280';
    const EXPORT_LINE = '#8b93a1';
    const EXPORT_BG = '#ffffff';

    function svgText(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function exportNodeSvg(node) {
      const accent = TONE_VALUE[node.tone] || '#6b7785';
      const isBand = node.type === 'band';
      const fill = isBand ? blendOnWhite(accent, 0.07) : blendOnWhite(accent, 0.15);
      const parts = [];
      const bare = node.type === 'text';
      const rule = node.type === 'line' || node.type === 'arrow' || node.type === 'stroke';
      const sticky = node.type === 'sticky';
      const highlight = node.type === 'stroke' && node.ink === 'highlighter';
      parts.push(
        '<g transform="translate(' + round(node.x) + ' ' + round(node.y) + ')">' +
        '<path d="' + shapePath(node.type, node.w, node.h, node) + '"' +
        ' fill="' + (bare || rule ? 'none' : sticky ? stickyFill(node.tone) : fill) + '"' +
        (bare || sticky
          ? ' stroke="none"'
          : ' stroke="' + (highlight ? HIGHLIGHT_INK : isBand ? blendOnWhite(accent, 0.4) : accent) + '"') +
        ' stroke-width="' + (highlight ? VIS.highlightWidth : isBand ? VIS.bandStroke : rule ? 2 : VIS.nodeStroke) + '"' +
        (highlight ? ' stroke-opacity="0.4"' : '') +
        (rule ? ' stroke-linecap="round"' : '') +
        (node.type === 'note' ? ' stroke-dasharray="6 4"' : '') +
        (isBand ? ' stroke-dasharray="9 6"' : '') + '/>'
      );
      const details = detailPaths(node.type, node.w, node.h, node);
      for (let i = 0; i < details.length; i += 1) {
        parts.push('<path d="' + details[i] + '" fill="none" stroke="' + blendOnWhite(accent, 0.55) + '" stroke-width="1.1"/>');
      }
      const wrapped = nodeLines(node);
      const box = wrapped.box;
      if (isBand) {
        /* The legend sits on the top border, with a white chip masking it. */
        const legend = bandLegend(node);
        parts.push(
          '<rect x="' + round(legend.x - node.x) + '" y="' + round(legend.y - node.y) + '" width="' + round(legend.w) +
          '" height="' + round(legend.h) + '" rx="4" fill="' + EXPORT_BG + '"/>'
        );
        parts.push(
          '<text x="' + round(legend.textX - node.x) + '" y="' + round(legend.baseline - node.y) + '" fill="' + blendOnWhite(accent, 0.95) + '"' +
          ' font-size="' + VIS.bandFont + '" font-weight="600" text-anchor="start"' +
          ' font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Noto Sans,sans-serif">' +
          svgText(wrapped.lines[0] || '') + '</text>'
        );
      } else {
        if (node.type === 'table') {
          /* Cells, laid out on the same grid the export draws. */
          const table = node.table || { cols: 3, rows: 2, cells: emptyCells(3, 2) };
          const cols = Math.max(1, table.cols);
          const rows = Math.max(1, table.rows);
          const head = Math.min(node.h * 0.24, 30);
          const bodyH = Math.max(1, node.h - head);
          const cellW = node.w / cols;
          const bodyRows = Math.max(1, rows - 1);
          const cellH = bodyH / bodyRows;
          const padX = 7;
          const padY = 4;
          for (let r = 0; r < rows; r += 1) {
            for (let c = 0; c < cols; c += 1) {
              const cellText = (table.cells[r] && table.cells[r][c]) || '';
              if (!cellText) continue;
              const isHeaderRow = r === 0;
              const top = isHeaderRow ? 0 : head + (r - 1) * cellH;
              const hgt = isHeaderRow ? head : cellH;
              const lines = wrapText(
                cellText,
                Math.max(12, cellW - padX * 2),
                VIS.cellFont,
                Math.max(1, Math.floor((hgt - padY * 2) / (VIS.cellFont * VIS.lineHeight))),
              );
              for (let li = 0; li < lines.length; li += 1) {
                parts.push(
                  '<text x="' + round(cellW * c + padX) + '" y="' +
                  round(top + padY + VIS.cellFont * 0.92 + li * VIS.cellFont * VIS.lineHeight) +
                  '" fill="' + (isHeaderRow ? EXPORT_INK : EXPORT_MUTED) + '"' +
                  ' font-size="' + VIS.cellFont + '" font-weight="' + (isHeaderRow ? 600 : 400) + '"' +
                  ' text-anchor="start" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Noto Sans,sans-serif">' +
                  svgText(lines[li]) + '</text>'
                );
              }
            }
          }
        } else if (node.type === 'frame') {
          const frameFirst = box.y - node.y + VIS.frameFont * 0.92;
          for (let i = 0; i < wrapped.lines.length; i += 1) {
            parts.push(
              '<text x="' + round(box.x - node.x) + '" y="' + round(frameFirst + i * wrapped.lineHeight) + '"' +
              ' fill="' + EXPORT_INK + '" font-size="' + VIS.frameFont + '" font-weight="600"' +
              ' text-anchor="start" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Noto Sans,sans-serif">' +
              svgText(wrapped.lines[i]) + '</text>'
            );
          }
        } else if (sticky) {
          /* Notes are top-aligned from the left edge, like paper. */
          let stickyBase = box.y - node.y + wrapped.fontSize * 0.92;
          for (let i = 0; i < wrapped.lines.length; i += 1) {
            parts.push(
              '<text x="' + round(box.x - node.x) + '" y="' + round(stickyBase) + '" fill="' + STICKY_INK + '"' +
              ' font-size="' + wrapped.fontSize + '" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Noto Sans,sans-serif"' +
              ' text-anchor="start">' + svgText(wrapped.lines[i]) + '</text>'
            );
            stickyBase += wrapped.lineHeight;
          }
        } else {
          const total = wrapped.lines.length * wrapped.lineHeight;
          let baseline = box.y - node.y + (box.h - total) / 2 + wrapped.fontSize * 0.82;
          for (let i = 0; i < wrapped.lines.length; i += 1) {
            parts.push(
              '<text x="' + round(node.w / 2) + '" y="' + round(baseline) + '" fill="' + EXPORT_INK + '"' +
              ' font-size="' + wrapped.fontSize + '" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Noto Sans,sans-serif"' +
              ' text-anchor="middle">' + svgText(wrapped.lines[i]) + '</text>'
            );
            baseline += wrapped.lineHeight;
          }
        }
      }
      parts.push('</g>');
      return parts.join('');
    }

    function exportEdgeSvg(edge, fromNode, toNode) {
      const geometry = geometryFor(edge, fromNode, toNode);
      const accent = TONE_VALUE[edge.tone] || '#6b7785';
      const stroke = blendOnWhite(accent, 0.85);
      const dash = edge.style === 'dashed' ? ' stroke-dasharray="6 5"' : '';
      const parts = [];
      parts.push(
        '<path d="' + geometry.d + '" fill="none" stroke="' + stroke + '" stroke-width="' + VIS.edgeStroke +
        '" stroke-linecap="round"' + dash + '/>'
      );
      if (edge.arrow !== 'none') {
        parts.push('<path d="' + arrowPath(geometry.endArrow.tip, geometry.endArrow.dir, VIS.arrowSize) + '" fill="' + stroke + '"/>');
      }
      if (edge.arrow === 'both') {
        parts.push('<path d="' + arrowPath(geometry.startArrow.tip, geometry.startArrow.dir, VIS.arrowSize) + '" fill="' + stroke + '"/>');
      }
      if (edge.label) {
        const width = measureWidth(edge.label, VIS.labelFont) + 12;
        parts.push(
          '<rect x="' + round(geometry.mid.x - width / 2) + '" y="' + round(geometry.mid.y - 9) +
          '" width="' + round(width) + '" height="18" rx="5" fill="' + EXPORT_BG + '" stroke="' + EXPORT_LINE + '" stroke-width="0.8"/>'
        );
        parts.push(
          '<text x="' + round(geometry.mid.x) + '" y="' + round(geometry.mid.y + 4) + '" fill="' + EXPORT_MUTED +
          '" font-size="' + VIS.labelFont + '" text-anchor="middle"' +
          ' font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Noto Sans,sans-serif">' + svgText(edge.label) + '</text>'
        );
      }
      return parts.join('');
    }

    function boardToSvg(board) {
      const bounds = boardBounds(board) || { x: 0, y: 0, w: 640, h: 400 };
      /* Band legends sit above their band's top edge, so the drawing box has to
       * grow upward by one legend height or the titles are clipped. */
      const hasBands = board.nodes.some(function (node) { return node.type === 'band'; });
      const legendLift = hasBands ? Math.ceil(VIS.bandFont * 0.78) + 4 : 0;
      const pad = 32;
      const width = Math.max(120, Math.round(bounds.w + pad * 2));
      const height = Math.max(120, Math.round(bounds.h + pad * 2 + legendLift));
      const parts = [];
      parts.push(
        '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height +
        '" viewBox="0 0 ' + width + ' ' + height + '">'
      );
      parts.push('<rect width="' + width + '" height="' + height + '" fill="' + EXPORT_BG + '"/>');
      parts.push(
        '<g transform="translate(' + round(pad - bounds.x) + ' ' + round(pad - bounds.y + legendLift) + ')">'
      );
      const ordered = nodesInPaintOrder(board);
      const byId = {};
      for (let i = 0; i < board.nodes.length; i += 1) byId[board.nodes[i].id] = board.nodes[i];
      for (let i = 0; i < ordered.length; i += 1) parts.push(exportNodeSvg(ordered[i]));
      for (let i = 0; i < board.edges.length; i += 1) {
        const edge = board.edges[i];
        const from = byId[edge.from];
        const to = byId[edge.to];
        if (from && to) parts.push(exportEdgeSvg(edge, from, to));
      }
      parts.push('</g>');
      parts.push('</svg>');
      return parts.join('');
    }

    function boardToMarkdown(board) {
      const byId = {};
      for (let i = 0; i < board.nodes.length; i += 1) byId[board.nodes[i].id] = board.nodes[i];
      const lines = ['# ' + board.name, ''];
      const groups = {};
      const order = [];
      for (let i = 0; i < board.nodes.length; i += 1) {
        const node = board.nodes[i];
        if (!groups[node.type]) {
          groups[node.type] = [];
          order.push(node.type);
        }
        groups[node.type].push(node);
      }
      for (let i = 0; i < order.length; i += 1) {
        const type = order[i];
        lines.push('## ' + type);
        lines.push('');
        for (let j = 0; j < groups[type].length; j += 1) {
          const text = groups[type][j].text || '(empty)';
          lines.push('- ' + text.split('\n').join(' '));
        }
        lines.push('');
      }
      if (board.edges.length) {
        lines.push('## ' + 'connectors');
        lines.push('');
        for (let i = 0; i < board.edges.length; i += 1) {
          const edge = board.edges[i];
          const from = byId[edge.from];
          const to = byId[edge.to];
          if (!from || !to) continue;
          const label = edge.label ? ' (' + edge.label + ')' : '';
          lines.push('- ' + (from.text || '(empty)') + ' -> ' + (to.text || '(empty)') + label);
        }
        lines.push('');
      }
      return lines.join('\n');
    }

    /* ---- filesystem and clipboard bridges ----------------------------------- */

    function download(filename, mime, text) {
      if (typeof document === 'undefined' || !document.createElement) return false;
      try {
        const blob = new Blob([text], { type: mime });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
        return true;
      } catch {
        return false;
      }
    }

    function copyText(text) {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).then(
          function () { return true; },
          function () { return false; },
        );
      }
      return Promise.resolve(false);
    }

    function slug(value) {
      return String(value || 'board').trim().toLowerCase().replace(/[^\w\u4e00-\u9fff-]+/g, '-').replace(/^-+|-+$/g, '') || 'board';
    }

    /* ---- shared style tokens ----------------------------------------------- */

    function toneVars(tone) {
      const value = TONE_VALUE[oneOf(tone, TONE_IDS, 'default')];
      if (!value) {
        return { '--fb-accent': 'var(--dsw-alias-border-l2)', '--fb-fill': 'var(--dsw-alias-bg-layer-1)' };
      }
      return { '--fb-accent': value, '--fb-fill': hexAlpha(value, 0.13) };
    }

    const CSS = [
      /* Shell ---------------------------------------------------------------- */
      '.dsh-fb-root{position:relative;display:flex;flex-direction:column;height:100%;min-height:0;box-sizing:border-box;',
      'background:var(--dsw-alias-bg-base);padding-top:var(--dsh-frame-top-clearance,0px);color:var(--dsw-alias-label-primary)}',
      '.dsh-fb-header{display:flex;flex:none;align-items:center;gap:10px;padding:16px 20px 10px;flex-wrap:wrap}',
      '.dsh-fb-mark{display:block;flex:none;color:var(--dsw-alias-brand-primary)}',
      '.dsh-fb-heading{display:flex;flex-direction:column;gap:1px;min-width:0;flex:1 1 190px}',
      '.dsh-fb-title{margin:0;font-size:15.5px;font-weight:600;line-height:1.3;color:var(--dsw-alias-label-primary);',
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.dsh-fb-sub{font-size:11.5px;line-height:1.4;color:var(--dsw-alias-label-secondary);',
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.dsh-fb-actions{display:flex;flex:none;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end}',

      /* Buttons --------------------------------------------------------------- */
      '.dsh-fb-btn{display:inline-flex;flex:none;align-items:center;gap:5px;height:29px;padding:0 10px;',
      'border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);',
      'color:var(--dsw-alias-label-primary);font-family:inherit;font-size:12.5px;line-height:1;cursor:pointer;',
      'transition:background .14s ease,border-color .14s ease,color .14s ease}',
      '.dsh-fb-btn:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-brand-primary)}',
      '.dsh-fb-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
      '.dsh-fb-btn:disabled{opacity:.42;cursor:default}',
      '.dsh-fb-btn.is-icon{width:29px;padding:0;justify-content:center}',
      '.dsh-fb-btn.is-primary{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}',
      '.dsh-fb-menu-wrap{position:relative;flex:none}',
      '.dsh-fb-menu{position:absolute;top:calc(100% + 5px);right:0;z-index:30;display:flex;flex-direction:column;',
      'min-width:216px;max-width:290px;padding:5px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;',
      'background:var(--dsw-alias-bg-overlay);box-shadow:0 16px 34px -20px rgba(0,0,0,.6)}',
      '.dsh-fb-menu-item{display:flex;flex-direction:column;gap:2px;width:100%;box-sizing:border-box;padding:7px 9px;',
      'border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-primary);',
      'font-family:inherit;font-size:12.5px;text-align:left;cursor:pointer}',
      '.dsh-fb-menu-item:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.dsh-fb-menu-item:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}',
      '.dsh-fb-menu-desc{font-size:11px;line-height:1.35;color:var(--dsw-alias-label-secondary)}',

      /* Board tabs ------------------------------------------------------------ */
      '.dsh-fb-bar{display:flex;flex:none;align-items:center;gap:8px;padding:0 20px 10px;flex-wrap:wrap}',
      '.dsh-fb-tabs{display:flex;align-items:center;gap:4px;min-width:0;overflow-x:auto;padding-bottom:1px}',
      '.dsh-fb-tab{flex:none;max-width:170px;padding:4px 11px;border:1px solid var(--dsw-alias-border-l2);',
      'border-radius:999px;background:transparent;color:var(--dsw-alias-label-secondary);font-family:inherit;',
      'font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}',
      '.dsh-fb-tab:hover{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}',
      '.dsh-fb-tab[aria-selected="true"]{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);',
      'border-color:var(--dsw-alias-brand-primary);font-weight:600}',
      '.dsh-fb-tab:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dsh-fb-name{flex:1 1 150px;min-width:110px;max-width:290px;height:27px;box-sizing:border-box;padding:0 9px;',
      'border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:var(--dsw-alias-bg-layer-1);',
      'color:var(--dsw-alias-label-primary);font-family:inherit;font-size:12px}',
      '.dsh-fb-name:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-1px}',

      /* Body ------------------------------------------------------------------ */
      '.dsh-fb-body{display:flex;flex:1;min-height:0;min-width:0;gap:0;border-top:1px solid var(--dsw-alias-border-l1)}',
      '.dsh-fb-palette{display:flex;flex:none;flex-direction:column;gap:3px;width:112px;box-sizing:border-box;',
      'padding:10px 8px;overflow-y:auto;border-right:1px solid var(--dsw-alias-border-l1);',
      'background:var(--dsw-specific-sidebar-fill)}',
      '.dsh-fb-palette-group{display:flex;flex-direction:column;gap:2px;padding-bottom:9px}',
      '.dsh-fb-palette-group+.dsh-fb-palette-group{padding-top:7px;border-top:1px solid var(--dsw-alias-border-l1)}',
      '.dsh-fb-palette-label{font-size:10px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;',
      'color:var(--dsw-alias-label-secondary);padding:0 4px 5px}',
      '.dsh-fb-shape-btn{display:flex;align-items:center;gap:8px;width:100%;box-sizing:border-box;padding:6px;',
      'border:1px solid transparent;border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary);',
      'font-family:inherit;font-size:12px;text-align:left;cursor:pointer}',
      '.dsh-fb-shape-btn:hover{background:var(--dsw-alias-bg-layer-1);border-color:var(--dsw-alias-border-l2)}',
      '.dsh-fb-shape-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dsh-fb-shape-glyph{flex:none;display:block;color:var(--dsw-alias-label-secondary)}',
      '.dsh-fb-shape-btn:hover .dsh-fb-shape-glyph{color:var(--dsw-alias-brand-primary)}',
      '.dsh-fb-shape-text{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.dsh-fb-palette-hint{margin-top:auto;padding:8px 4px 0;font-size:10.5px;line-height:1.45;',
      'color:var(--dsw-alias-label-secondary)}',

      /* Canvas ---------------------------------------------------------------- */
      '.dsh-fb-canvas-wrap{position:relative;flex:1;min-width:0;min-height:0;overflow:hidden;',
      'background:var(--dsw-alias-bg-base)}',
      '.dsh-fb-canvas{display:block;width:100%;height:100%;touch-action:none;user-select:none}',
      '.dsh-fb-canvas.is-panning{cursor:grabbing}',
      '.dsh-fb-canvas.is-linking{cursor:crosshair}',
      '.dsh-fb-canvas.is-pen{cursor:crosshair}',
      '.dsh-fb-shape-btn.is-armed{background:var(--dsw-alias-bg-layer-2);',
      'border-color:var(--dsw-alias-brand-primary)}',
      '.dsh-fb-shape-btn.is-armed .dsh-fb-shape-glyph{color:var(--dsw-alias-brand-primary)}',
      '.dsh-fb-node{cursor:grab}',
      '.dsh-fb-node.is-selected .dsh-fb-node-shape{stroke:var(--dsw-alias-brand-primary);stroke-width:2.4}',
      '.dsh-fb-node.is-dragging{cursor:grabbing}',
      '.dsh-fb-grip{fill:var(--dsw-alias-bg-base);stroke:var(--dsw-alias-brand-primary);stroke-width:1.5;',
      'cursor:nwse-resize}',
      '.dsh-fb-grip:hover{fill:var(--dsw-alias-brand-primary)}',
      '.dsh-fb-port{opacity:0;transition:opacity .12s ease;cursor:crosshair}',
      '.dsh-fb-node:hover .dsh-fb-port,.dsh-fb-node.is-selected .dsh-fb-port{opacity:1}',
      '.dsh-fb-port-dot{fill:var(--dsw-alias-bg-base);stroke:var(--dsw-alias-brand-primary);stroke-width:1.5}',
      '.dsh-fb-port:hover .dsh-fb-port-dot{fill:var(--dsw-alias-brand-primary)}',
      '.dsh-fb-edge-hit{stroke:transparent;stroke-width:16;fill:none;cursor:pointer}',
      '.dsh-fb-edge.is-selected .dsh-fb-edge-line{stroke:var(--dsw-alias-brand-primary);stroke-width:2.8}',
      '.dsh-fb-edge-label-bg{fill:var(--dsw-alias-bg-base);stroke:var(--dsw-alias-border-l2);stroke-width:1}',
      '.dsh-fb-edge-label{fill:var(--dsw-alias-label-secondary);font-size:11px}',
      '.dsh-fb-band-title{font-weight:600}',

      /* Overlays -------------------------------------------------------------- */
      '.dsh-fb-empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;',
      'justify-content:center;gap:8px;padding:28px;text-align:center;pointer-events:none}',
      '.dsh-fb-empty-title{font-size:13.5px;font-weight:600;color:var(--dsw-alias-label-primary);pointer-events:auto}',
      '.dsh-fb-empty-hint{font-size:12px;line-height:1.5;color:var(--dsw-alias-label-secondary);max-width:340px}',
      '.dsh-fb-empty-btn{pointer-events:auto;margin-top:4px}',
      '.dsh-fb-editor{position:absolute;z-index:20;box-sizing:border-box;padding:6px 8px;border-radius:8px;',
      'border:2px solid var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-overlay);',
      'color:var(--dsw-alias-label-primary);font-family:inherit;font-size:12.5px;line-height:1.4;resize:none;',
      'box-shadow:0 12px 26px -18px rgba(0,0,0,.7)}',
      '.dsh-fb-editor:focus{outline:none}',
      '.dsh-fb-toast{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);z-index:40;',
      'max-width:80%;padding:7px 14px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);',
      'background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);font-size:12px;',
      'box-shadow:0 14px 30px -22px rgba(0,0,0,.7);whitespace:nowrap;overflow:hidden;text-overflow:ellipsis}',

      /* Inspector ------------------------------------------------------------- */
      '.dsh-fb-inspector{display:flex;flex:none;flex-direction:column;gap:11px;width:216px;box-sizing:border-box;',
      'padding:12px 13px;overflow-y:auto;border-left:1px solid var(--dsw-alias-border-l1);',
      'background:var(--dsw-alias-bg-layer-1)}',
      '.dsh-fb-inspector-head{display:flex;align-items:center;justify-content:space-between;gap:8px}',
      '.dsh-fb-inspector-title{font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;',
      'color:var(--dsw-alias-label-secondary)}',
      '.dsh-fb-field{display:flex;flex-direction:column;gap:5px}',
      '.dsh-fb-field-label{font-size:11px;color:var(--dsw-alias-label-secondary)}',
      '.dsh-fb-input{width:100%;box-sizing:border-box;min-height:29px;padding:5px 8px;border-radius:7px;',
      'border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);',
      'color:var(--dsw-alias-label-primary);font-family:inherit;font-size:12.5px;line-height:1.4;resize:vertical}',
      '.dsh-fb-input:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-1px}',
      '.dsh-fb-cell-grid{display:flex;flex-direction:column;gap:3px;margin:3px 0 6px}',
      '.dsh-fb-cell-row{display:flex;gap:3px}',
      '.dsh-fb-cell-input{flex:1 1 0;min-width:0;box-sizing:border-box;height:24px;padding:0 5px;',
      'border:1px solid var(--dsw-alias-border-l2);border-radius:5px;background:var(--dsw-alias-bg-base);',
      'color:var(--dsw-alias-label-primary);font-family:inherit;font-size:11.5px}',
      '.dsh-fb-cell-input:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-1px}',
      '.dsh-fb-cell-input.is-header{font-weight:600}',
      '.dsh-fb-swatches{display:flex;flex-wrap:wrap;gap:5px}',
      '.dsh-fb-swatch{width:23px;height:23px;padding:0;border-radius:6px;cursor:pointer;',
      'border:2px solid transparent;background:var(--fb-dot);box-shadow:inset 0 0 0 1px var(--dsw-alias-border-l2)}',
      '.dsh-fb-swatch[aria-pressed="true"]{border-color:var(--dsw-alias-brand-primary)}',
      '.dsh-fb-swatch:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dsh-fb-swatch.is-default{background:var(--dsw-alias-bg-base)}',
      '.dsh-fb-seg{display:flex;gap:4px;flex-wrap:wrap}',
      '.dsh-fb-seg-btn{flex:1 1 auto;padding:5px 7px;border-radius:6px;cursor:pointer;font-family:inherit;',
      'font-size:11.5px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);',
      'color:var(--dsw-alias-label-secondary)}',
      '.dsh-fb-seg-btn[aria-pressed="true"]{border-color:var(--dsw-alias-brand-primary);',
      'color:var(--dsw-alias-label-primary);font-weight:600}',
      '.dsh-fb-seg-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dsh-fb-danger{display:flex;align-items:center;justify-content:center;gap:6px;height:29px;',
      'border-radius:7px;border:1px solid var(--dsw-alias-state-error-primary);background:transparent;',
      'color:var(--dsw-alias-state-error-primary);font-family:inherit;font-size:12px;cursor:pointer;margin-top:2px}',
      '.dsh-fb-danger:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.dsh-fb-danger:focus-visible{outline:2px solid var(--dsw-alias-state-error-primary);outline-offset:1px}',
      '.dsh-fb-inspector-empty{font-size:11.5px;line-height:1.5;color:var(--dsw-alias-label-secondary)}',

      /* Narrow panels --------------------------------------------------------- */
      '@media (max-width:880px){.dsh-fb-palette{width:84px}.dsh-fb-shape-text{display:none}',
      '.dsh-fb-palette-label{display:none}.dsh-fb-palette-hint{display:none}}',
      '@media (max-width:720px){.dsh-fb-inspector{display:none}}',
    ].join('');

    /* ---- small presentational pieces --------------------------------------- */

    /** The sidebar cell: props are `{ size, active }` from the global panel row. */
    function PanelIcon(props) {
      const size = props && typeof props.size === 'number' && props.size > 0 ? props.size : 20;
      const active = !!(props && props.active);
      return h(
        'svg',
        {
          viewBox: '0 0 20 20', width: size, height: size, 'aria-hidden': 'true',
          style: { display: 'block', opacity: active ? 1 : 0.72 },
        },
        h('rect', { x: 2.2, y: 2.6, width: 6.4, height: 4.6, rx: 1.4, fill: 'currentColor' }),
        h('path', {
          d: 'M8.6 4.9h2.4a1.4 1.4 0 0 1 1.4 1.4v2.2',
          fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round',
        }),
        h('path', {
          d: 'M12.4 10.9v.6M8.6 8.5H5.4a1.4 1.4 0 0 0-1.4 1.4v2.3',
          fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round',
        }),
        h('path', { d: 'M13.6 9.1l2.4 2.1-2.4 2.1z', fill: 'currentColor' }),
        h('rect', { x: 2.4, y: 12.6, width: 6.2, height: 4.4, rx: 1.4, fill: 'currentColor' }),
      );
    }

    /** A miniature of each shape for the palette list. */
    /**
     * A miniature of each shape for the palette list.
     *
     * Returns a complete `<svg>`: a bare `<path>` would be ignored by the
     * browser because it is not inside a drawing context, which is why the
     * palette once showed text with no icons at all.
     */
    function shapeGlyph(type) {
      const w = 22;
      const ht = 16;
      const fill = 'currentColor';
      const strokeOnly = {
        fill: 'none', stroke: 'currentColor', strokeWidth: 1.6,
        strokeLinecap: 'round', strokeLinejoin: 'round',
      };
      let body;
      if (type === 'ellipse') {
        body = h('ellipse', { cx: w / 2, cy: ht / 2, rx: w / 2 - 1, ry: ht / 2 - 1.4, fill: fill });
      } else if (type === 'triangle') {
        body = h('path', { d: 'M' + w / 2 + ' 1L' + (w - 1) + ' ' + (ht - 1.5) + 'L1 ' + (ht - 1.5) + 'z', fill: fill });
      } else if (type === 'text') {
        body = h('path', Object.assign({ d: 'M5 4h12M11 4v9M8.6 13h4.8', strokeWidth: 1.7 }, strokeOnly));
      } else if (type === 'line') {
        body = h('path', Object.assign({ d: 'M2 ' + ht / 2 + 'h' + (w - 4) }, strokeOnly));
      } else if (type === 'arrow') {
        body = h('path', Object.assign({ d: 'M2 ' + ht / 2 + 'h' + (w - 5) + 'M' + (w - 7) + ' ' + (ht / 2 - 3.6) +
          'L' + (w - 1.5) + ' ' + ht / 2 + 'L' + (w - 7) + ' ' + (ht / 2 + 3.6) }, strokeOnly));
      } else if (type === 'highlighter') {
        body = h('path', Object.assign({
          d: 'M2.6 ' + (ht - 3.4) + 'li' + (w - 6) + '-' + (ht - 6.4) + 'M3 ' + (ht - 4) + 'l3.6 1.4',
          strokeWidth: 3.4,
        }, strokeOnly));
      } else if (type === 'eraser') {
        body = h('path', Object.assign({ d: 'M3.4 11.6L9 3.2l7.6 4.4-5.6 8.4z' }, strokeOnly));
      } else if (type === 'stroke') {
        body = h('path', Object.assign({ d: 'M1.6 ' + (ht * 0.62) + 'q3 ' + (-ht * 0.7) + '6 0t6 0t6 0' }, strokeOnly));
      } else if (type === 'terminator') {
        body = h('rect', { x: 1, y: 2.6, width: w - 2, height: ht - 5.2, rx: (ht - 5.2) / 2, fill: fill });
      } else if (type === 'decision') {
        body = h('path', { d: 'M11 1l10 7-10 7-10-7z', fill: fill });
      } else if (type === 'data') {
        body = h('path', { d: 'M4.6 2.6h16.8l-4 10.8H1z', fill: fill });
      } else if (type === 'document') {
        body = h('path', { d: 'M1 2.6h20v8.4l-3.3 2.4L14.4 11.4 11 13.8 7.6 11.4 4.3 13.8 1 11.4z', fill: fill });
      } else if (type === 'note') {
        body = h('path', { d: 'M1 2.6h15.6L21 7.8v7.6H1z', fill: fill, opacity: 0.55 });
      } else if (type === 'actor') {
        body = h('rect', { x: 1, y: 2.6, width: w - 2, height: ht - 5.2, rx: (ht - 5.2) / 2, fill: fill, opacity: 0.8 });
      } else if (type === 'service') {
        body = h('path', Object.assign({ d: 'M2.4 3.2h17.2v9.6H2.4zM6 15.6h10' }, strokeOnly));
      } else if (type === 'database') {
        body = h('path', { d: 'M2 4.6c0-1.3 4-2.4 9-2.4s9 1.1 9 2.4v6.4c0 1.3-4 2.4-9 2.4s-9-1.1-9-2.4z', fill: fill });
      } else if (type === 'band') {
        body = h('rect', Object.assign({ x: 1, y: 2.6, width: w - 2, height: ht - 5.2, rx: 2.4, strokeDasharray: '3 2' }, strokeOnly));
      } else {
        body = h('rect', { x: 1, y: 2.6, width: w - 2, height: ht - 5.2, rx: 2.6, fill: fill });
      }
      return h(
        'svg',
        {
          viewBox: '0 0 ' + w + ' ' + ht,
          width: w,
          height: ht,
          'aria-hidden': 'true',
          style: { display: 'block', flex: 'none', overflow: 'visible' },
        },
        body,
      );
    }

    function icon(name, size) {
      const edge = size || 14;
      const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
      if (name === 'undo') {
        return h('svg', { viewBox: '0 0 16 16', width: edge, height: edge, 'aria-hidden': 'true', style: { display: 'block' } },
          h('path', Object.assign({ d: 'M6 3.5L2.5 6.8L6 10.1' }, stroke)),
          h('path', Object.assign({ d: 'M2.9 6.8h6.3a3.6 3.6 0 0 1 0 7.2H6.2' }, stroke)));
      }
      if (name === 'redo') {
        return h('svg', { viewBox: '0 0 16 16', width: edge, height: edge, 'aria-hidden': 'true', style: { display: 'block' } },
          h('path', Object.assign({ d: 'M10 3.5L13.5 6.8L10 10.1' }, stroke)),
          h('path', Object.assign({ d: 'M13.1 6.8H6.8a3.6 3.6 0 0 0 0 7.2h3' }, stroke)));
      }
      if (name === 'fit') {
        return h('svg', { viewBox: '0 0 16 16', width: edge, height: edge, 'aria-hidden': 'true', style: { display: 'block' } },
          h('path', Object.assign({ d: 'M2.4 6V2.6H6M10 2.6h3.6V6M13.6 10v3.4H10M6 13.4H2.4V10' }, stroke)));
      }
      if (name === 'plus') {
        return h('svg', { viewBox: '0 0 16 16', width: edge, height: edge, 'aria-hidden': 'true', style: { display: 'block' } },
          h('path', Object.assign({ d: 'M8 3v10M3 8h10' }, stroke)));
      }
      if (name === 'trash') {
        return h('svg', { viewBox: '0 0 16 16', width: edge, height: edge, 'aria-hidden': 'true', style: { display: 'block' } },
          h('path', Object.assign({ d: 'M2.8 4.2h10.4M6.3 4.2V2.6h3.4v1.6M4.2 4.2l.7 9.2h6.2l.7-9.2' }, stroke)));
      }
      if (name === 'chevron') {
        return h('svg', { viewBox: '0 0 16 16', width: 11, height: 11, 'aria-hidden': 'true', style: { display: 'block' } },
          h('path', Object.assign({ d: 'M4 6.2L8 10.2L12 6.2' }, stroke)));
      }
      return null;
    }

    /** A dropdown that closes on an outside click or on Escape. */
    function Menu(props) {
      const wrapRef = React.useRef(null);
      React.useEffect(
        function () {
          if (!props.open) return undefined;
          function onDown(event) {
            if (wrapRef.current && wrapRef.current.contains && event.target && wrapRef.current.contains(event.target)) return;
            props.onClose();
          }
          function onKey(event) {
            if (event.key === 'Escape') props.onClose();
          }
          if (typeof document !== 'undefined' && document.addEventListener) {
            document.addEventListener('pointerdown', onDown, true);
            document.addEventListener('keydown', onKey, true);
            return function () {
              document.removeEventListener('pointerdown', onDown, true);
              document.removeEventListener('keydown', onKey, true);
            };
          }
          return undefined;
        },
        [props.open],
      );
      return h(
        'div',
        { className: 'dsh-fb-menu-wrap', ref: wrapRef },
        h(
          'button',
          {
            type: 'button',
            className: 'dsh-fb-btn' + (props.open ? ' is-primary' : ''),
            'aria-expanded': props.open ? 'true' : 'false',
            'aria-haspopup': 'true',
            onClick: props.onToggle,
          },
          props.icon ? icon(props.icon) : null,
          h('span', null, props.label),
          icon('chevron'),
        ),
        props.open
          ? h('div', { className: 'dsh-fb-menu', role: 'menu' }, props.children)
          : null,
      );
    }

    function MenuItem(props) {
      return h(
        'button',
        {
          type: 'button',
          role: 'menuitem',
          className: 'dsh-fb-menu-item',
          onClick: props.onClick,
        },
        h('span', null, props.label),
        props.desc ? h('span', { className: 'dsh-fb-menu-desc' }, props.desc) : null,
      );
    }

    return {
      inject: ['slots', 'locale'],

      apply(ctx) {
        ctx.effect(function () { return ctx.locale.register(NS, DICT); }, 'flowboard: dictionaries');

        const t = ctx.locale.bind(NS);

        /* ---- the panel --------------------------------------------------------- */

        function FlowBoardPanel() {
          /* ---- boot ------------------------------------------------------------
           * The document is read once. Anything malformed falls back to a fresh
           * board, so a corrupt payload can never leave the panel blank. */
          const bootRef = React.useRef(null);
          if (!bootRef.current) {
            const locale = ctx.locale.getLocale().active;
            const seedTemplate = findTemplate('flowchart');
            const seeded = seedTemplate
              ? boardFromTemplate(seedTemplate, locale, t('template.flowchart.title'))
              : emptyBoard(t('board.defaultName'));
            const stored = readStorage(t('board.defaultName'));
            bootRef.current = stored || { version: DOC_VERSION, boards: [seeded], activeId: seeded.id };
          }
          const boot = bootRef.current;

          const [doc, setDoc] = React.useState(boot);
          /* Selection is a set of ids, so marquee, Shift-click and batch
           * operations share one model. `sel` below is the primary id. */
          const [selectedIds, setSelectedIds] = React.useState([]);
          const [marquee, setMarquee] = React.useState(null);
          const [guides, setGuides] = React.useState([]);
          const setSelection = function (next) {
            if (!next) { setSelectedIds([]); return; }
            if (Array.isArray(next)) { setSelectedIds(next); return; }
            setSelectedIds([next.id]);
          };
          const [editing, setEditing] = React.useState(null);
          const [draft, setDraft] = React.useState('');
          const [templatesOpen, setTemplatesOpen] = React.useState(false);
          const [exportOpen, setExportOpen] = React.useState(false);
          const [toast, setToast] = React.useState(null);
          const [viewport, setViewport] = React.useState({ width: 0, height: 0 });
          const [drag, setDrag] = React.useState(null);
          const [resizing, setResizing] = React.useState(null);
          /* The pen is a mode, not a shape you place: while it is armed a drag
           * on the canvas records a freehand stroke. */
          const [penArmed, setPenArmed] = React.useState(false);
          const [penStroke, setPenStroke] = React.useState(null);
          /* The pen has two inks: a thin marker and a translucent highlighter. */
          const [penMode, setPenMode] = React.useState('pen');
          const [eraserArmed, setEraserArmed] = React.useState(false);
          /* Linking drives the rubber-band preview from a port to the cursor. */
          const [link, setLink] = React.useState(null);
          const [panning, setPanning] = React.useState(false);

          /* Keep projected labels in step with a language switch without
           * re-registering anything. */
          const localeState = React.useState(ctx.locale.getLocale());
          const setLocaleSnapshot = localeState[1];
          React.useEffect(function () {
            if (!ctx.locale.subscribe) return undefined;
            return ctx.locale.subscribe(function () {
              setLocaleSnapshot(ctx.locale.getLocale());
            });
          }, []);

          const canvasRef = React.useRef(null);
          const wrapRef = React.useRef(null);
          const editorRef = React.useRef(null);
          const toastTimer = React.useRef(null);
          const historyRef = React.useRef({ past: [], future: [] });
          const dragRef = React.useRef(null);
          const penRef = React.useRef(null);
          const marqueeRef = React.useRef(null);
          const clipRef = React.useRef(null);
          const guidesRef = React.useRef([]);
          const eraserRef = React.useRef(null);
          const linkRef = React.useRef(null);
          const panRef = React.useRef(null);
          const viewportRef = React.useRef({ width: 0, height: 0 });
          const fittedRef = React.useRef(null);
          const editDoneRef = React.useRef(false);
          const warnedRef = React.useRef(false);

          const board = activeBoardOf(doc);

          const showToast = function (message) {
            setToast(message);
            if (toastTimer.current) clearTimeout(toastTimer.current);
            toastTimer.current = setTimeout(function () {
              toastTimer.current = null;
              setToast(null);
            }, TOAST_MS);
          };

          React.useEffect(function () {
            return function () {
              if (toastTimer.current) clearTimeout(toastTimer.current);
            };
          }, []);

          /* ---- persistence ---------------------------------------------------- */
          React.useEffect(function () {
            if (writeStorage(doc)) return;
            /* Warn once; the panel keeps working from memory either way. */
            if (warnedRef.current) return;
            warnedRef.current = true;
            showToast(t('toast.storageFailed'));
          }, [doc]);

          /* ---- measure the canvas --------------------------------------------- */
          React.useEffect(function () {
            const element = wrapRef.current;
            if (!element || !element.getBoundingClientRect) return undefined;
            function read() {
              const rect = element.getBoundingClientRect();
              const next = { width: Math.round(rect.width || 0), height: Math.round(rect.height || 0) };
              if (next.width !== viewportRef.current.width || next.height !== viewportRef.current.height) {
                viewportRef.current = next;
                setViewport(next);
              }
            }
            read();
            if (typeof window === 'undefined' || !window.addEventListener) return undefined;
            window.addEventListener('resize', read);
            return function () {
              window.removeEventListener('resize', read);
            };
          }, []);

          /* Fit a board the first time it is shown, then leave the camera to the
           * user until they ask for a fit. */
          React.useEffect(function () {
            if (!viewport.width || !viewport.height) return;
            if (!board.nodes.length) return;
            /* Keyed by board alone: a window resize must not throw away the
             * zoom the user has already chosen. */
            const key = board.id;
            if (fittedRef.current === key) return;
            fittedRef.current = key;
            const view = fitView(board, viewport.width, viewport.height);
            if (
              Math.abs(view.k - board.view.k) < 0.001 &&
              Math.abs(view.x - board.view.x) < 1 &&
              Math.abs(view.y - board.view.y) < 1
            ) {
              return;
            }
            setDoc(function (current) {
              return withBoard(current, function (b) {
                return replaceBoard(b, { view: view });
              }) || current;
            });
          }, [board.id, viewport.width, viewport.height]);

          /* Focus the inline editor as soon as it appears. */
          const editingId = editing ? editing.id : null;
          React.useEffect(function () {
            if (!editingId) return;
            const element = editorRef.current;
            if (!element || !element.focus) return;
            element.focus();
            if (element.select) element.select();
          }, [editingId]);

          /* ---- history --------------------------------------------------------- */

          /**
           * Apply a committed document change. Every mutating path funnels through
           * here, which is what makes undo uniform: one call, one snapshot.
           */
          const commit = function (producer, baseline) {
            setDoc(function (current) {
              const next = producer(current);
              if (!next) return current;
              const past = historyRef.current.past.slice();
              /* A drag has already written its live position into `doc`, so the
               * snapshot undo must return to is the one captured before the
               * pointer went down, not `current`. */
              past.push(baseline === undefined ? current : baseline);
              if (past.length > HISTORY_LIMIT) past.shift();
              historyRef.current.past = past;
              historyRef.current.future = [];
              return next;
            });
          };

          const undo = function () {
            const history = historyRef.current;
            if (!history.past.length) return;
            const previous = history.past[history.past.length - 1];
            history.past = history.past.slice(0, -1);
            history.future = [doc].concat(history.future).slice(0, HISTORY_LIMIT);
            setDoc(previous);
            setSelection(null);
            setEditing(null);
          };

          const redo = function () {
            const history = historyRef.current;
            if (!history.future.length) return;
            const next = history.future[0];
            history.future = history.future.slice(1);
            history.past = history.past.concat([doc]).slice(-HISTORY_LIMIT);
            setDoc(next);
            setSelection(null);
            setEditing(null);
          };

          /* ---- board-scoped document helpers ----------------------------------- */

          const mutateBoard = function (mutate) {
            commit(function (current) {
              return withBoard(current, mutate);
            });
          };

          const setView = function (view) {
            /* Camera moves stay out of the history: they would flood it. */
            setDoc(function (current) {
              return withBoard(current, function (b) {
                return replaceBoard(b, { view: view });
              }) || current;
            });
          };

          const findNode = function (id) {
            for (let i = 0; i < board.nodes.length; i += 1) {
              if (board.nodes[i].id === id) return board.nodes[i];
            }
            return null;
          };

          /* ---- node and edge operations ---------------------------------------- */

          /** Palette click: drop the new shape in the middle of the view. */
          /** Do two node boxes collide, with a little breathing room? */
          function collides(box, node) {
            const gap = 12;
            return !(
              box.x + box.w + gap <= node.x ||
              node.x + node.w + gap <= box.x ||
              box.y + box.h + gap <= node.y ||
              node.y + node.h + gap <= box.y
            );
          }

          /**
           * Find somewhere a new shape fits near the middle of the view.
           *
           * Dropping every palette click at the exact centre stacks them on top
           * of each other, which makes the board unusable after three shapes.
           * This walks a diagonal cascade until it finds a clear spot, then
           * falls back to the centre if the board is genuinely full.
           */
          function freeSpot(size, centre, host) {
            /* A selected frame acts as the drop target: adding while a frame is
             * selected puts the new shape inside it, which is what a board
             * section is for. Collision checks then ignore that host. */
            if (host) {
              const pad = 18;
              const step = 16;
              for (let row = 0; row < 14; row += 1) {
                for (let col = 0; col < 8; col += 1) {
                  const x = host.x + pad + col * step * 2;
                  const y = host.y + host.h * 0.28 + pad + row * step * 2;
                  if (x + size.w > host.x + host.w - pad) continue;
                  if (y + size.h > host.y + host.h - pad) continue;
                  const box = { x: x, y: y, w: size.w, h: size.h };
                  let clear = true;
                  for (let j = 0; j < board.nodes.length; j += 1) {
                    const other = board.nodes[j];
                    if (other.id === host.id || other.type === 'band') continue;
                    if (collides(box, other)) { clear = false; break; }
                  }
                  if (clear) return { x: x, y: y };
                }
              }
              return { x: host.x + pad, y: host.y + host.h * 0.28 + pad };
            }
            const others = board.nodes.filter(function (n) { return n.type !== 'band'; });
            const offsets = [[0, 0], [28, 28], [-28, -28], [56, 0], [0, 56], [-56, 0], [0, -56]];
            for (let i = 0; i < offsets.length; i += 1) {
              for (let step = 0; step < 40; step += 1) {
                const x = centre.x + offsets[i][0] + step * 24;
                const y = centre.y + offsets[i][1] + step * 24;
                const box = { x: x - size.w / 2, y: y - size.h / 2, w: size.w, h: size.h };
                let clear = true;
                for (let j = 0; j < others.length; j += 1) {
                  if (collides(box, others[j])) { clear = false; break; }
                }
                if (clear) return { x: box.x, y: box.y };
              }
            }
            return { x: centre.x - size.w / 2, y: centre.y - size.h / 2 };
          }

          function addNode(type) {
            const preset = TYPE_DEFAULT[type] || TYPE_DEFAULT.step;
            const centre = screenToBoard(board.view, (viewport.width || 640) / 2, (viewport.height || 420) / 2);
            /* Adding while a frame is selected drops the shape into that frame. */
            const host = selectedNodes.length === 1 && selectedNodes[0].type === 'frame'
              ? selectedNodes[0]
              : null;
            const spot = freeSpot(preset, centre, host);
            addNodeAt(type, { x: spot.x + preset.w / 2, y: spot.y + preset.h / 2 });
          }

          function addNodeAt(type, point) {
            const preset = TYPE_DEFAULT[type] || TYPE_DEFAULT.step;
            const node = makeNode(
              type,
              Math.round((point.x - preset.w / 2) / 4) * 4,
              Math.round((point.y - preset.h / 2) / 4) * 4,
              '',
              'default',
            );
            /* A frame with no title looks like a plain rectangle, so it is born
             * with a name the user can overwrite. */
            if (type === 'frame') node.text = t('frame.defaultTitle');
            mutateBoard(function (b) {
              return replaceBoard(b, { nodes: b.nodes.concat([node]) });
            });
            setSelection({ kind: 'node', id: node.id });
            /* A table is edited cell by cell in the inspector, so it must not
             * open the inline text editor: that editor writes `node.text`,
             * which a table does not use. */
            if (type === 'table') {
              setEditing(null);
              setDraft('');
              return;
            }
            editDoneRef.current = false;
            setEditing({ id: node.id, isNew: true });
            setDraft('');
          }

          function patchNode(id, patch) {
            mutateBoard(function (b) {
              const nodes = b.nodes.slice();
              for (let i = 0; i < nodes.length; i += 1) {
                if (nodes[i].id !== id) continue;
                nodes[i] = Object.assign({}, nodes[i], patch);
                return replaceBoard(b, { nodes: nodes });
              }
              return null;
            });
          }

          function removeNodeCascade(id) {
            mutateBoard(function (b) {
              return replaceBoard(b, {
                nodes: b.nodes.filter(function (node) { return node.id !== id; }),
                edges: b.edges.filter(function (edge) { return edge.from !== id && edge.to !== id; }),
              });
            });
          }

          /**
           * Snapshot the selection to the in-memory clipboard.
           *
           * Only connectors whose both ends are also copied come along, so a
           * paste never produces a dangling edge.
           */
          function copySelection() {
            if (!selectedIds.length) return false;
            const idSet = {};
            for (let i = 0; i < selectedIds.length; i += 1) idSet[selectedIds[i]] = true;
            const nodes = board.nodes.filter(function (n) { return idSet[n.id]; });
            if (!nodes.length) return false;
            const edges = board.edges.filter(function (e) {
              return idSet[e.from] && idSet[e.to];
            });
            clipRef.current = {
              nodes: nodes.map(function (n) {
                const copy = JSON.parse(JSON.stringify(n));
                return copy;
              }),
              edges: edges.map(function (e) { return JSON.parse(JSON.stringify(e)); }),
            };
            return true;
          }

          /**
           * Paste the clipboard, offset so the copy is visibly a new object.
           *
           * Ids are regenerated and connectors are rewired to the new ids; the
           * paste becomes the selection so it can be dragged straight away.
           */
          function pasteClipboard() {
            const clip = clipRef.current;
            if (!clip || !clip.nodes.length) return false;
            const offset = 24;
            const remap = {};
            const fresh = [];
            for (let i = 0; i < clip.nodes.length; i += 1) {
              const source = clip.nodes[i];
              const node = makeNode(
                source.type,
                source.x + offset,
                source.y + offset,
                source.text,
                source.tone,
                source.points,
              );
              node.w = source.w;
              node.h = source.h;
              remap[source.id] = node.id;
              fresh.push(node);
            }
            const freshEdges = [];
            for (let i = 0; i < clip.edges.length; i += 1) {
              const source = clip.edges[i];
              const edge = makeEdge(
                remap[source.from],
                source.fromPort,
                remap[source.to],
                source.toPort,
                source.label,
              );
              edge.router = source.router;
              edge.style = source.style;
              edge.arrow = source.arrow;
              edge.tone = source.tone;
              freshEdges.push(edge);
            }
            mutateBoard(function (b) {
              return replaceBoard(b, {
                nodes: b.nodes.concat(fresh),
                edges: b.edges.concat(freshEdges),
              });
            });
            setSelectedIds(fresh.map(function (n) { return n.id; }));
            /* Subsequent pastes step further out, like a stack. */
            for (let i = 0; i < clip.nodes.length; i += 1) clip.nodes[i].x += offset;
            for (let i = 0; i < clip.nodes.length; i += 1) clip.nodes[i].y += offset;
            return true;
          }

          /** Write one table cell, growing the grid if needed. */
          function setTableCell(id, row, col, value) {
            mutateBoard(function (b) {
              const nodes = b.nodes.slice();
              for (let i = 0; i < nodes.length; i += 1) {
                if (nodes[i].id !== id || nodes[i].type !== 'table') continue;
                const table = nodes[i].table || normalizeTable(null);
                const cells = table.cells.map(function (r) { return r.slice(); });
                while (cells.length <= row) cells.push([]);
                while (cells[row].length <= col) cells[row].push('');
                cells[row][col] = value;
                nodes[i] = Object.assign({}, nodes[i], {
                  table: { cols: table.cols, rows: table.rows, cells: cells },
                });
                return replaceBoard(b, { nodes: nodes });
              }
              return null;
            });
          }

          /** Add or remove a row or column, keeping whatever cells remain. */
          function resizeTable(id, axis, delta) {
            mutateBoard(function (b) {
              const nodes = b.nodes.slice();
              for (let i = 0; i < nodes.length; i += 1) {
                if (nodes[i].id !== id || nodes[i].type !== 'table') continue;
                const table = nodes[i].table || normalizeTable(null);
                let cols = table.cols;
                let rows = table.rows;
                if (axis === 'col') cols = clamp(cols + delta, 1, TABLE_MAX);
                else rows = clamp(rows + delta, 1, TABLE_MAX);
                const cells = emptyCells(cols, rows);
                for (let r = 0; r < Math.min(rows, table.cells.length); r += 1) {
                  for (let c = 0; c < Math.min(cols, table.cells[r].length); c += 1) {
                    cells[r][c] = table.cells[r][c];
                  }
                }
                nodes[i] = Object.assign({}, nodes[i], { table: { cols: cols, rows: rows, cells: cells } });
                return replaceBoard(b, { nodes: nodes });
              }
              return null;
            });
          }

          /** Duplicate in place without touching the clipboard. */
          function duplicateSelection() {
            const saved = clipRef.current;
            if (!copySelection()) return false;
            const ok = pasteClipboard();
            clipRef.current = saved;
            return ok;
          }

          /**
           * Reorder the selected shapes within the node array.
           *
           * `band` keeps its place at the bottom of the paint order, so layer
           * moves only reshuffle ordinary shapes.
           */
          function moveLayer(direction) {
            if (!selectedIds.length) return;
            mutateBoard(function (b) {
              const picked = b.nodes.filter(function (n) { return selectedSet[n.id]; });
              if (!picked.length) return null;
              const others = b.nodes.filter(function (n) { return !selectedSet[n.id]; });
              const indexOf = function (node) { return b.nodes.indexOf(node); };
              const pickedSet = {};
              for (let i = 0; i < picked.length; i += 1) pickedSet[picked[i].id] = true;

              if (direction === 'front') {
                return replaceBoard(b, { nodes: others.concat(picked) });
              }
              if (direction === 'back') {
                const bands = picked.filter(function (n) { return n.type === 'band'; });
                const rest = others.filter(function (n) { return n.type === 'band'; });
                const normalPicked = picked.filter(function (n) { return n.type !== 'band'; });
                const normalOthers = others.filter(function (n) { return n.type !== 'band'; });
                return replaceBoard(b, {
                  nodes: rest.concat(bands).concat(normalPicked).concat(normalOthers),
                });
              }
              const nodes = b.nodes.slice();
              if (direction === 'forward') {
                for (let i = nodes.length - 2; i >= 0; i -= 1) {
                  if (pickedSet[nodes[i].id] && !pickedSet[nodes[i + 1].id]) {
                    const swapped = nodes[i];
                    nodes[i] = nodes[i + 1];
                    nodes[i + 1] = swapped;
                  }
                }
              } else {
                for (let i = 1; i < nodes.length; i += 1) {
                  if (pickedSet[nodes[i].id] && !pickedSet[nodes[i - 1].id]) {
                    const swapped = nodes[i];
                    nodes[i] = nodes[i - 1];
                    nodes[i - 1] = swapped;
                  }
                }
              }
              return replaceBoard(b, { nodes: nodes });
            });
          }

          /** Align every selected shape to the group's own bounding box. */
          function alignSelection(mode) {
            if (selectedNodes.length < 2) return;
            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;
            for (let i = 0; i < selectedNodes.length; i += 1) {
              const n = selectedNodes[i];
              if (n.x < minX) minX = n.x;
              if (n.y < minY) minY = n.y;
              if (n.x + n.w > maxX) maxX = n.x + n.w;
              if (n.y + n.h > maxY) maxY = n.y + n.h;
            }
            const centreX = (minX + maxX) / 2;
            const centreY = (minY + maxY) / 2;
            const place = function (n) {
              const patch = {};
              if (mode === 'left') patch.x = minX;
              if (mode === 'right') patch.x = maxX - n.w;
              if (mode === 'hcenter') patch.x = Math.round(centreX - n.w / 2);
              if (mode === 'top') patch.y = minY;
              if (mode === 'bottom') patch.y = maxY - n.h;
              if (mode === 'vcenter') patch.y = Math.round(centreY - n.h / 2);
              return Object.assign({}, n, patch);
            };
            mutateBoard(function (b) {
              const nodes = b.nodes.map(function (n) {
                return selectedSet[n.id] ? place(n) : n;
              });
              return replaceBoard(b, { nodes: nodes });
            });
          }

          /**
           * Spread the selected shapes so the gaps between them are equal.
           * Requires three or more, otherwise there is nothing to distribute.
           */
          function distributeSelection(axis) {
            if (selectedNodes.length < 3) return;
            const sorted = selectedNodes.slice().sort(function (a, b) {
              return axis === 'h' ? a.x - b.x : a.y - b.y;
            });
            const first = sorted[0];
            const last = sorted[sorted.length - 1];
            const startEdge = axis === 'h' ? first.x + first.w : first.y + first.h;
            const endEdge = axis === 'h' ? last.x : last.y;
            const inner = sorted.slice(1, -1);
            if (!inner.length) return;
            const span = endEdge - startEdge;
            let used = 0;
            for (let i = 0; i < inner.length; i += 1) {
              used += axis === 'h' ? inner[i].w : inner[i].h;
            }
            const gap = (span - used) / (inner.length + 1);
            let cursor = startEdge + gap;
            const positions = {};
            for (let i = 0; i < inner.length; i += 1) {
              positions[inner[i].id] = Math.round(cursor);
              cursor += (axis === 'h' ? inner[i].w : inner[i].h) + gap;
            }
            mutateBoard(function (b) {
              const nodes = b.nodes.map(function (n) {
                if (!(n.id in positions)) return n;
                return axis === 'h'
                  ? Object.assign({}, n, { x: positions[n.id] })
                  : Object.assign({}, n, { y: positions[n.id] });
              });
              return replaceBoard(b, { nodes: nodes });
            });
          }

          /** Remove every selected node (with its connectors) and edge. */
          function deleteSelection() {
            if (!selectedIds.length) return;
            const ids = selectedIds;
            const idSet = {};
            for (let i = 0; i < ids.length; i += 1) idSet[ids[i]] = true;
            mutateBoard(function (b) {
              return replaceBoard(b, {
                nodes: b.nodes.filter(function (node) { return !idSet[node.id]; }),
                edges: b.edges.filter(function (edge) {
                  return !idSet[edge.id] && !idSet[edge.from] && !idSet[edge.to];
                }),
              });
            });
            setSelection(null);
            setEditing(null);
          }

          function createEdge(fromId, fromPort, toId) {
            if (!fromId || !toId || fromId === toId) return false;
            const from = findNode(fromId);
            const to = findNode(toId);
            if (!from || !to) return false;
            const ports = nearestPorts(from, to);
            const edge = makeEdge(fromId, fromPort || ports.fromPort, toId, ports.toPort, '');
            mutateBoard(function (b) {
              return replaceBoard(b, { edges: b.edges.concat([edge]) });
            });
            setSelection({ kind: 'edge', id: edge.id });
            return true;
          }

          function patchEdge(id, patch) {
            mutateBoard(function (b) {
              const edges = b.edges.slice();
              for (let i = 0; i < edges.length; i += 1) {
                if (edges[i].id !== id) continue;
                edges[i] = Object.assign({}, edges[i], patch);
                return replaceBoard(b, { edges: edges });
              }
              return null;
            });
          }

          /* ---- boards ---------------------------------------------------------- */

          function addBoard(templateKey) {
            const locale = ctx.locale.getLocale().active;
            let created;
            if (templateKey) {
              const template = findTemplate(templateKey);
              if (!template) return;
              created = boardFromTemplate(template, locale, t('template.' + templateKey + '.title'));
              showToast(t('toast.template'));
            } else {
              const base = t('board.defaultName');
              const names = {};
              for (let i = 0; i < doc.boards.length; i += 1) names[doc.boards[i].name] = true;
              let n = doc.boards.length + 1;
              let name = base + ' ' + n;
              while (names[name]) {
                n += 1;
                name = base + ' ' + n;
              }
              created = emptyBoard(name);
            }
            const createdId = created.id;
            commit(function (current) {
              return {
                version: DOC_VERSION,
                boards: current.boards.concat([created]),
                activeId: createdId,
              };
            });
            setSelection(null);
            setEditing(null);
            setTemplatesOpen(false);
          }

          function deleteBoard() {
            const index = boardIndex(doc, doc.activeId);
            if (doc.boards.length > 1) {
              const remaining = doc.boards.slice(0, index).concat(doc.boards.slice(index + 1));
              const nextActive = remaining[Math.min(index, remaining.length - 1)];
              commit(function () {
                return { version: DOC_VERSION, boards: remaining, activeId: nextActive.id };
              });
              showToast(t('toast.boardDeleted'));
            } else {
              const replacement = emptyBoard(t('board.defaultName'));
              commit(function () {
                return { version: DOC_VERSION, boards: [replacement], activeId: replacement.id };
              });
            }
            setSelection(null);
            setEditing(null);
          }

          /** Renaming is a label edit, not a drawing edit: it stays out of the
           * undo history so it cannot bury the user's actual diagram steps. */
          function renameBoard(name) {
            setDoc(function (current) {
              return withBoard(current, function (b) {
                if (b.name === name) return null;
                return replaceBoard(b, { name: name });
              }) || current;
            });
          }

          function selectBoard(id) {
            setDoc(function (current) {
              if (current.activeId === id) return current;
              return Object.assign({}, current, { activeId: id });
            });
            setSelection(null);
            setEditing(null);
          }

          /* ---- text editing ---------------------------------------------------- */

          function beginEdit(node) {
            setSelection({ kind: 'node', id: node.id });
            editDoneRef.current = false;
            setEditing({ id: node.id, isNew: false });
            setDraft(node.text);
          }

          function commitEdit() {
            if (editDoneRef.current) return;
            editDoneRef.current = true;
            const target = editing;
            if (!target) return;
            const value = draft;
            const node = findNode(target.id);
            setEditing(null);
            setSelection({ kind: 'node', id: target.id });
            if (!node) return;
            if (node.text === value) return;
            patchNode(target.id, { text: value });
          }

          function cancelEdit() {
            if (editDoneRef.current) return;
            editDoneRef.current = true;
            const target = editing;
            setEditing(null);
            if (!target) return;
            /* An empty shape whose first edit was cancelled would be an invisible
             * artifact, so it is removed again. */
            /* Only a textless shape is reclaimed. A table's copy lives in its
             * cells and a frame is meaningful without a title, so neither is
             * discarded for having no `text`. */
            if (target.isNew) {
              const node = findNode(target.id);
              const holdsOwnCopy = node && (node.type === 'table' || node.type === 'frame');
              if (node && !node.text && !holdsOwnCopy) {
                removeNodeCascade(target.id);
                setSelection(null);
                return;
              }
            }
            setSelection({ kind: 'node', id: target.id });
          }

          /* ---- export ---------------------------------------------------------- */

          function exportJson() {
            const payload = JSON.stringify(
              { version: doc.version, exportedAt: new Date().toISOString(), boards: doc.boards },
              null,
              2,
            );
            download('flowboard-' + slug(board.name) + '.json', 'application/json', payload);
            setExportOpen(false);
            showToast(t('toast.exported'));
          }

          function exportSvg() {
            download('flowboard-' + slug(board.name) + '.svg', 'image/svg+xml', boardToSvg(board));
            setExportOpen(false);
            showToast(t('toast.exported'));
          }

          function exportMarkdown() {
            download('flowboard-' + slug(board.name) + '.md', 'text/markdown', boardToMarkdown(board));
            setExportOpen(false);
            showToast(t('toast.exported'));
          }

          function copyMarkdown() {
            setExportOpen(false);
            copyText(boardToMarkdown(board)).then(function (ok) {
              showToast(ok ? t('toast.copied') : t('toast.copyFailed'));
            });
          }

          /* ---- pointer interaction --------------------------------------------- */

          function canvasPoint(event) {
            const element = canvasRef.current;
            if (!element || !element.getBoundingClientRect) return { x: 0, y: 0 };
            const rect = element.getBoundingClientRect();
            return { x: event.clientX - rect.left, y: event.clientY - rect.top };
          }

          /** Bands are hit-tested last so they never cover the shapes they group. */
          /**
           * Regions and frames are grabbable like shapes, but only where they
           * are actually reachable: a region from anywhere, a frame from its
           * title band, so its interior stays transparent to the shapes in it.
           */
          function bandAt(b, point) {
            for (let i = b.nodes.length - 1; i >= 0; i -= 1) {
              const node = b.nodes[i];
              if (node.type !== 'band' && node.type !== 'frame') continue;
              if (point.x >= node.x && point.x <= node.x + node.w && point.y >= node.y && point.y <= node.y + node.h) {
                if (node.type === 'frame') {
                  const head = Math.min(node.h * 0.28, 34);
                  if (point.y - node.y <= head) return node;
                  continue;
                }
                return node;
              }
            }
            return null;
          }

          /**
           * Snap a moving box to the edges and centres of every other shape.
           *
           * Returns the corrected position plus the guide lines to draw. The
           * threshold is in screen pixels so the pull feels the same at any
           * zoom, then converted into board units.
           */
          function snapBox(box, movingIds, zoom) {
            const threshold = 7 / (zoom || 1);
            const others = board.nodes.filter(function (n) {
              return n.type !== 'band' && movingIds.indexOf(n.id) < 0;
            });
            if (!others.length) return { x: box.x, y: box.y, guides: [] };

            const xCandidates = [box.x, box.x + box.w / 2, box.x + box.w];
            const yCandidates = [box.y, box.y + box.h / 2, box.y + box.h];
            let bestX = null;
            let bestY = null;

            for (let i = 0; i < others.length; i += 1) {
              const other = others[i];
              const xTargets = [other.x, other.x + other.w / 2, other.x + other.w];
              const yTargets = [other.y, other.y + other.h / 2, other.y + other.h];
              for (let a = 0; a < xCandidates.length; a += 1) {
                for (let b = 0; b < xTargets.length; b += 1) {
                  const delta = xTargets[b] - xCandidates[a];
                  if (Math.abs(delta) <= threshold) {
                    if (!bestX || Math.abs(delta) < Math.abs(bestX.delta)) {
                      bestX = { delta: delta, at: xTargets[b] };
                    }
                  }
                }
              }
              for (let a = 0; a < yCandidates.length; a += 1) {
                for (let b = 0; b < yTargets.length; b += 1) {
                  const delta = yTargets[b] - yCandidates[a];
                  if (Math.abs(delta) <= threshold) {
                    if (!bestY || Math.abs(delta) < Math.abs(bestY.delta)) {
                      bestY = { delta: delta, at: yTargets[b] };
                    }
                  }
                }
              }
            }

            const guides = [];
            const x = bestX ? box.x + bestX.delta : box.x;
            const y = bestY ? box.y + bestY.delta : box.y;
            if (bestX) guides.push({ axis: 'v', at: bestX.at });
            if (bestY) guides.push({ axis: 'h', at: bestY.at });
            return { x: x, y: y, guides: guides };
          }

          /**
           * Rub out freehand strokes near a board-space point.
           *
           * Only pen and highlighter strokes erase: a whiteboard eraser that
           * silently deleted a flowchart shape would be a footgun. The live doc
           * updates as the pointer moves, and the gesture commits as one undo
           * step when the pointer lifts.
           */
          function eraseAt(point) {
            const state = eraserRef.current;
            if (!state) return;
            const reach = 14 / (board.view.k || 1);
            const victims = [];
            for (let i = 0; i < board.nodes.length; i += 1) {
              const node = board.nodes[i];
              if (node.type !== 'stroke' || !node.points) continue;
              if (state.rubbed[node.id]) continue;
              for (let j = 0; j < node.points.length; j += 1) {
                const px = node.x + node.points[j].x;
                const py = node.y + node.points[j].y;
                if (Math.abs(px - point.x) <= reach && Math.abs(py - point.y) <= reach) {
                  victims.push(node.id);
                  break;
                }
              }
            }
            if (!victims.length) return;
            if (!state.removed) state.removed = [];
            for (let i = 0; i < victims.length; i += 1) {
              state.rubbed[victims[i]] = true;
              state.removed.push(victims[i]);
            }
            const gone = Object.assign({}, state.rubbed);
            setDoc(function (current) {
              return withBoard(current, function (b) {
                return replaceBoard(b, {
                  nodes: b.nodes.filter(function (n) { return !gone[n.id]; }),
                });
              }) || current;
            });
          }

          /** Normalise a marquee into a positive-extent rectangle, or null. */
          function marqueeBox(start, end) {
            if (!start || !end) return null;
            const x = Math.min(start.x, end.x);
            const y = Math.min(start.y, end.y);
            const w = Math.abs(end.x - start.x);
            const hgt = Math.abs(end.y - start.y);
            return { x: x, y: y, w: w, h: hgt };
          }

          function onCanvasPointerDown(event) {
            if (event.button !== undefined && event.button !== 0) return;
            const local = canvasPoint(event);
            const point = screenToBoard(board.view, local.x, local.y);

            /* The eraser rubs out freehand strokes it passes over. */
            if (eraserArmed) {
              eraserRef.current = { rubbed: {}, removed: [], baseline: doc };
              eraseAt(point);
              return;
            }

            /* The pen draws anywhere on the canvas, including over shapes. */
            if (penArmed) {
              penRef.current = { start: point, points: [{ x: 0, y: 0 }], moved: false };
              setSelection(null);
              setEditing(null);
              return;
            }
            const hit = nodeAt(board, point) || bandAt(board, point);
            if (hit) {
              const additive = !!(event.shiftKey || event.metaKey || event.ctrlKey);
              let nextIds;
              if (additive) {
                /* Shift-click toggles one shape in or out of the selection. */
                const already = selectedIds.indexOf(hit.id) >= 0;
                nextIds = already
                  ? selectedIds.filter(function (id) { return id !== hit.id; })
                  : selectedIds.concat([hit.id]);
              } else if (selectedIds.indexOf(hit.id) >= 0 && selectedIds.length > 1) {
                /* Clicking inside an existing multi-selection keeps it, so the
                 * whole group can be dragged together. */
                nextIds = selectedIds;
              } else {
                nextIds = [hit.id];
              }
              setSelectedIds(nextIds);
              setEditing(null);
              if (additive && nextIds.indexOf(hit.id) < 0) return;
              dragRef.current = {
                id: hit.id,
                ids: nextIds,
                origin: { x: point.x - hit.x, y: point.y - hit.y },
                start: point,
                origins: nextIds.map(function (id) {
                  const n = findNode(id);
                  return { id: id, x: n ? n.x : 0, y: n ? n.y : 0 };
                }),
                moved: false,
                baseline: doc,
              };
              setDrag({ id: hit.id });
              return;
            }
            /* Empty canvas: Shift keeps the selection and starts a marquee,
             * otherwise it is a pan. */
            if (event.shiftKey || event.metaKey || event.ctrlKey) {
              marqueeRef.current = { start: point, additive: true };
              setMarquee({ start: point, end: point, additive: true });
              return;
            }
            panRef.current = { start: local, view: board.view };
            setPanning(true);
            setSelection(null);
            setEditing(null);
          }

          /** Begin a resize; the opposite edge stays anchored. */
          function onGripPointerDown(event, node, grip) {
            if (event.button !== undefined && event.button !== 0) return;
            if (event.stopPropagation) event.stopPropagation();
            dragRef.current = null;
            panRef.current = null;
            linkRef.current = null;
            setDrag(null);
            setPanning(false);
            setLink(null);
            const local = canvasPoint(event);
            const point = screenToBoard(board.view, local.x, local.y);
            dragRef.current = {
              id: node.id,
              mode: 'resize',
              grip: grip,
              box: { x: node.x, y: node.y, w: node.w, h: node.h },
              start: point,
              moved: false,
              baseline: doc,
            };
            setSelection({ kind: 'node', id: node.id });
            setEditing(null);
            setResizing({ id: node.id });
          }

          function onPortPointerDown(event, node, port) {
            if (event.button !== undefined && event.button !== 0) return;
            if (event.stopPropagation) event.stopPropagation();
            /* A port press starts a connector, never a shape move: clear any
             * drag or pan the same gesture may have begun. */
            dragRef.current = null;
            panRef.current = null;
            setDrag(null);
            setPanning(false);
            const local = canvasPoint(event);
            const state = { from: node.id, fromPort: port, point: local };
            linkRef.current = state;
            setLink(state);
            setSelection({ kind: 'node', id: node.id });
            setEditing(null);
          }

          function onPointerMove(event) {
            const local = canvasPoint(event);

            /* ---- drawing a freehand stroke -------------------------------- */
            if (penRef.current) {
              const state = penRef.current;
              const point = screenToBoard(board.view, local.x, local.y);
              const last = state.points[state.points.length - 1];
              const lx = point.x - state.start.x;
              const ly = point.y - state.start.y;
              /* Skip samples closer than 2px: it keeps the path small without
               * making the line look segmented. */
              if (Math.hypot(lx - last.x, ly - last.y) >= 2) {
                state.points.push({ x: Math.round(lx * 10) / 10, y: Math.round(ly * 10) / 10 });
                if (state.points.length > 3000) state.points.shift();
              }
              state.moved = true;
              setPenStroke({ points: state.points.slice(), start: state.start });
              return undefined;
            }

            /* ---- erasing -------------------------------------------------- */
            if (eraserRef.current) {
              const point = screenToBoard(board.view, local.x, local.y);
              eraseAt(point);
              return undefined;
            }

            /* ---- rubber-band selection ----------------------------------- */
            if (marqueeRef.current) {
              const point = screenToBoard(board.view, local.x, local.y);
              marqueeRef.current = Object.assign({}, marqueeRef.current, { end: point });
              setMarquee({
                start: marqueeRef.current.start,
                end: point,
                additive: marqueeRef.current.additive,
              });
              return undefined;
            }

            /* ---- resizing a shape ---------------------------------------- */
            if (dragRef.current && dragRef.current.mode === 'resize') {
              const state = dragRef.current;
              const point = screenToBoard(board.view, local.x, local.y);
              const dx = point.x - state.start.x;
              const dy = point.y - state.start.y;
              const box = state.box;
              const grip = state.grip;
              const MIN_W = 24;
              const MIN_H = 16;
              let x = box.x;
              let y = box.y;
              let w = box.w;
              let hh = box.h;
              if (grip.indexOf('w') >= 0) {
                const nextW = Math.max(MIN_W, box.w - dx);
                x = box.x + (box.w - nextW);
                w = nextW;
              }
              if (grip.indexOf('e') >= 0) w = Math.max(MIN_W, box.w + dx);
              if (grip.indexOf('n') >= 0) {
                const nextH = Math.max(MIN_H, box.h - dy);
                y = box.y + (box.h - nextH);
                hh = nextH;
              }
              if (grip.indexOf('s') >= 0) hh = Math.max(MIN_H, box.h + dy);
              x = Math.round(x / 4) * 4;
              y = Math.round(y / 4) * 4;
              w = Math.round(w / 4) * 4;
              hh = Math.round(hh / 4) * 4;
              const node = findNode(state.id);
              if (!node || (node.x === x && node.y === y && node.w === w && node.h === hh)) return undefined;
              state.moved = true;
              setDoc(function (current) {
                return withBoard(current, function (b) {
                  const nodes = b.nodes.slice();
                  for (let i = 0; i < nodes.length; i += 1) {
                    if (nodes[i].id !== state.id) continue;
                    nodes[i] = Object.assign({}, nodes[i], { x: x, y: y, w: w, h: hh });
                    return replaceBoard(b, { nodes: nodes });
                  }
                  return null;
                }) || current;
              });
              return undefined;
            }

            if (dragRef.current) {
              const state = dragRef.current;
              const point = screenToBoard(board.view, local.x, local.y);
              const nx = Math.round((point.x - state.origin.x) / 4) * 4;
              const ny = Math.round((point.y - state.origin.y) / 4) * 4;
              const node = findNode(state.id);
              if (!node) return;

              /* Snap the dragged box to nearby edges and centres, and show the
               * guides that produced the pull. */
              const snapped = snapBox(
                { x: nx, y: ny, w: node.w, h: node.h },
                state.ids || [state.id],
                board.view.k,
              );
              const sx = Math.round(snapped.x);
              const sy = Math.round(snapped.y);
              if (snapped.guides.length) {
                if (!guidesRef.current || guidesRef.current.length !== snapped.guides.length) {
                  guidesRef.current = snapped.guides;
                  setGuides(snapped.guides);
                } else {
                  guidesRef.current = snapped.guides;
                }
              } else if (guidesRef.current && guidesRef.current.length) {
                guidesRef.current = [];
                setGuides([]);
              }

              /* Dragging one shape of a multi-selection moves the whole group. */
              if (state.origins && state.origins.length > 1) {
                const dx = sx - node.x;
                const dy = sy - node.y;
                if (dx === 0 && dy === 0) return;
                state.moved = true;
                setDoc(function (current) {
                  return withBoard(current, function (b) {
                    const moved = {};
                    for (let i = 0; i < state.origins.length; i += 1) {
                      const o = state.origins[i];
                      moved[o.id] = { x: o.x + dx, y: o.y + dy };
                    }
                    const nodes = b.nodes.map(function (item) {
                      const target = moved[item.id];
                      return target ? Object.assign({}, item, target) : item;
                    });
                    return replaceBoard(b, { nodes: nodes });
                  }) || current;
                });
                return;
              }
              if (!state.moved) {
                state.moved = true;
                setDrag({ id: state.id });
              }
              /* Live position carries no history entry; the drop commits once. */
              setDoc(function (current) {
                return withBoard(current, function (b) {
                  const nodes = b.nodes.slice();
                  for (let i = 0; i < nodes.length; i += 1) {
                    if (nodes[i].id !== state.id) continue;
                    nodes[i] = Object.assign({}, nodes[i], { x: sx, y: sy });
                    return replaceBoard(b, { nodes: nodes });
                  }
                  return null;
                }) || current;
              });
              return;
            }

            if (linkRef.current) {
              linkRef.current = Object.assign({}, linkRef.current, { point: local });
              setLink(linkRef.current);
              return;
            }

            if (panRef.current) {
              const state = panRef.current;
              setView({
                x: state.view.x + (local.x - state.start.x),
                y: state.view.y + (local.y - state.start.y),
                k: state.view.k,
              });
            }
          }

          function onPointerUp(event) {
            if (eraserRef.current) {
              const state = eraserRef.current;
              eraserRef.current = null;
              const removed = state.removed || [];
              if (!removed.length) return;
              commit(function (current) {
                return withBoard(current, function (b) {
                  const gone = {};
                  for (let i = 0; i < removed.length; i += 1) gone[removed[i]] = true;
                  return replaceBoard(b, {
                    nodes: b.nodes.filter(function (n) { return !gone[n.id]; }),
                    edges: b.edges.filter(function (e) { return !gone[e.from] && !gone[e.to]; }),
                  });
                });
              }, state.baseline);
              return;
            }

            if (guidesRef.current && guidesRef.current.length) {
              guidesRef.current = [];
              setGuides([]);
            }
            /* ---- finish a rubber-band selection -------------------------- */
            if (marqueeRef.current) {
              const state = marqueeRef.current;
              marqueeRef.current = null;
              setMarquee(null);
              const box = marqueeBox(state.start, state.end);
              if (!box) {
                if (!state.additive) setSelection(null);
                return;
              }
              const hits = [];
              for (let i = 0; i < board.nodes.length; i += 1) {
                const node = board.nodes[i];
                if (node.type === 'band') continue;
                /* A shape counts as selected when the band touches it. */
                if (
                  node.x < box.x + box.w && node.x + node.w > box.x &&
                  node.y < box.y + box.h && node.y + node.h > box.y
                ) {
                  hits.push(node.id);
                }
              }
              if (state.additive) {
                const merged = selectedIds.slice();
                for (let i = 0; i < hits.length; i += 1) {
                  if (merged.indexOf(hits[i]) < 0) merged.push(hits[i]);
                }
                setSelectedIds(merged);
              } else {
                setSelectedIds(hits);
              }
              setEditing(null);
              return;
            }

            if (penRef.current) {
              const state = penRef.current;
              penRef.current = null;
              setPenStroke(null);
              if (!state.moved || state.points.length < 2) return;
              let minX = Infinity;
              let minY = Infinity;
              let maxX = -Infinity;
              let maxY = -Infinity;
              for (let i = 0; i < state.points.length; i += 1) {
                const p2 = state.points[i];
                if (p2.x < minX) minX = p2.x;
                if (p2.y < minY) minY = p2.y;
                if (p2.x > maxX) maxX = p2.x;
                if (p2.y > maxY) maxY = p2.y;
              }
              const local = state.points.map(function (p3) {
                return { x: Math.round((p3.x - minX) * 10) / 10, y: Math.round((p3.y - minY) * 10) / 10 };
              });
              const node = makeNode(
                'stroke',
                Math.round(state.start.x + minX),
                Math.round(state.start.y + minY),
                '',
                'slate',
                local,
              );
              if (penMode === 'highlighter') node.ink = 'highlighter';
              node.w = Math.max(8, Math.round(maxX - minX));
              node.h = Math.max(8, Math.round(maxY - minY));
              mutateBoard(function (b) {
                return replaceBoard(b, { nodes: b.nodes.concat([node]) });
              });
              setSelection({ kind: 'node', id: node.id });
              return;
            }

            if (dragRef.current && dragRef.current.mode === 'resize') {
              const state = dragRef.current;
              dragRef.current = null;
              setResizing(null);
              if (!state.moved) return;
              const node = findNode(state.id);
              if (!node) return;
              const final = { x: node.x, y: node.y, w: node.w, h: node.h };
              commit(function (current) {
                return withBoard(current, function (b) {
                  const nodes = b.nodes.slice();
                  for (let i = 0; i < nodes.length; i += 1) {
                    if (nodes[i].id !== state.id) continue;
                    nodes[i] = Object.assign({}, nodes[i], final);
                    return replaceBoard(b, { nodes: nodes });
                  }
                  return null;
                });
              }, state.baseline);
              return;
            }

            if (dragRef.current) {
              const state = dragRef.current;
              dragRef.current = null;
              setDrag(null);
              if (!state.moved) return;
              /* One undoable step for the whole move, measured from the position
               * each shape held before the drag began. */
              const finals = {};
              for (let i = 0; i < (state.ids || [state.id]).length; i += 1) {
                const id = (state.ids || [state.id])[i];
                const node = findNode(id);
                if (node) finals[id] = { x: node.x, y: node.y };
              }
              commit(function (current) {
                return withBoard(current, function (b) {
                  const nodes = b.nodes.map(function (item) {
                    const target = finals[item.id];
                    return target ? Object.assign({}, item, target) : item;
                  });
                  return replaceBoard(b, { nodes: nodes });
                });
              }, state.baseline);
              return;
            }

            if (linkRef.current) {
              const state = linkRef.current;
              linkRef.current = null;
              setLink(null);
              const local = canvasPoint(event);
              const point = screenToBoard(board.view, local.x, local.y);
              const target = nodeAt(board, point);
              if (target) createEdge(state.from, state.fromPort, target.id);
              return;
            }

            if (panRef.current) {
              panRef.current = null;
              setPanning(false);
            }
          }

          function onWheel(event) {
            if (event.preventDefault) event.preventDefault();
            const local = canvasPoint(event);
            const current = board.view;
            const k = clamp(current.k * (event.deltaY > 0 ? 0.9 : 1.1), MIN_ZOOM, MAX_ZOOM);
            if (k === current.k) return;
            /* Keep the board point under the cursor pinned while zooming. */
            const before = screenToBoard(current, local.x, local.y);
            setView({ x: local.x - before.x * k, y: local.y - before.y * k, k: k });
          }

          function fitToScreen() {
            setView(fitView(board, viewport.width || 800, viewport.height || 520));
          }

          function onKeyDown(event) {
            const meta = event.metaKey || event.ctrlKey;
            if (meta && (event.key === 'z' || event.key === 'Z')) {
              if (event.preventDefault) event.preventDefault();
              if (event.shiftKey) redo();
              else undo();
              return;
            }
            if (meta && (event.key === 'c' || event.key === 'C')) {
              /* A browser copy of a text field must keep working. */
              const tag = event.target && event.target.tagName ? String(event.target.tagName).toLowerCase() : '';
              if (tag === 'input' || tag === 'textarea') return;
              if (copySelection() && event.preventDefault) event.preventDefault();
              showToast(t('toast.copiedObjects').replace('{n}', String(selectedIds.length)));
              return;
            }
            if (meta && (event.key === 'x' || event.key === 'X')) {
              const tag = event.target && event.target.tagName ? String(event.target.tagName).toLowerCase() : '';
              if (tag === 'input' || tag === 'textarea') return;
              if (!copySelection()) return;
              if (event.preventDefault) event.preventDefault();
              deleteSelection();
              showToast(t('toast.cutObjects').replace('{n}', String(selectedIds.length)));
              return;
            }
            if (meta && (event.key === 'v' || event.key === 'V')) {
              const tag = event.target && event.target.tagName ? String(event.target.tagName).toLowerCase() : '';
              if (tag === 'input' || tag === 'textarea') return;
              if (pasteClipboard()) {
                if (event.preventDefault) event.preventDefault();
                showToast(t('toast.pasted'));
              }
              return;
            }
            if (meta && (event.key === 'd' || event.key === 'D')) {
              if (event.preventDefault) event.preventDefault();
              if (duplicateSelection()) showToast(t('toast.pasted'));
              return;
            }
            if (meta && (event.key === 'a' || event.key === 'A')) {
              const tag = event.target && event.target.tagName ? String(event.target.tagName).toLowerCase() : '';
              if (tag === 'input' || tag === 'textarea') return;
              if (event.preventDefault) event.preventDefault();
              setSelectedIds(board.nodes.filter(function (n) {
                return n.type !== 'band';
              }).map(function (n) { return n.id; }));
              return;
            }
            if (meta && (event.key === 'y' || event.key === 'Y')) {
              if (event.preventDefault) event.preventDefault();
              redo();
              return;
            }
            if (event.key === 'Delete' || event.key === 'Backspace') {
              /* Never steal a keystroke that belongs to a text field. */
              const tag = event.target && event.target.tagName ? String(event.target.tagName).toLowerCase() : '';
              if (tag === 'input' || tag === 'textarea') return;
              if (!selectedIds.length) return;
              if (event.preventDefault) event.preventDefault();
              deleteSelection();
              return;
            }
            if (event.key === 'Escape') {
              setEditing(null);
              setSelection(null);
              setTemplatesOpen(false);
              setExportOpen(false);
              /* Escape always disarms the pen: it is the only way out besides
               * clicking the palette button again. */
              if (penArmed) {
                penRef.current = null;
                setPenStroke(null);
                setPenArmed(false);
              }
              if (eraserArmed) {
                eraserRef.current = null;
                setEraserArmed(false);
              }
            }
          }

          /* ---- derived view data ----------------------------------------------- */

          const nodeById = {};
          for (let i = 0; i < board.nodes.length; i += 1) nodeById[board.nodes[i].id] = board.nodes[i];

          const selectedSet = {};
          for (let i = 0; i < selectedIds.length; i += 1) selectedSet[selectedIds[i]] = true;
          /* The inspector edits one thing at a time: the last node selected, or
           * a selected connector. Batch actions use `selectedIds`. */
          const selectedNodes = board.nodes.filter(function (node) { return selectedSet[node.id]; });
          const selectedEdges = board.edges.filter(function (edge) { return selectedSet[edge.id]; });
          const selectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null;
          const selectedEdge = selectedNodes.length === 0 && selectedEdges.length === 1 ? selectedEdges[0] : null;
          const multiCount = selectedNodes.length + selectedEdges.length;

          const editingNode = editing ? nodeById[editing.id] || null : null;

          /* ---- canvas rendering ------------------------------------------------ */

          function renderNode(node) {
            const isBand = node.type === 'band';
            const isSelected = !!selectedSet[node.id];
            const isDragging = !!(drag && drag.id === node.id);
            /* `textBox` works in board coordinates, but everything below is
             * emitted inside a group already translated to the node's origin,
             * so all of it is shifted back to local space. */
            const wrapped = nodeLines(node);
            const box = wrapped.box;
            const total = wrapped.lines.length * wrapped.lineHeight;
            const firstLocal = box.y - node.y + (box.h - total) / 2 + wrapped.fontSize * 0.82;
            const children = [];

            /* A text node is bare type; rules are open strokes with no fill. */
            const bare = node.type === 'text';
            const rule = node.type === 'line' || node.type === 'arrow' || node.type === 'stroke';
            const sticky = node.type === 'sticky';
            const highlight = node.type === 'stroke' && node.ink === 'highlighter';
            children.push(h('path', {
              key: 'shape',
              className: 'dsh-fb-node-shape',
              d: shapePath(node.type, node.w, node.h, node),
              fill: bare || rule
                ? 'none'
                : sticky
                  ? stickyFill(node.tone)
                  : isBand
                    ? node.tone === 'default'
                      ? 'var(--dsw-alias-bg-layer-1)'
                      : hexAlpha(TONE_VALUE[node.tone], 0.07)
                    : 'var(--fb-fill)',
              stroke: bare ? 'none' : sticky ? 'none' : highlight ? HIGHLIGHT_INK : 'var(--fb-accent)',
              strokeWidth: highlight ? VIS.highlightWidth : isBand ? VIS.bandStroke : rule ? 2 : VIS.nodeStroke,
              strokeOpacity: highlight ? 0.4 : 1,
              strokeLinecap: rule ? 'round' : undefined,
              strokeDasharray: isBand ? '8 5' : node.type === 'note' ? '6 4' : undefined,
            }));

            const details = detailPaths(node.type, node.w, node.h, node);
            for (let i = 0; i < details.length; i += 1) {
              children.push(h('path', {
                key: 'detail-' + i,
                d: details[i],
                fill: 'none',
                stroke: 'var(--fb-accent)',
                strokeWidth: 1.1,
                opacity: 0.75,
              }));
            }

            if (isBand) {
              /* Draw the legend chip first so the band's own border is masked
               * behind it, exactly like an HTML fieldset. */
              const legend = bandLegend(node);
              children.push(h('rect', {
                key: 'band-legend-bg',
                className: 'dsh-fb-band-legend-bg',
                x: legend.x - node.x,
                y: legend.y - node.y,
                width: legend.w,
                height: legend.h,
                rx: 4,
                fill: 'var(--dsw-alias-bg-base)',
              }));
              children.push(h('text', {
                key: 'band-title',
                className: 'dsh-fb-band-title',
                x: legend.textX - node.x,
                y: legend.baseline - node.y,
                fill: 'var(--fb-accent)',
                fontSize: VIS.bandFont,
              }, wrapped.lines[0] || ''));
            } else if (node.type === 'table') {
              /* Cells are laid out on the same grid the detail lines draw, so
               * the ruling and the copy can never drift apart. */
              /* A legacy table may carry `text` from an earlier build that let
               * the inline editor write it. Show it rather than hide it, so no
               * typing is ever lost. */
              const legacy = typeof node.text === 'string' ? node.text.trim() : '';
              if (legacy) {
                children.push(h('text', {
                  key: 'legacy-text',
                  x: 7,
                  y: VIS.cellFont * 0.92 + 4,
                  fill: 'var(--dsw-alias-label-primary)',
                  fontSize: VIS.cellFont,
                  textAnchor: 'start',
                }, legacy.split('\n')[0]));
              }
              const table = node.table || { cols: 3, rows: 2, cells: emptyCells(3, 2) };
              const cols = Math.max(1, table.cols);
              const rows = Math.max(1, table.rows);
              const head = Math.min(node.h * 0.24, 30);
              const bodyTop = head;
              const bodyH = Math.max(1, node.h - head);
              const cellW = node.w / cols;
              const bodyRows = Math.max(1, rows - 1);
              const cellH = bodyH / bodyRows;
              const padX = 7;
              const padY = 4;
              for (let r = 0; r < rows; r += 1) {
                for (let c = 0; c < cols; c += 1) {
                  const cellText = (table.cells[r] && table.cells[r][c]) || '';
                  if (!cellText) continue;
                  /* Row 0 is the header band; later rows divide the body. */
                  const isHeaderRow = r === 0;
                  const top = isHeaderRow ? 0 : bodyTop + (r - 1) * cellH;
                  const hgt = isHeaderRow ? head : cellH;
                  const lines = wrapText(
                    cellText,
                    Math.max(12, cellW - padX * 2),
                    VIS.cellFont,
                    Math.max(1, Math.floor((hgt - padY * 2) / (VIS.cellFont * VIS.lineHeight))),
                  );
                  for (let li = 0; li < lines.length; li += 1) {
                    children.push(h('text', {
                      key: 'cell-' + r + '-' + c + '-' + li,
                      x: cellW * c + padX,
                      y: top + padY + VIS.cellFont * 0.92 + li * VIS.cellFont * VIS.lineHeight,
                      fill: isHeaderRow ? 'var(--dsw-alias-label-primary)' : 'var(--dsw-alias-label-secondary)',
                      fontSize: VIS.cellFont,
                      fontWeight: isHeaderRow ? 600 : 400,
                      textAnchor: 'start',
                    }, lines[li]));
                  }
                }
              }
            } else if (sticky) {
              /* Notes read top-down from the left, in fixed dark ink because
               * the paper is light in either theme. */
              const stickyFirst = box.y - node.y + wrapped.fontSize * 0.92;
              for (let i = 0; i < wrapped.lines.length; i += 1) {
                children.push(h('text', {
                  key: 'line-' + i,
                  x: box.x - node.x,
                  y: stickyFirst + i * wrapped.lineHeight,
                  fill: STICKY_INK,
                  fontSize: wrapped.fontSize,
                  textAnchor: 'start',
                }, wrapped.lines[i]));
              }
            } else if (node.type === 'frame') {
              const frameFirst = box.y - node.y + wrapped.fontSize * 0.92;
              for (let i = 0; i < wrapped.lines.length; i += 1) {
                children.push(h('text', {
                  key: 'line-' + i,
                  x: box.x - node.x,
                  y: frameFirst + i * wrapped.lineHeight,
                  fill: 'var(--dsw-alias-label-primary)',
                  fontSize: VIS.frameFont,
                  fontWeight: 600,
                  textAnchor: 'start',
                }, wrapped.lines[i]));
              }
            } else {
              for (let i = 0; i < wrapped.lines.length; i += 1) {
                children.push(h('text', {
                  key: 'line-' + i,
                  x: node.w / 2,
                  y: firstLocal + i * wrapped.lineHeight,
                  fill: 'var(--dsw-alias-label-primary)',
                  fontSize: wrapped.fontSize,
                  textAnchor: 'middle',
                }, wrapped.lines[i]));
              }
            }

            /* Resize grips: a drawing board has to let you size a shape, not
             * only move it. They appear on the selected node and are never
             * part of the exported drawing. */
            /* Resize grips belong to a lone selection: a group resize would need
             * a different (proportional) model, so it is deliberately absent. */
            if (isSelected && !isBand && selectedIds.length === 1) {
              const GRIPS = [
                { id: 'nw', x: 0, y: 0 }, { id: 'n', x: 0.5, y: 0 }, { id: 'ne', x: 1, y: 0 },
                { id: 'w', x: 0, y: 0.5 }, { id: 'e', x: 1, y: 0.5 },
                { id: 'sw', x: 0, y: 1 }, { id: 's', x: 0.5, y: 1 }, { id: 'se', x: 1, y: 1 },
              ];
              for (let i = 0; i < GRIPS.length; i += 1) {
                const grip = GRIPS[i];
                children.push(h('rect', {
                  key: 'grip-' + grip.id,
                  className: 'dsh-fb-grip',
                  x: grip.x * node.w - 4,
                  y: grip.y * node.h - 4,
                  width: 8,
                  height: 8,
                  rx: 1.5,
                  onPointerDown: function (event) { onGripPointerDown(event, node, grip.id); },
                }));
              }
            }

            /* Ports are affordances only: hidden until the node is hovered or
             * selected, and never part of the exported drawing. */
            if (!isBand) {
              for (let i = 0; i < PORTS.length; i += 1) {
                const port = PORTS[i];
                const anchor = portPoint({ x: 0, y: 0, w: node.w, h: node.h }, port);
                children.push(h(
                  'g',
                  {
                    key: 'port-' + port,
                    className: 'dsh-fb-port',
                    transform: 'translate(' + round(anchor.x) + ' ' + round(anchor.y) + ')',
                    onPointerDown: function (event) { onPortPointerDown(event, node, port); },
                  },
                  h('circle', { r: 11, fill: 'transparent' }),
                  h('circle', { className: 'dsh-fb-port-dot', r: 4.4, pointerEvents: 'none' }),
                ));
              }
            }

            return h(
              'g',
              {
                key: node.id,
                className:
                  'dsh-fb-node' + (isSelected ? ' is-selected' : '') +
                  (isDragging ? ' is-dragging' : '') +
                  (resizing && resizing.id === node.id ? ' is-resizing' : ''),
                transform: 'translate(' + round(node.x) + ' ' + round(node.y) + ')',
                style: toneVars(node.tone),
                onDoubleClick: function (event) {
                  if (event.stopPropagation) event.stopPropagation();
                  /* A table's copy lives in its cells, so double-clicking it
                   * must not open the single-text editor: that writes
                   * `node.text`, which a table never renders, and the typing
                   * would silently vanish. It selects the table instead, so the
                   * cell grid shows up in the inspector. */
                  if (node.type === 'table') {
                    setSelection({ kind: 'node', id: node.id });
                    setEditing(null);
                    showToast(t('table.editHint'));
                    return;
                  }
                  /* A frame's only text is its title, which lives in the header
                   * band. Double-clicking the body must not start editing that
                   * title, or it looks like the frame's contents are editable. */
                  if (node.type === 'frame') {
                    const head = Math.min(node.h * 0.28, 34);
                    const localPoint = screenToBoard(board.view, canvasPoint(event).x, canvasPoint(event).y);
                    if (localPoint.y - node.y > head) {
                      setSelection({ kind: 'node', id: node.id });
                      setEditing(null);
                      return;
                    }
                  }
                  beginEdit(node);
                },
                'data-node-type': node.type,
              },
              children,
            );
          }

          function renderEdge(edge) {
            const from = nodeById[edge.from];
            const to = nodeById[edge.to];
            if (!from || !to) return null;
            const geometry = geometryFor(edge, from, to);
            const isSelected = !!selectedSet[edge.id];
            const accent = edge.tone === 'default' ? 'var(--dsw-alias-state-idle-primary)' : 'var(--fb-accent)';
            const dash = edge.style === 'dashed' ? '6 5' : undefined;
            const children = [
              /* A wide transparent copy gives the connector a comfortable hit
               * target without thickening the visible line. */
              h('path', {
                key: 'hit',
                className: 'dsh-fb-edge-hit',
                d: geometry.d,
                onPointerDown: function (event) {
                  if (event.stopPropagation) event.stopPropagation();
                  setSelection({ kind: 'edge', id: edge.id });
                  setEditing(null);
                },
              }),
              h('path', {
                key: 'line',
                className: 'dsh-fb-edge-line',
                d: geometry.d,
                fill: 'none',
                stroke: accent,
                strokeWidth: VIS.edgeStroke,
                strokeLinecap: 'round',
                strokeDasharray: dash,
              }),
            ];
            if (edge.arrow !== 'none') {
              children.push(h('path', {
                key: 'arrow-end',
                d: arrowPath(geometry.endArrow.tip, geometry.endArrow.dir, VIS.arrowSize),
                fill: accent,
              }));
            }
            if (edge.arrow === 'both') {
              children.push(h('path', {
                key: 'arrow-start',
                d: arrowPath(geometry.startArrow.tip, geometry.startArrow.dir, VIS.arrowSize),
                fill: accent,
              }));
            }
            if (edge.label) {
              const width = measureWidth(edge.label, VIS.labelFont) + 12;
              children.push(h('rect', {
                key: 'label-bg',
                className: 'dsh-fb-edge-label-bg',
                x: geometry.mid.x - width / 2,
                y: geometry.mid.y - 9,
                width: width,
                height: 18,
                rx: 5,
              }));
              children.push(h('text', {
                key: 'label',
                className: 'dsh-fb-edge-label',
                x: geometry.mid.x,
                y: geometry.mid.y + 4,
                textAnchor: 'middle',
              }, edge.label));
            }
            return h('g', {
              key: edge.id,
              className: 'dsh-fb-edge' + (isSelected ? ' is-selected' : ''),
              style: toneVars(edge.tone),
            }, children);
          }

          /**
           * Full-span guide lines where the drag snapped to another shape.
           * They span the whole visible board so the alignment reads at a glance.
           */
          function renderGuides() {
            if (!guides.length) return null;
            const span = 4000;
            const items = [];
            for (let i = 0; i < guides.length; i += 1) {
              const guide = guides[i];
              if (guide.axis === 'v') {
                items.push(h('line', {
                  key: 'gv-' + i,
                  x1: guide.at, y1: -span, x2: guide.at, y2: span,
                }));
              } else {
                items.push(h('line', {
                  key: 'gh-' + i,
                  x1: -span, y1: guide.at, x2: span, y2: guide.at,
                }));
              }
            }
            return h('g', {
              className: 'dsh-fb-guides',
              stroke: 'var(--dsw-alias-brand-primary)',
              strokeWidth: 1 / (board.view.k || 1),
              strokeDasharray: (3 / (board.view.k || 1)) + ' ' + (3 / (board.view.k || 1)),
              pointerEvents: 'none',
              opacity: 0.85,
            }, items);
          }

          /** The rubber-band rectangle, drawn while dragging on empty canvas. */
          function renderMarquee() {
            if (!marquee) return null;
            const box = marqueeBox(marquee.start, marquee.end);
            if (!box) return null;
            return h('rect', {
              className: 'dsh-fb-marquee',
              x: box.x,
              y: box.y,
              width: box.w,
              height: box.h,
              fill: 'var(--dsw-alias-brand-primary)',
              fillOpacity: 0.1,
              stroke: 'var(--dsw-alias-brand-primary)',
              strokeWidth: 1,
              strokeDasharray: '5 3',
              pointerEvents: 'none',
            });
          }

          /** The stroke currently being drawn, shown live under the cursor. */
          function renderPenPreview() {
            if (!penStroke || penStroke.points.length < 2) return null;
            const origin = penStroke.start;
            const moved = penStroke.points.map(function (p2) {
              return { x: origin.x + p2.x, y: origin.y + p2.y };
            });
            const highlight = penMode === 'highlighter';
            return h('path', {
              d: freehandPath({ points: moved }),
              fill: 'none',
              stroke: highlight ? HIGHLIGHT_INK : TONE_VALUE.slate,
              strokeWidth: highlight ? VIS.highlightWidth : 2,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              opacity: highlight ? 0.4 : 1,
              pointerEvents: 'none',
            });
          }

          function renderLinkPreview() {
            if (!link) return null;
            const from = nodeById[link.from];
            if (!from) return null;
            const anchor = portPoint(from, link.fromPort);
            const target = screenToBoard(board.view, link.point.x, link.point.y);
            const controls = bezierControls(anchor, link.fromPort, target, 'l');
            return h('path', {
              d: 'M' + pt(anchor) + ' C' + pt(controls.c1) + ' ' + pt(controls.c2) + ' ' + pt(target),
              fill: 'none',
              stroke: 'var(--dsw-alias-brand-primary)',
              strokeWidth: 1.8,
              strokeDasharray: '6 5',
              pointerEvents: 'none',
            });
          }

          const view = board.view;

          const canvas = h(
            'svg',
            {
              ref: canvasRef,
              className:
                'dsh-fb-canvas' +
                (panning ? ' is-panning' : '') +
                (link ? ' is-linking' : '') +
                (penArmed ? ' is-pen' : ''),
              role: 'application',
              'aria-label': t('aria.canvas'),
              onPointerDown: onCanvasPointerDown,
              onPointerMove: onPointerMove,
              onPointerUp: onPointerUp,
              onPointerLeave: onPointerUp,
              onDoubleClick: function (event) {
                /* A double-click on empty canvas is the natural "add a step here". */
                const local = canvasPoint(event);
                const point = screenToBoard(board.view, local.x, local.y);
                if (nodeAt(board, point) || bandAt(board, point)) return;
                addNodeAt('step', point);
              },
              onWheel: onWheel,
            },
            h(
              'g',
              { transform: 'translate(' + round(view.x) + ' ' + round(view.y) + ') scale(' + round(view.k) + ')' },
              h('defs', { key: 'defs' },
                h('pattern', {
                  id: 'dsh-fb-grid',
                  width: VIS.gridSize,
                  height: VIS.gridSize,
                  patternUnits: 'userSpaceOnUse',
                },
                  h('circle', { cx: 1.2, cy: 1.2, r: 1, fill: 'var(--dsw-alias-border-l2)', opacity: 0.7 }),
                ),
              ),
              h('rect', {
                key: 'grid-bg',
                x: -6000, y: -6000, width: 12000, height: 12000,
                fill: 'url(#dsh-fb-grid)',
                pointerEvents: 'none',
              }),
              nodesInPaintOrder(board).map(function (node) { return renderNode(node); }),
              board.edges.map(function (edge) { return renderEdge(edge); }),
              renderLinkPreview(),
              renderPenPreview(),
              renderMarquee(),
              renderGuides(),
            ),
          );

          /* ---- inline editor --------------------------------------------------- */

          let editor = null;
          if (editingNode) {
            const width = Math.max(120, editingNode.w * view.k);
            const height = Math.max(32, Math.min(200, editingNode.h * view.k));
            editor = h('textarea', {
              ref: editorRef,
              className: 'dsh-fb-editor',
              style: {
                left: editingNode.x * view.k + view.x,
                top: editingNode.y * view.k + view.y,
                width: width,
                height: height,
              },
              value: draft,
              'aria-label': t('aria.editor'),
              onChange: function (event) { setDraft(event.target.value); },
              onKeyDown: function (event) {
                if (event.key === 'Escape') {
                  if (event.stopPropagation) event.stopPropagation();
                  if (event.preventDefault) event.preventDefault();
                  cancelEdit();
                  return;
                }
                if (event.key === 'Enter' && !event.shiftKey) {
                  if (event.preventDefault) event.preventDefault();
                  commitEdit();
                }
              },
              onBlur: function () { commitEdit(); },
            });
          }

          /* ---- header ---------------------------------------------------------- */

          const canUndo = historyRef.current.past.length > 0;
          const canRedo = historyRef.current.future.length > 0;

          const header = h(
            'div',
            { className: 'dsh-fb-header' },
            h(
              'svg',
              { className: 'dsh-fb-mark', viewBox: '0 0 20 20', width: 20, height: 20, 'aria-hidden': 'true' },
              h('rect', { x: 1.6, y: 2.2, width: 7, height: 5, rx: 1.5, fill: 'currentColor', opacity: 0.9 }),
              h('path', { d: 'M8.6 4.7h3.1a1 1 0 0 1 1 1v2.6M12.7 8.3v2.2', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 }),
              h('path', { d: 'M13.6 9l2.3 1.9-2.3 1.9z', fill: 'currentColor' }),
              h('rect', { x: 1.6, y: 12.4, width: 7, height: 5, rx: 1.5, fill: 'currentColor', opacity: 0.55 }),
            ),
            h('div', { className: 'dsh-fb-heading' },
              h('h1', { className: 'dsh-fb-title' }, t('panel.title')),
              h('p', { className: 'dsh-fb-sub' }, t('panel.subtitle')),
            ),
            h(
              'div',
              { className: 'dsh-fb-actions' },
              h(Menu, {
                open: templatesOpen,
                onToggle: function () { setTemplatesOpen(!templatesOpen); setExportOpen(false); },
                onClose: function () { setTemplatesOpen(false); },
                label: t('action.templates'),
              },
                TEMPLATES.map(function (template) {
                  return h(MenuItem, {
                    key: template.key,
                    label: t('template.' + template.key + '.title'),
                    desc: t('template.' + template.key + '.desc'),
                    onClick: function () { addBoard(template.key); },
                  });
                }),
              ),
              h(Menu, {
                open: exportOpen,
                onToggle: function () { setExportOpen(!exportOpen); setTemplatesOpen(false); },
                onClose: function () { setExportOpen(false); },
                label: t('action.export'),
              },
                h(MenuItem, { label: t('export.markdown'), onClick: exportMarkdown }),
                h(MenuItem, { label: t('export.svg'), onClick: exportSvg }),
                h(MenuItem, { label: t('export.json'), onClick: exportJson }),
                h(MenuItem, { label: t('export.copy'), onClick: copyMarkdown }),
              ),
              h('button', {
                type: 'button', className: 'dsh-fb-btn is-icon',
                title: t('action.undo'), 'aria-label': t('action.undo'),
                disabled: !canUndo, onClick: undo,
              }, icon('undo')),
              h('button', {
                type: 'button', className: 'dsh-fb-btn is-icon',
                title: t('action.redo'), 'aria-label': t('action.redo'),
                disabled: !canRedo, onClick: redo,
              }, icon('redo')),
              h('button', {
                type: 'button', className: 'dsh-fb-btn is-icon',
                title: t('action.fit'), 'aria-label': t('action.fit'),
                onClick: fitToScreen,
              }, icon('fit')),
              h('button', {
                type: 'button', className: 'dsh-fb-btn',
                title: t('action.newBoard'),
                onClick: function () { addBoard(null); },
              }, icon('plus'), h('span', null, t('action.newBoard'))),
            ),
          );

          /* ---- board tabs ------------------------------------------------------ */

          const bar = h(
            'div',
            { className: 'dsh-fb-bar' },
            h('div', { className: 'dsh-fb-tabs', role: 'tablist', 'aria-label': t('aria.tabs') },
              doc.boards.map(function (b) {
                return h('button', {
                  key: b.id,
                  type: 'button',
                  role: 'tab',
                  className: 'dsh-fb-tab',
                  'aria-selected': b.id === doc.activeId ? 'true' : 'false',
                  title: b.name,
                  onClick: function () { selectBoard(b.id); },
                }, b.name);
              }),
            ),
            h('input', {
              className: 'dsh-fb-name',
              value: board.name,
              'aria-label': t('action.rename'),
              onChange: function (event) { renameBoard(event.target.value); },
            }),
            h('button', {
              type: 'button',
              className: 'dsh-fb-btn is-icon',
              title: t('action.deleteBoard'),
              'aria-label': t('action.deleteBoard'),
              onClick: deleteBoard,
            }, icon('trash')),
          );

          /* ---- palette --------------------------------------------------------- */

          /* The palette is grouped: generic drawing tools first, because this
           * is a drawing board rather than a flowchart-only editor. */
          const PALETTE_GROUPS = [
            { id: 'draw', key: 'palette.draw' },
            { id: 'connect', key: 'palette.connect' },
            { id: 'diagram', key: 'palette.diagram' },
            { id: 'layout', key: 'palette.layout' },
          ];
          const palette = h(
            'div',
            { className: 'dsh-fb-palette', role: 'toolbar', 'aria-label': t('aria.palette') },
            PALETTE_GROUPS.map(function (group) {
              const presets = NODE_TYPES.filter(function (preset) { return preset.group === group.id; });
              if (!presets.length) return null;
              return h('div', { key: group.id, className: 'dsh-fb-palette-group' },
                h('div', { className: 'dsh-fb-palette-label' }, t(group.key)),
                presets.map(function (preset) {
                  return h('button', {
                    key: preset.id,
                    type: 'button',
                    className: 'dsh-fb-shape-btn' +
                      (preset.id === 'stroke' && penArmed && penMode === 'pen' ? ' is-armed' : '') +
                      (preset.id === 'highlighter' && penArmed && penMode === 'highlighter' ? ' is-armed' : '') +
                      (preset.id === 'eraser' && eraserArmed ? ' is-armed' : ''),
                    'aria-pressed': preset.id === 'stroke'
                      ? (penArmed && penMode === 'pen' ? 'true' : 'false')
                      : preset.id === 'highlighter'
                        ? (penArmed && penMode === 'highlighter' ? 'true' : 'false')
                        : preset.id === 'eraser'
                          ? (eraserArmed ? 'true' : 'false')
                          : undefined,
                    title: t(preset.key),
                    onClick: function () {
                      /* Pen, highlighter and eraser are drawing modes rather
                       * than shapes you place. */
                      if (preset.id === 'stroke' || preset.id === 'highlighter' || preset.id === 'eraser') {
                        if (preset.id === 'eraser') {
                          setPenArmed(false);
                          setPenStroke(null);
                          setEraserArmed(!eraserArmed);
                          setSelection(null);
                          setEditing(null);
                          return;
                        }
                        const wanted = preset.id === 'highlighter' ? 'highlighter' : 'pen';
                        const already = penArmed && penMode === wanted;
                        setPenMode(wanted);
                        setPenArmed(!already);
                        setEraserArmed(false);
                        setSelection(null);
                        setEditing(null);
                        return;
                      }
                      addNode(preset.id);
                    },
                  },
                    h('span', { className: 'dsh-fb-shape-glyph' }, shapeGlyph(preset.id)),
                    h('span', { className: 'dsh-fb-shape-text' }, t(preset.key)),
                  );
                }),
              );
            }),
            h('div', { className: 'dsh-fb-palette-hint' }, t('palette.hint')),
          );

          /* ---- inspector ------------------------------------------------------- */

          function segmentField(options, current, onPick, label) {
            return h(
              'div',
              { className: 'dsh-fb-field' },
              h('span', { className: 'dsh-fb-field-label' }, label),
              h('div', { className: 'dsh-fb-seg' },
                options.map(function (option) {
                  return h('button', {
                    key: option.id,
                    type: 'button',
                    className: 'dsh-fb-seg-btn',
                    'aria-pressed': current === option.id ? 'true' : 'false',
                    onClick: function () { onPick(option.id); },
                  }, t(option.key));
                }),
              ),
            );
          }

          function toneField(current, onPick) {
            return h('div', { className: 'dsh-fb-field' },
              h('span', { className: 'dsh-fb-field-label' }, t('inspector.tone')),
              h('div', { className: 'dsh-fb-swatches' },
                TONES.map(function (tone) {
                  return h('button', {
                    key: tone.id,
                    type: 'button',
                    className: 'dsh-fb-swatch' + (tone.value ? '' : ' is-default'),
                    style: { '--fb-dot': tone.value || 'transparent' },
                    title: t(tone.key),
                    'aria-label': t(tone.key),
                    'aria-pressed': current === tone.id ? 'true' : 'false',
                    onClick: function () { onPick(tone.id); },
                  });
                }),
              ),
            );
          }

          /* A table is edited cell by cell rather than as one text block. */
          function tableEditor(node) {
            const table = node.table || normalizeTable(null);
            const rows = [];
            for (let r = 0; r < table.rows; r += 1) {
              const cells = [];
              for (let c = 0; c < table.cols; c += 1) {
                cells.push(h('input', {
                  key: 'cell-' + r + '-' + c,
                  className: 'dsh-fb-cell-input' + (r === 0 ? ' is-header' : ''),
                  value: (table.cells[r] && table.cells[r][c]) || '',
                  'aria-label': t('table.cell') + ' ' + (r + 1) + '-' + (c + 1),
                  onChange: function (event) { setTableCell(node.id, r, c, event.target.value); },
                }));
              }
              rows.push(h('div', { key: 'row-' + r, className: 'dsh-fb-cell-row' }, cells));
            }
            return [
              h('div', { key: 'table', className: 'dsh-fb-field' },
                h('span', { className: 'dsh-fb-field-label' },
                  t('table.grid').replace('{cols}', String(table.cols)).replace('{rows}', String(table.rows))),
                h('div', { className: 'dsh-fb-cell-grid' }, rows),
                h('div', { className: 'dsh-fb-seg' },
                  h('button', { key: 'r+', type: 'button', className: 'dsh-fb-seg-btn',
                    onClick: function () { resizeTable(node.id, 'row', 1); } }, t('table.addRow')),
                  h('button', { key: 'r-', type: 'button', className: 'dsh-fb-seg-btn',
                    onClick: function () { resizeTable(node.id, 'row', -1); } }, t('table.removeRow')),
                  h('button', { key: 'c+', type: 'button', className: 'dsh-fb-seg-btn',
                    onClick: function () { resizeTable(node.id, 'col', 1); } }, t('table.addCol')),
                  h('button', { key: 'c-', type: 'button', className: 'dsh-fb-seg-btn',
                    onClick: function () { resizeTable(node.id, 'col', -1); } }, t('table.removeCol')),
                ),
              ),
            ];
          }

          let inspectorBody;
          if (selectedNode) {
            inspectorBody = [
              h('div', { key: 'kind', className: 'dsh-fb-field-label' },
                t('inspector.node') + ' · ' + t('type.' + selectedNode.type)),
              selectedNode.type === 'table' ? tableEditor(selectedNode)[0] : null,
              selectedNode.type === 'table' ? null : h('div', { key: 'text', className: 'dsh-fb-field' },
                h('span', { className: 'dsh-fb-field-label' }, t('inspector.text')),
                h('textarea', {
                  className: 'dsh-fb-input',
                  value: selectedNode.text,
                  rows: 3,
                  onChange: function (event) { patchNode(selectedNode.id, { text: event.target.value }); },
                }),
              ),
              h('div', { key: 'tone' }, toneField(selectedNode.tone, function (tone) {
                patchNode(selectedNode.id, { tone: tone });
              })),
              h('button', {
                key: 'delete', type: 'button', className: 'dsh-fb-danger',
                onClick: deleteSelection,
              }, icon('trash'), h('span', null, t('inspector.delete'))),
            ];
          } else if (selectedEdge) {
            inspectorBody = [
              h('div', { key: 'kind', className: 'dsh-fb-field-label' }, t('inspector.edge')),
              h('div', { key: 'label', className: 'dsh-fb-field' },
                h('span', { className: 'dsh-fb-field-label' }, t('inspector.label')),
                h('input', {
                  className: 'dsh-fb-input',
                  value: selectedEdge.label,
                  onChange: function (event) { patchEdge(selectedEdge.id, { label: event.target.value }); },
                }),
              ),
              h('div', { key: 'router' }, segmentField(
                [{ id: 'smooth', key: 'router.smooth' }, { id: 'elbow', key: 'router.elbow' }],
                selectedEdge.router,
                function (router) { patchEdge(selectedEdge.id, { router: router }); },
                t('inspector.router'),
              )),
              h('div', { key: 'style' }, segmentField(
                [{ id: 'solid', key: 'style.solid' }, { id: 'dashed', key: 'style.dashed' }],
                selectedEdge.style,
                function (style) { patchEdge(selectedEdge.id, { style: style }); },
                t('inspector.style'),
              )),
              h('div', { key: 'arrow' }, segmentField(
                [{ id: 'end', key: 'arrow.end' }, { id: 'both', key: 'arrow.both' }, { id: 'none', key: 'arrow.none' }],
                selectedEdge.arrow,
                function (arrow) { patchEdge(selectedEdge.id, { arrow: arrow }); },
                t('inspector.arrow'),
              )),
              h('div', { key: 'tone' }, toneField(selectedEdge.tone, function (tone) {
                patchEdge(selectedEdge.id, { tone: tone });
              })),
              h('button', {
                key: 'delete', type: 'button', className: 'dsh-fb-danger',
                onClick: deleteSelection,
              }, icon('trash'), h('span', null, t('inspector.delete'))),
            ];
          } else if (multiCount > 1) {
            const alignButton = function (mode, labelKey, glyph) {
              return h('button', {
                key: 'align-' + mode,
                type: 'button',
                className: 'dsh-fb-seg-btn',
                title: t(labelKey),
                'aria-label': t(labelKey),
                onClick: function () { alignSelection(mode); },
              }, glyph ? h('span', { className: 'dsh-fb-seg-glyph' }, glyph) : t(labelKey));
            };
            inspectorBody = [
              h('div', { key: 'kind', className: 'dsh-fb-field-label' },
                t('inspector.multi').replace('{n}', String(multiCount))),
              selectedNodes.length > 1
                ? h('div', { key: 'align', className: 'dsh-fb-field' },
                    h('span', { className: 'dsh-fb-field-label' }, t('inspector.align')),
                    h('div', { className: 'dsh-fb-seg' },
                      alignButton('left', 'align.left', '\u2190'),
                      alignButton('hcenter', 'align.hcenter', '\u2194'),
                      alignButton('right', 'align.right', '\u2192'),
                      alignButton('top', 'align.top', '\u2191'),
                      alignButton('vcenter', 'align.vcenter', '\u2195'),
                      alignButton('bottom', 'align.bottom', '\u2193'),
                    ),
                  )
                : null,
              selectedNodes.length > 2
                ? h('div', { key: 'dist', className: 'dsh-fb-field' },
                    h('span', { className: 'dsh-fb-field-label' }, t('inspector.distribute')),
                    h('div', { className: 'dsh-fb-seg' },
                      h('button', {
                        key: 'dist-h', type: 'button', className: 'dsh-fb-seg-btn',
                        onClick: function () { distributeSelection('h'); },
                      }, t('distribute.h')),
                      h('button', {
                        key: 'dist-v', type: 'button', className: 'dsh-fb-seg-btn',
                        onClick: function () { distributeSelection('v'); },
                      }, t('distribute.v')),
                    ),
                  )
                : null,
              h('div', { key: 'layer', className: 'dsh-fb-field' },
                h('span', { className: 'dsh-fb-field-label' }, t('inspector.layer')),
                h('div', { className: 'dsh-fb-seg' },
                  h('button', { key: 'l-front', type: 'button', className: 'dsh-fb-seg-btn',
                    onClick: function () { moveLayer('front'); } }, t('layer.front')),
                  h('button', { key: 'l-forward', type: 'button', className: 'dsh-fb-seg-btn',
                    onClick: function () { moveLayer('forward'); } }, t('layer.forward')),
                  h('button', { key: 'l-backward', type: 'button', className: 'dsh-fb-seg-btn',
                    onClick: function () { moveLayer('backward'); } }, t('layer.backward')),
                  h('button', { key: 'l-back', type: 'button', className: 'dsh-fb-seg-btn',
                    onClick: function () { moveLayer('back'); } }, t('layer.back')),
                ),
              ),
              h('div', { key: 'tone' }, toneField(null, function (tone) {
                /* Painting a group applies the tone to every selected shape. */
                mutateBoard(function (b) {
                  const nodes = b.nodes.map(function (node) {
                    return selectedSet[node.id] ? Object.assign({}, node, { tone: tone }) : node;
                  });
                  return replaceBoard(b, { nodes: nodes });
                });
              })),
              h('button', { key: 'delete', type: 'button', className: 'dsh-fb-danger',
                onClick: deleteSelection }, icon('trash'), h('span', null, t('inspector.delete'))),
            ];
          } else {
            inspectorBody = [
              h('div', { key: 'empty', className: 'dsh-fb-inspector-empty' }, t('inspector.empty')),
            ];
          }

          const inspector = h(
            'div',
            { className: 'dsh-fb-inspector' },
            h('div', { className: 'dsh-fb-inspector-head' },
              h('span', { className: 'dsh-fb-inspector-title' }, t('inspector.title')),
            ),
            inspectorBody,
          );

          /* ---- canvas overlays ------------------------------------------------- */

          const emptyState = !board.nodes.length
            ? h('div', { className: 'dsh-fb-empty' },
                h('div', { className: 'dsh-fb-empty-title' }, t('canvas.emptyTitle')),
                h('div', { className: 'dsh-fb-empty-hint' }, t('canvas.emptyHint')),
                h('button', {
                  type: 'button',
                  className: 'dsh-fb-btn is-primary dsh-fb-empty-btn',
                  onClick: function () { setTemplatesOpen(true); },
                }, t('canvas.pickTemplate')),
              )
            : null;

          return h(
            'div',
            {
              className: 'dsh-fb-root',
              tabIndex: -1,
              onKeyDown: onKeyDown,
            },
            h('style', { key: 'styles' }, CSS),
            header,
            bar,
            h('div', { className: 'dsh-fb-body' },
              palette,
              h('div', { className: 'dsh-fb-canvas-wrap', ref: wrapRef },
                canvas,
                editor,
                emptyState,
                toast ? h('div', { className: 'dsh-fb-toast' }, toast) : null,
              ),
              inspector,
            ),
          );
        }




        /* The panel row: the label doubles as visible text, accessible name and
         * rail tooltip, and stays a thunk so it follows the active locale. */
        ctx.slots.inject('sidebar.panellist', function () {
          return ctx.slots.register(
            {
              name: 'sidebar.panellist',
              id: PANEL_ID,
              order: 50,
              label: function () { return t('panel.title'); },
            },
            PanelIcon,
          );
        });

        /* The same id addresses this central panel; a missing entry would throw
         * when the sidebar cell is selected. */
        ctx.slots.inject('main', function () {
          return ctx.slots.register({ name: 'main', key: PANEL_ID }, FlowBoardPanel);
        });
      },
    };
  },
});
