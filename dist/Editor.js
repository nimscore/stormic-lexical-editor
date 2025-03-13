import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { CharacterLimitPlugin } from '@lexical/react/LexicalCharacterLimitPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin';
import { ClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { SelectionAlwaysOnDisplay } from '@lexical/react/LexicalSelectionAlwaysOnDisplay';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import React, { useState } from 'react';
import ContentEditable from './ui/ContentEditable';
export const Editor = () => {
    // Определяем, можно ли редактировать
    const isEditable = useLexicalEditable();
    // Состояние для хранения ссылки на DOM-элемент (для позиционирования всплывающих панелей, если нужно)
    const [floatingAnchorElem, setFloatingAnchorElem] = useState(null);
    // Получаем ссылку на контейнер редактора
    const onRef = (elem) => {
        if (elem !== null) {
            setFloatingAnchorElem(elem);
        }
    };
    // Строка-заполнитель
    const placeholder = 'Введите текст...';
    return (React.createElement(React.Fragment, null,
        React.createElement(AutoFocusPlugin, null),
        React.createElement(ClearEditorPlugin, null),
        React.createElement(HistoryPlugin, null),
        React.createElement(RichTextPlugin, { contentEditable: React.createElement("div", { className: 'editor-scroller' },
                React.createElement("div", { className: 'editor', ref: onRef },
                    React.createElement(ContentEditable, { placeholder: placeholder }))), ErrorBoundary: LexicalErrorBoundary }),
        React.createElement(HorizontalRulePlugin, null),
        React.createElement(ListPlugin, null),
        React.createElement(CheckListPlugin, null),
        React.createElement(TabIndentationPlugin, null),
        React.createElement(CharacterLimitPlugin, { maxLength: 1000, charset: 'UTF-16' }),
        React.createElement(ClickableLinkPlugin, { disabled: !isEditable }),
        React.createElement(SelectionAlwaysOnDisplay, null),
        React.createElement(TablePlugin, null)));
};
export default Editor;
