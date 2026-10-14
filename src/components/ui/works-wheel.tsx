"use client";

// A portfolio / services index built as a wheel you turn.
// At rest the services sit in a ring around a title, each card tangent to the circle.
// The first notch of scroll blows the ring open into a vertical drum.
import * as React from "react";
import { cn } from "@/lib/utils";

export interface WorksWheelItem {
  /** Service or project title. Shown beside the front card and in the index. */
  title: string;
  /** Optional cover art. Omitted for clean text/info cards. */
  image?: string;
  /** Where the card links to (e.g. WhatsApp or inquiry anchor). */
  href?: string;
  /** Category icon emoji */
  icon?: string;
  /** Category luxury badge */
  badge?: string;
  /** Detailed service overview */
  description?: string;
  /** Key deliverables list */
  highlights?: string[];
  /** Action url or phone */
  actionUrl?: string;
}

export interface WorksWheelProps extends Omit<
  React.ComponentPropsWithoutRef<"section">,
  "children"
> {
  items: WorksWheelItem[];
  /** Sits in the middle of the ring. @default "Our Services" */
  label?: string;
  /** Label on the card's action affordance. @default "Enquire Now" */
  action?: string;
  /** Callback when user clicks to inquire or explore an item */
  onItemAction?: (item: WorksWheelItem) => void;
}

const CARD_H = 0.46; // front card height, of the stage
const CARD_MAX_W = 0.42; // ... but never wider than this much of the stage
const CARD_RATIO = 2; // card width / height
const STEP = 40; // degrees between cards on the drum
const DRUM = 2.22; // drum radius, in card heights
const LENS = 2.7; // perspective distance
const RING_R = 1.14; // ring radius
const BOW = 1.82;
const TITLE = 0.124; // ring label and front-card title
const INDEX = 0.04; // the index down the right-hand side
const CULL = 1.6;

const WHEEL_UNITS = 900;
const DRAG_UNITS = 420;
const SETTLE = 140;
const EASE = 0.12;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Stage = { w: number; h: number };

const rad = (deg: number) => (deg * Math.PI) / 180;

const bowAt = (drumDeg: number, bow: number) =>
  -bow * (1 - Math.cos(rad(drumDeg)));

function place(
  ringDeg: number,
  drumDeg: number,
  ringR: number,
  drumR: number,
  bow: number,
  m: number,
) {
  return (
    `translateX(${m * bowAt(drumDeg, bow)}px)` +
    ` rotateZ(${(1 - m) * ringDeg}deg) translateY(${-(1 - m) * ringR}px)` +
    ` rotateX(${m * drumDeg}deg) translateZ(${m * drumR}px)`
  );
}

