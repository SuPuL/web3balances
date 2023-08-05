import { Button, MenuItem, MenuItemProps } from "@blueprintjs/core";
import {
  ItemPredicate,
  ItemRenderer,
  ItemRendererProps,
  Select,
} from "@blueprintjs/select";

import {
  Wallet,
  TokenInfo,
  areWalletsEq,
  areWalletsInfoEq,
  highlightText,
  isWalletEqInfo,
  toWallet,
} from "@/_common";
import _ from "lodash";
import { useCallback, useEffect, useState } from "react";

const filterWallet: ItemPredicate<TokenInfo> = (
  query,
  wallet,
  _index,
  exactMatch
) => {
  const normalizedTitle = wallet.name.toLowerCase();
  const normalizedQuery = query.toLowerCase();

  if (exactMatch) {
    return normalizedTitle === normalizedQuery;
  } else {
    return (
      `${wallet.currency}. ${normalizedTitle} (${wallet.address})`.indexOf(
        normalizedQuery
      ) >= 0
    );
  }
};

function getWalletItemProps(
  wallet: TokenInfo,
  { handleClick, handleFocus, modifiers, query, ref }: ItemRendererProps
): MenuItemProps & React.Attributes {
  return {
    active: modifiers.active,
    disabled: modifiers.disabled,
    onClick: handleClick,
    onFocus: handleFocus,
    ref,
    label: wallet.name.toString(),
    text: highlightText(`${wallet.currency}`, query),
  };
}

type WalletSelectProps = {
  selected?: Wallet;
  items?: TokenInfo[];
  onItemSelect?: (wallet: Wallet) => void;
};

export function WalletSelect({
  selected,
  items: itemsIn = [],
  onItemSelect,
}: WalletSelectProps) {
  const [items, setItems] = useState([...itemsIn]);
  const [selectedWallet, setSelectedWallet] = useState(selected);

  const updateWallet = useCallback(
    (wallet?: Wallet) => {
      if (!wallet) return;

      setSelectedWallet(wallet);
      onItemSelect?.(wallet);
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
    (info: TokenInfo) => {
      updateWallet(toWallet(info));
    },
    [updateWallet]
  );

  const itemRenderer = useCallback<ItemRenderer<TokenInfo>>(
    (wallet, props) => {
      if (!props.modifiers.matchesPredicate) {
        return null;
      }

      return (
        <MenuItem
          key={_(wallet).pick(["Name", "Currency"]).values().join("_")}
          {...getWalletItemProps(wallet, props)}
          roleStructure="listoption"
          selected={isWalletEqInfo(selectedWallet, wallet)}
        />
      );
    },
    [selectedWallet]
  );

  return (
    <Select<TokenInfo>
      itemPredicate={filterWallet}
      itemRenderer={itemRenderer}
      items={items}
      itemsEqual={areWalletsInfoEq}
      menuProps={{ "aria-label": "films" }}
      noResults={
        <MenuItem
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
            ? `${selectedWallet.currency}: ${selectedWallet.name}`
            : "(No wallet selected)"
        }
      />
    </Select>
  );
}
