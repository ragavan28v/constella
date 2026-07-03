import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

interface BlockEditorProps {
  content: any;
  onChange: (content: any) => void;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({ content, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: 'Start writing ideas, logs, tasks, code...',
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
  });

  // Load content dynamically when artifact changes
  useEffect(() => {
    if (editor && content) {
      const currentJSON = JSON.stringify(editor.getJSON());
      const incomingJSON = JSON.stringify(content);
      if (currentJSON !== incomingJSON) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="py-12 text-center text-xs text-text-tertiary animate-pulse">
        Loading editor engine...
      </div>
    );
  }

  return (
    <div className="prose prose-sm max-w-none focus:outline-none min-h-[300px]">
      <EditorContent editor={editor} className="outline-none" />
    </div>
  );
};
export default BlockEditor;
