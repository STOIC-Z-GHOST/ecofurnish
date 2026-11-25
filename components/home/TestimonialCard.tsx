interface TestimonialCardProps {
  name: string;
  role: string;
  comment: string;
}

export default function TestimonialCard({ name, role, comment }: TestimonialCardProps) {
  return (
    <article className="flex flex-col rounded-lg border border-border bg-card p-6 shadow-sm">
      <p className="grow leading-relaxed text-foreground">&ldquo;{comment}&rdquo;</p>

      <div className="mt-6 flex items-end justify-between gap-3">
        <div>
          <h3 className="font-sans font-semibold text-foreground">{name}</h3>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
        <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
          Demo data
        </span>
      </div>
    </article>
  );
}
