import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ground text-foreground flex flex-col items-center justify-center p-6 text-center">
      <div className="border border-border bg-surface p-8 max-w-sm w-full">
        <span className="text-[10px] font-mono uppercase text-muted tracking-widest">
          ERR // 404
        </span>
        <h2 className="mt-2 text-sm font-mono font-bold uppercase text-foreground">
          Page Not Found
        </h2>
        <p className="mt-2 text-xs text-muted font-sans">
          The requested route does not exist in Claude Multi-Deck.
        </p>
        <Link
          href="/"
          className="mt-5 inline-block border border-foreground bg-foreground px-4 py-1.5 text-xs font-mono font-semibold text-ground uppercase tracking-wider hover:opacity-90 transition-opacity"
        >
          Return to Deck
        </Link>
      </div>
    </div>
  );
}
