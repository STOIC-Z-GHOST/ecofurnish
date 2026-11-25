import { TESTIMONIALS } from "@/data/testimonials";
import SectionHeading from "./SectionHeading";
import TestimonialCard from "./TestimonialCard";

export default function Testimonials() {
  return (
    <section className="bg-muted/60 py-12 md:py-20">
      <div className="container mx-auto max-w-7xl px-4">
        <SectionHeading title="What customers say" />

        <div className="grid gap-4 md:grid-cols-3 md:gap-6">
          {TESTIMONIALS.map((testimonial) => (
            <TestimonialCard
              key={testimonial.id}
              name={testimonial.name}
              role={testimonial.role}
              comment={testimonial.comment}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
