import type {
  EachCallback,
  EventCallback,
  EventList,
  InsertReturn,
  InsertTarget,
  PushReturn,
  PushTarget,
  SetStyleObj,
  StyleObj,
  StyleObjKeys
} from "./def";

import type { FastjsModuleBase } from "../base/def";
import { FastjsDomList } from "./dom-list-types";

export interface FastjsDomAtom {
  construct: "FastjsDom";
  _events: EventList;
  _el: HTMLElement;
}

export interface FastjsDomAPI {
  get<T extends keyof HTMLElement>(key: T): HTMLElement[T];
  set<T extends keyof HTMLElement>(key: T, val: HTMLElement[T]): FastjsDom;
  text(): string;
  text(val: string): FastjsDom;
  html(): string;
  html(val: string): FastjsDom;
  val(): string;
  val(val: string): FastjsDom;
  el(): HTMLElement;
  remove(): FastjsDom;
  focus(): FastjsDom;
  first(): FastjsDom | null;
  last(): FastjsDom | null;
  father(): FastjsDom | null;
  children(): FastjsDomList;
  next(selector?: string): FastjsDom | FastjsDomList | null;
  each(callback: EachCallback, deep?: boolean): FastjsDom;
  addEvent(type: keyof HTMLElementEventMap, callback: EventCallback): FastjsDom;
  removeEvent(): FastjsDom;
  removeEvent(type: keyof HTMLElementEventMap): FastjsDom;
  removeEvent(callback: EventCallback): FastjsDom;
  removeEvent(type: keyof HTMLElementEventMap, key: number): FastjsDom;
  getStyle(): StyleObj;
  getStyle(key: keyof CSSStyleDeclaration): string;
  getStyle(callback: (style: StyleObj) => void): FastjsDom;
  setStyle(style: SetStyleObj): FastjsDom;
  setStyle(style: string): FastjsDom;
  setStyle(key: StyleObjKeys, val: string, important?: boolean): FastjsDom;
  getClass(): string[];
  getClass(callback: (classNames: string[]) => void): void;
  setClass(className: string, value?: boolean): FastjsDom;
  setClass(classNames: { [key: string]: boolean }): FastjsDom;
  addClass(className: string[]): FastjsDom;
  addClass(...className: string[]): FastjsDom;
  removeClass(className: string[]): FastjsDom;
  removeClass(...className: string[]): FastjsDom;
  clearClass(): FastjsDom;
  getAttr(): { [key: string]: string };
  getAttr(key: string): string;
  getAttr(callback: (attr: { [key: string]: string }) => void): void;
  getAttr(key: string, callback: (val: string | null) => void): void;
  setAttr(attr: { [key: string]: string | null }): FastjsDom;
  setAttr(key: string, val: string | null): FastjsDom;
  push<T extends PushTarget>(
    el: HTMLElement | FastjsDomList | FastjsDom,
    target: T,
    clone?: boolean
  ): PushReturn<T>;
  insert<T extends InsertTarget>(
    el: HTMLElement | FastjsDomList | FastjsDom,
    target: T,
    clone?: boolean
  ): InsertReturn;
}

export type FastjsDom = FastjsDomAtom & FastjsDomAPI & FastjsModuleBase;
