import Decimal from "decimal.js";
import SuperJSON from "superjson";

SuperJSON.registerCustom<Decimal, string>(
  {
    isApplicable: (v): v is Decimal => Decimal.isDecimal(v),
    serialize: (v) => v.toJSON(),
    deserialize: (v) => new Decimal(v),
  },
  "decimal.js"
);

export const JSONFetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw Error("Yo that's NOT OK!!!");
  }
  const response = SuperJSON.deserialize(await res.json());

  return response as T;
};

export default SuperJSON;
