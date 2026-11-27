import { baseDuration, isDottedDuration } from "../utils/tabOperations";

/**
 * A small engraved note glyph for a duration in beats — whole, half, quarter, eighth or
 * sixteenth, with an augmentation dot when the value is dotted. Drawn as SVG rather than
 * a Unicode musical symbol because the musical-symbols block is absent from most system
 * fonts and renders as tofu.
 */
export function NoteValueIcon({
  beats,
  className,
}: {
  beats: number;
  className?: string;
}) {
  const dotted = isDottedDuration(beats);
  const base = baseDuration(beats);

  const filled = base <= 1 + 1e-6; // quarter and shorter have a filled head
  const hasStem = base < 4 - 1e-6; // everything but the whole note
  const flags = base <= 0.5 + 1e-6 ? (base <= 0.25 + 1e-6 ? 2 : 1) : 0;

  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      aria-hidden="true">
      <ellipse
        cx="8"
        cy="16.5"
        rx="4.1"
        ry="3.1"
        transform="rotate(-22 8 16.5)"
        fill={filled ? "currentColor" : "none"}
        strokeWidth={filled ? 0 : 1.6}
      />
      {hasStem && (
        <line x1="11.7" y1="15.5" x2="11.7" y2="3.5" strokeWidth="1.5" strokeLinecap="round" />
      )}
      {flags >= 1 && (
        <path
          d="M11.7 3.8 C16.5 5 16.8 9 13.6 11.2"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )}
      {flags >= 2 && (
        <path
          d="M11.7 7.3 C16.5 8.5 16.8 12.5 13.6 14.7"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )}
      {dotted && <circle cx="15.5" cy="16.5" r="1.5" fill="currentColor" strokeWidth="0" />}
    </svg>
  );
}
