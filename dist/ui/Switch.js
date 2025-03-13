/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import * as React from 'react';
import { useMemo } from 'react';
export default function Switch({ checked, onClick, text, id, }) {
    const buttonId = useMemo(() => 'id_' + Math.floor(Math.random() * 10000), []);
    return (React.createElement("div", { className: "switch", id: id },
        React.createElement("label", { htmlFor: buttonId }, text),
        React.createElement("button", { role: "switch", "aria-checked": checked, id: buttonId, onClick: onClick },
            React.createElement("span", null))));
}
