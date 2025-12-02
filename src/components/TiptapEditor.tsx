'use client'; // Important for Next.js 13 App Router

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { useState } from 'react';

export default function TiptapEditor() {
  const [content, setContent] = useState('');

const editor = useEditor({
  extensions: [
    StarterKit,
    Underline,
    Link.configure({ openOnClick: true }),
  ],
  content: '<p>Hello Tiptap!</p>',
  onUpdate({ editor }) {
    setContent(editor.getHTML());
  },
  editorProps: {},
  // This avoids SSR hydration mismatch
  autofocus: false,
  editable: true,
  injectCSS: true,
  // <<< add this
  immediatelyRender: false,
});


  return (
    <div>
      <h2>Editor</h2>
      <EditorContent editor={editor} className="border p-2 rounded" />
      <h3 className="mt-4">Output HTML</h3>
      <div className="border p-2 rounded bg-gray-50" dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}
