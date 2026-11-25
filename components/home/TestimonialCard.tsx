interface TestimonialCardProps {
  name: string;
  role: string;
  comment: string;
}

export default function TestimonialCard({
  name,
  role,
  comment,
}: TestimonialCardProps) {
  return (
    <article className="rounded-xl border border-border bg-card p-6 sm:p-8">
      <p className="text-base leading-7 text-foreground">&ldquo;{comment}&rdquo;</p>

      <div className="mt-6">
        <h3 className="font-sans text-base font-semibold text-foreground">{name}</h3>
        <p className="text-sm text-muted-foreground">{role}</p>
      </div>
    </article>
  );
}
