'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';

type MacbookScrollProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  density?: 'default' | 'compact';
  children?: ReactNode;
  className?: string;
};

export function MacbookScroll({
  title,
  subtitle,
  badge,
  density = 'default',
  children,
  className,
}: MacbookScrollProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => {
      setIsMobile(window.innerWidth < 768);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const isCompact = density === 'compact';
  const targetScale = isMobile ? 1 : isCompact ? 1.25 : 1.35;
  const travelDistance = isCompact ? 900 : 1200;
  const textTravel = isCompact ? 90 : 120;

  const scaleX = useTransform(scrollYProgress, [0, 0.3], [1.08, targetScale]);
  const scaleY = useTransform(scrollYProgress, [0, 0.3], [0.65, targetScale]);
  const translate = useTransform(scrollYProgress, [0, 1], [0, travelDistance]);
  const rotate = useTransform(scrollYProgress, [0.1, 0.3], [-24, 0]);
  const textTransform = useTransform(scrollYProgress, [0, 0.3], [0, textTravel]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const containerClassName = isCompact
    ? 'flex min-h-[140vh] shrink-0 scale-[0.4] transform flex-col items-center justify-start py-0 [perspective:900px] sm:scale-50 md:scale-[0.92] md:py-36'
    : 'flex min-h-[200vh] shrink-0 scale-[0.45] transform flex-col items-center justify-start py-0 [perspective:900px] sm:scale-50 md:scale-100 md:py-72';
  const headingSpacing = isCompact ? 'mb-8 md:mb-10' : 'mb-20';

  return (
    <div
      ref={ref}
      className={cn(
        containerClassName,
        className
      )}
    >
      <motion.div
        style={{
          translateY: textTransform,
          opacity: textOpacity,
        }}
        className={cn('max-w-2xl text-center', headingSpacing)}
      >
        <h2 className="text-3xl font-semibold text-foreground sm:text-4xl lg:text-5xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            {subtitle}
          </p>
        ) : null}
      </motion.div>

      <MacbookLid
        scaleX={scaleX}
        scaleY={scaleY}
        rotate={rotate}
        translate={translate}
      >
        {children}
      </MacbookLid>

      <MacbookBase badge={badge} />
    </div>
  );
}

type MacbookLidProps = {
  scaleX: ReturnType<typeof useTransform>;
  scaleY: ReturnType<typeof useTransform>;
  rotate: ReturnType<typeof useTransform>;
  translate: ReturnType<typeof useTransform>;
  children?: ReactNode;
};

function MacbookLid({ scaleX, scaleY, rotate, translate, children }: MacbookLidProps) {
  return (
    <div className="relative [perspective:900px]">
      <div
        style={{
          transform: 'perspective(900px) rotateX(-24deg) translateZ(0px)',
          transformOrigin: 'bottom',
          transformStyle: 'preserve-3d',
        }}
        className="relative h-[12rem] w-[32rem] rounded-2xl bg-[#0b0b0d] p-2 shadow-[0_22px_60px_rgba(0,0,0,0.45)]"
      >
        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.16),transparent_60%)] opacity-80" />
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-black/50 opacity-80" />
        <div className="absolute inset-x-6 top-2 h-px bg-white/15" />
        <div className="absolute inset-x-10 bottom-2 h-px bg-black/60" />
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-[#0b0b0d]">
          <div className="absolute inset-0 rounded-xl border border-white/5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]" />
          <div className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.14),transparent_65%)] opacity-40" />
          <Logo className="relative z-10 h-7 w-7 text-white/75" />
        </div>
      </div>

      <motion.div
        style={{
          scaleX,
          scaleY,
          rotateX: rotate,
          translateY: translate,
          transformStyle: 'preserve-3d',
          transformOrigin: 'top',
        }}
        className="absolute inset-0 h-96 w-[32rem] rounded-2xl bg-[#0b0b0d] p-2 shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
      >
        <div className="absolute inset-0 rounded-xl bg-[#141416]" />
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 via-transparent to-black/40 opacity-70" />
        <div className="absolute inset-0 rounded-xl border border-white/10 bg-[#0f1115] p-3">
          <div className="relative h-full w-full overflow-hidden rounded-lg border border-white/10 bg-[#10141b]">
            <div className="absolute left-1/2 top-2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white/20" />
            {children}
            <div className="absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-transparent opacity-40" />
            <div className="absolute -left-1/3 top-0 h-full w-[60%] rotate-[8deg] bg-gradient-to-r from-white/20 via-white/5 to-transparent opacity-45" />
            <div className="absolute inset-x-8 bottom-0 h-5 bg-gradient-to-t from-white/15 to-transparent opacity-50" />
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/45 to-transparent" />
      </motion.div>
    </div>
  );
}

