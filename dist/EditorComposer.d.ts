import React from 'react';
export interface LexicalComposerInitialConfig {
    namespace: string;
    theme: Record<string, unknown>;
    onError: (error: Error) => void;
}
export interface EditorComposerProps {
    children: React.ReactNode;
    initialConfig?: Partial<LexicalComposerInitialConfig>;
}
export declare const EditorComposer: React.FC<EditorComposerProps>;
export default EditorComposer;
