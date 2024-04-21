import { getEntries, getWallet } from "@app/_db/data";
import SuperJSON from "@lib/superjson";
import { EntryType } from "@prisma/client";
import { has } from "lodash";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const id = Number(request.nextUrl.searchParams.get("walletId"));
  if (isNaN(id)) {
    return Response.json({ message: "Invalid wallet id" }, { status: 400 });
  }

  const type = request.nextUrl.searchParams.get("type");
  if (!type || !has(EntryType, type)) {
    return Response.json({ message: "Invalid type" }, { status: 400 });
  }

  const wallet = await getWallet(id);
  if (!wallet) {
    return Response.json({ message: "Wallet not found" }, { status: 404 });
  }

  const entries = await getEntries(wallet.id, type as EntryType);
  const asJson = SuperJSON.serialize(entries);

  return Response.json(asJson);
}
