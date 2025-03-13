/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { $isCodeNode, CODE_LANGUAGE_FRIENDLY_NAME_MAP, CODE_LANGUAGE_MAP, getLanguageFriendlyName, } from '@lexical/code';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $isListNode, ListNode } from '@lexical/list';
import { INSERT_EMBED_COMMAND } from '@lexical/react/LexicalAutoEmbedPlugin';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { $isHeadingNode } from '@lexical/rich-text';
import { $getSelectionStyleValueForProperty, $isParentElementRTL, $patchStyleText, } from '@lexical/selection';
import { $isTableNode, $isTableSelection } from '@lexical/table';
import { $findMatchingParent, $getNearestNodeOfType, $isEditorIsNestedEditor, mergeRegister, } from '@lexical/utils';
import { $getNodeByKey, $getSelection, $isElementNode, $isRangeSelection, $isRootOrShadowRoot, CAN_REDO_COMMAND, CAN_UNDO_COMMAND, COMMAND_PRIORITY_CRITICAL, FORMAT_ELEMENT_COMMAND, FORMAT_TEXT_COMMAND, INDENT_CONTENT_COMMAND, OUTDENT_CONTENT_COMMAND, REDO_COMMAND, SELECTION_CHANGE_COMMAND, UNDO_COMMAND, } from 'lexical';
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { blockTypeToBlockName, useToolbarState, } from '../../context/ToolbarContext';
import useModal from '../../hooks/useModal';
// import catTypingGif from '../../images/cat-typing.gif'
import DropDown, { DropDownItem } from '../../ui/DropDown';
import DropdownColorPicker from '../../ui/DropdownColorPicker';
import { getSelectedNode } from '../../utils/getSelectedNode';
import { sanitizeUrl } from '../../utils/url';
import { EmbedConfigs } from '../AutoEmbedPlugin';
import { INSERT_IMAGE_COMMAND, InsertImageDialog, } from '../ImagesPlugin';
import { InsertInlineImageDialog } from '../InlineImagePlugin';
import InsertLayoutDialog from '../LayoutPlugin/InsertLayoutDialog';
import { InsertPollDialog } from '../PollPlugin';
import FontSize from './fontSize';
import { clearFormatting, formatBulletList, formatCheckList, formatCode, formatHeading, formatNumberedList, formatParagraph, formatQuote, } from './utils';
const rootTypeToRootName = {
    root: 'Root',
    table: 'Table',
};
function getCodeLanguageOptions() {
    const options = [];
    for (const [lang, friendlyName] of Object.entries(CODE_LANGUAGE_FRIENDLY_NAME_MAP)) {
        options.push([lang, friendlyName]);
    }
    return options;
}
const CODE_LANGUAGE_OPTIONS = getCodeLanguageOptions();
const FONT_FAMILY_OPTIONS = [
    ['Arial', 'Arial'],
    ['Courier New', 'Courier New'],
    ['Georgia', 'Georgia'],
    ['Times New Roman', 'Times New Roman'],
    ['Trebuchet MS', 'Trebuchet MS'],
    ['Verdana', 'Verdana'],
];
const FONT_SIZE_OPTIONS = [
    ['10px', '10px'],
    ['11px', '11px'],
    ['12px', '12px'],
    ['13px', '13px'],
    ['14px', '14px'],
    ['15px', '15px'],
    ['16px', '16px'],
    ['17px', '17px'],
    ['18px', '18px'],
    ['19px', '19px'],
    ['20px', '20px'],
];
const ELEMENT_FORMAT_OPTIONS = {
    center: {
        icon: 'center-align',
        iconRTL: 'center-align',
        name: 'Center Align',
    },
    end: {
        icon: 'right-align',
        iconRTL: 'left-align',
        name: 'End Align',
    },
    justify: {
        icon: 'justify-align',
        iconRTL: 'justify-align',
        name: 'Justify Align',
    },
    left: {
        icon: 'left-align',
        iconRTL: 'left-align',
        name: 'Left Align',
    },
    right: {
        icon: 'right-align',
        iconRTL: 'right-align',
        name: 'Right Align',
    },
    start: {
        icon: 'left-align',
        iconRTL: 'right-align',
        name: 'Start Align',
    },
};
function dropDownActiveClass(active) {
    if (active) {
        return 'active dropdown-item-active';
    }
    else {
        return '';
    }
}
function BlockFormatDropDown({ editor, blockType, rootType, disabled = false, }) {
    return (React.createElement(DropDown, { disabled: disabled, buttonClassName: 'toolbar-item block-controls', buttonIconClassName: 'icon block-type ' + blockType, buttonLabel: blockTypeToBlockName[blockType], buttonAriaLabel: 'Formatting options for text style' },
        React.createElement(DropDownItem, { className: 'item wide ' + dropDownActiveClass(blockType === 'paragraph'), onClick: () => formatParagraph(editor) },
            React.createElement("div", { className: 'icon-text-container' },
                React.createElement("i", { className: 'icon paragraph' }),
                React.createElement("span", { className: 'text' }, "Normal"))),
        React.createElement(DropDownItem, { className: 'item wide ' + dropDownActiveClass(blockType === 'h1'), onClick: () => formatHeading(editor, blockType, 'h1') },
            React.createElement("div", { className: 'icon-text-container' },
                React.createElement("i", { className: 'icon h1' }),
                React.createElement("span", { className: 'text' }, "Heading 1"))),
        React.createElement(DropDownItem, { className: 'item wide ' + dropDownActiveClass(blockType === 'h2'), onClick: () => formatHeading(editor, blockType, 'h2') },
            React.createElement("div", { className: 'icon-text-container' },
                React.createElement("i", { className: 'icon h2' }),
                React.createElement("span", { className: 'text' }, "Heading 2"))),
        React.createElement(DropDownItem, { className: 'item wide ' + dropDownActiveClass(blockType === 'h3'), onClick: () => formatHeading(editor, blockType, 'h3') },
            React.createElement("div", { className: 'icon-text-container' },
                React.createElement("i", { className: 'icon h3' }),
                React.createElement("span", { className: 'text' }, "Heading 3"))),
        React.createElement(DropDownItem, { className: 'item wide ' + dropDownActiveClass(blockType === 'bullet'), onClick: () => formatBulletList(editor, blockType) },
            React.createElement("div", { className: 'icon-text-container' },
                React.createElement("i", { className: 'icon bullet-list' }),
                React.createElement("span", { className: 'text' }, "Bullet List"))),
        React.createElement(DropDownItem, { className: 'item wide ' + dropDownActiveClass(blockType === 'number'), onClick: () => formatNumberedList(editor, blockType) },
            React.createElement("div", { className: 'icon-text-container' },
                React.createElement("i", { className: 'icon numbered-list' }),
                React.createElement("span", { className: 'text' }, "Numbered List"))),
        React.createElement(DropDownItem, { className: 'item wide ' + dropDownActiveClass(blockType === 'check'), onClick: () => formatCheckList(editor, blockType) },
            React.createElement("div", { className: 'icon-text-container' },
                React.createElement("i", { className: 'icon check-list' }),
                React.createElement("span", { className: 'text' }, "Check List"))),
        React.createElement(DropDownItem, { className: 'item wide ' + dropDownActiveClass(blockType === 'quote'), onClick: () => formatQuote(editor, blockType) },
            React.createElement("div", { className: 'icon-text-container' },
                React.createElement("i", { className: 'icon quote' }),
                React.createElement("span", { className: 'text' }, "Quote"))),
        React.createElement(DropDownItem, { className: 'item wide ' + dropDownActiveClass(blockType === 'code'), onClick: () => formatCode(editor, blockType) },
            React.createElement("div", { className: 'icon-text-container' },
                React.createElement("i", { className: 'icon code' }),
                React.createElement("span", { className: 'text' }, "Code Block")))));
}
function Divider() {
    return React.createElement("div", { className: 'divider' });
}
function FontDropDown({ editor, value, style, disabled = false, }) {
    const handleClick = useCallback((option) => {
        editor.update(() => {
            const selection = $getSelection();
            if (selection !== null) {
                $patchStyleText(selection, {
                    [style]: option,
                });
            }
        });
    }, [editor, style]);
    const buttonAriaLabel = style === 'font-family'
        ? 'Formatting options for font family'
        : 'Formatting options for font size';
    return (React.createElement(DropDown, { disabled: disabled, buttonClassName: 'toolbar-item ' + style, buttonLabel: value, buttonIconClassName: style === 'font-family' ? 'icon block-type font-family' : '', buttonAriaLabel: buttonAriaLabel }, (style === 'font-family' ? FONT_FAMILY_OPTIONS : FONT_SIZE_OPTIONS).map(([option, text]) => (React.createElement(DropDownItem, { className: `item ${dropDownActiveClass(value === option)} ${style === 'font-size' ? 'fontsize-item' : ''}`, onClick: () => handleClick(option), key: option },
        React.createElement("span", { className: 'text' }, text))))));
}
function ElementFormatDropdown({ editor, value, isRTL, disabled = false, }) {
    const formatOption = ELEMENT_FORMAT_OPTIONS[value || 'left'];
    return (React.createElement(DropDown, { disabled: disabled, buttonLabel: formatOption.name, buttonIconClassName: `icon ${isRTL ? formatOption.iconRTL : formatOption.icon}`, buttonClassName: 'toolbar-item spaced alignment', buttonAriaLabel: 'Formatting options for text alignment' },
        React.createElement(DropDownItem, { onClick: () => {
                editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
            }, className: 'item wide' },
            React.createElement("div", { className: 'icon-text-container' },
                React.createElement("i", { className: 'icon left-align' }),
                React.createElement("span", { className: 'text' }, "Left Align"))),
        React.createElement(DropDownItem, { onClick: () => {
                editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
            }, className: 'item wide' },
            React.createElement("div", { className: 'icon-text-container' },
                React.createElement("i", { className: 'icon center-align' }),
                React.createElement("span", { className: 'text' }, "Center Align"))),
        React.createElement(DropDownItem, { onClick: () => {
                editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
            }, className: 'item wide' },
            React.createElement("div", { className: 'icon-text-container' },
                React.createElement("i", { className: 'icon right-align' }),
                React.createElement("span", { className: 'text' }, "Right Align"))),
        React.createElement(DropDownItem, { onClick: () => {
                editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
            }, className: 'item wide' },
            React.createElement("div", { className: 'icon-text-container' },
                React.createElement("i", { className: 'icon justify-align' }),
                React.createElement("span", { className: 'text' }, "Justify Align"))),
        React.createElement(DropDownItem, { onClick: () => {
                editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'start');
            }, className: 'item wide' },
            React.createElement("i", { className: `icon ${isRTL
                    ? ELEMENT_FORMAT_OPTIONS.start.iconRTL
                    : ELEMENT_FORMAT_OPTIONS.start.icon}` }),
            React.createElement("span", { className: 'text' }, "Start Align")),
        React.createElement(DropDownItem, { onClick: () => {
                editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'end');
            }, className: 'item wide' },
            React.createElement("i", { className: `icon ${isRTL
                    ? ELEMENT_FORMAT_OPTIONS.end.iconRTL
                    : ELEMENT_FORMAT_OPTIONS.end.icon}` }),
            React.createElement("span", { className: 'text' }, "End Align")),
        React.createElement(Divider, null),
        React.createElement(DropDownItem, { onClick: () => {
                editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
            }, className: 'item wide' },
            React.createElement("div", { className: 'icon-text-container' },
                React.createElement("i", { className: 'icon ' + (isRTL ? 'indent' : 'outdent') }),
                React.createElement("span", { className: 'text' }, "Outdent"))),
        React.createElement(DropDownItem, { onClick: () => {
                editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
            }, className: 'item wide' },
            React.createElement("div", { className: 'icon-text-container' },
                React.createElement("i", { className: 'icon ' + (isRTL ? 'outdent' : 'indent') }),
                React.createElement("span", { className: 'text' }, "Indent")))));
}
export default function ToolbarPlugin({ editor, activeEditor, setActiveEditor, setIsLinkEditMode, }) {
    const [selectedElementKey, setSelectedElementKey] = useState(null);
    const [modal, showModal] = useModal();
    const [isEditable, setIsEditable] = useState(() => editor.isEditable());
    const { toolbarState, updateToolbarState } = useToolbarState();
    const $updateToolbar = useCallback(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            if (activeEditor !== editor && $isEditorIsNestedEditor(activeEditor)) {
                const rootElement = activeEditor.getRootElement();
                updateToolbarState('isImageCaption', !!rootElement?.parentElement?.classList.contains('image-caption-container'));
            }
            else {
                updateToolbarState('isImageCaption', false);
            }
            const anchorNode = selection.anchor.getNode();
            let element = anchorNode.getKey() === 'root'
                ? anchorNode
                : $findMatchingParent(anchorNode, e => {
                    const parent = e.getParent();
                    return parent !== null && $isRootOrShadowRoot(parent);
                });
            if (element === null) {
                element = anchorNode.getTopLevelElementOrThrow();
            }
            const elementKey = element.getKey();
            const elementDOM = activeEditor.getElementByKey(elementKey);
            updateToolbarState('isRTL', $isParentElementRTL(selection));
            // Update links
            const node = getSelectedNode(selection);
            const parent = node.getParent();
            const isLink = $isLinkNode(parent) || $isLinkNode(node);
            updateToolbarState('isLink', isLink);
            const tableNode = $findMatchingParent(node, $isTableNode);
            if ($isTableNode(tableNode)) {
                updateToolbarState('rootType', 'table');
            }
            else {
                updateToolbarState('rootType', 'root');
            }
            if (elementDOM !== null) {
                setSelectedElementKey(elementKey);
                if ($isListNode(element)) {
                    const parentList = $getNearestNodeOfType(anchorNode, ListNode);
                    const type = parentList
                        ? parentList.getListType()
                        : element.getListType();
                    updateToolbarState('blockType', type);
                }
                else {
                    const type = $isHeadingNode(element)
                        ? element.getTag()
                        : element.getType();
                    if (type in blockTypeToBlockName) {
                        updateToolbarState('blockType', type);
                    }
                    if ($isCodeNode(element)) {
                        const language = element.getLanguage();
                        updateToolbarState('codeLanguage', language ? CODE_LANGUAGE_MAP[language] || language : '');
                        return;
                    }
                }
            }
            // Handle buttons
            updateToolbarState('fontColor', $getSelectionStyleValueForProperty(selection, 'color', '#000'));
            updateToolbarState('bgColor', $getSelectionStyleValueForProperty(selection, 'background-color', '#fff'));
            updateToolbarState('fontFamily', $getSelectionStyleValueForProperty(selection, 'font-family', 'Arial'));
            let matchingParent;
            if ($isLinkNode(parent)) {
                // If node is a link, we need to fetch the parent paragraph node to set format
                matchingParent = $findMatchingParent(node, parentNode => $isElementNode(parentNode) && !parentNode.isInline());
            }
            // If matchingParent is a valid node, pass it's format type
            updateToolbarState('elementFormat', $isElementNode(matchingParent)
                ? matchingParent.getFormatType()
                : $isElementNode(node)
                    ? node.getFormatType()
                    : parent?.getFormatType() || 'left');
        }
        if ($isRangeSelection(selection) || $isTableSelection(selection)) {
            // Update text format
            updateToolbarState('isBold', selection.hasFormat('bold'));
            updateToolbarState('isItalic', selection.hasFormat('italic'));
            updateToolbarState('isUnderline', selection.hasFormat('underline'));
            updateToolbarState('isStrikethrough', selection.hasFormat('strikethrough'));
            updateToolbarState('isSubscript', selection.hasFormat('subscript'));
            updateToolbarState('isSuperscript', selection.hasFormat('superscript'));
            updateToolbarState('isHighlight', selection.hasFormat('highlight'));
            updateToolbarState('isCode', selection.hasFormat('code'));
            updateToolbarState('fontSize', $getSelectionStyleValueForProperty(selection, 'font-size', '15px'));
            updateToolbarState('isLowercase', selection.hasFormat('lowercase'));
            updateToolbarState('isUppercase', selection.hasFormat('uppercase'));
            updateToolbarState('isCapitalize', selection.hasFormat('capitalize'));
        }
    }, [activeEditor, editor, updateToolbarState]);
    useEffect(() => {
        return editor.registerCommand(SELECTION_CHANGE_COMMAND, (_payload, newEditor) => {
            setActiveEditor(newEditor);
            $updateToolbar();
            return false;
        }, COMMAND_PRIORITY_CRITICAL);
    }, [editor, $updateToolbar, setActiveEditor]);
    useEffect(() => {
        activeEditor.getEditorState().read(() => {
            $updateToolbar();
        });
    }, [activeEditor, $updateToolbar]);
    useEffect(() => {
        return mergeRegister(editor.registerEditableListener(editable => {
            setIsEditable(editable);
        }), activeEditor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => {
                $updateToolbar();
            });
        }), activeEditor.registerCommand(CAN_UNDO_COMMAND, payload => {
            updateToolbarState('canUndo', payload);
            return false;
        }, COMMAND_PRIORITY_CRITICAL), activeEditor.registerCommand(CAN_REDO_COMMAND, payload => {
            updateToolbarState('canRedo', payload);
            return false;
        }, COMMAND_PRIORITY_CRITICAL));
    }, [$updateToolbar, activeEditor, editor, updateToolbarState]);
    const applyStyleText = useCallback((styles, skipHistoryStack) => {
        activeEditor.update(() => {
            const selection = $getSelection();
            if (selection !== null) {
                $patchStyleText(selection, styles);
            }
        }, skipHistoryStack ? { tag: 'historic' } : {});
    }, [activeEditor]);
    const onFontColorSelect = useCallback((value, skipHistoryStack) => {
        applyStyleText({ color: value }, skipHistoryStack);
    }, [applyStyleText]);
    const onBgColorSelect = useCallback((value, skipHistoryStack) => {
        applyStyleText({ 'background-color': value }, skipHistoryStack);
    }, [applyStyleText]);
    const insertLink = useCallback(() => {
        if (!toolbarState.isLink) {
            setIsLinkEditMode(true);
            activeEditor.dispatchCommand(TOGGLE_LINK_COMMAND, sanitizeUrl('https://'));
        }
        else {
            setIsLinkEditMode(false);
            activeEditor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
        }
    }, [activeEditor, setIsLinkEditMode, toolbarState.isLink]);
    const onCodeLanguageSelect = useCallback((value) => {
        activeEditor.update(() => {
            if (selectedElementKey !== null) {
                const node = $getNodeByKey(selectedElementKey);
                if ($isCodeNode(node)) {
                    node.setLanguage(value);
                }
            }
        });
    }, [activeEditor, selectedElementKey]);
    const insertGifOnClick = (payload) => {
        activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, payload);
    };
    const canViewerSeeInsertDropdown = !toolbarState.isImageCaption;
    const canViewerSeeInsertCodeButton = !toolbarState.isImageCaption;
    return (React.createElement("div", { className: 'toolbar' },
        React.createElement("button", { disabled: !toolbarState.canUndo || !isEditable, onClick: () => {
                activeEditor.dispatchCommand(UNDO_COMMAND, undefined);
            }, title: 'Undo (Ctrl+Z)', type: 'button', className: 'toolbar-item spaced', "aria-label": 'Undo' },
            React.createElement("i", { className: 'format undo' })),
        React.createElement("button", { disabled: !toolbarState.canRedo || !isEditable, onClick: () => {
                activeEditor.dispatchCommand(REDO_COMMAND, undefined);
            }, title: 'Redo (Ctrl+Y)', type: 'button', className: 'toolbar-item', "aria-label": 'Redo' },
            React.createElement("i", { className: 'format redo' })),
        React.createElement(Divider, null),
        toolbarState.blockType in blockTypeToBlockName &&
            activeEditor === editor && (React.createElement(React.Fragment, null,
            React.createElement(BlockFormatDropDown, { disabled: !isEditable, blockType: toolbarState.blockType, rootType: toolbarState.rootType, editor: activeEditor }),
            React.createElement(Divider, null))),
        toolbarState.blockType === 'code' ? (React.createElement(DropDown, { disabled: !isEditable, buttonClassName: 'toolbar-item code-language', buttonLabel: getLanguageFriendlyName(toolbarState.codeLanguage), buttonAriaLabel: 'Select language' }, CODE_LANGUAGE_OPTIONS.map(([value, name]) => {
            return (React.createElement(DropDownItem, { className: `item ${dropDownActiveClass(value === toolbarState.codeLanguage)}`, onClick: () => onCodeLanguageSelect(value), key: value },
                React.createElement("span", { className: 'text' }, name)));
        }))) : (React.createElement(React.Fragment, null,
            React.createElement(FontDropDown, { disabled: !isEditable, style: 'font-family', value: toolbarState.fontFamily, editor: activeEditor }),
            React.createElement(Divider, null),
            React.createElement(FontSize, { selectionFontSize: toolbarState.fontSize.slice(0, -2), editor: activeEditor, disabled: !isEditable }),
            React.createElement(Divider, null),
            React.createElement("button", { disabled: !isEditable, onClick: () => {
                    activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
                }, className: 'toolbar-item spaced ' + (toolbarState.isBold ? 'active' : ''), title: 'Bold', type: 'button', "aria-label": 'Format text as bold' },
                React.createElement("i", { className: 'format bold' })),
            React.createElement("button", { disabled: !isEditable, onClick: () => {
                    activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
                }, className: 'toolbar-item spaced ' + (toolbarState.isItalic ? 'active' : ''), title: 'Italic', type: 'button', "aria-label": 'Format text as italics' },
                React.createElement("i", { className: 'format italic' })),
            React.createElement("button", { disabled: !isEditable, onClick: () => {
                    activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
                }, className: 'toolbar-item spaced ' +
                    (toolbarState.isUnderline ? 'active' : ''), title: 'Underline', type: 'button', "aria-label": 'Format text to underlined' },
                React.createElement("i", { className: 'format underline' })),
            canViewerSeeInsertCodeButton && (React.createElement("button", { disabled: !isEditable, onClick: () => {
                    activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
                }, className: 'toolbar-item spaced ' + (toolbarState.isCode ? 'active' : ''), title: 'Insert code block', type: 'button', "aria-label": 'Insert code block' },
                React.createElement("i", { className: 'format code' }))),
            React.createElement("button", { disabled: !isEditable, onClick: insertLink, className: 'toolbar-item spaced ' + (toolbarState.isLink ? 'active' : ''), "aria-label": 'Insert link', title: 'Insert link', type: 'button' },
                React.createElement("i", { className: 'format link' })),
            React.createElement(DropdownColorPicker, { disabled: !isEditable, buttonClassName: 'toolbar-item color-picker', buttonAriaLabel: 'Formatting text color', buttonIconClassName: 'icon font-color', color: toolbarState.fontColor, onChange: onFontColorSelect, title: 'text color' }),
            React.createElement(DropdownColorPicker, { disabled: !isEditable, buttonClassName: 'toolbar-item color-picker', buttonAriaLabel: 'Formatting background color', buttonIconClassName: 'icon bg-color', color: toolbarState.bgColor, onChange: onBgColorSelect, title: 'bg color' }),
            React.createElement(DropDown, { disabled: !isEditable, buttonClassName: 'toolbar-item spaced', buttonLabel: '', buttonAriaLabel: 'Formatting options for additional text styles', buttonIconClassName: 'icon dropdown-more' },
                React.createElement(DropDownItem, { onClick: () => {
                        activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'lowercase');
                    }, className: 'item wide ' + dropDownActiveClass(toolbarState.isLowercase), title: 'Lowercase', "aria-label": 'Format text to lowercase' },
                    React.createElement("div", { className: 'icon-text-container' },
                        React.createElement("i", { className: 'icon lowercase' }),
                        React.createElement("span", { className: 'text' }, "Lowercase"))),
                React.createElement(DropDownItem, { onClick: () => {
                        activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'uppercase');
                    }, className: 'item wide ' + dropDownActiveClass(toolbarState.isUppercase), title: 'Uppercase', "aria-label": 'Format text to uppercase' },
                    React.createElement("div", { className: 'icon-text-container' },
                        React.createElement("i", { className: 'icon uppercase' }),
                        React.createElement("span", { className: 'text' }, "Uppercase"))),
                React.createElement(DropDownItem, { onClick: () => {
                        activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'capitalize');
                    }, className: 'item wide ' + dropDownActiveClass(toolbarState.isCapitalize), title: 'Capitalize', "aria-label": 'Format text to capitalize' },
                    React.createElement("div", { className: 'icon-text-container' },
                        React.createElement("i", { className: 'icon capitalize' }),
                        React.createElement("span", { className: 'text' }, "Capitalize"))),
                React.createElement(DropDownItem, { onClick: () => {
                        activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
                    }, className: 'item wide ' + dropDownActiveClass(toolbarState.isStrikethrough), title: 'Strikethrough', "aria-label": 'Format text with a strikethrough' },
                    React.createElement("div", { className: 'icon-text-container' },
                        React.createElement("i", { className: 'icon strikethrough' }),
                        React.createElement("span", { className: 'text' }, "Strikethrough"))),
                React.createElement(DropDownItem, { onClick: () => {
                        activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript');
                    }, className: 'item wide ' + dropDownActiveClass(toolbarState.isSubscript), title: 'Subscript', "aria-label": 'Format text with a subscript' },
                    React.createElement("div", { className: 'icon-text-container' },
                        React.createElement("i", { className: 'icon subscript' }),
                        React.createElement("span", { className: 'text' }, "Subscript"))),
                React.createElement(DropDownItem, { onClick: () => {
                        activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript');
                    }, className: 'item wide ' + dropDownActiveClass(toolbarState.isSuperscript), title: 'Superscript', "aria-label": 'Format text with a superscript' },
                    React.createElement("div", { className: 'icon-text-container' },
                        React.createElement("i", { className: 'icon superscript' }),
                        React.createElement("span", { className: 'text' }, "Superscript"))),
                React.createElement(DropDownItem, { onClick: () => {
                        activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'highlight');
                    }, className: 'item wide ' + dropDownActiveClass(toolbarState.isHighlight), title: 'Highlight', "aria-label": 'Format text with a highlight' },
                    React.createElement("div", { className: 'icon-text-container' },
                        React.createElement("i", { className: 'icon highlight' }),
                        React.createElement("span", { className: 'text' }, "Highlight"))),
                React.createElement(DropDownItem, { onClick: () => clearFormatting(activeEditor), className: 'item wide', title: 'Clear text formatting', "aria-label": 'Clear all text formatting' },
                    React.createElement("div", { className: 'icon-text-container' },
                        React.createElement("i", { className: 'icon clear' }),
                        React.createElement("span", { className: 'text' }, "Clear Formatting")))),
            canViewerSeeInsertDropdown && (React.createElement(React.Fragment, null,
                React.createElement(Divider, null),
                React.createElement(DropDown, { disabled: !isEditable, buttonClassName: 'toolbar-item spaced', buttonLabel: 'Insert', buttonAriaLabel: 'Insert specialized editor node', buttonIconClassName: 'icon plus' },
                    React.createElement(DropDownItem, { onClick: () => {
                            activeEditor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
                        }, className: 'item' },
                        React.createElement("i", { className: 'icon horizontal-rule' }),
                        React.createElement("span", { className: 'text' }, "Horizontal Rule")),
                    React.createElement(DropDownItem, { onClick: () => {
                            showModal('Insert Image', onClose => (React.createElement(InsertImageDialog, { activeEditor: activeEditor, onClose: onClose })));
                        }, className: 'item' },
                        React.createElement("i", { className: 'icon image' }),
                        React.createElement("span", { className: 'text' }, "Image")),
                    React.createElement(DropDownItem, { onClick: () => {
                            showModal('Insert Inline Image', onClose => (React.createElement(InsertInlineImageDialog, { activeEditor: activeEditor, onClose: onClose })));
                        }, className: 'item' },
                        React.createElement("i", { className: 'icon image' }),
                        React.createElement("span", { className: 'text' }, "Inline Image")),
                    React.createElement(DropDownItem, { onClick: () => insertGifOnClick({
                            altText: 'Cat typing on a laptop',
                            src: '../../images/cat-typing.gif',
                        }), className: 'item' },
                        React.createElement("i", { className: 'icon gif' }),
                        React.createElement("span", { className: 'text' }, "GIF")),
                    React.createElement(DropDownItem, { onClick: () => {
                            showModal('Insert Poll', onClose => (React.createElement(InsertPollDialog, { activeEditor: activeEditor, onClose: onClose })));
                        }, className: 'item' },
                        React.createElement("i", { className: 'icon poll' }),
                        React.createElement("span", { className: 'text' }, "Poll")),
                    React.createElement(DropDownItem, { onClick: () => {
                            showModal('Insert Columns Layout', onClose => (React.createElement(InsertLayoutDialog, { activeEditor: activeEditor, onClose: onClose })));
                        }, className: 'item' },
                        React.createElement("i", { className: 'icon columns' }),
                        React.createElement("span", { className: 'text' }, "Columns Layout")),
                    EmbedConfigs.map(embedConfig => (React.createElement(DropDownItem, { key: embedConfig.type, onClick: () => {
                            activeEditor.dispatchCommand(INSERT_EMBED_COMMAND, embedConfig.type);
                        }, className: 'item' },
                        embedConfig.icon,
                        React.createElement("span", { className: 'text' }, embedConfig.contentName))))))))),
        React.createElement(Divider, null),
        React.createElement(ElementFormatDropdown, { disabled: !isEditable, value: toolbarState.elementFormat, editor: activeEditor, isRTL: toolbarState.isRTL }),
        modal));
}
