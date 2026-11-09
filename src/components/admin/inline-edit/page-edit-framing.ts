import { PAGE_EDIT_HOLD_ATTRIBUTE } from "@/lib/page-edit-hold";
import { clampPercent, clampZoom, frameOverflow, type PhotoFraming } from "@/lib/photo-framing";
import { TARGET_ATTRIBUTE } from "./page-edit-targets";

export const FRAMING_BOX_CLASS = "page-edit-framing-box";

export type PageFramingSession = {
  apply: (framing: PhotoFraming) => void;
  stop: () => void;
};

type Point = { x: number; y: number };

function slideOf(image: HTMLElement, box: HTMLElement): HTMLElement {
  let slide = image;
  while (slide.parentElement && slide.parentElement !== box) slide = slide.parentElement;
  return slide;
}

function contains(rect: DOMRect, point: Point): boolean {
  return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
}

export function startPageFraming(
  doc: Document,
  key: string,
  framing: PhotoFraming,
  onChange: (next: PhotoFraming) => void
): PageFramingSession | null {
  const view = doc.defaultView;
  const found = doc.querySelector<HTMLImageElement>(`img[${TARGET_ATTRIBUTE}~="${CSS.escape(key)}"]`);
  if (!view || !found) return null;
  const image: HTMLImageElement = found;
  const wrapper = image.closest<HTMLElement>(".photo-frame");
  const container = (wrapper ?? image).offsetParent;
  if (!(container instanceof view.HTMLElement)) return null;
  const box: HTMLElement = container;

  const originalStyles = new Map<HTMLElement, string | null>();
  function restyle(el: HTMLElement, set: (style: CSSStyleDeclaration) => void) {
    if (!originalStyles.has(el)) originalStyles.set(el, el.getAttribute("style"));
    set(el.style);
  }

  const slide = slideOf(image, box);
  for (const sibling of box.children) {
    if (sibling === slide || !(sibling instanceof view.HTMLElement)) continue;
    if (sibling.tagName === "IMG" || sibling.querySelector("img")) {
      restyle(sibling, (style) => {
        style.opacity = "0";
      });
    }
  }
  for (let el: HTMLElement | null = image; el && el !== box; el = el.parentElement) {
    restyle(el, (style) => {
      style.opacity = "1";
      style.transition = "none";
      style.animation = "none";
    });
  }

  let current = framing;
  function apply(next: PhotoFraming) {
    current = next;
    if (wrapper) {
      restyle(wrapper, (style) => {
        style.setProperty("--frame-x", `${next.x}%`);
        style.setProperty("--frame-y", `${next.y}%`);
        style.setProperty("--frame-zoom", String(next.zoom / 100));
      });
      return;
    }
    restyle(image, (style) => {
      style.maxWidth = "none";
      style.width = `${next.zoom}%`;
      style.height = `${next.zoom}%`;
      style.left = `${((100 - next.zoom) * next.x) / 100}%`;
      style.top = `${((100 - next.zoom) * next.y) / 100}%`;
      style.objectPosition = `${next.x}% ${next.y}%`;
    });
  }

  const pointers = new Map<number, Point>();
  let dragFrom: { pointer: Point; framing: PhotoFraming } | null = null;
  let pinchFrom: { distance: number; zoom: number } | null = null;

  function pinchDistance(): number {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function rebase() {
    const [first] = [...pointers.values()];
    dragFrom = pointers.size === 1 ? { pointer: first, framing: current } : null;
    pinchFrom = pointers.size === 2 ? { distance: pinchDistance(), zoom: current.zoom } : null;
  }

  function onPointerDown(event: PointerEvent) {
    const point = { x: event.clientX, y: event.clientY };
    if (event.button !== 0 || !contains(box.getBoundingClientRect(), point)) return;
    event.preventDefault();
    box.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, point);
    rebase();
  }

  function onPointerMove(event: PointerEvent) {
    if (!pointers.has(event.pointerId)) return;
    const point = { x: event.clientX, y: event.clientY };
    pointers.set(event.pointerId, point);
    if (pinchFrom && pointers.size === 2) {
      onChange({ ...current, zoom: clampZoom((pinchFrom.zoom * pinchDistance()) / pinchFrom.distance) });
      return;
    }
    if (!dragFrom || !image.naturalWidth) return;
    const natural = { width: image.naturalWidth, height: image.naturalHeight };
    const spill = frameOverflow(box.getBoundingClientRect(), natural, dragFrom.framing.zoom);
    const dx = point.x - dragFrom.pointer.x;
    const dy = point.y - dragFrom.pointer.y;
    const from = dragFrom.framing;
    onChange({
      ...from,
      x: spill.width > 0 ? clampPercent(from.x - (dx / spill.width) * 100) : from.x,
      y: spill.height > 0 ? clampPercent(from.y - (dy / spill.height) * 100) : from.y,
    });
  }

  function onPointerEnd(event: PointerEvent) {
    if (!pointers.delete(event.pointerId)) return;
    if (box.hasPointerCapture(event.pointerId)) box.releasePointerCapture(event.pointerId);
    rebase();
  }

  function onBlur() {
    pointers.clear();
    rebase();
  }

  function preventDefault(event: Event) {
    event.preventDefault();
  }

  const listeners: [string, EventListener][] = [
    ["pointerdown", onPointerDown as EventListener],
    ["pointermove", onPointerMove as EventListener],
    ["pointerup", onPointerEnd as EventListener],
    ["pointercancel", onPointerEnd as EventListener],
    ["dragstart", preventDefault],
  ];
  for (const [type, listener] of listeners) doc.addEventListener(type, listener, { capture: true });
  view.addEventListener("blur", onBlur);

  doc.documentElement.setAttribute(PAGE_EDIT_HOLD_ATTRIBUTE, "");
  box.classList.add(FRAMING_BOX_CLASS);
  apply(framing);
  view.scrollBy({ top: box.getBoundingClientRect().top });

  return {
    apply,
    stop() {
      for (const [type, listener] of listeners) doc.removeEventListener(type, listener, { capture: true });
      view.removeEventListener("blur", onBlur);
      box.classList.remove(FRAMING_BOX_CLASS);
      const topBefore = box.getBoundingClientRect().top;
      doc.documentElement.removeAttribute(PAGE_EDIT_HOLD_ATTRIBUTE);
      view.scrollBy({ top: box.getBoundingClientRect().top - topBefore });
      for (const [el, style] of originalStyles) {
        if (style === null) el.removeAttribute("style");
        else el.setAttribute("style", style);
      }
    },
  };
}
