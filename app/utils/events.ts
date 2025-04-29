import mitt from "mitt";

type Events = {
  "multisigs:refresh"?: undefined;
  "transactions:refresh"?: undefined;
  "treasury:refresh"?: undefined;
};

export const emitter = mitt<Events>();
