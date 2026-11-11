import { PAGE_EDIT_HOLD_ATTRIBUTE } from "@/lib/page-edit-hold";

export type PageEditTarget = {
  key: string;
  label: string;
  within?: string;
  /** Only takes elements no other target has, so a better-named target wins. */
  secondary?: boolean;
} & (
  | { kind: "text"; text: string }
  | { kind: "link"; href: string }
  | { kind: "photo"; src: string; turns: number; framable: boolean }
  /** Matches the public page's `data-edit-record` attribute, e.g. "level:<id>:name". */
  | { kind: "record"; record: string; photo: boolean }
);

export const TARGET_ATTRIBUTE = "data-page-edit";
const TURNS_ATTRIBUTE = "data-page-edit-turns";
const FRAMABLE_ATTRIBUTE = "data-page-edit-framable";
// The attributes this file put on an element, so they come off again when
// React reuses the element for words that are no longer a target.
const ADDED_ATTRIBUTE = "data-page-edit-added";
const ADDABLE = ["aria-label", "tabindex", "role"];
const CLOSED_TAB = '[role="tab"][aria-selected="false"]';
const UNSEARCHED_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "HEAD", "TITLE"]);
// These repeat page words like "Japanese School" and are never edited here.
const SITE_CHROME = 'header, nav, footer, [data-edit-record="banner"]';
const FOCUSABLE_TAGS = new Set(["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA"]);

