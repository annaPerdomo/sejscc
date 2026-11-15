import { PAGE_EDIT_HOLD_ATTRIBUTE } from "@/lib/page-edit-hold";
import {
  PHOTO_SLIDE_ATTRIBUTE,
  SIZE_MAX,
  withSize,
  clampZoom,
  draggedFraming,
  frameOverflow,
  type PhotoFraming,
} from "@/lib/photo-framing";
import { TARGET_ATTRIBUTE } from "./page-edit-targets";

export const FRAMING_BOX_CLASS = "page-edit-framing-box";

export type PageFramingSession = {
  apply: (framing: PhotoFraming) => void;
  stop: () => void;
  /** Whether this photo can grow from a frame beside the words to the full hero. */
  sizable: boolean;
};

const WHOLE_CLASS = "photo-frame-whole";
const SIZE_HANDLE_CLASS = "page-edit-size-handle";
const SIZABLE_SLIDE = ".hero-slide-beside";
const SIZABLE_SCREEN = "(width >= 64rem)";

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

  const fitSlide = box.closest<HTMLElement>(`[${PHOTO_SLIDE_ATTRIBUTE}]`);
  const slideFit = fitSlide?.getAttribute(PHOTO_SLIDE_ATTRIBUTE) ?? null;
  const wasWhole = wrapper?.classList.contains(WHOLE_CLASS) ?? false;
  const stage: HTMLElement = fitSlide?.parentElement ?? box;
  const slide = slideOf(image, stage);
  const sizable = Boolean(fitSlide?.matches(SIZABLE_SLIDE)) && view.matchMedia(SIZABLE_SCREEN).matches;

  const handles = sizable
    ? ["top", "bottom"].map((edge) => {
        const handle = doc.createElement("div");
        handle.className = SIZE_HANDLE_CLASS;
        handle.textContent = "↔";
        handle.style.setProperty(edge, "0");
        box.append(handle);
        return handle;
      })
    : [];
  for (const sibling of stage.children) {
    if (sibling === slide || !(sibling instanceof view.HTMLElement)) continue;
    if (sibling.tagName === "IMG" || sibling.querySelector("img")) {
      restyle(sibling, (style) => {
        style.opacity = "0";
      });
    }
  }
  for (let el: HTMLElement | null = image; el && el !== stage; el = el.parentElement) {
    restyle(el, (style) => {
      style.opacity = "1";
      style.transition = "none";
      style.animation = "none";
    });
  }

  let current = framing;
  function apply(next: PhotoFraming) {
    current = next;
    const whole = next.fit === "whole";
    if (fitSlide) {
      fitSlide.setAttribute(PHOTO_SLIDE_ATTRIBUTE, next.fit);
      restyle(fitSlide, (style) => {
        style.setProperty("--photo-size", String(next.size / SIZE_MAX));
      });
    }
    for (const handle of handles) handle.hidden = !whole;
    if (wrapper) {
      wrapper.classList.toggle(WHOLE_CLASS, whole);
      restyle(wrapper, (style) => {
        style.setProperty("--frame-x", `${next.x}%`);
        style.setProperty("--frame-y", `${next.y}%`);
        style.setProperty("--frame-zoom", String(next.zoom / 100));
      });
      return;
    }
    restyle(image, (style) => {
      style.setProperty("object-fit", whole ? "contain" : "cover", "important");
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
  let resizeFrom: { pointerId: number; x: number; size: number; travel: number } | null = null;

  // The box's left edge follows the handle: `travel` is how far it moves from frame to full width.
  function startResize(event: PointerEvent) {
    const offset = box.getBoundingClientRect().left - stage.getBoundingClientRect().left;
    const rest = 1 - current.size / SIZE_MAX;
    const travel = rest > 0 ? offset / rest : stage.getBoundingClientRect().width / 2;
    resizeFrom = { pointerId: event.pointerId, x: event.clientX, size: current.size, travel };
    box.setPointerCapture(event.pointerId);
  }
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
    // The page's words lie over the photo, so the handle is found by where it is, not as the target.
    if (handles.some((handle) => !handle.hidden && contains(handle.getBoundingClientRect(), point))) {
      startResize(event);
      return;
    }
    box.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, point);
    rebase();
  }

  function onPointerMove(event: PointerEvent) {
    if (resizeFrom?.pointerId === event.pointerId) {
      const grown = ((resizeFrom.x - event.clientX) / resizeFrom.travel) * SIZE_MAX;
      onChange(withSize(current, resizeFrom.size + grown));
      return;
    }
    if (!pointers.has(event.pointerId)) return;
    const point = { x: event.clientX, y: event.clientY };
    pointers.set(event.pointerId, point);
    if (pinchFrom && pointers.size === 2) {
      if (current.fit === "whole") return;
      onChange({ ...current, zoom: clampZoom((pinchFrom.zoom * pinchDistance()) / pinchFrom.distance) });
      return;
    }
    if (!dragFrom || !image.naturalWidth) return;
    const natural = { width: image.naturalWidth, height: image.naturalHeight };
    const spill = frameOverflow(box.getBoundingClientRect(), natural, dragFrom.framing);
    const dx = point.x - dragFrom.pointer.x;
    const dy = point.y - dragFrom.pointer.y;
    onChange(draggedFraming(dragFrom.framing, spill, dx, dy));
  }

  function onPointerEnd(event: PointerEvent) {
    if (resizeFrom?.pointerId === event.pointerId) {
      resizeFrom = null;
      if (box.hasPointerCapture(event.pointerId)) box.releasePointerCapture(event.pointerId);
      return;
    }
    if (!pointers.delete(event.pointerId)) return;
    if (box.hasPointerCapture(event.pointerId)) box.releasePointerCapture(event.pointerId);
    rebase();
  }

  function onBlur() {
    resizeFrom = null;
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
    sizable,
    stop() {
      for (const [type, listener] of listeners) doc.removeEventListener(type, listener, { capture: true });
      view.removeEventListener("blur", onBlur);
      box.classList.remove(FRAMING_BOX_CLASS);
      for (const handle of handles) handle.remove();
      if (fitSlide && slideFit !== null) fitSlide.setAttribute(PHOTO_SLIDE_ATTRIBUTE, slideFit);
      wrapper?.classList.toggle(WHOLE_CLASS, wasWhole);
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
