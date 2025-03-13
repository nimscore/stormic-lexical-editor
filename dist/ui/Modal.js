/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import './Modal.css';
import { isDOMNode } from 'lexical';
import * as React from 'react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
function PortalImpl({ onClose, children, title, closeOnClickOutside, }) {
    const modalRef = useRef(null);
    useEffect(() => {
        if (modalRef.current !== null) {
            modalRef.current.focus();
        }
    }, []);
    useEffect(() => {
        let modalOverlayElement = null;
        const handler = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        const clickOutsideHandler = (event) => {
            const target = event.target;
            if (modalRef.current !== null &&
                isDOMNode(target) &&
                !modalRef.current.contains(target) &&
                closeOnClickOutside) {
                onClose();
            }
        };
        const modelElement = modalRef.current;
        if (modelElement !== null) {
            modalOverlayElement = modelElement.parentElement;
            if (modalOverlayElement !== null) {
                modalOverlayElement.addEventListener('click', clickOutsideHandler);
            }
        }
        window.addEventListener('keydown', handler);
        return () => {
            window.removeEventListener('keydown', handler);
            if (modalOverlayElement !== null) {
                modalOverlayElement?.removeEventListener('click', clickOutsideHandler);
            }
        };
    }, [closeOnClickOutside, onClose]);
    return (React.createElement("div", { className: "Modal__overlay", role: "dialog" },
        React.createElement("div", { className: "Modal__modal", tabIndex: -1, ref: modalRef },
            React.createElement("h2", { className: "Modal__title" }, title),
            React.createElement("button", { className: "Modal__closeButton", "aria-label": "Close modal", type: "button", onClick: onClose }, "X"),
            React.createElement("div", { className: "Modal__content" }, children))));
}
export default function Modal({ onClose, children, title, closeOnClickOutside = false, }) {
    return createPortal(React.createElement(PortalImpl, { onClose: onClose, title: title, closeOnClickOutside: closeOnClickOutside }, children), document.body);
}