type MacbookBaseProps = {
  badge?: ReactNode;
};

function MacbookBase({ badge }: MacbookBaseProps) {
  return (
    <div className="relative -z-10 h-[22rem] w-[32rem] overflow-hidden rounded-2xl bg-[#d6d3ce]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.65)_0%,rgba(255,255,255,0.25)_35%,rgba(0,0,0,0.18)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.7)_0%,transparent_55%)] opacity-70" />
        <div className="absolute inset-x-10 top-10 h-28 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.45)_0%,rgba(255,255,255,0.16)_35%,transparent_70%)] opacity-60 mix-blend-screen" />
        <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white/30 to-transparent opacity-60" />
        <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white/30 to-transparent opacity-60" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />
      </div>
      <div className="relative z-10 h-10 w-full">
        <div className="absolute inset-x-0 mx-auto h-4 w-[80%] rounded-b-xl bg-[#0b0b0d] shadow-[0_12px_20px_rgba(0,0,0,0.35)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-white/40" />
        <div className="absolute inset-x-12 top-[2px] h-px bg-white/30" />
      </div>
      <div className="relative z-10 flex h-[12.5rem]">
        <div className="mx-auto h-full w-[10%] overflow-hidden">
          <SpeakerGrid />
        </div>
        <div className="mx-auto h-full w-[80%]">
          <Keypad />
        </div>
        <div className="mx-auto h-full w-[10%] overflow-hidden">
          <SpeakerGrid />
        </div>
      </div>
      <div className="relative z-10">
        <Trackpad />
      </div>
      <div className="absolute inset-x-0 bottom-0 mx-auto h-2 w-20 rounded-tl-3xl rounded-tr-3xl bg-gradient-to-t from-[#9f9ea2] to-[#2a2a2c]" />
      {badge ? <div className="absolute bottom-4 left-4">{badge}</div> : null}
    </div>
  );
}

function Trackpad() {
  return (
    <div
      className="relative mx-auto my-2 h-24 w-[36%] rounded-xl bg-gradient-to-b from-[#dedad6] to-[#bdb9b4]"
      style={{
        boxShadow: '0px 0px 1px 1px #00000020 inset',
      }}
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/50 via-transparent to-black/20" />
      <div className="absolute inset-x-6 bottom-2 h-px bg-black/25" />
    </div>
  );
}

