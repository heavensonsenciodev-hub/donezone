"use client";

import { Editor } from "@tinymce/tinymce-react";
import { useRef } from "react";

export default function EditorClient({ value, onChange}: any) {
  const editorRef = useRef<any>(null);

  return (
    <div className="mb-8 sm:max-w-[425px] md:max-w-[600px] lg:max-w-[850px]">
      <Editor
        apiKey="s4aj93cure64mj5h58ltm286m1rhiydjxo51kd10233zcotw"
        init={{
          height: 300,
          plugins: "lists",
          toolbar: "undo redo | bold italic | bullist numlist",
          skin: "oxide-dark",
          content_css: "dark",
        }}
        onInit={(evt, editor) => (editorRef.current = editor)}
        onEditorChange={(content) => {
          // content is HTML (bold, italic, bullets preserved)
          onChange(content);
        }}
      />
    </div>
  );
}
