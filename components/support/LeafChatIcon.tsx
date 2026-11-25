/** A chat bubble with a leaf inside it, so it reads as "talk to the EcoFurnish assistant". */
export default function LeafChatIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {/* bubble */}
      <path d="M21 11.2a8.6 8.6 0 0 1-12.5 7.7L3 20.4l1.5-4.7A8.6 8.6 0 1 1 21 11.2Z" />
      {/* leaf */}
      <path d="M8.6 14.6c0-3.5 2.4-5.7 6.9-5.9 0 4.2-2.3 6.4-6 6.2" fill="currentColor" fillOpacity="0.25" />
      <path d="M8.6 14.6 7.9 15.6" />
      <path d="M9.4 14.2c1.6-1.9 3.2-3 5.2-3.9" />
    </svg>
  );
}
