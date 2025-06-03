/* ------------------------------------------------------------------ */
/*  AdvancedEditor.tsx – police Arial, gras désactivé, couleur texte  */
/* ------------------------------------------------------------------ */
import React, { useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit               from '@tiptap/starter-kit';
import Underline                from '@tiptap/extension-underline';
import Link                     from '@tiptap/extension-link';
import Image                    from '@tiptap/extension-image';
import Table                    from '@tiptap/extension-table';
import TableRow                 from '@tiptap/extension-table-row';
import TableCell                from '@tiptap/extension-table-cell';
import TableHeader              from '@tiptap/extension-table-header';
import TextAlign                from '@tiptap/extension-text-align';
import Highlight                from '@tiptap/extension-highlight';
import Placeholder              from '@tiptap/extension-placeholder';
import CharacterCount           from '@tiptap/extension-character-count';
import TaskList                 from '@tiptap/extension-task-list';
import TaskItem                 from '@tiptap/extension-task-item';
import TextStyle                from '@tiptap/extension-text-style';
import Color                    from '@tiptap/extension-color';

import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Highlighter, Code,
  Pilcrow, Heading1, Heading2, Heading3, Quote, Braces, Minus,
  List, ListOrdered, CheckSquare,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link as LinkIcon, Link2Off,
  Image as ImageIcon, Table2,
  Undo2, Redo2, Eraser, PaintBucket
} from 'lucide-react';

import './AdvancedEditor.css';

const CHAR_LIMIT = 10000;

/* ------------------------------------------------------------------ */
export interface AdvancedEditorProps {
  value: string;
  onChange: (html: string) => void;
}

