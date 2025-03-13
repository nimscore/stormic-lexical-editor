import React from 'react';
import './index.css';
import { DraggableBlockPlugin_EXPERIMENTAL } from '@lexical/react/LexicalDraggableBlockPlugin';
import { useRef } from 'react';
const DRAGGABLE_BLOCK_MENU_CLASSNAME = 'draggable-block-menu';
function isOnMenu(element) {
    return !!element.closest(`.${DRAGGABLE_BLOCK_MENU_CLASSNAME}`);
}
export default function DraggableBlockPlugin({ anchorElem = document.body, }) {
    const menuRef = useRef(null);
    const targetLineRef = useRef(null);
    return (React.createElement(DraggableBlockPlugin_EXPERIMENTAL, { anchorElem: anchorElem, menuRef: menuRef, targetLineRef: targetLineRef, menuComponent: React.createElement("div", { ref: menuRef, className: 'icon draggable-block-menu' },
            React.createElement("div", { className: 'icon' })), targetLineComponent: React.createElement("div", { ref: targetLineRef, className: 'draggable-block-target-line' }), isOnMenu: isOnMenu }));
}