function normalized(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function imageSource(image: Element): string {
  const raw = image.getAttribute("src") ?? "";
  if (!raw.startsWith("/_next/image")) return raw;
  return new URL(raw, image.ownerDocument.baseURI).searchParams.get("url") ?? raw;
}

function deepest(elements: Element[]): Element[] {
  return elements.filter((el) => !elements.some((other) => other !== el && el.contains(other)));
}

function indexText(doc: Document, longest: number) {
  const byElementText = new Map<string, Element[]>();
  const byOwnText = new Map<string, Element[]>();

  function add(index: Map<string, Element[]>, text: string, el: Element) {
    const list = index.get(text);
    if (list) list.push(el);
    else index.set(text, [el]);
  }

  for (const el of doc.body.querySelectorAll("*")) {
    if (UNSEARCHED_TAGS.has(el.tagName) || el.closest(SITE_CHROME)) continue;
    const text = el.textContent ?? "";
    if (text.length <= longest * 2) add(byElementText, normalized(text), el);
    for (const node of el.childNodes) {
      if (node.nodeType === node.TEXT_NODE) add(byOwnText, normalized(node.textContent ?? ""), el);
    }
  }
  return { byElementText, byOwnText };
}

function elementsFor(
  target: PageEditTarget,
  doc: Document,
  index: ReturnType<typeof indexText>
): Element[] {
  const everywhere = unscopedElementsFor(target, doc, index);
  const scope = target.within ? doc.getElementById(target.within) : doc.body;
  const inScope = scope ? everywhere.filter((el) => scope.contains(el)) : [];
  return inScope.length === 0 && target.secondary ? everywhere : inScope;
}

function unscopedElementsFor(
  target: PageEditTarget,
  doc: Document,
  index: ReturnType<typeof indexText>
): Element[] {
  switch (target.kind) {
    case "text": {
      const text = normalized(target.text);
      if (!text) return [];
      const whole = index.byElementText.get(text);
      if (whole) return deepest(whole);
      // A sentence that runs straight into a link (an email address, say)
      // shares its element with that link, so it's found by its own text.
      return index.byOwnText.get(text) ?? [];
    }
    case "link":
      return [...doc.querySelectorAll("a[href]")].filter((a) => a.getAttribute("href") === target.href);
    case "photo":
      return [...doc.querySelectorAll("img")].filter((img) => imageSource(img) === target.src);
    case "record": {
      const tagged = [...doc.querySelectorAll(`[data-edit-record="${CSS.escape(target.record)}"]`)];
      if (!target.photo) return tagged;
      return tagged.flatMap((el) => {
        const images = [...el.querySelectorAll("img")];
        return images.length > 0 ? images : [el];
      });
    }
  }
}

function accessibleName(targets: PageEditTarget[]): string {
  const [first] = targets;
  if (first.kind === "text") return `Change ${first.label}: ${normalized(first.text)}`;
  if (first.kind === "photo") return `Change photo: ${first.label}`;
  if (first.kind === "record") return `Change ${first.label}`;
  return `Change ${first.label}`;
}

export function markPageEditTargets(doc: Document, targets: PageEditTarget[]): Set<string> {
  if (!doc.body) return new Set();
  const longest = Math.max(0, ...targets.map((t) => (t.kind === "text" ? t.text.length : 0)));
  const index = indexText(doc, longest);
  const targetsByElement = new Map<Element, PageEditTarget[]>();

  for (const target of targets.filter((t) => !t.secondary)) {
    for (const el of elementsFor(target, doc, index)) {
      const list = targetsByElement.get(el);
      if (list) list.push(target);
      else targetsByElement.set(el, [target]);
    }
  }
  // Identical page words can't be told apart, so the element offers them all.
  for (const target of targets.filter((t) => t.secondary)) {
    for (const el of elementsFor(target, doc, index)) {
      const list = targetsByElement.get(el);
      if (!list) targetsByElement.set(el, [target]);
      else if (list.every((t) => t.secondary)) list.push(target);
    }
  }

  const ownTargets = new Map([...targetsByElement].map(([el, list]) => [el, [...list]]));
  for (const [el, elTargets] of targetsByElement) {
    if (el.tagName === "IMG") continue;
    for (let outer = el.parentElement; outer; outer = outer.parentElement) {
      const outerTargets = ownTargets.get(outer);
      if (!outerTargets) continue;
      for (const target of outerTargets) if (!elTargets.includes(target)) elTargets.push(target);
      break;
    }
  }

  for (const stale of doc.querySelectorAll(`[${TARGET_ATTRIBUTE}]`)) {
    if (targetsByElement.has(stale)) continue;
    for (const name of stale.getAttribute(ADDED_ATTRIBUTE)?.split(" ") ?? []) stale.removeAttribute(name);
    stale.removeAttribute(TARGET_ATTRIBUTE);
    stale.removeAttribute(TURNS_ATTRIBUTE);
    stale.removeAttribute(FRAMABLE_ATTRIBUTE);
    stale.removeAttribute(ADDED_ATTRIBUTE);
  }

  const found = new Set<string>();
  for (const [el, elTargets] of targetsByElement) {
    for (const target of elTargets) found.add(target.key);
    if (!el.hasAttribute(TARGET_ATTRIBUTE)) {
      const added = ADDABLE.filter((name) => !el.hasAttribute(name));
      el.setAttribute(ADDED_ATTRIBUTE, added.join(" "));
    }
    el.setAttribute(TARGET_ATTRIBUTE, elTargets.map((t) => t.key).join(" "));
    const turns = Math.max(...elTargets.map((t) => (t.kind === "photo" ? t.turns : 1)));
    if (turns > 1) el.setAttribute(TURNS_ATTRIBUTE, String(turns));
    else el.removeAttribute(TURNS_ATTRIBUTE);
    if (elTargets.some((t) => t.kind === "photo" && t.framable)) el.setAttribute(FRAMABLE_ATTRIBUTE, "");
    else el.removeAttribute(FRAMABLE_ATTRIBUTE);
    el.setAttribute("aria-label", accessibleName(elTargets));
    if (!FOCUSABLE_TAGS.has(el.tagName)) {
      el.setAttribute("tabindex", "0");
      el.setAttribute("role", "button");
    }
  }
  return found;
}

export type PagePlace = {
  anchors: { key: string; nth: number; top: number }[];
  depth: number;
};

export function placeOnPage(doc: Document): PagePlace | null {
  const view = doc.defaultView;
  if (!view) return null;
  const seen = new Map<string, number>();
  const anchors: PagePlace["anchors"] = [];
  for (const el of doc.querySelectorAll(`[${TARGET_ATTRIBUTE}]`)) {
    const key = el.getAttribute(TARGET_ATTRIBUTE) ?? "";
    const nth = seen.get(key) ?? 0;
    seen.set(key, nth + 1);
    const { top, bottom } = el.getBoundingClientRect();
    // The header is pinned to the screen, so it says nothing about how far down the reader is.
    if (bottom > 0 && top < view.innerHeight && !el.closest(SITE_CHROME)) anchors.push({ key, nth, top });
  }
  const scrollable = doc.documentElement.scrollHeight - view.innerHeight;
  return { anchors, depth: scrollable > 0 ? view.scrollY / scrollable : 0 };
}

export function returnToPlace(doc: Document, place: PagePlace): void {
  const view = doc.defaultView;
  if (!view) return;
  for (const { key, nth, top } of place.anchors) {
    const el = doc.querySelectorAll(`[${TARGET_ATTRIBUTE}="${CSS.escape(key)}"]`)[nth];
    if (!el) continue;
    const now = el.getBoundingClientRect();
    if (now.width === 0 && now.height === 0) continue;
    view.scrollBy({ top: now.top - top, behavior: "instant" });
    return;
  }
  const scrollable = doc.documentElement.scrollHeight - view.innerHeight;
  view.scrollTo({ top: place.depth * scrollable, behavior: "instant" });
}

export function listenForPageEdits(doc: Document, onPick: (keys: string[]) => void): void {
  const view = doc.defaultView;
  if (!view) return;

  function targetKeys(eventTarget: EventTarget | null): string[] | null {
    if (!view || !(eventTarget instanceof view.Element)) return null;
    const marked = eventTarget.closest(`[${TARGET_ATTRIBUTE}]`);
    return marked?.getAttribute(TARGET_ATTRIBUTE)?.split(" ") ?? null;
  }

  doc.addEventListener(
    "click",
    (event) => {
      if (doc.documentElement.hasAttribute(PAGE_EDIT_HOLD_ATTRIBUTE)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      // A tab that isn't open opens first, so its own words can then be tapped.
      if (event.target instanceof view.Element && event.target.closest(CLOSED_TAB)) return;
      const keys = targetKeys(event.target);
      if (keys) {
        event.preventDefault();
        event.stopPropagation();
        onPick(keys);
        return;
      }
      if (!(event.target instanceof view.Element)) return;
      if (event.target.closest("a[href]")) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (event.target.closest("button, input, select, textarea, label, [role=button]")) return;
      // A backdrop photo sits under the words laid over it, so a tap on the
      // photo usually lands on their container instead.
      const underneath = doc
        .elementsFromPoint(event.clientX, event.clientY)
        .map(targetKeys)
        .find((found) => found !== null);
      if (!underneath) return;
      event.preventDefault();
      event.stopPropagation();
      onPick(underneath);
    },
    { capture: true }
  );

  doc.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (doc.documentElement.hasAttribute(PAGE_EDIT_HOLD_ATTRIBUTE)) return;
      if (!(event.target instanceof view.Element) || !event.target.hasAttribute(TARGET_ATTRIBUTE)) return;
      if (event.target.closest(CLOSED_TAB)) return;
      const keys = targetKeys(event.target);
      if (!keys) return;
      event.preventDefault();
      event.stopPropagation();
      onPick(keys);
    },
    { capture: true }
  );
}

