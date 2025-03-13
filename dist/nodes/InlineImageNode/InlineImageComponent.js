import './InlineImageNode.css';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { LexicalNestedComposer } from '@lexical/react/LexicalNestedComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import { $getNodeByKey, $getSelection, $isNodeSelection, $setSelection, CLICK_COMMAND, COMMAND_PRIORITY_LOW, DRAGSTART_COMMAND, KEY_BACKSPACE_COMMAND, KEY_DELETE_COMMAND, KEY_ENTER_COMMAND, KEY_ESCAPE_COMMAND, SELECTION_CHANGE_COMMAND, } from 'lexical';
import * as React from 'react';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import useModal from '../../hooks/useModal';
import LinkPlugin from '../../plugins/LinkPlugin';
import Button from '../../ui/Button';
import ContentEditable from '../../ui/ContentEditable';
import { DialogActions } from '../../ui/Dialog';
import Select from '../../ui/Select';
import TextInput from '../../ui/TextInput';
import { $isInlineImageNode } from './InlineImageNode';
const imageCache = new Set();
function useSuspenseImage(src) {
    if (!imageCache.has(src)) {
        throw new Promise((resolve) => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                imageCache.add(src);
                resolve(null);
            };
        });
    }
}
function LazyImage({ altText, className, imageRef, src, width, height, position, }) {
    useSuspenseImage(src);
    return (React.createElement("img", { className: className || undefined, src: src, alt: altText, ref: imageRef, "data-position": position, style: {
            display: 'block',
            height,
            width,
        }, draggable: "false" }));
}
export function UpdateInlineImageDialog({ activeEditor, nodeKey, onClose, }) {
    const editorState = activeEditor.getEditorState();
    const node = editorState.read(() => $getNodeByKey(nodeKey));
    const [altText, setAltText] = useState(node.getAltText());
    const [showCaption, setShowCaption] = useState(node.getShowCaption());
    const [position, setPosition] = useState(node.getPosition());
    const handleShowCaptionChange = (e) => {
        setShowCaption(e.target.checked);
    };
    const handlePositionChange = (e) => {
        setPosition(e.target.value);
    };
    const handleOnConfirm = () => {
        const payload = { altText, position, showCaption };
        if (node) {
            activeEditor.update(() => {
                node.update(payload);
            });
        }
        onClose();
    };
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { style: { marginBottom: '1em' } },
            React.createElement(TextInput, { label: "Alt Text", placeholder: "Descriptive alternative text", onChange: setAltText, value: altText, "data-test-id": "image-modal-alt-text-input" })),
        React.createElement(Select, { style: { marginBottom: '1em', width: '208px' }, value: position, label: "Position", name: "position", id: "position-select", onChange: handlePositionChange },
            React.createElement("option", { value: "left" }, "Left"),
            React.createElement("option", { value: "right" }, "Right"),
            React.createElement("option", { value: "full" }, "Full Width")),
        React.createElement("div", { className: "Input__wrapper" },
            React.createElement("input", { id: "caption", type: "checkbox", checked: showCaption, onChange: handleShowCaptionChange }),
            React.createElement("label", { htmlFor: "caption" }, "Show Caption")),
        React.createElement(DialogActions, null,
            React.createElement(Button, { "data-test-id": "image-modal-file-upload-btn", onClick: () => handleOnConfirm() }, "Confirm"))));
}
export default function InlineImageComponent({ src, altText, nodeKey, width, height, showCaption, caption, position, }) {
    const [modal, showModal] = useModal();
    const imageRef = useRef(null);
    const buttonRef = useRef(null);
    const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
    const [editor] = useLexicalComposerContext();
    const [selection, setSelection] = useState(null);
    const activeEditorRef = useRef(null);
    const isEditable = useLexicalEditable();
    const $onDelete = useCallback((payload) => {
        const deleteSelection = $getSelection();
        if (isSelected && $isNodeSelection(deleteSelection)) {
            const event = payload;
            event.preventDefault();
            if (isSelected && $isNodeSelection(deleteSelection)) {
                deleteSelection.getNodes().forEach((node) => {
                    if ($isInlineImageNode(node)) {
                        node.remove();
                    }
                });
            }
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
    useEffect(() => {
        let isMounted = true;
        const unregister = mergeRegister(editor.registerUpdateListener(({ editorState }) => {
            if (isMounted) {
                setSelection(editorState.read(() => $getSelection()));
            }
        }), editor.registerCommand(SELECTION_CHANGE_COMMAND, (_, activeEditor) => {
            activeEditorRef.current = activeEditor;
            return false;
        }, COMMAND_PRIORITY_LOW), editor.registerCommand(CLICK_COMMAND, (payload) => {
            const event = payload;
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
        }, COMMAND_PRIORITY_LOW), editor.registerCommand(DRAGSTART_COMMAND, (event) => {
            if (event.target === imageRef.current) {
                // TODO This is just a temporary workaround for FF to behave like other browsers.
                // Ideally, this handles drag & drop too (and all browsers).
                event.preventDefault();
                return true;
            }
            return false;
        }, COMMAND_PRIORITY_LOW), editor.registerCommand(KEY_DELETE_COMMAND, $onDelete, COMMAND_PRIORITY_LOW), editor.registerCommand(KEY_BACKSPACE_COMMAND, $onDelete, COMMAND_PRIORITY_LOW), editor.registerCommand(KEY_ENTER_COMMAND, $onEnter, COMMAND_PRIORITY_LOW), editor.registerCommand(KEY_ESCAPE_COMMAND, $onEscape, COMMAND_PRIORITY_LOW));
        return () => {
            isMounted = false;
            unregister();
        };
    }, [
        clearSelection,
        editor,
        isSelected,
        nodeKey,
        $onDelete,
        $onEnter,
        $onEscape,
        setSelected,
    ]);
    const draggable = isSelected && $isNodeSelection(selection);
    const isFocused = isSelected && isEditable;
    return (React.createElement(Suspense, { fallback: null },
        React.createElement(React.Fragment, null,
            React.createElement("span", { draggable: draggable },
                isEditable && (React.createElement("button", { className: "image-edit-button", ref: buttonRef, onClick: () => {
                        showModal('Update Inline Image', (onClose) => (React.createElement(UpdateInlineImageDialog, { activeEditor: editor, nodeKey: nodeKey, onClose: onClose })));
                    } }, "Edit")),
                React.createElement(LazyImage, { className: isFocused
                        ? `focused ${$isNodeSelection(selection) ? 'draggable' : ''}`
                        : null, src: src, altText: altText, imageRef: imageRef, width: width, height: height, position: position })),
            showCaption && (React.createElement("span", { className: "image-caption-container" },
                React.createElement(LexicalNestedComposer, { initialEditor: caption },
                    React.createElement(AutoFocusPlugin, null),
                    React.createElement(LinkPlugin, null),
                    React.createElement(RichTextPlugin, { contentEditable: React.createElement(ContentEditable, { placeholder: "Enter a caption...", placeholderClassName: "InlineImageNode__placeholder", className: "InlineImageNode__contentEditable" }), ErrorBoundary: LexicalErrorBoundary }))))),
        modal));
}
