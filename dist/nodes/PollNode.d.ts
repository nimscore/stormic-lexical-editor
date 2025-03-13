/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { JSX } from 'react';
import { DecoratorNode, DOMConversionMap, DOMExportOutput, LexicalNode, SerializedLexicalNode, Spread } from 'lexical';
export type Options = ReadonlyArray<Option>;
export type Option = Readonly<{
    text: string;
    uid: string;
    votes: Array<number>;
}>;
export declare function createPollOption(text?: string): Option;
export type SerializedPollNode = Spread<{
    question: string;
    options: Options;
}, SerializedLexicalNode>;
export declare class PollNode extends DecoratorNode<JSX.Element> {
    static getType(): string;
    static clone(node: PollNode): PollNode;
    static importJSON(serializedNode: SerializedPollNode): PollNode;
    getQuestion: (this: this) => string;
    setQuestion: (this: this, valueOrUpdater: import("lexical").ValueOrUpdater<string>) => this;
    getOptions: (this: this) => Options;
    setOptions: (this: this, valueOrUpdater: import("lexical").ValueOrUpdater<Options>) => this;
    addOption(option: Option): this;
    deleteOption(option: Option): this;
    setOptionText(option: Option, text: string): this;
    toggleVote(option: Option, clientID: number): this;
    static importDOM(): DOMConversionMap | null;
    exportDOM(): DOMExportOutput;
    createDOM(): HTMLElement;
    updateDOM(): false;
    decorate(): JSX.Element;
}
export declare function $createPollNode(question: string, options: Options): PollNode;
export declare function $isPollNode(node: LexicalNode | null | undefined): node is PollNode;
