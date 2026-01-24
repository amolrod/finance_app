'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

type TimelineItem = {
  title: string;
  content: React.ReactNode;
};

const BAR_HEIGHTS = [28, 42, 58, 36, 72, 54, 40, 62];

const TIMELINE_DATA: TimelineItem[] = [
  {
    title: 'Configura tu base',
    content: (
      <div className="rounded-2xl border border-neutral-200/80 bg-white/90 p-6 text-sm text-neutral-600 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70 dark:text-neutral-200">
        <p className="text-base font-semibold text-neutral-900 dark:text-white">
          Define moneda, saldos y objetivos en minutos.
        </p>
        <p className="mt-2">
          Empieza con un panorama limpio: cuentas, metas y preferencias quedan listos para
          que el tablero tenga sentido desde el primer dia.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {['Monedas', 'Saldos', 'Metas'].map((label) => (
            <div
              key={label}
              className="rounded-xl border border-neutral-200/70 bg-white/80 px-3 py-2 text-xs font-semibold text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-200"
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'Clasifica en segundos',
    content: (
      <div className="rounded-2xl border border-neutral-200/80 bg-white/90 p-6 text-sm text-neutral-600 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70 dark:text-neutral-200">
        <p className="text-base font-semibold text-neutral-900 dark:text-white">
          Categorias y etiquetas que se entienden a simple vista.
        </p>
        <p className="mt-2">
          Organiza cada movimiento con colores claros, iconos reconocibles y reglas que
          aprenden tus patrones de gasto.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {['Comida', 'Transporte', 'Hogar', 'Salud', 'Ahorro'].map((label) => (
            <span
              key={label}
              className="rounded-full border border-neutral-200/70 bg-white/80 px-3 py-1 text-xs font-semibold text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-200"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'Ve el pulso completo',
    content: (
      <div className="rounded-2xl border border-neutral-200/80 bg-white/90 p-6 text-sm text-neutral-600 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70 dark:text-neutral-200">
        <p className="text-base font-semibold text-neutral-900 dark:text-white">
          Un panel con ritmo real, sin ruido extra.
        </p>
        <p className="mt-2">
          Saldos, tendencias y alertas se leen de inmediato. El panel prioriza lo
          importante para que tomes decisiones con calma.
        </p>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-300">
            <span>Flujo mensual</span>
            <span>+6.4%</span>
          </div>
          <div className="mt-3 flex h-16 items-end gap-1">
            {BAR_HEIGHTS.map((height, index) => (
              <div
                key={`bar-${index}`}
                className="flex-1 rounded-full bg-gradient-to-t from-emerald-500/70 to-emerald-300/40"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Decide con seguridad',
    content: (
      <div className="rounded-2xl border border-neutral-200/80 bg-white/90 p-6 text-sm text-neutral-600 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70 dark:text-neutral-200">
        <p className="text-base font-semibold text-neutral-900 dark:text-white">
          Recomendaciones suaves, sin imponer.
        </p>
        <p className="mt-2">
          La app destaca riesgos, oportunidades y metas en progreso. Tu eliges el ritmo y
          los siguientes pasos.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-3 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/30 dark:text-emerald-200">
            Meta ahorro 78%
          </div>
          <div className="rounded-xl border border-blue-200/80 bg-blue-50/80 px-3 py-2 text-xs font-semibold text-blue-700 dark:border-blue-900/60 dark:bg-blue-900/30 dark:text-blue-200">
            Presupuesto estable
          </div>
        </div>
      </div>
    ),
  },
];

export default function ComoFuncionaPage() {
  return <Timeline data={TIMELINE_DATA} />;
}

export function Timeline({ data }: { data: TimelineItem[] }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 10%', 'end 50%'],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div className="w-full bg-white font-sans dark:bg-neutral-950 md:px-10" ref={containerRef}>
      <div className="mx-auto max-w-7xl px-4 py-20 md:px-8 lg:px-10">
        <h2 className="mb-4 max-w-4xl text-lg text-black dark:text-white md:text-4xl">
          Como trabaja FinanceApp en tu dia a dia
        </h2>
        <p className="max-w-sm text-sm text-neutral-700 dark:text-neutral-300 md:text-base">
          Un recorrido claro por todo lo que hace la app para ordenar tus finanzas sin
          friccion.
        </p>
      </div>
      <div ref={ref} className="relative mx-auto max-w-7xl pb-20">
        {data.map((item, index) => (
          <div key={index} className="flex justify-start pt-10 md:gap-10 md:pt-40">
            <div className="sticky top-40 z-40 flex max-w-xs flex-col items-center self-start md:w-full md:flex-row lg:max-w-sm">
              <div className="absolute left-3 flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-black md:left-3">
                <div className="h-4 w-4 rounded-full border border-neutral-300 bg-neutral-200 p-2 dark:border-neutral-700 dark:bg-neutral-800" />
              </div>
              <h3 className="hidden text-xl font-bold text-neutral-500 dark:text-neutral-500 md:block md:pl-20 md:text-5xl">
                {item.title}
              </h3>
            </div>

            <div className="relative w-full pl-20 pr-4 md:pl-4">
              <h3 className="mb-4 block text-left text-2xl font-bold text-neutral-500 dark:text-neutral-500 md:hidden">
                {item.title}
              </h3>
              {item.content}{' '}
            </div>
          </div>
        ))}
        <div
          style={{ height: `${height}px` }}
          className="absolute left-8 top-0 w-[2px] overflow-hidden bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-neutral-200 to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] dark:via-neutral-700 md:left-8"
        >
          <motion.div
            style={{ height: heightTransform, opacity: opacityTransform }}
            className="absolute inset-x-0 top-0 w-[2px] rounded-full bg-gradient-to-t from-purple-500 via-blue-500 to-transparent from-[0%] via-[10%]"
          />
        </div>
      </div>
    </div>
  );
}