function Keypad() {
  return (
    <div className="mx-1 h-full rounded-md bg-[#050505] p-1">
      <div className="mb-[2px] flex w-full shrink-0 gap-[2px]">
        <KBtn className="w-10 items-end justify-start pb-[2px] pl-[4px]" childrenClassName="items-start">
          esc
        </KBtn>
        <KBtn>
          <MiniSun dim />
          <span className="mt-1 inline-block">F1</span>
        </KBtn>
        <KBtn>
          <MiniSun />
          <span className="mt-1 inline-block">F2</span>
        </KBtn>
        <KBtn>
          <MiniGrid />
          <span className="mt-1 inline-block">F3</span>
        </KBtn>
        <KBtn>
          <MiniSearch />
          <span className="mt-1 inline-block">F4</span>
        </KBtn>
        <KBtn>
          <MiniMic />
          <span className="mt-1 inline-block">F5</span>
        </KBtn>
        <KBtn>
          <MiniMoon />
          <span className="mt-1 inline-block">F6</span>
        </KBtn>
        <KBtn>
          <MiniPrev />
          <span className="mt-1 inline-block">F7</span>
        </KBtn>
        <KBtn>
          <MiniPlay />
          <span className="mt-1 inline-block">F8</span>
        </KBtn>
        <KBtn>
          <MiniNext />
          <span className="mt-1 inline-block">F9</span>
        </KBtn>
        <KBtn>
          <MiniVolume level={1} />
          <span className="mt-1 inline-block">F10</span>
        </KBtn>
        <KBtn>
          <MiniVolume level={2} />
          <span className="mt-1 inline-block">F11</span>
        </KBtn>
        <KBtn>
          <MiniVolume level={3} />
          <span className="mt-1 inline-block">F12</span>
        </KBtn>
        <KBtn backlit={false}>
          <div className="h-4 w-4 rounded-full bg-gradient-to-b from-neutral-900 via-black to-neutral-900 p-px">
            <div className="h-full w-full rounded-full bg-black" />
          </div>
        </KBtn>
      </div>
      <div className="mb-[2px] flex w-full shrink-0 gap-[2px]">
        <KBtn>
          <span className="block">~</span>
          <span className="mt-1 block">`</span>
        </KBtn>
        <KBtn>
          <span className="block">!</span>
          <span className="block">1</span>
        </KBtn>
        <KBtn>
          <span className="block">@</span>
          <span className="block">2</span>
        </KBtn>
        <KBtn>
          <span className="block">#</span>
          <span className="block">3</span>
        </KBtn>
        <KBtn>
          <span className="block">$</span>
          <span className="block">4</span>
        </KBtn>
        <KBtn>
          <span className="block">%</span>
          <span className="block">5</span>
        </KBtn>
        <KBtn>
          <span className="block">^</span>
          <span className="block">6</span>
        </KBtn>
        <KBtn>
          <span className="block">&amp;</span>
          <span className="block">7</span>
        </KBtn>
        <KBtn>
          <span className="block">*</span>
          <span className="block">8</span>
        </KBtn>
        <KBtn>
          <span className="block">(</span>
          <span className="block">9</span>
        </KBtn>
        <KBtn>
          <span className="block">)</span>
          <span className="block">0</span>
        </KBtn>
        <KBtn>
          <span className="block">-</span>
          <span className="block">_</span>
        </KBtn>
        <KBtn>
          <span className="block">+</span>
          <span className="block">=</span>
        </KBtn>
        <KBtn className="w-10 items-end justify-end pr-[4px] pb-[2px]" childrenClassName="items-end">
          delete
        </KBtn>
      </div>
      <div className="mb-[2px] flex w-full shrink-0 gap-[2px]">
        <KBtn className="w-10 items-end justify-start pb-[2px] pl-[4px]" childrenClassName="items-start">
          tab
        </KBtn>
        {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map((key) => (
          <KBtn key={`key-${key}`}>
            <span className="block">{key}</span>
          </KBtn>
        ))}
        <KBtn>
          <span className="block">{'{'}</span>
          <span className="block">{'['}</span>
        </KBtn>
        <KBtn>
          <span className="block">{'}'}</span>
          <span className="block">{']'}</span>
        </KBtn>
        <KBtn>
          <span className="block">|</span>
          <span className="block">\\</span>
        </KBtn>
      </div>
      <div className="mb-[2px] flex w-full shrink-0 gap-[2px]">
        <KBtn className="w-[2.8rem] items-end justify-start pb-[2px] pl-[4px]" childrenClassName="items-start">
          caps lock
        </KBtn>
        {['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'].map((key) => (
          <KBtn key={`key-${key}`}>
            <span className="block">{key}</span>
          </KBtn>
        ))}
        <KBtn>
          <span className="block">:</span>
          <span className="block">;</span>
        </KBtn>
        <KBtn>
          <span className="block">{'"'}</span>
          <span className="block">{'\''}</span>
        </KBtn>
        <KBtn className="w-[2.85rem] items-end justify-end pr-[4px] pb-[2px]" childrenClassName="items-end">
          return
        </KBtn>
      </div>
      <div className="mb-[2px] flex w-full shrink-0 gap-[2px]">
        <KBtn className="w-[3.65rem] items-end justify-start pb-[2px] pl-[4px]" childrenClassName="items-start">
          shift
        </KBtn>
        {['Z', 'X', 'C', 'V', 'B', 'N', 'M'].map((key) => (
          <KBtn key={`key-${key}`}>
            <span className="block">{key}</span>
          </KBtn>
        ))}
        <KBtn>
          <span className="block">{'<'}</span>
          <span className="block">,</span>
        </KBtn>
        <KBtn>
          <span className="block">{'>'}</span>
          <span className="block">.</span>
        </KBtn>
        <KBtn>
          <span className="block">?</span>
          <span className="block">/</span>
        </KBtn>
        <KBtn className="w-[3.65rem] items-end justify-end pr-[4px] pb-[2px]" childrenClassName="items-end">
          shift
        </KBtn>
      </div>
      <div className="mb-[2px] flex w-full shrink-0 gap-[2px]">
        <KBtn childrenClassName="h-full justify-between py-[4px]">
          <div className="flex w-full justify-end pr-1">
            <span className="block">fn</span>
          </div>
          <div className="flex w-full justify-start pl-1">
            <MiniGlobe />
          </div>
        </KBtn>
        <KBtn childrenClassName="h-full justify-between py-[4px]">
          <div className="flex w-full justify-end pr-1">
            <MiniChevron direction="up" />
          </div>
          <div className="flex w-full justify-start pl-1">
            <span className="block">control</span>
          </div>
        </KBtn>
        <KBtn childrenClassName="h-full justify-between py-[4px]">
          <div className="flex w-full justify-end pr-1">
            <OptionKey className="h-[6px] w-[6px]" />
          </div>
          <div className="flex w-full justify-start pl-1">
            <span className="block">option</span>
          </div>
        </KBtn>
        <KBtn className="w-8" childrenClassName="h-full justify-between py-[4px]">
          <div className="flex w-full justify-end pr-1">
            <span className="block">cmd</span>
          </div>
          <div className="flex w-full justify-start pl-1">
            <span className="block">command</span>
          </div>
        </KBtn>
        <KBtn className="w-[8.2rem]" />
        <KBtn className="w-8" childrenClassName="h-full justify-between py-[4px]">
          <div className="flex w-full justify-start pl-1">
            <span className="block">cmd</span>
          </div>
          <div className="flex w-full justify-start pl-1">
            <span className="block">command</span>
          </div>
        </KBtn>
        <KBtn childrenClassName="h-full justify-between py-[4px]">
          <div className="flex w-full justify-start pl-1">
            <OptionKey className="h-[6px] w-[6px]" />
          </div>
          <div className="flex w-full justify-start pl-1">
            <span className="block">option</span>
          </div>
        </KBtn>
        <div className="mt-[2px] flex h-6 w-[4.9rem] flex-col items-center justify-end rounded-[4px] p-[0.5px]">
          <KBtn className="h-3 w-6">
            <MiniCaret direction="up" />
          </KBtn>
          <div className="flex">
            <KBtn className="h-3 w-6">
              <MiniCaret direction="left" />
            </KBtn>
            <KBtn className="h-3 w-6">
              <MiniCaret direction="down" />
            </KBtn>
            <KBtn className="h-3 w-6">
              <MiniCaret direction="right" />
            </KBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

type KBtnProps = {
  className?: string;
  children?: ReactNode;
  childrenClassName?: string;
  backlit?: boolean;
};

function KBtn({ className, children, childrenClassName, backlit = true }: KBtnProps) {
  return (
    <div
      className={cn(
        '[transform:translateZ(0)] rounded-[4px] p-[0.5px] [will-change:transform]',
        backlit && 'bg-white/[0.2] shadow-[0_0_18px_rgba(255,255,255,0.22)]'
      )}
    >
      <div
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-[3.5px] bg-[#0f1115]',
          className
        )}
        style={{
          boxShadow: '0px -0.5px 2px 0 #0d0d0f inset, -0.5px 0px 2px 0 #0d0d0f inset',
        }}
      >
        <div
          className={cn(
            'flex w-full flex-col items-center justify-center text-[5px] text-neutral-200',
            childrenClassName,
            backlit && 'text-white'
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function SpeakerGrid() {
  return (
    <div className="relative mt-2 h-40 w-full">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, #2d2c30 0.5px, transparent 0.5px)',
          backgroundSize: '3px 3px',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/30" />
    </div>
  );
}

function MiniSun({ dim = false }: { dim?: boolean }) {
  return (
    <svg viewBox="0 0 12 12" className="h-[6px] w-[6px]" fill="none" stroke="currentColor">
      <circle cx="6" cy="6" r={dim ? 2 : 2.5} strokeWidth="1" />
      <line x1="6" y1="0.5" x2="6" y2="2" strokeWidth="1" />
      <line x1="6" y1="10" x2="6" y2="11.5" strokeWidth="1" />
      <line x1="0.5" y1="6" x2="2" y2="6" strokeWidth="1" />
      <line x1="10" y1="6" x2="11.5" y2="6" strokeWidth="1" />
    </svg>
  );
}

function MiniGrid() {
  return (
    <svg viewBox="0 0 12 12" className="h-[6px] w-[6px]" fill="none" stroke="currentColor">
      <rect x="1" y="1" width="3" height="3" strokeWidth="1" />
      <rect x="8" y="1" width="3" height="3" strokeWidth="1" />
      <rect x="1" y="8" width="3" height="3" strokeWidth="1" />
      <rect x="8" y="8" width="3" height="3" strokeWidth="1" />
    </svg>
  );
}

function MiniSearch() {
  return (
    <svg viewBox="0 0 12 12" className="h-[6px] w-[6px]" fill="none" stroke="currentColor">
      <circle cx="5" cy="5" r="3" strokeWidth="1" />
      <line x1="7.5" y1="7.5" x2="11" y2="11" strokeWidth="1" />
    </svg>
  );
}

function MiniMic() {
  return (
    <svg viewBox="0 0 12 12" className="h-[6px] w-[6px]" fill="none" stroke="currentColor">
      <rect x="4" y="2" width="4" height="5" rx="2" strokeWidth="1" />
      <line x1="6" y1="7" x2="6" y2="9.5" strokeWidth="1" />
      <line x1="4" y1="9.5" x2="8" y2="9.5" strokeWidth="1" />
    </svg>
  );
}

function MiniMoon() {
  return (
    <svg viewBox="0 0 12 12" className="h-[6px] w-[6px]" fill="none" stroke="currentColor">
      <path d="M8.5 2.5A4 4 0 1 0 8.5 9.5A3 3 0 1 1 8.5 2.5Z" strokeWidth="1" />
    </svg>
  );
}

function MiniPrev() {
  return (
    <svg viewBox="0 0 12 12" className="h-[6px] w-[6px]" fill="none" stroke="currentColor">
      <polygon points="7,2 3,6 7,10" fill="currentColor" />
      <line x1="9" y1="2" x2="9" y2="10" strokeWidth="1" />
    </svg>
  );
}

function MiniPlay() {
  return (
    <svg viewBox="0 0 12 12" className="h-[6px] w-[6px]" fill="currentColor">
      <polygon points="3,2 9,6 3,10" />
    </svg>
  );
}

function MiniNext() {
  return (
    <svg viewBox="0 0 12 12" className="h-[6px] w-[6px]" fill="none" stroke="currentColor">
      <polygon points="5,2 9,6 5,10" fill="currentColor" />
      <line x1="3" y1="2" x2="3" y2="10" strokeWidth="1" />
    </svg>
  );
}

function MiniVolume({ level }: { level: 1 | 2 | 3 }) {
  return (
    <svg viewBox="0 0 12 12" className="h-[6px] w-[6px]" fill="none" stroke="currentColor">
      <polygon points="1,4 4,4 6,2 6,10 4,8 1,8" strokeWidth="1" />
      {level >= 1 && <path d="M7 5 C8 5.5 8 6.5 7 7" strokeWidth="1" />}
      {level >= 2 && <path d="M8.5 4 C10 5 10 7 8.5 8" strokeWidth="1" />}
      {level >= 3 && <path d="M9.8 3 C11.5 4.5 11.5 7.5 9.8 9" strokeWidth="1" />}
    </svg>
  );
}

function MiniGlobe() {
  return (
    <svg viewBox="0 0 12 12" className="h-[6px] w-[6px]" fill="none" stroke="currentColor">
      <circle cx="6" cy="6" r="4" strokeWidth="1" />
      <line x1="2" y1="6" x2="10" y2="6" strokeWidth="1" />
      <line x1="6" y1="2" x2="6" y2="10" strokeWidth="1" />
    </svg>
  );
}

function MiniChevron({ direction }: { direction: 'up' | 'down' | 'left' | 'right' }) {
  const paths = {
    up: 'M3 7 L6 4 L9 7',
    down: 'M3 5 L6 8 L9 5',
    left: 'M7 3 L4 6 L7 9',
    right: 'M5 3 L8 6 L5 9',
  };
  return (
    <svg viewBox="0 0 12 12" className="h-[6px] w-[6px]" fill="none" stroke="currentColor">
      <path d={paths[direction]} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MiniCaret({ direction }: { direction: 'up' | 'down' | 'left' | 'right' }) {
  const points = {
    up: '6,3 10,9 2,9',
    down: '2,3 10,3 6,9',
    left: '3,6 9,2 9,10',
    right: '3,2 9,6 3,10',
  };
  return (
    <svg viewBox="0 0 12 12" className="h-[6px] w-[6px]" fill="currentColor">
      <polygon points={points[direction]} />
    </svg>
  );
}

function OptionKey({ className }: { className?: string }) {
  return (
    <svg
      fill="none"
      version="1.1"
      viewBox="0 0 32 32"
      className={className}
    >
      <rect stroke="currentColor" strokeWidth="2" x="18" y="5" width="10" height="2" />
      <polygon
        stroke="currentColor"
        strokeWidth="2"
        points="10.6,5 4,5 4,7 9.4,7 18.4,27 28,27 28,25 19.6,25 "
      />
      <rect width="32" height="32" stroke="none" />
    </svg>
  );
}
