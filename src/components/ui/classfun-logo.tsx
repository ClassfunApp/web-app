/**
 * Classfun brand logo component.
 *
 * Variants:
 *  - "wordmark"  — "class" (purple) + "fun" (orange) text + swoosh  (default)
 *  - "mark"      — compact square icon (navy bg, cf letters)
 *  - "full"      — icon mark + wordmark side-by-side
 */

interface ClassfunLogoProps {
  variant?: 'wordmark' | 'mark' | 'full';
  /** Text size for wordmark. Defaults to 'xl'. */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  /** Whether to animate the swoosh on mount */
  animated?: boolean;
  className?: string;
}

const textSizes: Record<string, string> = {
  sm:  'text-lg',
  md:  'text-xl',
  lg:  'text-2xl',
  xl:  'text-3xl',
  '2xl': 'text-4xl',
  '3xl': 'text-5xl',
};

const markSizes: Record<string, string> = {
  sm:  'w-8 h-8 rounded-xl text-sm',
  md:  'w-9 h-9 rounded-xl text-sm',
  lg:  'w-11 h-11 rounded-xl text-base',
  xl:  'w-14 h-14 rounded-2xl text-lg',
  '2xl': 'w-16 h-16 rounded-2xl text-xl',
  '3xl': 'w-20 h-20 rounded-2xl text-2xl',
};

/** The square icon mark — navy bg, "cf" letters */
function LogoMark({ size = 'md' }: { size?: string }) {
  return (
    <div
      className={`${markSizes[size]} bg-[#1B2B4A] flex items-center justify-center shrink-0 shadow-md`}
      aria-hidden="true"
    >
      <span>
        <span className="font-black text-[#7055DC]">c</span>
        <span className="font-black text-[#E87600]">f</span>
      </span>
    </div>
  );
}

/** The text wordmark: "class" (purple) + "fun" (orange) + swoosh */
function Wordmark({ size = 'xl', animated = false }: { size?: string; animated?: boolean }) {
  const ts = textSizes[size];
  // Swoosh SVG scales with the text
  const swooshH = size === 'sm' ? 8 : size === 'md' ? 9 : size === 'lg' ? 10 : size === 'xl' ? 12 : 14;

  return (
    <div className="flex flex-col items-start leading-none">
      <div className="flex items-baseline">
        <span className={`${ts} font-black text-[#5B45D0] tracking-tight leading-none`}>class</span>
        <span className={`${ts} font-black text-[#E87600] tracking-tight leading-none`}>fun</span>
      </div>
      {/* Swoosh */}
      <svg
        viewBox="0 0 90 10"
        style={{ height: swooshH, width: 'auto' }}
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M 4 7 Q 45 1 86 7"
          stroke="#E87600"
          strokeWidth="3"
          strokeLinecap="round"
          className={animated ? 'cf-logo-swoosh animate' : undefined}
          style={!animated ? undefined : undefined}
        />
      </svg>
    </div>
  );
}

export function ClassfunLogo({
  variant = 'full',
  size = 'xl',
  animated = false,
  className = '',
}: ClassfunLogoProps) {
  if (variant === 'mark') {
    return <LogoMark size={size} />;
  }

  if (variant === 'wordmark') {
    return (
      <div className={className}>
        <Wordmark size={size} animated={animated} />
      </div>
    );
  }

  // 'full' — mark + wordmark
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoMark size={size === 'xl' || size === '2xl' || size === '3xl' ? 'md' : 'sm'} />
      <Wordmark size={size} animated={animated} />
    </div>
  );
}
