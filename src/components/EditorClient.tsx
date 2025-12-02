"use client";

import { Editor } from "@tinymce/tinymce-react";
import { useRef } from "react";

interface EditorClientProps {
  value?: string;
  onChange?: (content: string) => void;
}

export default function EditorClient({ value = "", onChange }: EditorClientProps) {
  const editorRef = useRef<Editor | null>(null);

  return (
    <div className="mb-8 sm:max-w-[425px] md:max-w-[600px] lg:max-w-[850px]">
      <Editor
        apiKey="s4aj93cure64mj5h58ltm286m1rhiydjxo51kd10233zcotw"
        value={value}
        init={{
          height: 300,
          plugins: "lists",
          toolbar: "undo redo | bold italic | bullist numlist",
          skin: "oxide-dark",
          content_css: "dark",
        }}
        onInit={(evt, editor) => {
          editorRef.current = editor;
        }}
        onEditorChange={(content) => {
          if (onChange) onChange(content);
        }}
      />
    </div>
  );
}