export function WorksWheel({
  items,
  label = "Our Services",
  action = "Enquire Now",
  onItemAction,
  className,
  ...props
}: WorksWheelProps) {
  const stageRef = React.useRef<HTMLDivElement>(null);
  const wheelRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLElement | null)[]>([]);
  const labelRef = React.useRef<HTMLDivElement>(null);
  const titleRef = React.useRef<HTMLDivElement>(null);

  const turn = React.useRef(0);
  const target = React.useRef(0);
  const [active, setActive] = React.useState(0);
  const [stage, setStage] = React.useState<Stage>({ w: 0, h: 0 });

  const count = items.length;
  const last = Math.max(count - 1, 0);

  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setReduced(query.matches);
    read();
    query.addEventListener("change", read);
    return () => query.removeEventListener("change", read);
  }, []);

  React.useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const read = () => setStage({ w: el.clientWidth, h: el.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const metrics = React.useMemo(() => {
    const { w, h } = stage;
    const cardW = Math.min(h * CARD_H * CARD_RATIO, w * CARD_MAX_W);
    const cardH = cardW / CARD_RATIO;
    const drumR = cardH * DRUM;
    const ringR = cardH * RING_R;
    const ringScale = count
      ? clamp((((2 * Math.PI * ringR) / count) * 0.82) / (cardW || 1), 0.16, 1)
      : 1;
    return {
      cardW,
      cardH,
      ringR,
      ringScale,
      drumR,
      bow: cardH * BOW,
      depth: cardH * LENS,
      title: cardH * TITLE,
      index: cardH * INDEX,
    };
  }, [stage, count]);

  React.useEffect(() => {
    if (!stage.h) return;
    let frame = 0;
    const { ringR, ringScale, drumR, bow } = metrics;

    const draw = () => {
      frame = requestAnimationFrame(draw);
      const gap = target.current - turn.current;
      if (Math.abs(gap) < 0.0005) turn.current = target.current;
      else turn.current += gap * (reduced ? 1 : EASE);

      const t = turn.current;
      const m = clamp(t, 0, 1);
      const pos = Math.max(0, t - 1);

      if (wheelRef.current) {
        wheelRef.current.style.transform = `translateZ(${-m * drumR}px)`;
      }

      for (let i = 0; i < count; i++) {
        const d = i - pos;
        const drumDeg = d * STEP;
        const card = cardRefs.current[i];
        if (card) {
          card.style.transform = place(
            d * (360 / count),
            drumDeg,
            ringR,
            drumR,
            bow,
            m,
          );
          card.style.opacity = m > 0.5 && Math.abs(d) > CULL ? "0" : "1";
          card.style.zIndex = String(Math.round(100 - Math.abs(d) * 2));
        }
        const face = card?.firstElementChild as HTMLElement | null;
        if (face) face.style.transform = `scale(${lerp(ringScale, 1, m)})`;
      }

      if (labelRef.current) labelRef.current.style.opacity = String(1 - m);
      if (titleRef.current) titleRef.current.style.opacity = String(m);
      const near = clamp(Math.round(pos), 0, last);
      setActive((prev) => (prev === near ? prev : near));
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [metrics, stage.h, count, last, reduced]);

  const to = React.useCallback(
    (next: number) => {
      target.current = clamp(next, 0, last + 1);
    },
    [last],
  );

  React.useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      const next = target.current + event.deltaY / WHEEL_UNITS;
      if (next > 0 && next < last + 1) event.preventDefault();
      to(next);
      window.clearTimeout(settling.current);
      settling.current = window.setTimeout(
        () => to(Math.round(target.current)),
        SETTLE,
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      window.clearTimeout(settling.current);
    };
  }, [to, last]);

  const drag = React.useRef<number | null>(null);
  const settling = React.useRef(0);

  return (
    <section
      aria-label={label}
      className={cn(
        "bg-white text-[#26382B] relative h-full min-h-[32rem] md:min-h-[38rem] w-full overflow-hidden select-none border-y border-[#EAE5DE]",
        className,
      )}
      {...props}
    >
      <div
        ref={stageRef}
        tabIndex={0}
        role="listbox"
        aria-label={label}
        aria-activedescendant={`works-wheel-${active}`}
        className="focus-visible:outline-foreground absolute inset-0 cursor-grab touch-pan-x outline-none focus-visible:outline-2 focus-visible:-outline-offset-4 active:cursor-grabbing"
        style={{ perspective: `${metrics.depth}px` }}
        onPointerDown={(event) => {
          drag.current = event.clientY;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (drag.current === null) return;
          to(target.current + (drag.current - event.clientY) / DRAG_UNITS);
          drag.current = event.clientY;
        }}
        onPointerUp={() => {
          drag.current = null;
          if (target.current > 1) to(Math.round(target.current));
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") to(Math.round(target.current) + 1);
          else if (event.key === "ArrowUp") to(Math.round(target.current) - 1);
          else return;
          event.preventDefault();
        }}
      >
        <div
          ref={wheelRef}
          className="absolute top-1/2 left-1/2 [transform-style:preserve-3d]"
        >
          {items.map((item, i) => {
            const Tag = (item.href ? "a" : "div") as "a";
            return (
              <React.Fragment key={item.title}>
                <Tag
                  id={`works-wheel-${i}`}
                  role="option"
                  aria-selected={i === active}
                  href={item.href}
                  onClick={(e: React.MouseEvent) => {
                    if (onItemAction) {
                      e.preventDefault();
                      onItemAction(item);
                    }
                  }}
                  ref={(node: HTMLElement | null) => {
                    cardRefs.current[i] = node;
                  }}
                  className="group absolute [backface-visibility:hidden] no-underline cursor-pointer"
                  style={{
                    width: metrics.cardW,
                    height: metrics.cardH,
                    marginLeft: -metrics.cardW / 2,
                    marginTop: -metrics.cardH / 2,
                  }}
                >
                  {/* Clean Service Info Card (White Background, NO Images) */}
                  <div className="bg-white border-2 border-[#E7E1D8] shadow-[0_16px_40px_rgba(38,56,43,0.12)] relative flex flex-col justify-between size-full overflow-hidden rounded-2xl p-5 md:p-7 text-left select-none transition-all duration-300 hover:border-[#C5A059] hover:shadow-[0_20px_50px_rgba(197,160,89,0.2)]">
                    <div>
                      {/* Top Header: Icon & Badge */}
                      <div className="flex items-center justify-between mb-3.5">
                        <div className="w-11 h-11 rounded-xl bg-[#EDF3ED] text-[#26382B] flex items-center justify-center text-xl shadow-xs">
                          {item.icon || "✨"}
                        </div>
                        {item.badge && (
                          <span className="text-[0.68rem] md:text-[0.72rem] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full bg-[#FAF6ED] text-[#8C6D3B] border border-[#C5A059]/30">
                            {item.badge}
                          </span>
                        )}
                      </div>

                      {/* Service Title */}
                      <h3 className="text-lg md:text-xl font-serif font-bold text-[#26382B] mb-2 leading-tight">
                        {item.title}
                      </h3>

                      {/* Overview Description */}
                      {item.description && (
                        <p className="text-[0.8rem] md:text-[0.85rem] text-[#556358] leading-relaxed mb-3.5 line-clamp-3">
                          {item.description}
                        </p>
                      )}

                      {/* Key Deliverables List */}
                      {item.highlights && item.highlights.length > 0 && (
                        <ul className="space-y-1 text-[0.75rem] md:text-[0.78rem] text-[#3C5542] border-t border-dashed border-[#EAE5DE] pt-2.5">
                          {item.highlights.slice(0, 3).map((hl, idx) => (
                            <li key={idx} className="flex items-center gap-1.5 truncate">
                              <span className="text-[#C5A059] font-bold text-xs">✓</span>
                              <span className="truncate">{hl}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-3 border-t border-[#F2ECE3] flex items-center justify-between mt-auto">
                      <span className="text-[0.8rem] font-semibold text-[#26382B] group-hover:text-[#C5A059] transition-colors flex items-center gap-1">
                        {action}
                        <svg className="w-3 h-3 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </span>
                      <span className="text-[0.68rem] uppercase tracking-wider text-[#98A29A] font-medium">
                        Explore Vertical
                      </span>
                    </div>
                  </div>
                </Tag>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Ring title in the center (visible when ring is closed) */}
      <div
        ref={labelRef}
        className="pointer-events-none absolute inset-0 grid place-items-center tracking-tight font-serif text-[#26382B] font-semibold"
        style={{ fontSize: metrics.title }}
      >
        {label}
      </div>

      {/* Front-card title displayed beside the drum */}
      <div
        ref={titleRef}
        className="pointer-events-none absolute top-1/2 left-[5%] md:left-[8%] -translate-y-1/2 tracking-tight opacity-0 font-serif text-[#26382B] font-bold max-w-[260px] leading-tight"
        style={{ fontSize: Math.max(metrics.title * 0.75, 20) }}
      >
        {items[active]?.title}
      </div>

      {/* Wheel Index Navigator on the right */}
      <ol
        className="text-[#7A8A7E] absolute top-[8%] right-[3%] text-right leading-[1.8] hidden sm:block"
        style={{ fontSize: Math.max(metrics.index, 11) }}
      >
        {items.map((item, i) => (
          <li key={item.title}>
            <button
              type="button"
              onClick={() => to(i + 1)}
              className={cn(
                "focus-visible:outline-foreground cursor-pointer transition-colors outline-none hover:text-[#26382B]",
                i === active && "text-[#26382B] font-bold text-sm scale-105 inline-block text-[#C5A059]",
              )}
            >
              {item.title}
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default WorksWheel;
