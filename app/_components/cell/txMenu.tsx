import { Chain } from "@app/_common";
import { CopyCellsMenuItem } from "@blueprintjs/table";
import { MenuContext } from "../table";
import { OpenTxMenuItem } from "./OpenTxMenuItem";

export type TxMenuProps<T extends object = object> = {
  txColumn: keyof T;
  chain?: Chain;
  context: MenuContext<T>;
};

export const TxMenu = <T extends object = object>({
  txColumn,
  chain,
  context: { context, getCellDataByName },
}: TxMenuProps<T>) => (
  <>
    {txColumn && (
      <CopyCellsMenuItem
        context={context}
        getCellData={(r) => getCellDataByName(r, txColumn as any)}
        text="Copy Tx"
      />
    )}
    {txColumn && chain && (
      <OpenTxMenuItem
        context={context}
        getCellData={(r) => ({
          tx: getCellDataByName(r, txColumn as any),
          chain,
        })}
        text="Open Tx"
      />
    )}
  </>
);
