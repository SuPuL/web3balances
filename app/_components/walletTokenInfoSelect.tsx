"use client";
import { Button, MenuItem, MenuItemProps } from "@blueprintjs/core";
import {
  ItemPredicate,
  ItemRenderer,
  ItemRendererProps,
  Select,
} from "@blueprintjs/select";

import { WalletTokenInfo, areInfoEq, highlightText } from "@app/_common";

import _ from "lodash";
import { useCallback, useEffect, useState } from "react";

const filterWallet: ItemPredicate<WalletTokenInfo> = (
  query,
  info,
  _index,
  exactMatch
) => {
  const normalizedTitle = info.name.toLowerCase();
  const normalizedQuery = query.toLowerCase();

  if (exactMatch) {
    return normalizedTitle === normalizedQuery;
  } else {
    return (
      `${info.symbol}. ${normalizedTitle} (${info.tokenAddress})`.indexOf(
        normalizedQuery
      ) >= 0
    );
  }
};

function getWalletItemProps(
  info: WalletTokenInfo,
  { handleClick, handleFocus, modifiers, query, ref }: ItemRendererProps
): MenuItemProps & React.Attributes {
  return {
    active: modifiers.active,
    disabled: modifiers.disabled,
    onClick: handleClick,
    onFocus: handleFocus,
    ref,
    label: info.name.toString(),
    text: highlightText(`${info.symbol}`, query),
  };
}

type WalletTokenInfoSelectProps = {
  selected?: WalletTokenInfo;
  items?: WalletTokenInfo[];
  onItemSelect?: (info: WalletTokenInfo) => void;
};

export function WalletTokenInfoSelect({
  selected,
  items: itemsIn = [],
  onItemSelect,
}: WalletTokenInfoSelectProps) {
  const [items, setItems] = useState([...itemsIn]);
  const [selectedWallet, setSelectedWallet] = useState(selected);

  const updateWallet = useCallback(
    (info?: WalletTokenInfo) => {
      if (!info) return;

      setSelectedWallet(info);
      onItemSelect?.(info);
    },
    [onItemSelect]
  );

  useEffect(() => {
    if (!itemsIn) return;
    setItems([...itemsIn]);
  }, [itemsIn]);

  useEffect(() => {
    setSelectedWallet(selected);
  }, [selected]);

  const handleItemSelect = useCallback(
    (info: WalletTokenInfo) => {
      updateWallet({ ...info });
    },
    [updateWallet]
  );

  const itemRenderer = useCallback<ItemRenderer<WalletTokenInfo>>(
    (info, props) => {
      if (!props.modifiers.matchesPredicate) {
        return null;
      }

      return (
        <MenuItem
          key={_(info).pick(["chain", "name", "symbol"]).values().join("_")}
          {...getWalletItemProps(info, props)}
          roleStructure="listoption"
          selected={areInfoEq(selectedWallet, info)}
        />
      );
    },
    [selectedWallet]
  );

  return (
    <Select<WalletTokenInfo>
      itemPredicate={filterWallet}
      itemRenderer={itemRenderer}
      items={items}
      itemsEqual={areInfoEq}
      menuProps={{ "aria-label": "wallets" }}
      noResults={
        <MenuItem
          key={"no-results"}
          disabled={true}
          text="No results."
          roleStructure="listoption"
        />
      }
      onItemSelect={handleItemSelect}
    >
      <Button
        rightIcon="caret-down"
        text={
          selectedWallet
            ? `${selectedWallet.symbol}: ${selectedWallet.name}`
            : "(No info selected)"
        }
      />
    </Select>
  );
}
