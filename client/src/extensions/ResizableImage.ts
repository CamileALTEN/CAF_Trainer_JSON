import Image from '@tiptap/extension-image';

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: element => element.getAttribute('data-width'),
        renderHTML: attrs =>
          attrs.width ? { 'data-width': attrs.width } : {},
      },
      height: {
        default: null,
        parseHTML: element => element.getAttribute('data-height'),
        renderHTML: attrs =>
          attrs.height ? { 'data-height': attrs.height } : {},
      },
    };
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const container = document.createElement('span');
      container.className = 'image-wrapper';
      container.draggable = true;
      container.contentEditable = 'false';

      const img = document.createElement('img');
      img.src = node.attrs.src;
      if (node.attrs.alt) img.alt = node.attrs.alt;
      if (node.attrs.title) img.title = node.attrs.title;
      if (node.attrs.width) img.style.width = node.attrs.width;
      if (node.attrs.height) img.style.height = node.attrs.height;

      container.appendChild(img);

      const positions = ['nw','n','ne','e','se','s','sw','w'] as const;
      const handles: {el: HTMLSpanElement; pos: typeof positions[number]}[] = [];
      positions.forEach(pos => {
        const h = document.createElement('span');
        h.className = `image-resize-handle handle-${pos}`;
        container.appendChild(h);
        handles.push({ el: h, pos });
      });

      let startX = 0;
      let startY = 0;
      let startWidth = 0;
      let startHeight = 0;
      let current: typeof positions[number] | null = null;

      const onMouseDown = (pos: typeof positions[number]) => (event: MouseEvent) => {
        event.preventDefault();
        current = pos;
        startX = event.clientX;
        startY = event.clientY;
        startWidth = img.offsetWidth;
        startHeight = img.offsetHeight;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      };

      const onMouseMove = (event: MouseEvent) => {
        if (!current) return;
        let width = startWidth;
        let height = startHeight;
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;
        if (current.includes('e')) width = Math.max(50, startWidth + dx);
        if (current.includes('w')) width = Math.max(50, startWidth - dx);
        if (current.includes('s')) height = Math.max(50, startHeight + dy);
        if (current.includes('n')) height = Math.max(50, startHeight - dy);
        img.style.width = `${width}px`;
        img.style.height = `${height}px`;
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        const pos = getPos();
        if (typeof pos === 'number') {
          const { tr } = editor.state;
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            width: img.style.width,
            height: img.style.height,
          });
          editor.view.dispatch(tr);
        }
        current = null;
      };

      const handlers = handles.map(h => {
        const fn = onMouseDown(h.pos);
        h.el.addEventListener('mousedown', fn);
        return { el: h.el, fn };
      });

      return {
        dom: container,
        contentDOM: null,
        update: updatedNode => {
          if (updatedNode.type !== node.type) return false;
          if (updatedNode.attrs.src !== node.attrs.src) img.src = updatedNode.attrs.src;
          if (updatedNode.attrs.width) img.style.width = updatedNode.attrs.width;
          else img.style.removeProperty('width');
          if (updatedNode.attrs.height) img.style.height = updatedNode.attrs.height;
          else img.style.removeProperty('height');
          return true;
        },
        destroy: () => {
          handlers.forEach(h => h.el.removeEventListener('mousedown', h.fn));
        },
      };
    };
  },
});

export default ResizableImage;
