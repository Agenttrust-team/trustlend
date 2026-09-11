export function BrandMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <rect width="48" height="48" rx="15" fill="#D9ED92" />
      <path d="M12 14h24v7h-8v15h-8V21h-8z" fill="#173D32" />
      <path d="m28 28 8-7v15h-8z" fill="#57836A" />
    </svg>
  );
}
