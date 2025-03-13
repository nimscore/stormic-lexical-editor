import { LexicalEditor } from 'lexical';
import * as React from 'react';
interface Props {
    editor: LexicalEditor;
    getCodeDOMNode: () => HTMLElement | null;
}
export declare function CopyButton({ editor, getCodeDOMNode }: Props): React.JSX.Element;
export {};
