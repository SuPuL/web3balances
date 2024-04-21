import { useWalletTokenInfoProvider } from "@app/_provider/walletsProvider";
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

export const Navigation = () => {
  const { infoList, selectedInfo, setSelectedInfo } =
    useWalletTokenInfoProvider();
  const router = useRouter();

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
          onClick={() => router.push("/transactions")}
        />
        <Button
          className={Classes.MINIMAL}
          icon="bank-account"
          text="Tax Service"
          onClick={() => router.push("/service")}
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
          items={infoList?.filter((i) => i.symbol !== "BTC")}
          selected={selectedInfo}
          onItemSelect={setSelectedInfo}
        />
      </NavbarGroup>
    </Navbar>
  );
};
