import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { CharacterLimitPlugin } from '@lexical/react/LexicalCharacterLimitPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin';
import { ClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { SelectionAlwaysOnDisplay } from '@lexical/react/LexicalSelectionAlwaysOnDisplay';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import React, { useCallback, useState } from 'react';
import ContentEditable from './ui/ContentEditable';
// Плагин для обработки изменений в редакторе
const OnChangeHandler = ({ onChange }) => {
    const [editor] = useLexicalComposerContext();
    const handleChange = useCallback(() => {
        if (onChange) {
            editor.update(() => {
                const editorState = editor.getEditorState();
                onChange(editorState);
            });
        }
    }, [editor, onChange]);
    return React.createElement(OnChangePlugin, { onChange: handleChange });
};
export const Editor = ({ onChange, initialState, theme, }) => {
    const isEditable = useLexicalEditable();
    const [floatingAnchorElem, setFloatingAnchorElem] = useState(null);
    const onRef = (elem) => {
        if (elem !== null) {
            setFloatingAnchorElem(elem);
        }
    };
    // Начальная конфигурация редактора
    const editorConfig = {
        namespace: 'StormicEditor',
        theme: theme || {}, // Можно передавать кастомную тему
        onError(error) {
            console.error(error);
        },
        editorState: initialState || undefined, // Начальное состояние
    };
    return (React.createElement(LexicalComposer, { initialConfig: editorConfig },
        React.createElement(AutoFocusPlugin, null),
        React.createElement(ClearEditorPlugin, null),
        React.createElement(HistoryPlugin, null),
        React.createElement(RichTextPlugin, { contentEditable: React.createElement("div", { className: 'editor-scroller' },
                React.createElement("div", { className: 'editor', ref: onRef },
                    React.createElement(ContentEditable, { placeholder: '\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0442\u0435\u043A\u0441\u0442...' }))), ErrorBoundary: LexicalErrorBoundary }),
        React.createElement(HorizontalRulePlugin, null),
        React.createElement(ListPlugin, null),
        React.createElement(CheckListPlugin, null),
        React.createElement(TabIndentationPlugin, null),
        React.createElement(CharacterLimitPlugin, { maxLength: 1000, charset: 'UTF-16' }),
        React.createElement(ClickableLinkPlugin, { disabled: !isEditable }),
        React.createElement(SelectionAlwaysOnDisplay, null),
        React.createElement(TablePlugin, null),
        React.createElement(OnChangeHandler, { onChange: onChange })));
};
export default Editor;
