/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import './index.css';
import { LexicalEditor } from 'lexical';
import React from 'react';
interface Props {
    lang: string;
    editor: LexicalEditor;
    getCodeDOMNode: () => HTMLElement | null;
}
export declare function canBePrettier(lang: string): boolean;
export declare function PrettierButton({ lang, editor, getCodeDOMNode }: Props): React.JSX.Element;
export {};
