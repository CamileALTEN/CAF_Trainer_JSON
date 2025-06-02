             /* ------------------------------------------------------------------ */
             /*  AdvancedEditor.tsx – version stabilisée                           */
             /* ------------------------------------------------------------------ */
import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import ReactQuill from 'react-quill';
import axios from 'axios';
             import 'react-quill/dist/quill.snow\.css';
      
             import hljs from 'highlight.js';
             import 'highlight.js/styles/github.css';
      
             /* HLJS ---------------------------------------------------------------- */
             hljs.configure({
               languages: [
                 'javascript', 'typescript', 'python', 'go',
                 'java', 'c', 'cpp', 'json', 'bash', 'markdown'
               ]
             });
      
             /* -------------------------------------------------------------------- */
             export interface AdvancedEditorProps {
               value: string;
               onChange: (html: string) => void;
             }
      
             const AdvancedEditor: React.FC<AdvancedEditorProps> = ({ value, onChange }) => {
               /* 1. Ref Quill ----------------------------------------------------- */
               const quillRef = useRef<any>(null);
                  const [html, setHtml] = useState(value);
                  useEffect(() => setHtml(value), [value]);
      
               /* 2. Compteur de mots --------------------------------------------- */
               const [words, setWords] = useState(0);
      
               /* 3. Handler image, MEMO‑ISÉ (sinon ↻ à chaque render) ------------ */
  const handleImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.click();

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const { data } = await axios.post('/api/images', { data: reader.result });
          const editor = quillRef.current?.getEditor();
          const range  = editor?.getSelection(true);
          editor?.insertEmbed(range?.index ?? 0, 'image', data.url);
        } catch (e) {
          alert('Envoi image impossible');
        }
      };
      reader.readAsDataURL(file);
    };
  }, []);                           // dépendances : aucune → stable

  const handleTable = useCallback(() => {
    const rows = parseInt(prompt('Nombre de lignes ?', '2') || '2', 10);
    const cols = parseInt(prompt('Nombre de colonnes ?', '2') || '2', 10);
    if (!rows || !cols) return;
    const editor = quillRef.current?.getEditor();
    const range = editor?.getSelection(true);
    const table = Array.from({ length: rows }, () =>
      `<tr>${'<td></td>'.repeat(cols)}</tr>`
    ).join('');
    editor?.clipboard.dangerouslyPasteHTML(
      range?.index ?? 0,
      `<table style="width:100%; border-collapse:collapse" border="1">${table}</table>`
    );
  }, []);

  useEffect(() => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    const dbl = (e: MouseEvent) => {
      const img = (e.target as HTMLElement).closest('img');
      if (img) {
        e.preventDefault();
        const cur = img.getAttribute('width') || img.style.width.replace('px', '') || '300';
        const width = prompt("Largeur de l'image en pixels?", cur);
        if (width) {
          img.setAttribute('width', width);
        }
      }
    };
    editor.root.addEventListener('dblclick', dbl);
    return () => {
      editor.root.removeEventListener('dblclick', dbl);
    };
  }, []);
      
               /* 4. Modules / formats MEMO‑ISÉS ---------------------------------- */
               const modules = useMemo(
                 () => ({
                   syntax: { highlight: (txt: string) => hljs.highlightAuto(txt).value },
                   toolbar: {
                     container: [
                       [{ header: [1, 2, 3, false] }],
                       ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
                       [{ color: [] }, { background: [] }],
                       [{ list: 'ordered' }, { list: 'bullet' }],
                       [{ align: [] }],
                       ['link', 'image', 'table'],
                       ['clean']
                     ],
                     handlers: { image: handleImage, table: handleTable }
                   }
                 }),
                 [handleImage]                   // ne change plus car handleImage est figé
               );
      
               const formats = useMemo(
                 () => [
                   'header', 'bold', 'italic', 'underline', 'strike',
                   'blockquote', 'code-block',
                   'list', 'bullet',
                   'link', 'image', 'table',
                   'color', 'background', 'align'
                 ],
                 []
               );
      
               /* 5. onChange – MEMO‑ISÉ aussi (optionnel) ------------------------ */
               const onEditorChange = useCallback(
                 (html: string, _delta: any, _src: any, editor: any) => {
                   onChange(html);
                   setHtml(html);
                   const txt = editor.getText().trim();
                   setWords(txt ? txt.split(/\s+/).length : 0);
                 },
                 [onChange]
               );
      
               /* 6. Rendu --------------------------------------------------------- */
               return (
                 <div className="advanced-editor">
                   <ReactQuill
                     ref={quillRef}
                     theme="snow"
                     value={html}
                     onChange={onEditorChange}
                     modules={modules}
                     formats={formats}
                     placeholder="Commencez à écrire…"
                   />
      
                   <div style={{ textAlign: 'right', fontSize: 12, marginTop: 4, color: '#666' }}>
                     {words} mot{words > 1 ? 's' : ''}
                   </div>
                 </div>
               );
             };
      
             export default AdvancedEditor;