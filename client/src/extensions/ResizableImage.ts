import Image from '@tiptap/extension-image';

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: element => element.getAttribute('data-width'),
        renderHTML: attributes =>
          attributes.width ? { 'data-width': attributes.width, style: `width:${attributes.width}` } : {},
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

      const handle = document.createElement('span');
      handle.className = 'image-resize-handle';

      container.appendChild(img);
      container.appendChild(handle);

      let startX = 0;
      let startWidth = 0;

      const onMouseDown = (event: MouseEvent) => {
        event.preventDefault();
        startX = event.clientX;
        startWidth = img.offsetWidth;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        container.classList.add('resizing');
      };

      const onMouseMove = (event: MouseEvent) => {
        const width = Math.max(50, startWidth + event.clientX - startX);
        img.style.width = `${width}px`;
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        container.classList.remove('resizing');
        const pos = getPos();
        if (typeof pos === 'number') {
          const { tr } = editor.state;
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            width: img.style.width,
          });
          editor.view.dispatch(tr);
        }
      };

      handle.addEventListener('mousedown', onMouseDown);

      return {
        dom: container,
        contentDOM: null,
        update: updatedNode => {
          if (updatedNode.type !== node.type) return false;
          if (updatedNode.attrs.src !== node.attrs.src) img.src = updatedNode.attrs.src;
          if (updatedNode.attrs.width) img.style.width = updatedNode.attrs.width;
          else img.style.removeProperty('width');
          return true;
        },
        destroy: () => {
          handle.removeEventListener('mousedown', onMouseDown);
        },
      };
    };
  },
});

export default ResizableImage;
