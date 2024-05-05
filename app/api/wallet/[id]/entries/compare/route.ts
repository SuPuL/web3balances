import { getCompareEntries, getWallet } from "@app/_db/data";
import SuperJSON from "@lib/superjson";
import { type NextRequest } from "next/server";

type Params = {
  id: number;
};

export async function GET(
  _: NextRequest,
  { params: { id } }: { params: Params }
) {
  if (isNaN(id)) {
    return Response.json({ message: "Invalid wallet id" }, { status: 400 });
  }

  const wallet = await getWallet(id);
  if (!wallet) {
    return Response.json({ message: "Wallet not found" }, { status: 404 });
  }

  const entries = await getCompareEntries(wallet.id, wallet.type);
  const asJson = SuperJSON.serialize(entries);

  return Response.json(asJson);
}