export const PHOTO_LAYER_CLASS = "page-edit-photo-layer";
const BADGE_INSET = 12;
const BADGE_REFRESH_MS = 400;
const CAMERA_PATH =
  "M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Zm8 3.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z";
const MOVE_PATH =
  "M12 2l3 3h-2v6h6V9l3 3-3 3v-2h-6v6h2l-3 3-3-3h2v-6H5v2l-3-3 3-3v2h6V5H9l3-3Z";

type Box = { top: number; right: number; bottom: number; left: number };

function intersect(a: Box, b: Box): Box {
  return {
    top: Math.max(a.top, b.top),
    right: Math.min(a.right, b.right),
    bottom: Math.min(a.bottom, b.bottom),
    left: Math.max(a.left, b.left),
  };
}

// Zoomed photos overflow the frame that clips them, and scroll under the
// sticky menu, so the button goes in the corner of the part still visible.
function visibleBox(image: Element, view: Window, headerBottom: number): Box | null {
  let box: Box = image.getBoundingClientRect();
  for (let el = image.parentElement; el && el !== image.ownerDocument.body; el = el.parentElement) {
    if (view.getComputedStyle(el).overflow !== "visible") box = intersect(box, el.getBoundingClientRect());
  }
  box = intersect(box, { top: headerBottom, right: view.innerWidth, bottom: view.innerHeight, left: 0 });
  const minWidth = image.hasAttribute(FRAMABLE_ATTRIBUTE) ? 320 : 80;
  const roomy = box.right - box.left > minWidth && box.bottom - box.top > 56;
  return roomy ? box : null;
}

