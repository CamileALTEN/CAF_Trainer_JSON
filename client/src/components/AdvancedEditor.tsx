             /* ------------------------------------------------------------------ */
             /*  AdvancedEditor.tsx – version stabilisée                           */
             /* ------------------------------------------------------------------ */
import React, {
  useRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import clsx from 'clsx';
import './AdvancedEditor.css';
      
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
  storageKey?: string;
}

const AdvancedEditor: React.FC<AdvancedEditorProps> = ({ value, onChange, storageKey = 'editorContent' }) => {
               /* 1. Ref Quill ----------------------------------------------------- */
                const quillRef = useRef<any>(null);
                   const [html, setHtml] = useState(value);
                   useEffect(() => setHtml(value), [value]);

                // charge depuis le stockage local
                useEffect(() => {
                  if (storageKey) {
                    const saved = localStorage.getItem(storageKey);
                    if (saved) {
                      setHtml(saved);
                      onChange(saved);
                    }
                  }
                }, [storageKey]);

                // sauvegarde dans le stockage local
                useEffect(() => {
                  if (storageKey) {
                    localStorage.setItem(storageKey, html);
                  }
                }, [html, storageKey]);

                const [dark, setDark] = useState(() => localStorage.getItem('editor_dark') === '1');
                useEffect(() => {
                  localStorage.setItem('editor_dark', dark ? '1' : '0');
                }, [dark]);

                const [full, setFull] = useState(false);
      
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
                   reader.onload = () => {
                     const editor = quillRef.current?.getEditor();
                     const range  = editor?.getSelection(true);
                     editor?.insertEmbed(range?.index ?? 0, 'image', reader.result);
                   };
                   reader.readAsDataURL(file);
                 };
               }, []);                           // dépendances : aucune → stable
      
               /* 4. Modules / formats MEMO‑ISÉS ---------------------------------- */
               const modules = useMemo(
                 () => ({
                   syntax: { highlight: (txt: string) => hljs.highlightAuto(txt).value },
                   toolbar: {
                     container: [
                       [{ header: [1, 2, 3, false] }],
                       ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
                       [{ list: 'ordered' }, { list: 'bullet' }],
                       ['link', 'image'],
                       ['clean']
                     ],
                     handlers: { image: handleImage }
                   }
                 }),
                 [handleImage]                   // ne change plus car handleImage est figé
               );
      
               const formats = useMemo(
                 () => [
                   'header', 'bold', 'italic', 'underline', 'strike',
                   'blockquote', 'code-block',
                   'list', 'bullet',
                   'link', 'image'
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
                 <div className={clsx('advanced-editor', { dark, fullscreen: full })}>
                   <div className="editor-toolbar">
                     <button onClick={() => setDark(d => !d)} title="Mode sombre">🌙</button>
                     <button onClick={() => setFull(f => !f)} title="Plein écran">⛶</button>
                     <button
                       onClick={() => {
                         setHtml('');
                         onChange('');
                         if (storageKey) localStorage.removeItem(storageKey);
                       }}
                       title="Effacer"
                     >🗑️</button>
                   </div>
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