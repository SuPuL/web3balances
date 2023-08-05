"use client";
import { useWallets } from "@/_provider";
import { useConfig } from "@/_provider/configProvider";
import {
  Alignment,
  Button,
  Classes,
  Navbar,
  NavbarDivider,
  NavbarGroup,
  NavbarHeading,
} from "@blueprintjs/core";
import { useRouter } from "next/navigation";
import { WalletSelect } from "./walletSelect";
import { Wallet } from "@/_common";

export function Navigation() {
  const { wallet, wallets, setWallet } = useWallets();
  const router = useRouter();

  function updateWallet(wallet: Wallet): void {
    setWallet?.(wallet);
  }

  return (
    <Navbar>
      <NavbarGroup>
        <NavbarHeading>Balances</NavbarHeading>
        <NavbarDivider />
        <Button
          className={Classes.MINIMAL}
          icon="home"
          text="Overview"
          onClick={() => router.push("/")}
        />
        <Button
          className={Classes.MINIMAL}
          icon="link"
          text="Chain Explorer"
          onClick={() => router.push("/chainExplorer")}
        />
        <Button
          className={Classes.MINIMAL}
          icon="bank-account"
          text="Accointing"
          onClick={() => router.push("/accointing")}
        />
        <Button
          className={Classes.MINIMAL}
          icon="lock"
          text="Wallets"
          onClick={() => router.push("/wallets")}
        />
      </NavbarGroup>
      <NavbarGroup align={Alignment.RIGHT}>
        <WalletSelect
          items={wallets}
          selected={wallet}
          onItemSelect={updateWallet}
        />
      </NavbarGroup>
    </Navbar>
  );
}
