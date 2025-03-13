/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalContextMenuPlugin, MenuOption, } from '@lexical/react/LexicalContextMenuPlugin';
import { $getNearestNodeFromDOMNode, $getSelection, $isDecoratorNode, $isNodeSelection, $isRangeSelection, COPY_COMMAND, CUT_COMMAND, PASTE_COMMAND, } from 'lexical';
import { useCallback, useMemo } from 'react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
function ContextMenuItem({ index, isSelected, onClick, onMouseEnter, option, }) {
    let className = 'item';
    if (isSelected) {
        className += ' selected';
    }
    return (React.createElement("li", { key: option.key, tabIndex: -1, className: className, ref: option.setRefElement, role: "option", "aria-selected": isSelected, id: 'typeahead-item-' + index, onMouseEnter: onMouseEnter, onClick: onClick },
        React.createElement("span", { className: "text" }, option.title)));
}
function ContextMenu({ options, selectedItemIndex, onOptionClick, onOptionMouseEnter, }) {
    return (React.createElement("div", { className: "typeahead-popover" },
        React.createElement("ul", null, options.map((option, i) => (React.createElement(ContextMenuItem, { index: i, isSelected: selectedItemIndex === i, onClick: () => onOptionClick(option, i), onMouseEnter: () => onOptionMouseEnter(i), key: option.key, option: option }))))));
}
export class ContextMenuOption extends MenuOption {
    title;
    onSelect;
    constructor(title, options) {
        super(title);
        this.title = title;
        this.onSelect = options.onSelect.bind(this);
    }
}
export default function ContextMenuPlugin() {
    const [editor] = useLexicalComposerContext();
    const defaultOptions = useMemo(() => {
        return [
            new ContextMenuOption(`Copy`, {
                onSelect: (_node) => {
                    editor.dispatchCommand(COPY_COMMAND, null);
                },
            }),
            new ContextMenuOption(`Cut`, {
                onSelect: (_node) => {
                    editor.dispatchCommand(CUT_COMMAND, null);
                },
            }),
            new ContextMenuOption(`Paste`, {
                onSelect: (_node) => {
                    navigator.clipboard.read().then(async function (...args) {
                        const data = new DataTransfer();
                        const items = await navigator.clipboard.read();
                        const item = items[0];
                        const permission = await navigator.permissions.query({
                            // @ts-expect-error These types are incorrect.
                            name: 'clipboard-read',
                        });
                        if (permission.state === 'denied') {
                            alert('Not allowed to paste from clipboard.');
                            return;
                        }
                        for (const type of item.types) {
                            const dataString = await (await item.getType(type)).text();
                            data.setData(type, dataString);
                        }
                        const event = new ClipboardEvent('paste', {
                            clipboardData: data,
                        });
                        editor.dispatchCommand(PASTE_COMMAND, event);
                    });
                },
            }),
            new ContextMenuOption(`Paste as Plain Text`, {
                onSelect: (_node) => {
                    navigator.clipboard.read().then(async function (...args) {
                        const permission = await navigator.permissions.query({
                            // @ts-expect-error These types are incorrect.
                            name: 'clipboard-read',
                        });
                        if (permission.state === 'denied') {
                            alert('Not allowed to paste from clipboard.');
                            return;
                        }
                        const data = new DataTransfer();
                        const items = await navigator.clipboard.readText();
                        data.setData('text/plain', items);
                        const event = new ClipboardEvent('paste', {
                            clipboardData: data,
                        });
                        editor.dispatchCommand(PASTE_COMMAND, event);
                    });
                },
            }),
            new ContextMenuOption(`Delete Node`, {
                onSelect: (_node) => {
                    const selection = $getSelection();
                    if ($isRangeSelection(selection)) {
                        const currentNode = selection.anchor.getNode();
                        const ancestorNodeWithRootAsParent = currentNode
                            .getParents()
                            .at(-2);
                        ancestorNodeWithRootAsParent?.remove();
                    }
                    else if ($isNodeSelection(selection)) {
                        const selectedNodes = selection.getNodes();
                        selectedNodes.forEach((node) => {
                            if ($isDecoratorNode(node)) {
                                node.remove();
                            }
                        });
                    }
                },
            }),
        ];
    }, [editor]);
    const [options, setOptions] = React.useState(defaultOptions);
    const onSelectOption = useCallback((selectedOption, targetNode, closeMenu) => {
        editor.update(() => {
            selectedOption.onSelect(targetNode);
            closeMenu();
        });
    }, [editor]);
    const onWillOpen = (event) => {
        let newOptions = defaultOptions;
        editor.update(() => {
            const node = $getNearestNodeFromDOMNode(event.target);
            if (node) {
                const parent = node.getParent();
                if ($isLinkNode(parent)) {
                    newOptions = [
                        new ContextMenuOption(`Remove Link`, {
                            onSelect: (_node) => {
                                editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
                            },
                        }),
                        ...defaultOptions,
                    ];
                }
            }
        });
        setOptions(newOptions);
    };
    return (React.createElement(LexicalContextMenuPlugin, { options: options, onSelectOption: onSelectOption, onWillOpen: onWillOpen, menuRenderFn: (anchorElementRef, { selectedIndex, options: _options, selectOptionAndCleanUp, setHighlightedIndex, }, { setMenuRef }) => anchorElementRef.current
            ? ReactDOM.createPortal(React.createElement("div", { className: "typeahead-popover auto-embed-menu", style: {
                    marginLeft: anchorElementRef.current.style.width,
                    userSelect: 'none',
                    width: 200,
                }, ref: setMenuRef },
                React.createElement(ContextMenu, { options: options, selectedItemIndex: selectedIndex, onOptionClick: (option, index) => {
                        setHighlightedIndex(index);
                        selectOptionAndCleanUp(option);
                    }, onOptionMouseEnter: (index) => {
                        setHighlightedIndex(index);
                    } })), anchorElementRef.current)
            : null }));
}
