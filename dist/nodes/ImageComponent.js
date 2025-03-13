/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import './ImageNode.css';
import { HashtagNode } from '@lexical/hashtag';
import { LinkNode } from '@lexical/link';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { useCollaborationContext } from '@lexical/react/LexicalCollaborationContext';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalNestedComposer } from '@lexical/react/LexicalNestedComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import { $getNodeByKey, $getSelection, $isNodeSelection, $isRangeSelection, $setSelection, CLICK_COMMAND, COMMAND_PRIORITY_LOW, createCommand, DRAGSTART_COMMAND, KEY_BACKSPACE_COMMAND, KEY_DELETE_COMMAND, KEY_ENTER_COMMAND, KEY_ESCAPE_COMMAND, LineBreakNode, ParagraphNode, RootNode, SELECTION_CHANGE_COMMAND, TextNode, } from 'lexical';
import * as React from 'react';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSharedHistoryContext } from '../context/SharedHistoryContext';
// import brokenImage from '../images/image-broken.svg'
import EmojisPlugin from '../plugins/EmojisPlugin';
import LinkPlugin from '../plugins/LinkPlugin';
import ContentEditable from '../ui/ContentEditable';
import ImageResizer from '../ui/ImageResizer';
import { EmojiNode } from './EmojiNode';
import { $isImageNode } from './ImageNode';
const imageCache = new Set();
export const RIGHT_CLICK_IMAGE_COMMAND = createCommand('RIGHT_CLICK_IMAGE_COMMAND');
function useSuspenseImage(src) {
    if (!imageCache.has(src)) {
        throw new Promise(resolve => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                imageCache.add(src);
                resolve(null);
            };
            img.onerror = () => {
                imageCache.add(src);
            };
        });
    }
}
function LazyImage({ altText, className, imageRef, src, width, height, maxWidth, onError, }) {
    useSuspenseImage(src);
    return (React.createElement("img", { className: className || undefined, src: src, alt: altText, ref: imageRef, style: {
            height,
            maxWidth,
            width,
        }, onError: onError, draggable: 'false' }));
}
function BrokenImage() {
    return (React.createElement("img", { 
        // src={brokenImage}
        src: '../images/image-broken.svg', style: {
            height: 200,
            opacity: 0.2,
            width: 200,
        }, draggable: 'false' }));
}
export default function ImageComponent({ src, altText, nodeKey, width, height, maxWidth, resizable, showCaption, caption, captionsEnabled, }) {
    const imageRef = useRef(null);
    const buttonRef = useRef(null);
    const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
    const [isResizing, setIsResizing] = useState(false);
    const { isCollabActive } = useCollaborationContext();
    const [editor] = useLexicalComposerContext();
    const [selection, setSelection] = useState(null);
    const activeEditorRef = useRef(null);
    const [isLoadError, setIsLoadError] = useState(false);
    const isEditable = useLexicalEditable();
    const $onDelete = useCallback((payload) => {
        const deleteSelection = $getSelection();
        if (isSelected && $isNodeSelection(deleteSelection)) {
            const event = payload;
            event.preventDefault();
            deleteSelection.getNodes().forEach(node => {
                if ($isImageNode(node)) {
                    node.remove();
                }
            });
        }
        return false;
    }, [isSelected]);
    const $onEnter = useCallback((event) => {
        const latestSelection = $getSelection();
        const buttonElem = buttonRef.current;
        if (isSelected &&
            $isNodeSelection(latestSelection) &&
            latestSelection.getNodes().length === 1) {
            if (showCaption) {
                // Move focus into nested editor
                $setSelection(null);
                event.preventDefault();
                caption.focus();
                return true;
            }
            else if (buttonElem !== null &&
                buttonElem !== document.activeElement) {
                event.preventDefault();
                buttonElem.focus();
                return true;
            }
        }
        return false;
    }, [caption, isSelected, showCaption]);
    const $onEscape = useCallback((event) => {
        if (activeEditorRef.current === caption ||
            buttonRef.current === event.target) {
            $setSelection(null);
            editor.update(() => {
                setSelected(true);
                const parentRootElement = editor.getRootElement();
                if (parentRootElement !== null) {
                    parentRootElement.focus();
                }
            });
            return true;
        }
        return false;
    }, [caption, editor, setSelected]);
    const onClick = useCallback((payload) => {
        const event = payload;
        if (isResizing) {
            return true;
        }
        if (event.target === imageRef.current) {
            if (event.shiftKey) {
                setSelected(!isSelected);
            }
            else {
                clearSelection();
                setSelected(true);
            }
            return true;
        }
        return false;
    }, [isResizing, isSelected, setSelected, clearSelection]);
    const onRightClick = useCallback((event) => {
        editor.getEditorState().read(() => {
            const latestSelection = $getSelection();
            const domElement = event.target;
            if (domElement.tagName === 'IMG' &&
                $isRangeSelection(latestSelection) &&
                latestSelection.getNodes().length === 1) {
                editor.dispatchCommand(RIGHT_CLICK_IMAGE_COMMAND, event);
            }
        });
    }, [editor]);
    useEffect(() => {
        const rootElement = editor.getRootElement();
        const unregister = mergeRegister(editor.registerUpdateListener(({ editorState }) => {
            const updatedSelection = editorState.read(() => $getSelection());
            if ($isNodeSelection(updatedSelection)) {
                setSelection(updatedSelection);
            }
            else {
                setSelection(null);
            }
        }), editor.registerCommand(SELECTION_CHANGE_COMMAND, (_, activeEditor) => {
            activeEditorRef.current = activeEditor;
            return false;
        }, COMMAND_PRIORITY_LOW), editor.registerCommand(CLICK_COMMAND, onClick, COMMAND_PRIORITY_LOW), editor.registerCommand(RIGHT_CLICK_IMAGE_COMMAND, onClick, COMMAND_PRIORITY_LOW), editor.registerCommand(DRAGSTART_COMMAND, event => {
            if (event.target === imageRef.current) {
                // TODO This is just a temporary workaround for FF to behave like other browsers.
                // Ideally, this handles drag & drop too (and all browsers).
                event.preventDefault();
                return true;
            }
            return false;
        }, COMMAND_PRIORITY_LOW), editor.registerCommand(KEY_DELETE_COMMAND, $onDelete, COMMAND_PRIORITY_LOW), editor.registerCommand(KEY_BACKSPACE_COMMAND, $onDelete, COMMAND_PRIORITY_LOW), editor.registerCommand(KEY_ENTER_COMMAND, $onEnter, COMMAND_PRIORITY_LOW), editor.registerCommand(KEY_ESCAPE_COMMAND, $onEscape, COMMAND_PRIORITY_LOW));
        rootElement?.addEventListener('contextmenu', onRightClick);
        return () => {
            unregister();
            rootElement?.removeEventListener('contextmenu', onRightClick);
        };
    }, [
        clearSelection,
        editor,
        isResizing,
        isSelected,
        nodeKey,
        $onDelete,
        $onEnter,
        $onEscape,
        onClick,
        onRightClick,
        setSelected,
    ]);
    const setShowCaption = () => {
        editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if ($isImageNode(node)) {
                node.setShowCaption(true);
            }
        });
    };
    const onResizeEnd = (nextWidth, nextHeight) => {
        // Delay hiding the resize bars for click case
        setTimeout(() => {
            setIsResizing(false);
        }, 200);
        editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if ($isImageNode(node)) {
                node.setWidthAndHeight(nextWidth, nextHeight);
            }
        });
    };
    const onResizeStart = () => {
        setIsResizing(true);
    };
    const { historyState } = useSharedHistoryContext();
    const draggable = isSelected && $isNodeSelection(selection) && !isResizing;
    const isFocused = (isSelected || isResizing) && isEditable;
    return (React.createElement(Suspense, { fallback: null },
        React.createElement(React.Fragment, null,
            React.createElement("div", { draggable: draggable }, isLoadError ? (React.createElement(BrokenImage, null)) : (React.createElement(LazyImage, { className: isFocused
                    ? `focused ${$isNodeSelection(selection) ? 'draggable' : ''}`
                    : null, src: src, altText: altText, imageRef: imageRef, width: width, height: height, maxWidth: maxWidth, onError: () => setIsLoadError(true) }))),
            showCaption && (React.createElement("div", { className: 'image-caption-container' },
                React.createElement(LexicalNestedComposer, { initialEditor: caption, initialNodes: [
                        RootNode,
                        TextNode,
                        LineBreakNode,
                        ParagraphNode,
                        LinkNode,
                        EmojiNode,
                        HashtagNode,
                    ] },
                    React.createElement(AutoFocusPlugin, null),
                    React.createElement(LinkPlugin, null),
                    React.createElement(EmojisPlugin, null),
                    React.createElement(HashtagPlugin, null),
                    React.createElement(HistoryPlugin, { externalHistoryState: historyState }),
                    React.createElement(RichTextPlugin, { contentEditable: React.createElement(ContentEditable, { placeholder: 'Enter a caption...', placeholderClassName: 'ImageNode__placeholder', className: 'ImageNode__contentEditable' }), ErrorBoundary: LexicalErrorBoundary })))),
            resizable && $isNodeSelection(selection) && isFocused && (React.createElement(ImageResizer, { showCaption: showCaption, setShowCaption: setShowCaption, editor: editor, buttonRef: buttonRef, imageRef: imageRef, maxWidth: maxWidth, onResizeStart: onResizeStart, onResizeEnd: onResizeEnd, captionsEnabled: !isLoadError && captionsEnabled })))));
}
