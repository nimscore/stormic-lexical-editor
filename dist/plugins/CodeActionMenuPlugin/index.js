/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import './index.css';
import { $isCodeNode, CodeNode, getLanguageFriendlyName, normalizeCodeLang, } from '@lexical/code';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNearestNodeFromDOMNode, isHTMLElement } from 'lexical';
import { useEffect, useRef, useState } from 'react';
import * as React from 'react';
import { createPortal } from 'react-dom';
import { CopyButton } from './components/CopyButton';
import { canBePrettier, PrettierButton } from './components/PrettierButton';
import { useDebounce } from './utils';
const CODE_PADDING = 8;
function CodeActionMenuContainer({ anchorElem, }) {
    const [editor] = useLexicalComposerContext();
    const [lang, setLang] = useState('');
    const [isShown, setShown] = useState(false);
    const [shouldListenMouseMove, setShouldListenMouseMove] = useState(false);
    const [position, setPosition] = useState({
        right: '0',
        top: '0',
    });
    const codeSetRef = useRef(new Set());
    const codeDOMNodeRef = useRef(null);
    function getCodeDOMNode() {
        return codeDOMNodeRef.current;
    }
    const debouncedOnMouseMove = useDebounce((event) => {
        const { codeDOMNode, isOutside } = getMouseInfo(event);
        if (isOutside) {
            setShown(false);
            return;
        }
        if (!codeDOMNode) {
            return;
        }
        codeDOMNodeRef.current = codeDOMNode;
        let codeNode = null;
        let _lang = '';
        editor.update(() => {
            const maybeCodeNode = $getNearestNodeFromDOMNode(codeDOMNode);
            if ($isCodeNode(maybeCodeNode)) {
                codeNode = maybeCodeNode;
                _lang = codeNode.getLanguage() || '';
            }
        });
        if (codeNode) {
            const { y: editorElemY, right: editorElemRight } = anchorElem.getBoundingClientRect();
            const { y, right } = codeDOMNode.getBoundingClientRect();
            setLang(_lang);
            setShown(true);
            setPosition({
                right: `${editorElemRight - right + CODE_PADDING}px`,
                top: `${y - editorElemY}px`,
            });
        }
    }, 50, 1000);
    useEffect(() => {
        if (!shouldListenMouseMove) {
            return;
        }
        document.addEventListener('mousemove', debouncedOnMouseMove);
        return () => {
            setShown(false);
            debouncedOnMouseMove.cancel();
            document.removeEventListener('mousemove', debouncedOnMouseMove);
        };
    }, [shouldListenMouseMove, debouncedOnMouseMove]);
    useEffect(() => {
        return editor.registerMutationListener(CodeNode, (mutations) => {
            editor.getEditorState().read(() => {
                for (const [key, type] of mutations) {
                    switch (type) {
                        case 'created':
                            codeSetRef.current.add(key);
                            break;
                        case 'destroyed':
                            codeSetRef.current.delete(key);
                            break;
                        default:
                            break;
                    }
                }
            });
            setShouldListenMouseMove(codeSetRef.current.size > 0);
        }, { skipInitialization: false });
    }, [editor]);
    const normalizedLang = normalizeCodeLang(lang);
    const codeFriendlyName = getLanguageFriendlyName(lang);
    return (React.createElement(React.Fragment, null, isShown ? (React.createElement("div", { className: "code-action-menu-container", style: { ...position } },
        React.createElement("div", { className: "code-highlight-language" }, codeFriendlyName),
        React.createElement(CopyButton, { editor: editor, getCodeDOMNode: getCodeDOMNode }),
        canBePrettier(normalizedLang) ? (React.createElement(PrettierButton, { editor: editor, getCodeDOMNode: getCodeDOMNode, lang: normalizedLang })) : null)) : null));
}
function getMouseInfo(event) {
    const target = event.target;
    if (isHTMLElement(target)) {
        const codeDOMNode = target.closest('code.PlaygroundEditorTheme__code');
        const isOutside = !(codeDOMNode ||
            target.closest('div.code-action-menu-container'));
        return { codeDOMNode, isOutside };
    }
    else {
        return { codeDOMNode: null, isOutside: true };
    }
}
export default function CodeActionMenuPlugin({ anchorElem = document.body, }) {
    return createPortal(React.createElement(CodeActionMenuContainer, { anchorElem: anchorElem }), anchorElem);
}