function icon(doc: Document, d: string): SVGSVGElement {
  const svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const path = doc.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  path.setAttribute("fill-rule", "evenodd");
  path.setAttribute("fill", "currentColor");
  svg.append(path);
  return svg;
}

export function showPhotoButtons(
  doc: Document,
  onPick: (keys: string[]) => void,
  onFrame: (key: string) => void
): void {
  const view = doc.defaultView;
  if (!view || !doc.body) return;

  const layer = doc.createElement("div");
  layer.className = PHOTO_LAYER_CLASS;
  doc.body.append(layer);

  const buttons = new Map<string, HTMLElement>();

  function buttonFor(image: Element): HTMLElement {
    const id = image.getAttribute(TARGET_ATTRIBUTE) ?? "";
    const existing = buttons.get(id);
    if (existing) return existing;
    const group = doc.createElement("div");
    group.className = "page-edit-photo-buttons";
    const change = doc.createElement("button");
    change.type = "button";
    change.className = "page-edit-photo-button";
    const turns = image.getAttribute(TURNS_ATTRIBUTE);
    if (turns) {
      change.setAttribute("aria-label", `Change photos: ${turns} photos take turns here`);
      change.append(icon(doc, CAMERA_PATH), "Change photos");
    } else {
      change.setAttribute("aria-label", image.getAttribute("aria-label") ?? "Change photo");
      change.append(icon(doc, CAMERA_PATH), "Change photo");
    }
    change.addEventListener("click", () => onPick(id.split(" ")));
    group.append(change);
    if (image.hasAttribute(FRAMABLE_ATTRIBUTE)) {
      const move = doc.createElement("button");
      move.type = "button";
      move.className = "page-edit-photo-button";
      move.setAttribute("aria-label", "Move or zoom this photo");
      move.append(icon(doc, MOVE_PATH), "Move or zoom");
      move.addEventListener("click", () => {
        const keys = id.split(" ");
        if (keys.length === 1) onFrame(keys[0]);
        else onPick(keys);
      });
      group.append(move);
    }
    buttons.set(id, group);
    return group;
  }

  function place() {
    if (!view) return;
    const header = doc.querySelector("header");
    const headerBottom = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
    const taken = new Set<string>();
    const shown = new Set<HTMLElement>();

    for (const image of doc.querySelectorAll(`img[${TARGET_ATTRIBUTE}]`)) {
      if (!image.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
      const box = visibleBox(image, view, headerBottom);
      if (!box) continue;
      const spot = `${Math.round(box.top)}:${Math.round(box.right)}`;
      if (taken.has(spot)) continue;
      taken.add(spot);

      const button = buttonFor(image);
      button.style.top = `${box.top + BADGE_INSET}px`;
      button.style.right = `${view.innerWidth - box.right + BADGE_INSET}px`;
      if (button.parentElement !== layer) layer.append(button);
      shown.add(button);
    }

    for (const button of buttons.values()) {
      if (!shown.has(button)) button.remove();
    }
  }

  let pending = false;
  function schedule() {
    if (pending || !view) return;
    pending = true;
    view.requestAnimationFrame(() => {
      pending = false;
      place();
    });
  }

  view.addEventListener("scroll", schedule, { passive: true });
  view.addEventListener("resize", schedule);
  // Slideshows fade and late images shift the layout without a scroll.
  view.setInterval(schedule, BADGE_REFRESH_MS);
  place();
}
