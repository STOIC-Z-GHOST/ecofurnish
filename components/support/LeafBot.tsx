/**
 * The EcoFurnish assistant: a little leaf with a face. No circle and no chat
 * bubble around it. The eyes blink (see .leaf-bot-eye in globals.css).
 *
 * `halo` draws a thin background-colored outline under the leaf so it stays
 * visible on dark photos and on green sections. `eyeColor` is the color of
 * the eyes, so the face still works when the leaf is drawn in another color
 * (for example inside the green chat header).
 */
export default function LeafBot({
  className,
  halo = true,
  eyeColor = "var(--primary-foreground)",
}: {
  className?: string;
  halo?: boolean;
  eyeColor?: string;
}) {
  const body = "M8 54C5 35 17 21 35 19C43 18 50 17 57 14C60 32 56 49 41 55C31 59 20 53 8 54Z";
  const stem = "M30 21C28 12 36 6 45 9";

  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className} fill="none">
      {halo && (
        <g
          stroke="var(--background)"
          strokeWidth="6"
          strokeLinejoin="round"
          strokeLinecap="round"
          fill="var(--background)"
        >
          <path d={body} />
          <path d={stem} fill="none" />
        </g>
      )}
      <path d={stem} stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
      <path d={body} fill="currentColor" />
      <circle className="leaf-bot-eye" cx="25" cy="37" r="3.6" fill={eyeColor} />
      <circle className="leaf-bot-eye" cx="40" cy="34" r="3.6" fill={eyeColor} />
    </svg>
  );
}
