/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { makeStateWrapper } from '@lexical/utils';
import { createState, DecoratorNode, } from 'lexical';
import * as React from 'react';
const PollComponent = React.lazy(() => import('./PollComponent'));
function createUID() {
    return Math.random()
        .toString(36)
        .replace(/[^a-z]+/g, '')
        .substring(0, 5);
}
export function createPollOption(text = '') {
    return {
        text,
        uid: createUID(),
        votes: [],
    };
}
function cloneOption(option, text, votes) {
    return {
        text,
        uid: option.uid,
        votes: votes || Array.from(option.votes),
    };
}
function $convertPollElement(domNode) {
    const question = domNode.getAttribute('data-lexical-poll-question');
    const options = domNode.getAttribute('data-lexical-poll-options');
    if (question !== null && options !== null) {
        const node = $createPollNode(question, JSON.parse(options));
        return { node };
    }
    return null;
}
function parseOptions(json) {
    const options = [];
    if (Array.isArray(json)) {
        for (const row of json) {
            if (row &&
                typeof row.text === 'string' &&
                typeof row.uid === 'string' &&
                Array.isArray(row.votes) &&
                row.votes.every((v) => typeof v === 'number')) {
                options.push(row);
            }
        }
    }
    return options;
}
const questionState = makeStateWrapper(createState('question', {
    parse: v => (typeof v === 'string' ? v : ''),
}));
const optionsState = makeStateWrapper(createState('options', {
    isEqual: (a, b) => a.length === b.length && JSON.stringify(a) === JSON.stringify(b),
    parse: parseOptions,
}));
export class PollNode extends DecoratorNode {
    static getType() {
        return 'poll';
    }
    static clone(node) {
        return new PollNode(node.__key);
    }
    static importJSON(serializedNode) {
        return $createPollNode(serializedNode.question, serializedNode.options);
        // .updateFromJSON(serializedNode);
    }
    getQuestion = questionState.makeGetterMethod();
    setQuestion = questionState.makeSetterMethod();
    getOptions = optionsState.makeGetterMethod();
    setOptions = optionsState.makeSetterMethod();
    addOption(option) {
        return this.setOptions(options => [...options, option]);
    }
    deleteOption(option) {
        return this.setOptions(prevOptions => {
            const index = prevOptions.indexOf(option);
            if (index === -1) {
                return prevOptions;
            }
            const options = Array.from(prevOptions);
            options.splice(index, 1);
            return options;
        });
    }
    setOptionText(option, text) {
        return this.setOptions(prevOptions => {
            const clonedOption = cloneOption(option, text);
            const options = Array.from(prevOptions);
            const index = options.indexOf(option);
            options[index] = clonedOption;
            return options;
        });
    }
    toggleVote(option, clientID) {
        return this.setOptions(prevOptions => {
            const index = prevOptions.indexOf(option);
            if (index === -1) {
                return prevOptions;
            }
            const votes = option.votes;
            const votesClone = Array.from(votes);
            const voteIndex = votes.indexOf(clientID);
            if (voteIndex === -1) {
                votesClone.push(clientID);
            }
            else {
                votesClone.splice(voteIndex, 1);
            }
            const clonedOption = cloneOption(option, option.text, votesClone);
            const options = Array.from(prevOptions);
            options[index] = clonedOption;
            return options;
        });
    }
    static importDOM() {
        return {
            span: (domNode) => {
                if (!domNode.hasAttribute('data-lexical-poll-question')) {
                    return null;
                }
                return {
                    conversion: $convertPollElement,
                    priority: 2,
                };
            },
        };
    }
    exportDOM() {
        const element = document.createElement('span');
        element.setAttribute('data-lexical-poll-question', this.getQuestion());
        element.setAttribute('data-lexical-poll-options', JSON.stringify(this.getOptions()));
        return { element };
    }
    createDOM() {
        const elem = document.createElement('span');
        elem.style.display = 'inline-block';
        return elem;
    }
    updateDOM() {
        return false;
    }
    decorate() {
        return (React.createElement(PollComponent, { question: this.getQuestion(), options: this.getOptions(), nodeKey: this.__key }));
    }
}
export function $createPollNode(question, options) {
    return new PollNode().setQuestion(question).setOptions(options);
}
export function $isPollNode(node) {
    return node instanceof PollNode;
}
