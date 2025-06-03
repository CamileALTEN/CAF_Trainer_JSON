import React from 'react';
import { BubbleMenu, Editor } from '@tiptap/react';
import {
  PlusCircle, PlusSquare, MinusCircle, MinusSquare,
  ArrowLeftRight, LayoutTemplate, Trash2
} from 'lucide-react';

interface Props { editor: Editor }

const TableBubble: React.FC<Props> = ({ editor }) =>
  <BubbleMenu editor={editor} tippyOptions={{ duration: 150 }} className="table-bubble shadow bg-white border rounded p-1 flex gap-1">
    <button title="Ligne +"
      onClick={() => editor.chain().focus().addRowAfter().run()}><PlusSquare size={16}/></button>
    <button title="Ligne –"
      onClick={() => editor.chain().focus().deleteRow().run()}><MinusSquare size={16}/></button>
    <button title="Colonne +"
      onClick={() => editor.chain().focus().addColumnAfter().run()}><PlusCircle size={16}/></button>
    <button title="Colonne –"
      onClick={() => editor.chain().focus().deleteColumn().run()}><MinusCircle size={16}/></button>
    <button title="Entête on/off"
      onClick={() => editor.chain().focus().toggleHeaderRow().run()}><LayoutTemplate size={16}/></button>
    <button title="Fusionner / scinder"
      onClick={() => editor.can().mergeCells()
        ? editor.chain().focus().mergeCells().run()
        : editor.chain().focus().splitCell().run()}><ArrowLeftRight size={16}/></button>
    <button title="Supprimer tableau"
      onClick={() => editor.chain().focus().deleteTable().run()}><Trash2 size={16}/></button>
  </BubbleMenu>;

export default TableBubble;

