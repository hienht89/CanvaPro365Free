import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className, showText = true, size = 'md' }: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: 'text-lg' },
    md: { icon: 32, text: 'text-xl' },
    lg: { icon: 40, text: 'text-2xl' },
  };

  const { icon, text } = sizes[size];

  return (
    <Link to="/" className={cn("flex items-center gap-2", className)}>
      {/* Chain Link Icon */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Top link - Pink/Magenta */}
        <path
          d="M28 12C28 7.58 24.42 4 20 4C15.58 4 12 7.58 12 12V20C12 24.42 15.58 28 20 28"
          stroke="url(#pinkGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        {/* Bottom link - Cyan/Teal */}
        <path
          d="M20 36C20 40.42 23.58 44 28 44C32.42 44 36 40.42 36 36V28C36 23.58 32.42 20 28 20"
          stroke="url(#cyanGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        {/* Gradients */}
        <defs>
          <linearGradient id="pinkGradient" x1="12" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#EC4899" />
            <stop offset="1" stopColor="#DB2777" />
          </linearGradient>
          <linearGradient id="cyanGradient" x1="20" y1="20" x2="36" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#06B6D4" />
            <stop offset="1" stopColor="#0891B2" />
          </linearGradient>
        </defs>
      </svg>

      {/* Text Logo */}
      {showText && (
        <span className={cn("font-bold tracking-tight", text)}>
          <span className="text-foreground">CanvaPro</span>
          <span className="text-orange-500">365</span>
          <span className="text-foreground">Free</span>
          <span className="text-cyan-500">✓</span>
        </span>
      )}
    </Link>
  );
}

// Icon only version for favicon/small spaces
export function LogoIcon({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Top link - Pink/Magenta */}
      <path
        d="M28 12C28 7.58 24.42 4 20 4C15.58 4 12 7.58 12 12V20C12 24.42 15.58 28 20 28"
        stroke="url(#pinkGradientIcon)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Bottom link - Cyan/Teal */}
      <path
        d="M20 36C20 40.42 23.58 44 28 44C32.42 44 36 40.42 36 36V28C36 23.58 32.42 20 28 20"
        stroke="url(#cyanGradientIcon)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Gradients */}
      <defs>
        <linearGradient id="pinkGradientIcon" x1="12" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EC4899" />
          <stop offset="1" stopColor="#DB2777" />
        </linearGradient>
        <linearGradient id="cyanGradientIcon" x1="20" y1="20" x2="36" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#06B6D4" />
          <stop offset="1" stopColor="#0891B2" />
        </linearGradient>
      </defs>
    </svg>
  );
}
