/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import './index.css';
import { $isCodeHighlightNode } from '@lexical/code';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import { $getSelection, $isParagraphNode, $isRangeSelection, $isTextNode, COMMAND_PRIORITY_LOW, FORMAT_TEXT_COMMAND, getDOMSelection, SELECTION_CHANGE_COMMAND, } from 'lexical';
import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getDOMRangeRect } from '../../utils/getDOMRangeRect';
import { getSelectedNode } from '../../utils/getSelectedNode';
import { setFloatingElemPosition } from '../../utils/setFloatingElemPosition';
function TextFormatFloatingToolbar({ editor, anchorElem, isLink, isBold, isItalic, isUnderline, isUppercase, isLowercase, isCapitalize, isCode, isStrikethrough, isSubscript, isSuperscript, setIsLinkEditMode, }) {
    const popupCharStylesEditorRef = useRef(null);
    const insertLink = useCallback(() => {
        if (!isLink) {
            setIsLinkEditMode(true);
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, 'https://');
        }
        else {
            setIsLinkEditMode(false);
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
        }
    }, [editor, isLink, setIsLinkEditMode]);
    function mouseMoveListener(e) {
        if (popupCharStylesEditorRef?.current &&
            (e.buttons === 1 || e.buttons === 3)) {
            if (popupCharStylesEditorRef.current.style.pointerEvents !== 'none') {
                const x = e.clientX;
                const y = e.clientY;
                const elementUnderMouse = document.elementFromPoint(x, y);
                if (!popupCharStylesEditorRef.current.contains(elementUnderMouse)) {
                    // Mouse is not over the target element => not a normal click, but probably a drag
                    popupCharStylesEditorRef.current.style.pointerEvents = 'none';
                }
            }
        }
    }
    function mouseUpListener(e) {
        if (popupCharStylesEditorRef?.current) {
            if (popupCharStylesEditorRef.current.style.pointerEvents !== 'auto') {
                popupCharStylesEditorRef.current.style.pointerEvents = 'auto';
            }
        }
    }
    useEffect(() => {
        if (popupCharStylesEditorRef?.current) {
            document.addEventListener('mousemove', mouseMoveListener);
            document.addEventListener('mouseup', mouseUpListener);
            return () => {
                document.removeEventListener('mousemove', mouseMoveListener);
                document.removeEventListener('mouseup', mouseUpListener);
            };
        }
    }, [popupCharStylesEditorRef]);
    const $updateTextFormatFloatingToolbar = useCallback(() => {
        const selection = $getSelection();
        const popupCharStylesEditorElem = popupCharStylesEditorRef.current;
        const nativeSelection = getDOMSelection(editor._window);
        if (popupCharStylesEditorElem === null) {
            return;
        }
        const rootElement = editor.getRootElement();
        if (selection !== null &&
            nativeSelection !== null &&
            !nativeSelection.isCollapsed &&
            rootElement !== null &&
            rootElement.contains(nativeSelection.anchorNode)) {
            const rangeRect = getDOMRangeRect(nativeSelection, rootElement);
            setFloatingElemPosition(rangeRect, popupCharStylesEditorElem, anchorElem, isLink);
        }
    }, [editor, anchorElem, isLink]);
    useEffect(() => {
        const scrollerElem = anchorElem.parentElement;
        const update = () => {
            editor.getEditorState().read(() => {
                $updateTextFormatFloatingToolbar();
            });
        };
        window.addEventListener('resize', update);
        if (scrollerElem) {
            scrollerElem.addEventListener('scroll', update);
        }
        return () => {
            window.removeEventListener('resize', update);
            if (scrollerElem) {
                scrollerElem.removeEventListener('scroll', update);
            }
        };
    }, [editor, $updateTextFormatFloatingToolbar, anchorElem]);
    useEffect(() => {
        editor.getEditorState().read(() => {
            $updateTextFormatFloatingToolbar();
        });
        return mergeRegister(editor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => {
                $updateTextFormatFloatingToolbar();
            });
        }), editor.registerCommand(SELECTION_CHANGE_COMMAND, () => {
            $updateTextFormatFloatingToolbar();
            return false;
        }, COMMAND_PRIORITY_LOW));
    }, [editor, $updateTextFormatFloatingToolbar]);
    return (React.createElement("div", { ref: popupCharStylesEditorRef, className: 'floating-text-format-popup' }, editor.isEditable() && (React.createElement(React.Fragment, null,
        React.createElement("button", { type: 'button', onClick: () => {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
            }, className: 'popup-item spaced ' + (isBold ? 'active' : ''), title: 'Bold', "aria-label": 'Format text as bold' },
            React.createElement("i", { className: 'format bold' })),
        React.createElement("button", { type: 'button', onClick: () => {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
            }, className: 'popup-item spaced ' + (isItalic ? 'active' : ''), title: 'Italic', "aria-label": 'Format text as italics' },
            React.createElement("i", { className: 'format italic' })),
        React.createElement("button", { type: 'button', onClick: () => {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
            }, className: 'popup-item spaced ' + (isUnderline ? 'active' : ''), title: 'Underline', "aria-label": 'Format text to underlined' },
            React.createElement("i", { className: 'format underline' })),
        React.createElement("button", { type: 'button', onClick: () => {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
            }, className: 'popup-item spaced ' + (isStrikethrough ? 'active' : ''), title: 'Strikethrough', "aria-label": 'Format text with a strikethrough' },
            React.createElement("i", { className: 'format strikethrough' })),
        React.createElement("button", { type: 'button', onClick: () => {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript');
            }, className: 'popup-item spaced ' + (isSubscript ? 'active' : ''), title: 'Subscript', "aria-label": 'Format Subscript' },
            React.createElement("i", { className: 'format subscript' })),
        React.createElement("button", { type: 'button', onClick: () => {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript');
            }, className: 'popup-item spaced ' + (isSuperscript ? 'active' : ''), title: 'Superscript', "aria-label": 'Format Superscript' },
            React.createElement("i", { className: 'format superscript' })),
        React.createElement("button", { type: 'button', onClick: () => {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'uppercase');
            }, className: 'popup-item spaced ' + (isUppercase ? 'active' : ''), title: 'Uppercase', "aria-label": 'Format text to uppercase' },
            React.createElement("i", { className: 'format uppercase' })),
        React.createElement("button", { type: 'button', onClick: () => {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'lowercase');
            }, className: 'popup-item spaced ' + (isLowercase ? 'active' : ''), title: 'Lowercase', "aria-label": 'Format text to lowercase' },
            React.createElement("i", { className: 'format lowercase' })),
        React.createElement("button", { type: 'button', onClick: () => {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'capitalize');
            }, className: 'popup-item spaced ' + (isCapitalize ? 'active' : ''), title: 'Capitalize', "aria-label": 'Format text to capitalize' },
            React.createElement("i", { className: 'format capitalize' })),
        React.createElement("button", { type: 'button', onClick: () => {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
            }, className: 'popup-item spaced ' + (isCode ? 'active' : ''), title: 'Insert code block', "aria-label": 'Insert code block' },
            React.createElement("i", { className: 'format code' })),
        React.createElement("button", { type: 'button', onClick: insertLink, className: 'popup-item spaced ' + (isLink ? 'active' : ''), title: 'Insert link', "aria-label": 'Insert link' },
            React.createElement("i", { className: 'format link' }))))));
}
function useFloatingTextFormatToolbar(editor, anchorElem, setIsLinkEditMode) {
    const [isText, setIsText] = useState(false);
    const [isLink, setIsLink] = useState(false);
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [isUppercase, setIsUppercase] = useState(false);
    const [isLowercase, setIsLowercase] = useState(false);
    const [isCapitalize, setIsCapitalize] = useState(false);
    const [isStrikethrough, setIsStrikethrough] = useState(false);
    const [isSubscript, setIsSubscript] = useState(false);
    const [isSuperscript, setIsSuperscript] = useState(false);
    const [isCode, setIsCode] = useState(false);
    const updatePopup = useCallback(() => {
        editor.getEditorState().read(() => {
            // Should not to pop up the floating toolbar when using IME input
            if (editor.isComposing()) {
                return;
            }
            const selection = $getSelection();
            const nativeSelection = getDOMSelection(editor._window);
            const rootElement = editor.getRootElement();
            if (nativeSelection !== null &&
                (!$isRangeSelection(selection) ||
                    rootElement === null ||
                    !rootElement.contains(nativeSelection.anchorNode))) {
                setIsText(false);
                return;
            }
            if (!$isRangeSelection(selection)) {
                return;
            }
            const node = getSelectedNode(selection);
            // Update text format
            setIsBold(selection.hasFormat('bold'));
            setIsItalic(selection.hasFormat('italic'));
            setIsUnderline(selection.hasFormat('underline'));
            setIsUppercase(selection.hasFormat('uppercase'));
            setIsLowercase(selection.hasFormat('lowercase'));
            setIsCapitalize(selection.hasFormat('capitalize'));
            setIsStrikethrough(selection.hasFormat('strikethrough'));
            setIsSubscript(selection.hasFormat('subscript'));
            setIsSuperscript(selection.hasFormat('superscript'));
            setIsCode(selection.hasFormat('code'));
            // Update links
            const parent = node.getParent();
            if ($isLinkNode(parent) || $isLinkNode(node)) {
                setIsLink(true);
            }
            else {
                setIsLink(false);
            }
            if (!$isCodeHighlightNode(selection.anchor.getNode()) &&
                selection.getTextContent() !== '') {
                setIsText($isTextNode(node) || $isParagraphNode(node));
            }
            else {
                setIsText(false);
            }
            const rawTextContent = selection.getTextContent().replace(/\n/g, '');
            if (!selection.isCollapsed() && rawTextContent === '') {
                setIsText(false);
                return;
            }
        });
    }, [editor]);
    useEffect(() => {
        document.addEventListener('selectionchange', updatePopup);
        return () => {
            document.removeEventListener('selectionchange', updatePopup);
        };
    }, [updatePopup]);
    useEffect(() => {
        return mergeRegister(editor.registerUpdateListener(() => {
            updatePopup();
        }), editor.registerRootListener(() => {
            if (editor.getRootElement() === null) {
                setIsText(false);
            }
        }));
    }, [editor, updatePopup]);
    if (!isText) {
        return null;
    }
    return createPortal(React.createElement(TextFormatFloatingToolbar, { editor: editor, anchorElem: anchorElem, isLink: isLink, isBold: isBold, isItalic: isItalic, isUppercase: isUppercase, isLowercase: isLowercase, isCapitalize: isCapitalize, isStrikethrough: isStrikethrough, isSubscript: isSubscript, isSuperscript: isSuperscript, isUnderline: isUnderline, isCode: isCode, setIsLinkEditMode: setIsLinkEditMode }), anchorElem);
}
export default function FloatingTextFormatToolbarPlugin({ anchorElem = document.body, setIsLinkEditMode, }) {
    const [editor] = useLexicalComposerContext();
    return useFloatingTextFormatToolbar(editor, anchorElem, setIsLinkEditMode);
}
