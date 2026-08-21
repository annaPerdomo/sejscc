export function MadeWithLove({
  madeWith,
  by,
  className,
  heartClassName = "text-magenta",
}: {
  madeWith: string;
  by: string;
  className?: string;
  heartClassName?: string;
}) {
  return (
    <span className={className}>
      {madeWith}{" "}
      <svg
        viewBox="0 0 512 512"
        fill="currentColor"
        aria-hidden="true"
        className={`beating-heart inline-block size-3.5 align-middle ${heartClassName}`}
      >
        <path d="M462.3 62.6C407.5 15.9 326 24.3 275.7 76.2L256 96.5l-19.7-20.3C186.1 24.3 104.5 15.9 49.7 62.6c-62.8 53.6-66.1 149.8-9.9 207.9l193.5 199.8c12.5 12.9 32.8 12.9 45.3 0l193.5-199.8c56.3-58.1 53-154.3-9.8-207.9z" />
      </svg>
      <span className="sr-only">love</span> {by}{" "}
      <a
        href="https://www.variationsonastring.com"
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium underline-offset-4 hover:underline"
      >
        Variations on a String
      </a>
    </span>
  );
}
