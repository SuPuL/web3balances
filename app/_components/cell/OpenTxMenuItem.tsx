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

import { MenuItem, type MenuItemProps } from "@blueprintjs/core";
import { MenuContext, Regions } from "@blueprintjs/table";
import { Chain } from "@/_common";

export interface OpenTxMenuItemProps extends Omit<MenuItemProps, "onCopy"> {
  /**
   * The menu context that launched the menu.
   */
  context: MenuContext;

  /**
   * A callback that returns the data for a specific cell. This need not
   * match the value displayed in the `<Cell>` component. The value will be
   * invisibly added as `textContent` into the DOM before copying.
   */
  getCellData: (
    row: number,
    col: number
  ) => {
    tx: string;
    chain: Chain;
  };
}

export class OpenTxMenuItem extends React.PureComponent<OpenTxMenuItemProps> {
  public render() {
    const { getCellData, ...menuItemProps } = this.props;
    return <MenuItem {...menuItemProps} onClick={this.handleClick} />;
  }

  private handleClick = () => {
    const { context, getCellData } = this.props;
    const cells = context.getUniqueCells();
    const sparse = Regions.sparseMapCells(cells, getCellData);
    const firstCell = sparse?.[0]?.[0];
    if (firstCell) {
      let url = "";
      switch (firstCell.chain) {
        case "ETH":
          url = `https://etherscan.io/tx/${firstCell.tx}`;
          break;
        case "BNB":
          url = `https://bscscan.com/tx/${firstCell.tx}`;
          break;
        case "MATIC":
          url = `https://polygonscan.com/tx/${firstCell.tx}`;
          break;
        case "SOLANA":
          url = `https://solscan.io/tx/${firstCell.tx}`;
        default:
          url = "";
      }

      if (url) {
        window.open(url, "_blank");
      }
    }
  };
}
