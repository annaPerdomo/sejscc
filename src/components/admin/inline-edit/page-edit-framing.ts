import { PAGE_EDIT_HOLD_ATTRIBUTE } from "@/lib/page-edit-hold";
import {
  PHOTO_SLIDE_ATTRIBUTE,
  PHOTO_WASH_ATTRIBUTE,
  ROOT_PX,
  SIZE_MAX,
  SIZE_MIN,
  clampWash,
  withSize,
  withWash,
  clampZoom,
  draggedFraming,
  frameOverflow,
  type PhotoFraming,
} from "@/lib/photo-framing";
import { TARGET_ATTRIBUTE, icon } from "./page-edit-targets";

export const FRAMING_BOX_CLASS = "page-edit-framing-box";

/** The blue shade's edge, in `PhotoFraming.wash` units: where the design puts it, and how far back it can be pulled. */
export type WashRange = { auto: number; min: number };

export type PagePlacement = {
  /** Whether this photo can grow from a frame beside the words to the full hero. */
  sizable: boolean;
  wash: WashRange;
};

export type PageFramingSession = {
  apply: (framing: PhotoFraming) => void;
  stop: () => void;
  placement: PagePlacement;
};

const WHOLE_CLASS = "photo-frame-whole";
const SIZE_HANDLE_CLASS = "page-edit-size-handle";
const WASH_HANDLE_CLASS = "page-edit-wash-handle";
const HANDLE_TIP_CLASS = "page-edit-handle-tip";
const TIP_SHOWN_ATTRIBUTE = "data-tip-shown";
const SIZE_TIP = "Drag to make the photo bigger or smaller";
const WASH_TIP = "Drag to move the blue shade off the photo";
// Must match the fade in `.hero-slide-beside[data-photo-wash]`.
const WASH_FADE_REM = 4;
const SIDEWAYS_PATH = "M2 12l5-5v3.5h10V7l5 5-5 5v-3.5H7V17l-5-5Z";
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

  function sidewaysHandle(className: string, tip: string): HTMLElement {
    const handle = doc.createElement("div");
    handle.className = className;
    const label = doc.createElement("span");
    label.className = HANDLE_TIP_CLASS;
    label.textContent = tip;
    handle.append(icon(doc, SIDEWAYS_PATH), label);
    return handle;
  }

  const handles = sizable
    ? ["top", "bottom"].map((edge) => {
        const handle = sidewaysHandle(SIZE_HANDLE_CLASS, SIZE_TIP);
        handle.style.setProperty(edge, "0");
        box.append(handle);
        return handle;
      })
    : [];

  const washHandle =
    sizable && fitSlide ? sidewaysHandle(`${SIZE_HANDLE_CLASS} ${WASH_HANDLE_CLASS}`, WASH_TIP) : null;
  if (washHandle) fitSlide?.append(washHandle);
  const tipped = washHandle ? [...handles, washHandle] : handles;

  // The page's words lie over the handles, so the pointer never hovers one as far as CSS can tell.
  function showTips(point: Point | null) {
    for (const handle of tipped) {
      const over = point !== null && !handle.hidden && contains(handle.getBoundingClientRect(), point);
      handle.toggleAttribute(TIP_SHOWN_ATTRIBUTE, over);
    }
  }
  function hideTips() {
    showTips(null);
  }
  const hadWash = fitSlide?.hasAttribute(PHOTO_WASH_ATTRIBUTE) ?? false;

  // The shade is measured from the left edge of the page's content, in px at a 16px root.
  const rootStyle = getComputedStyle(doc.documentElement);
  const rem = parseFloat(rootStyle.fontSize) || ROOT_PX;
  function contentLeft(): number {
    const stageBox = stage.getBoundingClientRect();
    const wide = parseFloat(rootStyle.getPropertyValue("--container-wide")) * rem;
    return stageBox.left + (Number.isFinite(wide) ? Math.max(0, (stageBox.width - wide) / 2) : 0);
  }
  function washAt(clientX: number): number {
    return ((clientX - contentLeft()) / rem) * ROOT_PX;
  }

  // The hero measures how far its own words reach; the shade can be pulled
  // back to just past them and pushed out again no further than the design's place.
  function washRange(): WashRange {
    const stageBox = stage.getBoundingClientRect();
    const framedLeft = fitSlide ? parseFloat(getComputedStyle(fitSlide).getPropertyValue("--slide-left")) : NaN;
    const designed = stageBox.left + (stageBox.width * (Number.isFinite(framedLeft) ? framedLeft : 66)) / 100;
    const auto = clampWash(washAt(designed));
    const wordsEnd = parseFloat(getComputedStyle(stage).getPropertyValue("--hero-words-end"));
    if (!Number.isFinite(wordsEnd)) return { auto, min: auto };
    return { auto, min: Math.min(auto, clampWash((wordsEnd + WASH_FADE_REM) * ROOT_PX)) };
  }
  const wash = washRange();
  // Only the opacity is put back: a save can redraw these slides' other styles while they are hidden.
  const hiddenSlides = new Map<HTMLElement, string>();
  for (const sibling of stage.children) {
    if (sibling === slide || !(sibling instanceof view.HTMLElement)) continue;
    if (sibling.tagName === "IMG" || sibling.querySelector("img")) {
      hiddenSlides.set(sibling, sibling.style.opacity);
      sibling.style.opacity = "0";
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
      fitSlide.toggleAttribute(PHOTO_WASH_ATTRIBUTE, Boolean(next.wash));
      restyle(fitSlide, (style) => {
        style.setProperty("--photo-size", String(next.size / SIZE_MAX));
        if (next.wash) style.setProperty("--photo-wash", `${next.wash / ROOT_PX}rem`);
        else style.removeProperty("--photo-wash");
      });
    }
    for (const handle of handles) handle.hidden = !whole;
    if (washHandle) {
      washHandle.hidden = !whole || next.size === SIZE_MIN;
      const edge = contentLeft() + ((next.wash || wash.auto) / ROOT_PX) * rem - stage.getBoundingClientRect().left;
      washHandle.style.left = `calc(${edge}px - 1.5rem)`;
    }
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
  let washPointer: number | null = null;

  // The box's left edge follows the handle: `travel` is how far it moves from frame to full width.
  function startResize(event: PointerEvent) {
    const stageWidth = stage.getBoundingClientRect().width;
    const framedLeft = fitSlide ? parseFloat(getComputedStyle(fitSlide).getPropertyValue("--slide-left")) : NaN;
    const travel = Number.isFinite(framedLeft) ? (stageWidth * framedLeft) / 100 : stageWidth / 2;
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
    if (event.button !== 0) return;
    showTips(point);
    // The page's words lie over the photo, so a handle is found by where it is,
    // not as the target; the shade's can sit left of the photo's box.
    if (washHandle && !washHandle.hidden && contains(washHandle.getBoundingClientRect(), point)) {
      event.preventDefault();
      washPointer = event.pointerId;
      box.setPointerCapture(event.pointerId);
      return;
    }
    if (!contains(box.getBoundingClientRect(), point)) return;
    event.preventDefault();
    if (handles.some((handle) => !handle.hidden && contains(handle.getBoundingClientRect(), point))) {
      startResize(event);
      return;
    }
    box.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, point);
    rebase();
  }

  function onPointerMove(event: PointerEvent) {
    const dragging = washPointer !== null || resizeFrom !== null || pointers.size > 0;
    showTips(dragging ? null : { x: event.clientX, y: event.clientY });
    if (washPointer === event.pointerId) {
      onChange(withWash(current, washAt(event.clientX), wash));
      return;
    }
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
    showTips(event.pointerType === "mouse" ? { x: event.clientX, y: event.clientY } : null);
    if (washPointer === event.pointerId || resizeFrom?.pointerId === event.pointerId) {
      washPointer = null;
      resizeFrom = null;
      if (box.hasPointerCapture(event.pointerId)) box.releasePointerCapture(event.pointerId);
      return;
    }
    if (!pointers.delete(event.pointerId)) return;
    if (box.hasPointerCapture(event.pointerId)) box.releasePointerCapture(event.pointerId);
    rebase();
  }

  function onBlur() {
    hideTips();
    washPointer = null;
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
  doc.documentElement.addEventListener("pointerleave", hideTips);

  doc.documentElement.setAttribute(PAGE_EDIT_HOLD_ATTRIBUTE, "");
  box.classList.add(FRAMING_BOX_CLASS);
  apply(framing);
  view.scrollBy({ top: box.getBoundingClientRect().top });

  return {
    apply,
    placement: { sizable, wash },
    stop() {
      for (const [type, listener] of listeners) doc.removeEventListener(type, listener, { capture: true });
      view.removeEventListener("blur", onBlur);
      doc.documentElement.removeEventListener("pointerleave", hideTips);
      box.classList.remove(FRAMING_BOX_CLASS);
      for (const handle of handles) handle.remove();
      washHandle?.remove();
      fitSlide?.toggleAttribute(PHOTO_WASH_ATTRIBUTE, hadWash);
      if (fitSlide && slideFit !== null) fitSlide.setAttribute(PHOTO_SLIDE_ATTRIBUTE, slideFit);
      wrapper?.classList.toggle(WHOLE_CLASS, wasWhole);
      const topBefore = box.getBoundingClientRect().top;
      doc.documentElement.removeAttribute(PAGE_EDIT_HOLD_ATTRIBUTE);
      view.scrollBy({ top: box.getBoundingClientRect().top - topBefore });
      // A photo that finished loading meanwhile had its shape written to this same attribute.
      const ratio = wrapper?.style.getPropertyValue("--photo-ratio");
      for (const [el, opacity] of hiddenSlides) el.style.opacity = opacity;
      for (const [el, style] of originalStyles) {
        if (style === null) el.removeAttribute("style");
        else el.setAttribute("style", style);
      }
      if (ratio) wrapper?.style.setProperty("--photo-ratio", ratio);
    },
  };
}
