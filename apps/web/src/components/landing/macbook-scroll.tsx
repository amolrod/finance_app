'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';

type MacbookScrollProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function MacbookScroll({
  title,
  subtitle,
  badge,
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

  const scaleX = useTransform(scrollYProgress, [0, 0.3], [1.08, isMobile ? 1 : 1.35]);
  const scaleY = useTransform(scrollYProgress, [0, 0.3], [0.65, isMobile ? 1 : 1.35]);
  const translate = useTransform(scrollYProgress, [0, 1], [0, 1200]);
  const rotate = useTransform(scrollYProgress, [0.1, 0.3], [-24, 0]);
  const textTransform = useTransform(scrollYProgress, [0, 0.3], [0, 120]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div
      ref={ref}
      className={cn(
        'flex min-h-[200vh] shrink-0 scale-[0.45] transform flex-col items-center justify-start py-0 [perspective:900px] sm:scale-50 md:scale-100 md:py-72',
        className
      )}
    >
      <motion.div
        style={{
          translateY: textTransform,
          opacity: textOpacity,
        }}
        className="mb-20 max-w-2xl text-center"
      >
        <h2 className="text-3xl font-semibold text-neutral-900 sm:text-4xl lg:text-5xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-4 text-base text-neutral-600 sm:text-lg">
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
        className="relative h-[12rem] w-[32rem] rounded-2xl bg-[#0b0b0d] p-2"
      >
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-[#0b0b0d]">
          <Logo className="h-7 w-7 text-white/70" />
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
        className="absolute inset-0 h-96 w-[32rem] rounded-2xl bg-[#0b0b0d] p-2"
      >
        <div className="absolute inset-0 rounded-xl bg-[#141416]" />
        <div className="absolute inset-0 rounded-xl border border-white/10 bg-[#0f1115] p-3">
          <div className="h-full w-full overflow-hidden rounded-lg border border-white/10 bg-[#10141b]">
            {children}
          </div>
        </div>
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
      <div className="relative h-10 w-full">
        <div className="absolute inset-x-0 mx-auto h-3.5 w-[82%] rounded-b-xl bg-[#0b0b0d]" />
      </div>
      <div className="relative flex h-[12.5rem]">
        <div className="mx-auto h-full w-[10%] overflow-hidden">
          <SpeakerGrid />
        </div>
        <div className="mx-auto h-full w-[80%]">
          <KeyboardGrid />
        </div>
        <div className="mx-auto h-full w-[10%] overflow-hidden">
          <SpeakerGrid />
        </div>
      </div>
      <Trackpad />
      <div className="absolute inset-x-0 bottom-0 mx-auto h-2 w-20 rounded-tl-3xl rounded-tr-3xl bg-gradient-to-t from-[#9f9ea2] to-[#2a2a2c]" />
      {badge ? <div className="absolute bottom-4 left-4">{badge}</div> : null}
    </div>
  );
}

function Trackpad() {
  return (
    <div
      className="mx-auto my-2 h-24 w-[36%] rounded-xl bg-[#c5c2bd]"
      style={{
        boxShadow: '0px 0px 1px 1px #00000020 inset',
      }}
    />
  );
}

function KeyboardGrid() {
  const keys = Array.from({ length: 60 });
  return (
    <div className="mx-2 h-full rounded-md bg-[#0b0b0d] p-2">
      <div className="grid grid-cols-12 gap-[2px]">
        {keys.map((_, index) => (
          <div
            key={`key-${index}`}
            className="h-4 rounded-[4px] bg-[#141416]"
            style={{
              boxShadow: '0px -0.5px 2px 0 #0d0d0f inset, -0.5px 0px 2px 0 #0d0d0f inset',
            }}
          />
        ))}
      </div>
    </div>
  );
}

function SpeakerGrid() {
  return (
    <div
      className="mt-2 h-40 w-full"
      style={{
        backgroundImage: 'radial-gradient(circle, #2d2c30 0.5px, transparent 0.5px)',
        backgroundSize: '4px 4px',
      }}
    />
  );
}
