import Image, { type StaticImageData } from "next/image";

export type Founder = {
  id: string;
  name: string;
  role: string;
  year: string;
  photo: { image: StaticImageData; alt: string };
};

export function HistoryFounders({
  label,
  founders,
}: {
  label: string;
  founders: Founder[];
}) {
  return (
    <ul
      aria-label={label}
      className="reveal-stagger-3 grid gap-10 sm:grid-cols-3 sm:gap-8 lg:gap-10"
    >
      {founders.map((founder) => (
        <li key={founder.id} className="reveal-rise sm:even:mt-12">
          <figure className="flex items-center gap-6 sm:flex-col sm:items-stretch sm:gap-0">
            <div className="w-32 shrink-0 sm:w-auto">
              <span
                aria-hidden="true"
                className="mx-auto block size-2 rounded-full bg-ink-deep"
              />
              <svg
                viewBox="0 0 100 28"
                preserveAspectRatio="none"
                aria-hidden="true"
                className="mx-auto -mt-1 block h-7 w-3/5"
              >
                <path
                  d="M4 28 L50 0 L96 28"
                  fill="none"
                  className="stroke-gold"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <div className="kakejiku">
                <div className="kakejiku-panel">
                  <Image
                    src={founder.photo.image}
                    alt={founder.photo.alt}
                    sizes="(max-width: 640px) 8rem, (max-width: 1024px) 30vw, 12rem"
                    placeholder="blur"
                    className="aspect-flyer w-full object-cover object-top"
                  />
                </div>
              </div>
            </div>
            <figcaption className="sm:mt-8 sm:text-center">
              <span className="block font-display text-xl font-bold tracking-[0.05em] text-magenta">
                {founder.year}
              </span>
              <span className="mt-1 block font-display text-lg leading-snug font-semibold text-ink">
                {founder.name}
              </span>
              <span className="mt-1 block text-base leading-snug text-ink-soft">
                {founder.role}
              </span>
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
