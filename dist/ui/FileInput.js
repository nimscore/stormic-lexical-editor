/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import './Input.css';
import * as React from 'react';
export default function FileInput({ accept, label, onChange, 'data-test-id': dataTestId, }) {
    return (React.createElement("div", { className: "Input__wrapper" },
        React.createElement("label", { className: "Input__label" }, label),
        React.createElement("input", { type: "file", accept: accept, className: "Input__input", onChange: (e) => onChange(e.target.files), "data-test-id": dataTestId })));
}
