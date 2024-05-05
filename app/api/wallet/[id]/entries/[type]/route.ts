import { getEntries, getWallet } from "@app/_db/data";
import SuperJSON from "@lib/superjson";
import { EntryType } from "@prisma/client";
import { has } from "lodash";
import { type NextRequest } from "next/server";

type Params = {
  id: number;
  type: string;
};

export async function GET(
  _: NextRequest,
  { params: { id, type: typeIn } }: { params: Params }
) {
  if (isNaN(id)) {
    return Response.json({ message: "Invalid wallet id" }, { status: 400 });
  }

  const type = typeIn.toUpperCase() as EntryType;
  if (!type || !has(EntryType, type)) {
    return Response.json({ message: "Invalid type" }, { status: 400 });
  }

  const wallet = await getWallet(id);
  if (!wallet) {
    return Response.json({ message: "Wallet not found" }, { status: 404 });
  }

  const entries = await getEntries(wallet.id, type);
  const asJson = SuperJSON.serialize(entries);

  return Response.json(asJson);
}