/* ------------------------------------------------------------------ */
const AdvancedEditor: React.FC<AdvancedEditorProps> = ({ value, onChange }) => {

  const editor = useEditor({
    content: value,
    editorProps: { attributes: { class: 'editor-core' } },
    extensions: [
      StarterKit,
      Underline,
      Link,
      Image,
      /* --- TABLE (ordre impératif) -------------------------------- */
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      /* ------------------------------------------------------------ */
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight,
      Placeholder.configure({ placeholder: 'Écrivez ici…' }),
      CharacterCount.configure({ limit: CHAR_LIMIT }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TextStyle,          // nécessaire pour Color
      Color,
    ],
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (!editor) return;
    const cur = editor.getHTML();
    if (cur !== value) editor.commands.setContent(value, false);
  }, [value, editor]);

  /* ---------- Références & commandes utilitaires ---------------- */
  const colorRef = useRef<HTMLInputElement>(null);

  const promptTable = () => {
    const rows = parseInt(prompt('Nombre de lignes ?', '3') || '', 10);
    const cols = parseInt(prompt('Nombre de colonnes ?', '3') || '', 10);
    if (rows > 0 && cols > 0) {
      editor?.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
      editor?.commands.enter();
    }
  };

  const addLink = () => {
    const url = prompt('URL du lien');
    if (url) editor?.chain().focus().setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = prompt('URL de l’image');
    if (url) editor?.chain().focus().setImage({ src: url }).run();
  };

  /** Efface marks + nœuds (gomme) */
  const clearFormatting = () => {
    if (!editor) return;
    editor.chain().focus().unsetAllMarks().run();
    editor.chain().focus().clearNodes().run();
  };

  /** Change la couleur du texte sélectionné */
  const changeColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editor) return;
    const col = e.target.value;
    col === '#000000'
      ? editor.chain().focus().unsetColor().run()
      : editor.chain().focus().setColor(col).run();
    e.target.blur();
  };

  const currentColor = editor?.getAttributes('textStyle').color?.toString() || '#000000';
  const chars        = editor ? editor.storage.characterCount.characters() : 0;

  /* ----------------------------- UI ----------------------------- */
  return (
    <div className="word-editor">
      <div className="toolbar">

        {/* Bloc Couleur ------------------------------------------------ */}
        <div className="group">
          <button
            title="Couleur du texte"
            onMouseDown={(e) => {
              e.preventDefault();
              colorRef.current?.click();
            }}
          >
            {/* stroke = couleur actuelle */}
            <PaintBucket size={16} style={{ color: currentColor }} />
          </button>
          {/* input caché : palette visible uniquement via le bouton */}
          <input
            ref={colorRef}
            type="color"
            value={currentColor}
            onChange={changeColor}
            style={{ display: 'none' }}
          />
        </div>

        {/* Bloc 1 – Texte --------------------------------------------- */}
        <div className="group">
          <button className={editor?.isFocused && editor.isActive('bold') ? 'active' : ''}      onClick={() => editor?.chain().focus().toggleBold().run()}><Bold size={16}/></button>
          <button className={editor?.isFocused && editor.isActive('italic') ? 'active' : ''}    onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic size={16}/></button>
          <button className={editor?.isFocused && editor.isActive('underline') ? 'active' : ''} onClick={() => editor?.chain().focus().toggleUnderline().run()}><UnderlineIcon size={16}/></button>
          <button className={editor?.isFocused && editor.isActive('strike') ? 'active' : ''}    onClick={() => editor?.chain().focus().toggleStrike().run()}><Strikethrough size={16}/></button>
          <button className={editor?.isFocused && editor.isActive('highlight') ? 'active' : ''} onClick={() => editor?.chain().focus().toggleHighlight().run()}><Highlighter size={16}/></button>
          <button className={editor?.isFocused && editor.isActive('code') ? 'active' : ''}      onClick={() => editor?.chain().focus().toggleCode().run()}><Code size={16}/></button>
        </div>

        {/* Bloc 2 – Structure ----------------------------------------- */}
        <div className="group">
          <button onClick={() => editor?.chain().focus().setParagraph().run()}><Pilcrow size={16}/></button>
          <button className={editor?.isFocused && editor.isActive('heading',{level:1}) ? 'active' : ''} onClick={() => editor?.chain().focus().toggleHeading({level:1}).run()}><Heading1 size={16}/></button>
          <button className={editor?.isFocused && editor.isActive('heading',{level:2}) ? 'active' : ''} onClick={() => editor?.chain().focus().toggleHeading({level:2}).run()}><Heading2 size={16}/></button>
          <button className={editor?.isFocused && editor.isActive('heading',{level:3}) ? 'active' : ''} onClick={() => editor?.chain().focus().toggleHeading({level:3}).run()}><Heading3 size={16}/></button>
          <button className={editor?.isFocused && editor.isActive('blockquote') ? 'active' : ''} onClick={() => editor?.chain().focus().toggleBlockquote().run()}><Quote size={16}/></button>
          <button className={editor?.isFocused && editor.isActive('codeBlock') ? 'active' : ''}  onClick={() => editor?.chain().focus().toggleCodeBlock().run()}><Braces size={16}/></button>
          <button onClick={() => editor?.chain().focus().setHorizontalRule().run()}><Minus size={16}/></button>
        </div>

        {/* Bloc 3 – Listes ------------------------------------------- */}
        <div className="group">
          <button className={editor?.isFocused && editor.isActive('bulletList') ? 'active' : ''}  onClick={() => editor?.chain().focus().toggleBulletList().run()}><List size={16}/></button>
          <button className={editor?.isFocused && editor.isActive('orderedList') ? 'active' : ''} onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered size={16}/></button>
          <button className={editor?.isFocused && editor.isActive('taskList') ? 'active' : ''}    onClick={() => editor?.chain().focus().toggleTaskList().run()}><CheckSquare size={16}/></button>
        </div>

        {/* Bloc 4 – Alignement --------------------------------------- */}
        <div className="group">
          <button className={editor?.isFocused && editor.isActive({textAlign:'left'}) ? 'active' : ''}    onClick={() => editor?.chain().focus().setTextAlign('left').run()}><AlignLeft size={16}/></button>
          <button className={editor?.isFocused && editor.isActive({textAlign:'center'}) ? 'active' : ''}  onClick={() => editor?.chain().focus().setTextAlign('center').run()}><AlignCenter size={16}/></button>
          <button className={editor?.isFocused && editor.isActive({textAlign:'right'}) ? 'active' : ''}   onClick={() => editor?.chain().focus().setTextAlign('right').run()}><AlignRight size={16}/></button>
          <button className={editor?.isFocused && editor.isActive({textAlign:'justify'}) ? 'active' : ''} onClick={() => editor?.chain().focus().setTextAlign('justify').run()}><AlignJustify size={16}/></button>
        </div>

        {/* Bloc 5 – Liens ------------------------------------------- */}
        <div className="group">
          <button onClick={addLink}><LinkIcon size={16}/></button>
          <button onClick={() => editor?.chain().focus().unsetLink().run()}><Link2Off size={16}/></button>
        </div>

        {/* Bloc 6 – Insertion --------------------------------------- */}
        <div className="group">
          <button onClick={addImage}><ImageIcon size={16}/></button>
          <button onClick={promptTable}><Table2 size={16}/></button>
        </div>

        {/* Bloc 7 – Outils ------------------------------------------ */}
        <div className="group">
          <button onClick={() => editor?.chain().focus().undo().run()}><Undo2 size={16}/></button>
          <button onClick={() => editor?.chain().focus().redo().run()}><Redo2 size={16}/></button>
          <button onClick={clearFormatting}><Eraser size={16}/></button>
          <span className="counter">{chars}/{CHAR_LIMIT}</span>
        </div>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
};

export default AdvancedEditor;
