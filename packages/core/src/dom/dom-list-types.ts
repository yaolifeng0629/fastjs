import type { FastjsDom } from "./dom-types";
import type { EachCallback } from "./def";

export interface FastjsDomListAtom {
  construct: "FastjsDomList";
  _list: Array<FastjsDom>;
  length: number;
}

export interface FastjsDomListAPI {
  add(el: FastjsDom): FastjsDomList;
  delete(key: number, deleteDom?: boolean): FastjsDomList;
  each(callback: EachCallback): FastjsDomList;
  el(key?: number): HTMLElement;
  getElement(key?: number): HTMLElement;
  getDom(key?: number): FastjsDom;
  next(el: string): FastjsDom | FastjsDomList | null;
  toArray(): FastjsDomList;
  toElArray(): Array<HTMLElement>;
}

export type FastjsDomList = FastjsDomListAtom &
  FastjsDomListAPI &
  Omit<FastjsDom, "construct">;
