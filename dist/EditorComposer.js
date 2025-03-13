import { LexicalComposer } from '@lexical/react/LexicalComposer';
import React from 'react';
export const EditorComposer = ({ children, initialConfig, }) => {
    const defaultConfig = {
        namespace: 'StormicLexicalEditor',
        theme: {
        // Добавьте свои стили или оставьте пустым объектом
        },
        onError(error) {
            console.error('Lexical Error:', error);
        },
        ...initialConfig,
    };
    return (React.createElement(LexicalComposer, { initialConfig: defaultConfig }, children));
};
export default EditorComposer;
