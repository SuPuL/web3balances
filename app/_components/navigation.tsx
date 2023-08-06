"use client";
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
import { WalletTokenInfoSelect } from "./walletTokenInfoSelect";
import { WalletTokenInfo } from "@/_common";
import { useWalletTokenInfoProvider } from "@/_provider/walletTokenInfoProvider";

export function Navigation() {
  const { infoList, selectedInfo, setSelectedInfo } =
    useWalletTokenInfoProvider();
  const router = useRouter();

  function updateWallet(info: WalletTokenInfo): void {
    setSelectedInfo?.(info);
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
          text="Transactions"
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
        <WalletTokenInfoSelect
          items={infoList?.filter((i) => !!i.walletAddress)}
          selected={selectedInfo}
          onItemSelect={updateWallet}
        />
      </NavbarGroup>
    </Navbar>
  );
}
