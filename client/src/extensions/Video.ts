import { Node, mergeAttributes } from '@tiptap/core';

const Video = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: { default: null },
      controls: { default: true },
      width: { default: null },
      height: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'video',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes({ controls: true }, HTMLAttributes)];
  },

  addNodeView() {
    return ({ node }) => {
      const video = document.createElement('video');
      video.src = node.attrs.src;
      video.preload = 'metadata';
      video.style.maxWidth = '100%';
      video.style.height = 'auto';
      video.style.display = 'block';
      video.style.margin = '0 auto';
      return { dom: video };
    };
  },
});

export default Video;
