import _dev from "../dev";
import { rand } from "../utils/";
import {
  EachCallback,
  EventCallback,
  InsertTarget,
  PushReturn,
  PushTarget,
  SetStyleObj,
  StyleObj,
  StyleObjKeys
} from "./def";
import { createFastjsDom } from "./dom";
import { createFastjsDomList } from "./dom-list";
import { FastjsDomList } from "./dom-list-types";

import type { FastjsDom, FastjsDomAPI } from "./dom-types";
import _selector from "./selector-atom";

export function createMethods(dom: FastjsDom): FastjsDomAPI {
  function get<T extends keyof HTMLElement>(key: T): HTMLElement[T] {
    return dom._el[key];
  }

  function set<T extends keyof HTMLElement>(
    key: T,
    val: HTMLElement[T]
  ): FastjsDom {
    if (
      findPropInChain(dom._el.constructor.prototype, key)?.writable ||
      findPropInChain(dom._el.constructor.prototype, key)?.set
    ) {
      dom._el[key] = val;
    } else if (__DEV__)
      _dev.warn(
        "fastjs/dom/set",
        `key **${key}** is not writable`,
        [
          "*key: " + key,
          "set<T extends keyof HTMLElement>(**key: T**, val: HTMLElement[T]): Dom",
          "super: ",
          dom
        ],
        ["fastjs.warn"]
      );
    return dom;

    function findPropInChain(
      obj: object,
      prop: string
    ): PropertyDescriptor | null {
      while (obj !== null) {
        const desc = Object.getOwnPropertyDescriptor(obj, prop);
        if (desc) return desc;
        obj = Object.getPrototypeOf(obj);
      }
      return null;
    }
  }

  function text(): string;
  function text(val: string): FastjsDom;
  function text(val?: string): string | FastjsDom {
    if (val === undefined) return dom._el.textContent || "";
    dom._el.textContent = val;
    return dom;
  }

  function html(): string;
  function html(val: string): FastjsDom;
  function html(val?: string): string | FastjsDom {
    if (val === undefined) return dom._el.innerHTML;
    dom._el.innerHTML = val;
    return dom;
  }

  function val(): string;
  function val(val: string): FastjsDom;

  function val(val?: string): string | FastjsDom {
    const key = (
      dom._el.tagName === "INPUT" ? "value" : "textContent"
    ) as keyof HTMLElement;
    if (val === undefined) return dom._el[key] as string;
    // @ts-expect-error
    dom._el[key] = val;
    return dom;
  }

  const el = () => dom._el;

  const remove = () => {
    dom._el.remove();
    return dom;
  };

  const focus = () => {
    dom._el.focus();
    return dom;
  };

  const first = () =>
    dom._el.firstElementChild
      ? createFastjsDom(dom._el.firstElementChild)
      : null;

  const last = () =>
    dom._el.lastElementChild ? createFastjsDom(dom._el.lastElementChild) : null;

  const father = () => {
    const father = dom._el.parentElement;
    return father ? createFastjsDom(father) : null;
  };

  const children = () => createFastjsDomList([...dom._el.children]);

  const next = (selector: string = "*"): FastjsDom | FastjsDomList | null => {
    const result = _selector(selector, dom._el);
    if (result instanceof HTMLElement) return createFastjsDom(result);
    if (result === null) return null;
    return createFastjsDomList(result);
  };

  const each = (callback: EachCallback, deep: boolean = false): FastjsDom => {
    const children = [...dom._el.children];
    children.forEach((v, i) => {
      callback(createFastjsDom(v), v as HTMLElement, i);
      if (deep) createFastjsDom(v).each(callback, deep);
    });
    return dom;
  };

  function addEvent(
    event: keyof HTMLElementEventMap,
    callback: EventCallback
  ): FastjsDom {
    let eventTrig: EventListener | EventListenerObject = (event: Event) =>
      callback(dom, event);
    dom._events.push({
      type: event,
      callback: callback,
      trigger: eventTrig,
      remove: () => {
        dom.removeEvent(callback);
      }
    });

    dom._el.addEventListener(event, eventTrig);
    return dom;
  }

  function removeEvent(): FastjsDom;
  function removeEvent(type: keyof HTMLElementEventMap): FastjsDom;
  function removeEvent(callback: EventCallback): FastjsDom;
  function removeEvent(type: keyof HTMLElementEventMap, key: number): FastjsDom;

  function removeEvent(
    typeOrCallback?: keyof HTMLElementEventMap | EventCallback,
    key?: number
  ): FastjsDom {
    const attrs = {
      type: typeof typeOrCallback === "string" ? typeOrCallback : undefined,
      callback:
        typeof typeOrCallback === "function" ? typeOrCallback : undefined,
      key
    };

    if (attrs.callback) {
      dom._events.forEach((v, i) => {
        if (v.callback === attrs.callback) {
          dom._el.removeEventListener(v.type, v.trigger);
          dom._events.splice(i, 1);
        }
      });
    } else if (attrs.type) {
      if (attrs.key !== undefined) {
        dom._el.removeEventListener(
          dom._events[attrs.key].type,
          dom._events[attrs.key].trigger
        );
        dom._events.splice(attrs.key, 1);
      } else {
        dom._events.forEach((v) => {
          if (v.type === attrs.type) {
            dom._el.removeEventListener(v.type, v.trigger);
            dom._events.splice(dom._events.indexOf(v), 1);
          }
        });
      }
    }

    return dom;
  }

  function getStyle(): StyleObj;
  function getStyle(key: keyof CSSStyleDeclaration): string;
  function getStyle(callback: (style: StyleObj) => void): FastjsDom;

  function getStyle(
    keyOrCallback?: keyof CSSStyleDeclaration | ((style: StyleObj) => void)
  ) {
    const getStyleProxy = (): StyleObj => {
      return new Proxy(styles, {
        get: (target, key: string) => {
          return (
            target.getPropertyValue(key) ||
            target[key as keyof CSSStyleDeclaration] ||
            null
          );
        },
        set: (target, key: string, value) => {
          dom.setStyle(key as keyof CSSStyleDeclaration, value);
          return Reflect.set(target, key, value);
        }
      });
    };

    const computedStyle = window.getComputedStyle(dom._el);
    const styles: CSSStyleDeclaration = Object.assign(
      computedStyle,
      dom._el.style
    );

    if (typeof keyOrCallback === "string")
      return styles.getPropertyValue(keyOrCallback);
    else if (typeof keyOrCallback === "function")
      keyOrCallback(getStyleProxy());
    else return getStyleProxy();

    return dom;
  }

  function setStyle(style: SetStyleObj): FastjsDom;
  function setStyle(style: string): FastjsDom;
  function setStyle(
    key: StyleObjKeys,
    val: string,
    important?: boolean
  ): FastjsDom;

  function setStyle(
    strOrObj: string | StyleObjKeys | SetStyleObj,
    val?: string | null,
    important?: boolean
  ): FastjsDom {
    if (val)
      dom._el.style.setProperty(
        strOrObj as string,
        val,
        important ? "important" : ""
      );
    else if (typeof strOrObj === "string") dom._el.style.cssText = strOrObj;
    else {
      let key: StyleObjKeys;
      for (key in strOrObj as StyleObj) {
        dom.setStyle(key, (strOrObj as StyleObj)[key]!);
      }
    }

    return dom;
  }

  function getClass(): string[];
  function getClass(callback: (classNames: string[]) => void): void;

  function getClass(
    callback?: (classNames: string[]) => void
  ): string[] | void {
    const arr = [...dom._el.classList];
    if (callback) callback(arr);
    else return arr;
  }

  function setClass(className: string, value?: boolean): FastjsDom;
  function setClass(classNames: { [key: string]: boolean }): FastjsDom;

  function setClass(
    nameOrObj: string | { [key: string]: boolean },
    value: boolean = true
  ): FastjsDom {
    if (typeof nameOrObj === "string")
      dom._el.classList[value ? "add" : "remove"](nameOrObj);
    else {
      for (const key in nameOrObj) {
        dom.setClass(key, nameOrObj[key]);
      }
    }
    return dom;
  }

  const classOp = (name: string[], op: boolean) => {
    name.forEach((v) => {
      v.split(" ").forEach((v) => {
        dom.setClass(v, op);
      });
    });
  };

  function addClass(className: string[]): FastjsDom;
  function addClass(...className: string[]): FastjsDom;

  function addClass(className: string | string[]): FastjsDom {
    if (typeof className === "string") classOp([...arguments], true);
    else className.forEach((v) => dom.addClass(v));
    return dom;
  }

  function removeClass(className: string[]): FastjsDom;
  function removeClass(...className: string[]): FastjsDom;

  function removeClass(className: string | string[]): FastjsDom {
    if (typeof className === "string") classOp([...arguments], false);
    else className.forEach((v) => dom.removeClass(v));
    return dom;
  }

  const clearClass = () => {
    dom._el.className = "";
    return dom;
  };

  function getAttr(): { [key: string]: string };
  function getAttr(key: string): string;
  function getAttr(callback: (attr: { [key: string]: string }) => void): void;
  function getAttr(key: string, callback: (val: string | null) => void): void;

  function getAttr(
    keyOrCallback?: string | ((attr: { [key: string]: string }) => void),
    callback?: (value: string | null) => void
  ): { [key: string]: string } | string | null | FastjsDom {
    const getAttrProxy = (): { [key: string]: string } => {
      const arr = [...dom._el.attributes];
      const obj: { [key: string]: string } = {};
      arr.forEach((v) => {
        obj[v.name] = v.value;
      });
      return new Proxy(obj, {
        set: (target, key: string, value) => {
          dom.setAttr(key, value);
          return Reflect.set(target, key, value);
        }
      });
    };

    if (typeof keyOrCallback === "string")
      if (callback) callback(dom._el.getAttribute(keyOrCallback));
      else return dom._el.getAttribute(keyOrCallback);
    else if (typeof keyOrCallback === "function") keyOrCallback(getAttrProxy());
    else return getAttrProxy();

    return dom;
  }

  function setAttr(attr: { [key: string]: string | null }): FastjsDom;
  function setAttr(key: string, val: string | null): FastjsDom;

  function setAttr(
    keyOrAttr: string | { [key: string]: string | null },
    val?: string | null
  ): FastjsDom {
    const setAttr = (key: string, val: string | null) => {
      if (val === null) dom._el.removeAttribute(key);
      else dom._el.setAttribute(key, val);
    };

    if (typeof keyOrAttr === "string") setAttr(keyOrAttr, val!);
    else {
      for (const key in keyOrAttr) {
        setAttr(key, keyOrAttr[key]);
      }
    }
    return dom;
  }

  function push<T extends PushTarget>(
    el: HTMLElement | FastjsDomList | FastjsDom = document.body,
    target: T,
    clone?: boolean
  ): PushReturn<T> {
    el = el instanceof HTMLElement ? el : el.el();
    console.log(dom._el);

    type IsReplace<T> = T extends "replaceElement" ? true : false;
    const isReplace = (target === "replaceElement") as IsReplace<T>;

    type ElementReturn<T> = T extends "replaceElement" ? FastjsDom : never;
    const newElement = createFastjsDom(
      clone ? (dom._el.cloneNode(true) as HTMLElement) : dom._el
    );

    if (isReplace) {
      const father = createFastjsDom(dom._el.parentElement!);
      if (father === null) {
        if (__DEV__) {
          throw _dev.error(
            "fastjs/dom/push",
            "father is null",
            [
              "*el: ",
              el,
              "target: ",
              target,
              "push<T extends PushTarget>(**el?: HTMLElement | FastjsDomList | FastjsDom**, target?: T, clone?: boolean): PushReturn<T>"
            ],
            ["fastjs.wrong"]
          );
        }
        throw new Error("father is null");
      }
      father._el.replaceChild(newElement._el, dom._el);
    } else if (typeof target === "number") {
      if (__DEV__) {
        if (target > dom._el.children.length) {
          throw _dev.error(
            "fastjs/dom/push",
            "target is out of range",
            [
              "*dom(container): ",
              dom,
              "target: ",
              target,
              "push<T extends PushTarget>(**el?: HTMLElement | FastjsDomList | FastjsDom**, target?: T, clone?: boolean): PushReturn<T>"
            ],
            ["fastjs.wrong"]
          );
        }
      }
      dom._el.insertBefore(newElement._el, dom._el.children[target]);
    } else {
      type keys = Exclude<PushTarget, "replaceElement" | number>;
      const event: {
        [key in keys]: () => void;
      } = {
        firstElementChild: () => el.prepend(newElement._el),
        lastElementChild: () => el.append(newElement._el),
        randomElementChild,
        beforeElement: () => el.before(newElement._el),
        afterElement: () => el.after(newElement._el)
      };
      event[target as Exclude<PushTarget, "replaceElement" | number>]();
    }

    return {
      isReplace,
      newElement: (isReplace && newElement) as ElementReturn<T>,
      oldElement: isReplace && (dom as ElementReturn<T>),
      index: [...el.children].indexOf(newElement._el),
      el: newElement,
      origin: dom,
      father: newElement.father()
    };

    function randomElementChild() {
      const children = [...el.children];
      if (children.length === 0) el.appendChild(dom._el);
      else {
        const pos = rand(0, children.length);
        if (pos === children.length) el.appendChild(dom._el);
        else el.insertBefore(dom._el, children[rand(0, children.length - 1)]);
      }
    }
  }

  function insert<T extends InsertTarget>(
    el: HTMLElement | FastjsDomList | FastjsDom,
    target: T,
    clone?: boolean
  ) {
    el = el instanceof HTMLElement ? el : el.el();
    const newElement = createFastjsDom(
      clone ? (el.cloneNode(true) as HTMLElement) : el
    );
    if (typeof target === "number") {
      if (__DEV__) {
        if (target > el.children.length) {
          throw _dev.error(
            "fastjs/dom/insert",
            "target is **out of range**",
            [
              "*el(container): ",
              el,
              "target: ",
              target,
              "insert<T extends InsertTarget>(**el: HTMLElement | FastjsDomList | FastjsDom**, target: T, clone?: boolean): InsertReturn"
            ],
            ["fastjs.wrong"]
          );
        }
      }
      el.insertBefore(newElement._el, dom._el.children[target]);
    } else {
      type keys = Exclude<InsertTarget, number>;
      const event: {
        [key in keys]: () => void;
      } = {
        first: () => dom._el.prepend(newElement._el),
        last: () => dom._el.append(newElement._el),
        random: randomElementChild,
        before: () => dom._el.before(newElement._el),
        after: () => dom._el.after(newElement._el)
      };
      event[target as Exclude<InsertTarget, number>]();
    }

    return {
      index: Array.from(el.children).indexOf(newElement._el),
      added: newElement,
      origin: dom
    };

    function randomElementChild() {
      const children = [...dom._el.children];
      if (children.length === 0) dom._el.appendChild(newElement._el);
      else
        dom._el.insertBefore(
          newElement._el,
          children[rand(0, children.length - 1)]
        );
    }
  }

  return {
    get,
    set,
    text,
    html,
    val,
    el,
    remove,
    focus,
    first,
    last,
    father,
    children,
    next,
    each,
    addEvent,
    removeEvent,
    getStyle,
    setStyle,
    getClass,
    setClass,
    addClass,
    removeClass,
    clearClass,
    getAttr,
    setAttr,
    push,
    insert
  };
}
