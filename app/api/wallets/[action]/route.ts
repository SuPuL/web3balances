import { markWalletChecked } from "@app/_db/data";
import { initDI } from "@lib/di";
import { calculateStats } from "@lib/wallets";
import { isBoolean } from "lodash";
import { NextRequest } from "next/server";
import SuperJSON from "superjson";

export async function POST(
  request: NextRequest,
  { params }: { params: { action: string } }
) {
  try {
    if (params.action === "markChecked") {
      return markChecked(await request.json());
    } else if (params.action === "recalculate") {
      return recalculate(await request.json());
    }

    return Response.json({ message: "Invalid Request" }, { status: 400 });
  } catch (e) {
    return Response.json({ message: "Invalid Body" }, { status: 400 });
  }
}

type MarkCheckedParam = {
  id?: number;
  checked?: boolean;
}[];

const markChecked = async (res: MarkCheckedParam) => {
  const updates = res.map((update) => {
    if (!isBoolean(update?.checked) || !update?.id) {
      throw new Error("Invalid request");
    }

    return { id: Number(update.id), checked: update.checked };
  });

  for (const { id, checked } of updates) {
    await markWalletChecked(id, checked);
  }

  return Response.json({ message: "Success" });
};

const recalculate = async (ids: number[]) => {
  const di = await initDI({ moralisApiKey: process.env.MORALIS_API_KEY });
  const wallets = await calculateStats(ids, di);
  return Response.json({ ...SuperJSON.serialize(wallets) });
};
