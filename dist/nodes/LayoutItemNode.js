/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { addClassNamesToElement } from '@lexical/utils';
import { ElementNode } from 'lexical';
function $convertLayoutItemElement() {
    return { node: $createLayoutItemNode() };
}
export class LayoutItemNode extends ElementNode {
    static getType() {
        return 'layout-item';
    }
    static clone(node) {
        return new LayoutItemNode(node.__key);
    }
    createDOM(config) {
        const dom = document.createElement('div');
        dom.setAttribute('data-lexical-layout-item', 'true');
        if (typeof config.theme.layoutItem === 'string') {
            addClassNamesToElement(dom, config.theme.layoutItem);
        }
        return dom;
    }
    updateDOM() {
        return false;
    }
    static importDOM() {
        return {
            div: (domNode) => {
                if (!domNode.hasAttribute('data-lexical-layout-item')) {
                    return null;
                }
                return {
                    conversion: $convertLayoutItemElement,
                    priority: 2,
                };
            },
        };
    }
    static importJSON(serializedNode) {
        return $createLayoutItemNode();
        // .updateFromJSON(serializedNode);
    }
    isShadowRoot() {
        return true;
    }
}
export function $createLayoutItemNode() {
    return new LayoutItemNode();
}
export function $isLayoutItemNode(node) {
    return node instanceof LayoutItemNode;
}
