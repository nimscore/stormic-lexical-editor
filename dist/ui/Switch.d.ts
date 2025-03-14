/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { JSX } from 'react';
import * as React from 'react';
export default function Switch({ checked, onClick, text, id, }: Readonly<{
    checked: boolean;
    id?: string;
    onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    text: string;
}>): JSX.Element;
