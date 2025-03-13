/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { AutoEmbedOption, LexicalAutoEmbedPlugin, URL_MATCHER, } from '@lexical/react/LexicalAutoEmbedPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import * as React from 'react';
import { useMemo, useState } from 'react';
import * as ReactDOM from 'react-dom';
import useModal from '../../hooks/useModal';
import Button from '../../ui/Button';
import { DialogActions } from '../../ui/Dialog';
import { INSERT_YOUTUBE_COMMAND } from '../YouTubePlugin';
export const YoutubeEmbedConfig = {
    contentName: 'Youtube Video',
    exampleUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    // Icon for display.
    icon: React.createElement("i", { className: 'icon youtube' }),
    insertNode: (editor, result) => {
        editor.dispatchCommand(INSERT_YOUTUBE_COMMAND, result.id);
    },
    keywords: ['youtube', 'video'],
    // Determine if a given URL is a match and return url data.
    parseUrl: async (url) => {
        const match = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/.exec(url);
        const id = match ? (match?.[2].length === 11 ? match[2] : null) : null;
        if (id != null) {
            return {
                id,
                url,
            };
        }
        return null;
    },
    type: 'youtube-video',
};
export const EmbedConfigs = [YoutubeEmbedConfig];
function AutoEmbedMenuItem({ index, isSelected, onClick, onMouseEnter, option, }) {
    let className = 'item';
    if (isSelected) {
        className += ' selected';
    }
    return (React.createElement("li", { key: option.key, tabIndex: -1, className: className, ref: option.setRefElement, role: 'option', "aria-selected": isSelected, id: 'typeahead-item-' + index, onMouseEnter: onMouseEnter, onClick: onClick },
        React.createElement("span", { className: 'text' }, option.title)));
}
function AutoEmbedMenu({ options, selectedItemIndex, onOptionClick, onOptionMouseEnter, }) {
    return (React.createElement("div", { className: 'typeahead-popover' },
        React.createElement("ul", null, options.map((option, i) => (React.createElement(AutoEmbedMenuItem, { index: i, isSelected: selectedItemIndex === i, onClick: () => onOptionClick(option, i), onMouseEnter: () => onOptionMouseEnter(i), key: option.key, option: option }))))));
}
const debounce = (callback, delay) => {
    let timeoutId;
    return (text) => {
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
            callback(text);
        }, delay);
    };
};
export function AutoEmbedDialog({ embedConfig, onClose, }) {
    const [text, setText] = useState('');
    const [editor] = useLexicalComposerContext();
    const [embedResult, setEmbedResult] = useState(null);
    const validateText = useMemo(() => debounce((inputText) => {
        const urlMatch = URL_MATCHER.exec(inputText);
        if (embedConfig != null && inputText != null && urlMatch != null) {
            Promise.resolve(embedConfig.parseUrl(inputText)).then(parseResult => {
                setEmbedResult(parseResult);
            });
        }
        else if (embedResult != null) {
            setEmbedResult(null);
        }
    }, 200), [embedConfig, embedResult]);
    const onClick = () => {
        if (embedResult != null) {
            embedConfig.insertNode(editor, embedResult);
            onClose();
        }
    };
    return (React.createElement("div", { style: { width: '600px' } },
        React.createElement("div", { className: 'Input__wrapper' },
            React.createElement("input", { type: 'text', className: 'Input__input', placeholder: embedConfig.exampleUrl, value: text, "data-test-id": `${embedConfig.type}-embed-modal-url`, onChange: e => {
                    const { value } = e.target;
                    setText(value);
                    validateText(value);
                } })),
        React.createElement(DialogActions, null,
            React.createElement(Button, { disabled: !embedResult, onClick: onClick, "data-test-id": `${embedConfig.type}-embed-modal-submit-btn` }, "Embed"))));
}
export default function AutoEmbedPlugin() {
    const [modal, showModal] = useModal();
    const openEmbedModal = (embedConfig) => {
        showModal(`Embed ${embedConfig.contentName}`, onClose => (React.createElement(AutoEmbedDialog, { embedConfig: embedConfig, onClose: onClose })));
    };
    const getMenuOptions = (activeEmbedConfig, embedFn, dismissFn) => {
        return [
            new AutoEmbedOption('Dismiss', {
                onSelect: dismissFn,
            }),
            new AutoEmbedOption(`Embed ${activeEmbedConfig.contentName}`, {
                onSelect: embedFn,
            }),
        ];
    };
    return (React.createElement(React.Fragment, null,
        modal,
        React.createElement(LexicalAutoEmbedPlugin, { embedConfigs: EmbedConfigs, onOpenEmbedModalForConfig: openEmbedModal, getMenuOptions: getMenuOptions, menuRenderFn: (anchorElementRef, { selectedIndex, options, selectOptionAndCleanUp, setHighlightedIndex, }) => anchorElementRef.current
                ? ReactDOM.createPortal(React.createElement("div", { className: 'typeahead-popover auto-embed-menu', style: {
                        marginLeft: `${Math.max(parseFloat(anchorElementRef.current.style.width) - 200, 0)}px`,
                        width: 200,
                    } },
                    React.createElement(AutoEmbedMenu, { options: options, selectedItemIndex: selectedIndex, onOptionClick: (option, index) => {
                            setHighlightedIndex(index);
                            selectOptionAndCleanUp(option);
                        }, onOptionMouseEnter: (index) => {
                            setHighlightedIndex(index);
                        } })), anchorElementRef.current)
                : null })));
}
