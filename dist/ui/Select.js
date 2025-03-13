/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import './Select.css';
import * as React from 'react';
export default function Select({ children, label, className, ...other }) {
    return (React.createElement("div", { className: "Input__wrapper" },
        React.createElement("label", { style: { marginTop: '-1em' }, className: "Input__label" }, label),
        React.createElement("select", { ...other, className: className || 'select' }, children)));
}
