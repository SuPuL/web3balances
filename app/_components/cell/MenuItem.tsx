/*
 * Copyright 2016 Palantir Technologies, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from "react";

import {
  MenuItem as BSMenuItem,
  type MenuItemProps as BSMenuItemProps,
} from "@blueprintjs/core";
import { MenuContext, Regions } from "@blueprintjs/table";

export interface MenuItemProps extends Omit<BSMenuItemProps, "onCopy"> {
  /**
   * The menu context that launched the menu.
   */
  context: MenuContext;

  /**
   * A callback that returns the data for a specific cell. This need not
   * match the value displayed in the `<Cell>` component. The value will be
   * invisibly added as `textContent` into the DOM before copying.
   */
  getCellData: (row: number, col: number) => any;

  onClick?: (value: any) => void;
}

export class MenuItem extends React.PureComponent<MenuItemProps> {
  public render() {
    const { getCellData, onClick, ...menuItemProps } = this.props;
    return <BSMenuItem {...menuItemProps} onClick={this.handleClick} />;
  }

  private handleClick = () => {
    const { context, getCellData, onClick } = this.props;
    const cells = context.getUniqueCells();
    const sparse = Regions.sparseMapCells(cells, getCellData);
    onClick?.(sparse?.[0]);
  };
}
