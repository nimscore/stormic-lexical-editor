import { EditorState, EditorThemeClasses } from 'lexical';
import React from 'react';
interface EditorProps {
    onChange?: (editorState: EditorState) => void;
    initialState?: string;
    theme?: EditorThemeClasses;
}
export declare const Editor: React.FC<EditorProps>;
export default Editor;
