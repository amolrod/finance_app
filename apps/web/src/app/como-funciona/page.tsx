'use client';

import React from 'react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';

type Product = {
  title: string;
  link: string;
  thumbnail: string;
};

const makeThumb = (title: string, accent: string) => {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b1120" />
      <stop offset="45%" stop-color="${accent}" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.9" />
      <stop offset="70%" stop-color="#ffffff" stop-opacity="0.25" />
      <stop offset="100%" stop-color="${accent}" stop-opacity="0.6" />
    </linearGradient>
    <radialGradient id="glow" cx="0.2" cy="0.2" r="0.9">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>
    <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
      <path d="M28 0H0V28" fill="none" stroke="#ffffff" stroke-opacity="0.04" stroke-width="1" />
    </pattern>
  </defs>
  <rect width="600" height="600" fill="url(#bg)" />
  <rect width="600" height="600" fill="url(#grid)" opacity="0.6" />
  <rect x="40" y="48" width="520" height="504" rx="36" fill="#0b1120" fill-opacity="0.72" stroke="#ffffff" stroke-opacity="0.12" />
  <rect x="64" y="78" width="472" height="112" rx="20" fill="#0f172a" fill-opacity="0.95" stroke="#ffffff" stroke-opacity="0.06" />
  <rect x="64" y="204" width="472" height="14" rx="7" fill="url(#accent)" opacity="0.85" />
  <circle cx="90" cy="104" r="6" fill="#22c55e" fill-opacity="0.8" />
  <circle cx="110" cy="104" r="6" fill="#f59e0b" fill-opacity="0.8" />
  <circle cx="130" cy="104" r="6" fill="#ef4444" fill-opacity="0.8" />
  <text x="64" y="150" fill="#e2e8f0" font-size="26" font-family="ui-sans-serif, system-ui" font-weight="600">${title}</text>
  <text x="64" y="178" fill="#94a3b8" font-size="15" font-family="ui-sans-serif, system-ui">FinanceApp overview</text>
  <rect x="64" y="236" width="230" height="210" rx="20" fill="#0f172a" fill-opacity="0.88" stroke="#ffffff" stroke-opacity="0.06" />
  <rect x="306" y="236" width="230" height="210" rx="20" fill="#0b1326" fill-opacity="0.9" stroke="#ffffff" stroke-opacity="0.06" />
  <path d="M84 386 C116 360 144 364 172 340 C200 316 236 322 266 298" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round" />
  <path d="M84 402 C116 392 144 396 172 380 C200 362 236 368 266 350" fill="none" stroke="#38bdf8" stroke-opacity="0.7" stroke-width="2" stroke-linecap="round" />
  <rect x="330" y="262" width="18" height="140" rx="8" fill="${accent}" fill-opacity="0.7" />
  <rect x="356" y="292" width="18" height="110" rx="8" fill="#38bdf8" fill-opacity="0.6" />
  <rect x="382" y="322" width="18" height="80" rx="8" fill="#f59e0b" fill-opacity="0.6" />
  <rect x="408" y="302" width="18" height="100" rx="8" fill="#a855f7" fill-opacity="0.6" />
  <rect x="434" y="332" width="18" height="70" rx="8" fill="#22c55e" fill-opacity="0.6" />
  <rect x="460" y="312" width="18" height="90" rx="8" fill="#06b6d4" fill-opacity="0.6" />
  <rect x="64" y="460" width="156" height="70" rx="18" fill="#0f172a" fill-opacity="0.9" stroke="#ffffff" stroke-opacity="0.06" />
  <rect x="232" y="460" width="156" height="70" rx="18" fill="#0f172a" fill-opacity="0.9" stroke="#ffffff" stroke-opacity="0.06" />
  <rect x="400" y="460" width="136" height="70" rx="18" fill="#0f172a" fill-opacity="0.9" stroke="#ffffff" stroke-opacity="0.06" />
  <rect x="86" y="486" width="110" height="8" rx="4" fill="#94a3b8" fill-opacity="0.6" />
  <rect x="250" y="486" width="110" height="8" rx="4" fill="${accent}" fill-opacity="0.65" />
  <rect x="418" y="486" width="90" height="8" rx="4" fill="#38bdf8" fill-opacity="0.6" />
  <circle cx="520" cy="124" r="34" fill="${accent}" fill-opacity="0.15" />
  <circle cx="520" cy="124" r="18" fill="${accent}" fill-opacity="0.45" />
  <rect width="600" height="600" fill="url(#glow)" />
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const PRODUCTS: Product[] = [
  {
    title: 'Dashboard total',
    link: '/dashboard',
    thumbnail: makeThumb('Dashboard total', '#22c55e'),
  },
  {
    title: 'Cuentas claras',
    link: '/dashboard/accounts',
    thumbnail: makeThumb('Cuentas claras', '#16a34a'),
  },
  {
    title: 'Categorias limpias',
    link: '/dashboard/categories',
    thumbnail: makeThumb('Categorias limpias', '#0ea5e9'),
  },
  {
    title: 'Transacciones en foco',
    link: '/dashboard/transactions',
    thumbnail: makeThumb('Transacciones en foco', '#2563eb'),
  },
  {
    title: 'Presupuestos vivos',
    link: '/dashboard/budgets',
    thumbnail: makeThumb('Presupuestos vivos', '#f97316'),
  },
  {
    title: 'Inversiones en orden',
    link: '/dashboard/investments',
    thumbnail: makeThumb('Inversiones en orden', '#a855f7'),
  },
  {
    title: 'Ingresos recurrentes',
    link: '/dashboard/recurring',
    thumbnail: makeThumb('Ingresos recurrentes', '#14b8a6'),
  },
  {
    title: 'Reportes claros',
    link: '/dashboard/reports',
    thumbnail: makeThumb('Reportes claros', '#06b6d4'),
  },
  {
    title: 'Importacion rapida',
    link: '/dashboard/import',
    thumbnail: makeThumb('Importacion rapida', '#f59e0b'),
  },
  {
    title: 'Etiquetas utiles',
    link: '/dashboard/tags',
    thumbnail: makeThumb('Etiquetas utiles', '#ef4444'),
  },
  {
    title: 'Ajustes precisos',
    link: '/dashboard/settings',
    thumbnail: makeThumb('Ajustes precisos', '#64748b'),
  },
  {
    title: 'Alertas suaves',
    link: '/dashboard',
    thumbnail: makeThumb('Alertas suaves', '#0f766e'),
  },
  {
    title: 'Metas visibles',
    link: '/dashboard',
    thumbnail: makeThumb('Metas visibles', '#84cc16'),
  },
  {
    title: 'Login seguro',
    link: '/auth/login',
    thumbnail: makeThumb('Login seguro', '#334155'),
  },
  {
    title: 'Registro simple',
    link: '/auth/register',
    thumbnail: makeThumb('Registro simple', '#1d4ed8'),
  },
];

export default function ComoFuncionaPage() {
  return <HeroParallax products={PRODUCTS} />;
}

export const HeroParallax = ({ products }: { products: Product[] }) => {
  const firstRow = products.slice(0, 5);
  const secondRow = products.slice(5, 10);
  const thirdRow = products.slice(10, 15);
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const springConfig = { stiffness: 300, damping: 30, bounce: 100 };

  const translateX = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1000]), springConfig);
  const translateXReverse = useSpring(useTransform(scrollYProgress, [0, 1], [0, -1000]), springConfig);
  const rotateX = useSpring(useTransform(scrollYProgress, [0, 0.2], [15, 0]), springConfig);
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.2], [0.2, 1]), springConfig);
  const rotateZ = useSpring(useTransform(scrollYProgress, [0, 0.2], [20, 0]), springConfig);
  const translateY = useSpring(useTransform(scrollYProgress, [0, 0.2], [-700, 500]), springConfig);
  return (
    <div
      ref={ref}
      className="h-[300vh] py-40 overflow-hidden antialiased relative flex flex-col self-auto [perspective:1000px] [transform-style:preserve-3d]"
    >
      <Header />
      <motion.div
        style={{
          rotateX,
          rotateZ,
          translateY,
          opacity,
        }}
        className=""
      >
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-20 mb-20">
          {firstRow.map((product) => (
            <ProductCard product={product} translate={translateX} key={product.title} />
          ))}
        </motion.div>
        <motion.div className="flex flex-row mb-20 space-x-20 ">
          {secondRow.map((product) => (
            <ProductCard product={product} translate={translateXReverse} key={product.title} />
          ))}
        </motion.div>
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-20">
          {thirdRow.map((product) => (
            <ProductCard product={product} translate={translateX} key={product.title} />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export const Header = () => {
  return (
    <div className="max-w-7xl relative mx-auto py-20 md:py-40 px-4 w-full left-0 top-0">
      <h1 className="text-2xl md:text-7xl font-bold dark:text-white">
        FinanceApp <br /> ordena todo tu dinero
      </h1>
      <p className="max-w-2xl text-base md:text-xl mt-8 dark:text-neutral-200">
        Un recorrido visual por cuentas, presupuestos, inversiones y alertas. Todo se
        mueve contigo para que entiendas el estado real de tus finanzas.
      </p>
    </div>
  );
};

export const ProductCard = ({ product, translate }: { product: Product; translate: any }) => {
  return (
    <motion.div
      style={{
        x: translate,
      }}
      whileHover={{
        y: -20,
      }}
      key={product.title}
      className="group/product h-96 w-[30rem] relative shrink-0"
    >
      <a href={product.link} className="block group-hover/product:shadow-2xl ">
        <img
          src={product.thumbnail}
          height="600"
          width="600"
          className="object-cover object-left-top absolute h-full w-full inset-0"
          alt={product.title}
        />
      </a>
      <div className="absolute inset-0 h-full w-full opacity-0 group-hover/product:opacity-80 bg-black pointer-events-none"></div>
      <h2 className="absolute bottom-4 left-4 opacity-0 group-hover/product:opacity-100 text-white">
        {product.title}
      </h2>
    </motion.div>
  );
};
