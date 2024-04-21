import axios from "axios";
import { parseCsvByPath, parseCsvByUrl, parseCsvData } from "./csv";
import { camelCase } from "lodash";

export type DownloadOptions = {
  bearerToken: string;
  year: number;
};

export type BlockpitData = {
  blockpitId: string;
  timestamp: string;
  sourceType: string;
  sourceName: string;
  integration: string;
  transactionType: string;
  outgoingAsset: string;
  outgoingAmount: number;
  incomingAsset: string;
  incomingAmount: number;
  feeAsset: string;
  feeAmount: number;
  transactionId: string;
  note: string;
  mergeId: string;
};

export const downloadData = async ({
  year,
  bearerToken,
}: DownloadOptions): Promise<BlockpitData[]> => {
  try {
    // Make GET request with Authorization header containing the bearer token
    const response = await axios.get(
      `https://cn.blockpit.io/api/v1/transactions/export?year=${year}`,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      }
    );

    const txs = await parseCsvData<BlockpitData>(response.data, {
      header: true,
      dynamicTyping: true,
      transformHeader: camelCase,
    });

    return txs.data;
  } catch (error: any) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
    return [];
  }
};
