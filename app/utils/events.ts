import mitt from "mitt";

type Events = {
  "multisigs:refresh"?: undefined;
  "transactions:refresh"?: undefined;
  "treasury:refresh"?: undefined;
  "send:open"?: undefined;
  "send:close"?: undefined;
};

export const emitter = mitt<Events>();
