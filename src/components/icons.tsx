import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function HeartIcon(props: IconProps) {
  return (
    <svg width={18} height={18} {...base} {...props}>
      <path d="M12 20.3 4.6 13a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9A4.6 4.6 0 0 1 19.4 13L12 20.3z" />
    </svg>
  );
}

export function HeartSolid(props: IconProps) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 20.3 4.6 13a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9A4.6 4.6 0 0 1 19.4 13L12 20.3z" />
    </svg>
  );
}

export function NoteIcon(props: IconProps) {
  return (
    <svg width={18} height={18} {...base} {...props}>
      <path d="M9 18V6l10-2v10" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="16.5" cy="14" r="2.5" />
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <svg width={16} height={16} {...base} {...props}>
      <path d="M7 5.5v13l11-6.5-11-6.5z" />
    </svg>
  );
}
