import mitt from "mitt";

type Events = {
  "connect-wallet:open"?: undefined;
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
