/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { $createCodeNode } from '@lexical/code';
import { INSERT_CHECK_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, } from '@lexical/list';
import { INSERT_EMBED_COMMAND } from '@lexical/react/LexicalAutoEmbedPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { LexicalTypeaheadMenuPlugin, MenuOption, useBasicTypeaheadTriggerMatch, } from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { INSERT_TABLE_COMMAND } from '@lexical/table';
import { $createParagraphNode, $getSelection, $isRangeSelection, FORMAT_ELEMENT_COMMAND, } from 'lexical';
import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import * as ReactDOM from 'react-dom';
import useModal from '../../hooks/useModal';
// import catTypingGif from '../../images/cat-typing.gif'
import { EmbedConfigs } from '../AutoEmbedPlugin';
import { INSERT_IMAGE_COMMAND, InsertImageDialog } from '../ImagesPlugin';
import InsertLayoutDialog from '../LayoutPlugin/InsertLayoutDialog';
import { InsertPollDialog } from '../PollPlugin';
class ComponentPickerOption extends MenuOption {
    // What shows up in the editor
    title;
    // Icon for display
    icon;
    // For extra searching.
    keywords;
    // TBD
    keyboardShortcut;
    // What happens when you select this option?
    onSelect;
    constructor(title, options) {
        super(title);
        this.title = title;
        this.keywords = options.keywords || [];
        this.icon = options.icon;
        this.keyboardShortcut = options.keyboardShortcut;
        this.onSelect = options.onSelect.bind(this);
    }
}
function ComponentPickerMenuItem({ index, isSelected, onClick, onMouseEnter, option, }) {
    let className = 'item';
    if (isSelected) {
        className += ' selected';
    }
    return (React.createElement("li", { key: option.key, tabIndex: -1, className: className, ref: option.setRefElement, role: 'option', "aria-selected": isSelected, id: 'typeahead-item-' + index, onMouseEnter: onMouseEnter, onClick: onClick },
        option.icon,
        React.createElement("span", { className: 'text' }, option.title)));
}
function getDynamicOptions(editor, queryString) {
    const options = [];
    if (queryString == null) {
        return options;
    }
    const tableMatch = queryString.match(/^([1-9]\d?)(?:x([1-9]\d?)?)?$/);
    if (tableMatch !== null) {
        const rows = tableMatch[1];
        const colOptions = tableMatch[2]
            ? [tableMatch[2]]
            : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(String);
        options.push(...colOptions.map(columns => new ComponentPickerOption(`${rows}x${columns} Table`, {
            icon: React.createElement("i", { className: 'icon table' }),
            keywords: ['table'],
            onSelect: () => editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns, rows }),
        })));
    }
    return options;
}
function getBaseOptions(editor, showModal) {
    return [
        new ComponentPickerOption('Paragraph', {
            icon: React.createElement("i", { className: 'icon paragraph' }),
            keywords: ['normal', 'paragraph', 'p', 'text'],
            onSelect: () => editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    $setBlocksType(selection, () => $createParagraphNode());
                }
            }),
        }),
        ...[1, 2, 3].map(n => new ComponentPickerOption(`Heading ${n}`, {
            icon: React.createElement("i", { className: `icon h${n}` }),
            keywords: ['heading', 'header', `h${n}`],
            onSelect: () => editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    $setBlocksType(selection, () => $createHeadingNode(`h${n}`));
                }
            }),
        })),
        new ComponentPickerOption('Numbered List', {
            icon: React.createElement("i", { className: 'icon number' }),
            keywords: ['numbered list', 'ordered list', 'ol'],
            onSelect: () => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
        }),
        new ComponentPickerOption('Bulleted List', {
            icon: React.createElement("i", { className: 'icon bullet' }),
            keywords: ['bulleted list', 'unordered list', 'ul'],
            onSelect: () => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
        }),
        new ComponentPickerOption('Check List', {
            icon: React.createElement("i", { className: 'icon check' }),
            keywords: ['check list', 'todo list'],
            onSelect: () => editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined),
        }),
        new ComponentPickerOption('Quote', {
            icon: React.createElement("i", { className: 'icon quote' }),
            keywords: ['block quote'],
            onSelect: () => editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    $setBlocksType(selection, () => $createQuoteNode());
                }
            }),
        }),
        new ComponentPickerOption('Code', {
            icon: React.createElement("i", { className: 'icon code' }),
            keywords: ['javascript', 'python', 'js', 'codeblock'],
            onSelect: () => editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    if (selection.isCollapsed()) {
                        $setBlocksType(selection, () => $createCodeNode());
                    }
                    else {
                        // Will this ever happen?
                        const textContent = selection.getTextContent();
                        const codeNode = $createCodeNode();
                        selection.insertNodes([codeNode]);
                        selection.insertRawText(textContent);
                    }
                }
            }),
        }),
        new ComponentPickerOption('Divider', {
            icon: React.createElement("i", { className: 'icon horizontal-rule' }),
            keywords: ['horizontal rule', 'divider', 'hr'],
            onSelect: () => editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined),
        }),
        new ComponentPickerOption('Poll', {
            icon: React.createElement("i", { className: 'icon poll' }),
            keywords: ['poll', 'vote'],
            onSelect: () => showModal('Insert Poll', onClose => (React.createElement(InsertPollDialog, { activeEditor: editor, onClose: onClose }))),
        }),
        ...EmbedConfigs.map(embedConfig => new ComponentPickerOption(`Embed ${embedConfig.contentName}`, {
            icon: embedConfig.icon,
            keywords: [...embedConfig.keywords, 'embed'],
            onSelect: () => editor.dispatchCommand(INSERT_EMBED_COMMAND, embedConfig.type),
        })),
        new ComponentPickerOption('GIF', {
            icon: React.createElement("i", { className: 'icon gif' }),
            keywords: ['gif', 'animate', 'image', 'file'],
            onSelect: () => editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                altText: 'Cat typing on a laptop',
                // src: catTypingGif,
                src: '../../images/cat-typing.gif',
            }),
        }),
        new ComponentPickerOption('Image', {
            icon: React.createElement("i", { className: 'icon image' }),
            keywords: ['image', 'photo', 'picture', 'file'],
            onSelect: () => showModal('Insert Image', onClose => (React.createElement(InsertImageDialog, { activeEditor: editor, onClose: onClose }))),
        }),
        new ComponentPickerOption('Columns Layout', {
            icon: React.createElement("i", { className: 'icon columns' }),
            keywords: ['columns', 'layout', 'grid'],
            onSelect: () => showModal('Insert Columns Layout', onClose => (React.createElement(InsertLayoutDialog, { activeEditor: editor, onClose: onClose }))),
        }),
        ...['left', 'center', 'right', 'justify'].map(alignment => new ComponentPickerOption(`Align ${alignment}`, {
            icon: React.createElement("i", { className: `icon ${alignment}-align` }),
            keywords: ['align', 'justify', alignment],
            onSelect: () => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment),
        })),
    ];
}
export default function ComponentPickerMenuPlugin() {
    const [editor] = useLexicalComposerContext();
    const [modal, showModal] = useModal();
    const [queryString, setQueryString] = useState(null);
    const checkForTriggerMatch = useBasicTypeaheadTriggerMatch('/', {
        minLength: 0,
    });
    const options = useMemo(() => {
        const baseOptions = getBaseOptions(editor, showModal);
        if (!queryString) {
            return baseOptions;
        }
        const regex = new RegExp(queryString, 'i');
        return [
            ...getDynamicOptions(editor, queryString),
            ...baseOptions.filter(option => regex.test(option.title) ||
                option.keywords.some(keyword => regex.test(keyword))),
        ];
    }, [editor, queryString, showModal]);
    const onSelectOption = useCallback((selectedOption, nodeToRemove, closeMenu, matchingString) => {
        editor.update(() => {
            nodeToRemove?.remove();
            selectedOption.onSelect(matchingString);
            closeMenu();
        });
    }, [editor]);
    return (React.createElement(React.Fragment, null,
        modal,
        React.createElement(LexicalTypeaheadMenuPlugin, { onQueryChange: setQueryString, onSelectOption: onSelectOption, triggerFn: checkForTriggerMatch, options: options, menuRenderFn: (anchorElementRef, { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }) => anchorElementRef.current && options.length
                ? ReactDOM.createPortal(React.createElement("div", { className: 'typeahead-popover component-picker-menu' },
                    React.createElement("ul", null, options.map((option, i) => (React.createElement(ComponentPickerMenuItem, { index: i, isSelected: selectedIndex === i, onClick: () => {
                            setHighlightedIndex(i);
                            selectOptionAndCleanUp(option);
                        }, onMouseEnter: () => {
                            setHighlightedIndex(i);
                        }, key: option.key, option: option }))))), anchorElementRef.current)
                : null })));
}
