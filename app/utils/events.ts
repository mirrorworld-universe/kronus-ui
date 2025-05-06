import mitt from "mitt";

type Events = {
  "multisigs:refresh"?: undefined;
  "transactions:refresh"?: undefined;
  "treasury:refresh"?: undefined;
  "send:open": {
    vaultAccount: string;
    tokenSymbol: string;
  };
  "send:close"?: undefined;
};

export const emitter = mitt<Events>();
