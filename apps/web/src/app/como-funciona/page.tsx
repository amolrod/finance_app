'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LogoText } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';

type Layout =
  | 'dashboard'
  | 'accounts'
  | 'categories'
  | 'transactions'
  | 'budgets'
  | 'investments'
  | 'recurring'
  | 'reports'
  | 'import'
  | 'tags'
  | 'settings'
  | 'alerts'
  | 'goals'
  | 'login'
  | 'register';

type ProductSeed = {
  title: string;
  link: string;
  accent: string;
  layout: Layout;
};

type Product = {
  title: string;
  link: string;
  thumbnail: string;
};

const layoutMap: Record<Layout, (accent: string) => string> = {
  dashboard: (accent) => `
  <rect x="64" y="150" width="156" height="72" rx="14" fill="#0f172a" fill-opacity="0.9" stroke="#ffffff" stroke-opacity="0.06" />
  <rect x="228" y="150" width="156" height="72" rx="14" fill="#0f172a" fill-opacity="0.9" stroke="#ffffff" stroke-opacity="0.06" />
  <rect x="392" y="150" width="144" height="72" rx="14" fill="#0f172a" fill-opacity="0.9" stroke="#ffffff" stroke-opacity="0.06" />
  <rect x="64" y="236" width="300" height="230" rx="18" fill="#0f172a" fill-opacity="0.9" stroke="#ffffff" stroke-opacity="0.06" />
  <rect x="378" y="236" width="158" height="230" rx="18" fill="#0f172a" fill-opacity="0.9" stroke="#ffffff" stroke-opacity="0.06" />
  <path d="M84 430 C132 408 150 412 188 372 C226 332 276 342 324 306" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round" />
  <path d="M84 412 C132 400 150 404 188 382 C226 360 276 366 324 346" fill="none" stroke="#38bdf8" stroke-opacity="0.7" stroke-width="2" stroke-linecap="round" />
  <circle cx="457" cy="330" r="44" fill="none" stroke="${accent}" stroke-width="10" stroke-dasharray="180 60" />
  <circle cx="457" cy="330" r="28" fill="none" stroke="#38bdf8" stroke-opacity="0.7" stroke-width="8" stroke-dasharray="90 60" />
  <rect x="80" y="172" width="96" height="8" rx="4" fill="#94a3b8" fill-opacity="0.6" />
  <rect x="244" y="172" width="96" height="8" rx="4" fill="${accent}" fill-opacity="0.7" />
  <rect x="408" y="172" width="88" height="8" rx="4" fill="#38bdf8" fill-opacity="0.7" />
  `,
  accounts: (accent) => `
  <rect x="64" y="150" width="472" height="54" rx="14" fill="#0f172a" fill-opacity="0.9" stroke="#ffffff" stroke-opacity="0.06" />
  <rect x="64" y="214" width="472" height="54" rx="14" fill="#0f172a" fill-opacity="0.85" stroke="#ffffff" stroke-opacity="0.06" />
  <rect x="64" y="278" width="472" height="54" rx="14" fill="#0f172a" fill-opacity="0.9" stroke="#ffffff" stroke-opacity="0.06" />
  <rect x="64" y="342" width="472" height="54" rx="14" fill="#0f172a" fill-opacity="0.85" stroke="#ffffff" stroke-opacity="0.06" />
  <rect x="64" y="406" width="472" height="54" rx="14" fill="#0f172a" fill-opacity="0.9" stroke="#ffffff" stroke-opacity="0.06" />
  <circle cx="92" cy="176" r="8" fill="${accent}" />
  <circle cx="92" cy="240" r="8" fill="#38bdf8" />
  <circle cx="92" cy="304" r="8" fill="#f59e0b" />
  <circle cx="92" cy="368" r="8" fill="#a855f7" />
  <circle cx="92" cy="432" r="8" fill="#22c55e" />
  <rect x="112" y="168" width="140" height="8" rx="4" fill="#e2e8f0" fill-opacity="0.7" />
  <rect x="112" y="232" width="120" height="8" rx="4" fill="#e2e8f0" fill-opacity="0.6" />
  <rect x="112" y="296" width="150" height="8" rx="4" fill="#e2e8f0" fill-opacity="0.7" />
  <rect x="112" y="360" width="130" height="8" rx="4" fill="#e2e8f0" fill-opacity="0.6" />
  <rect x="112" y="424" width="160" height="8" rx="4" fill="#e2e8f0" fill-opacity="0.7" />
  <rect x="430" y="168" width="80" height="8" rx="4" fill="#94a3b8" fill-opacity="0.7" />
  <rect x="430" y="232" width="70" height="8" rx="4" fill="#94a3b8" fill-opacity="0.6" />
  <rect x="430" y="296" width="90" height="8" rx="4" fill="#94a3b8" fill-opacity="0.7" />
  <rect x="430" y="360" width="60" height="8" rx="4" fill="#94a3b8" fill-opacity="0.6" />
  <rect x="430" y="424" width="90" height="8" rx="4" fill="#94a3b8" fill-opacity="0.7" />
  `,
  categories: (accent) => `
  <rect x="64" y="150" width="130" height="36" rx="18" fill="${accent}" fill-opacity="0.2" stroke="${accent}" stroke-opacity="0.5" />
  <rect x="204" y="150" width="120" height="36" rx="18" fill="#38bdf8" fill-opacity="0.2" stroke="#38bdf8" stroke-opacity="0.5" />
  <rect x="334" y="150" width="150" height="36" rx="18" fill="#f59e0b" fill-opacity="0.2" stroke="#f59e0b" stroke-opacity="0.5" />
  <rect x="64" y="200" width="160" height="36" rx="18" fill="#a855f7" fill-opacity="0.2" stroke="#a855f7" stroke-opacity="0.5" />
  <rect x="234" y="200" width="130" height="36" rx="18" fill="#22c55e" fill-opacity="0.2" stroke="#22c55e" stroke-opacity="0.5" />
  <rect x="374" y="200" width="140" height="36" rx="18" fill="#06b6d4" fill-opacity="0.2" stroke="#06b6d4" stroke-opacity="0.5" />
  <rect x="64" y="250" width="140" height="36" rx="18" fill="#ef4444" fill-opacity="0.2" stroke="#ef4444" stroke-opacity="0.5" />
  <rect x="214" y="250" width="150" height="36" rx="18" fill="#84cc16" fill-opacity="0.2" stroke="#84cc16" stroke-opacity="0.5" />
  <rect x="374" y="250" width="120" height="36" rx="18" fill="#14b8a6" fill-opacity="0.2" stroke="#14b8a6" stroke-opacity="0.5" />
  <rect x="64" y="306" width="472" height="160" rx="18" fill="#0f172a" fill-opacity="0.9" stroke="#ffffff" stroke-opacity="0.06" />
  <circle cx="140" cy="386" r="46" fill="none" stroke="${accent}" stroke-width="10" stroke-dasharray="140 80" />
  <circle cx="220" cy="386" r="36" fill="none" stroke="#38bdf8" stroke-width="8" stroke-dasharray="110 60" />
  <circle cx="300" cy="386" r="30" fill="none" stroke="#f59e0b" stroke-width="7" stroke-dasharray="90 50" />
  `,
  transactions: (accent) => `
  <rect x="64" y="150" width="472" height="34" rx="10" fill="#0f172a" fill-opacity="0.95" />
  <rect x="80" y="162" width="120" height="6" rx="3" fill="#94a3b8" fill-opacity="0.6" />
  <rect x="260" y="162" width="90" height="6" rx="3" fill="#94a3b8" fill-opacity="0.6" />
  <rect x="420" y="162" width="80" height="6" rx="3" fill="#94a3b8" fill-opacity="0.6" />
  <rect x="64" y="196" width="472" height="48" rx="12" fill="#0f172a" fill-opacity="0.85" />
  <rect x="64" y="252" width="472" height="48" rx="12" fill="#0f172a" fill-opacity="0.9" />
  <rect x="64" y="308" width="472" height="48" rx="12" fill="#0f172a" fill-opacity="0.85" />
  <rect x="64" y="364" width="472" height="48" rx="12" fill="#0f172a" fill-opacity="0.9" />
  <rect x="64" y="420" width="472" height="48" rx="12" fill="#0f172a" fill-opacity="0.85" />
  <rect x="90" y="214" width="160" height="8" rx="4" fill="#e2e8f0" fill-opacity="0.7" />
  <rect x="90" y="270" width="140" height="8" rx="4" fill="#e2e8f0" fill-opacity="0.7" />
  <rect x="90" y="326" width="180" height="8" rx="4" fill="#e2e8f0" fill-opacity="0.7" />
  <rect x="90" y="382" width="150" height="8" rx="4" fill="#e2e8f0" fill-opacity="0.7" />
  <rect x="90" y="438" width="170" height="8" rx="4" fill="#e2e8f0" fill-opacity="0.7" />
  <rect x="420" y="214" width="80" height="8" rx="4" fill="${accent}" fill-opacity="0.7" />
  <rect x="420" y="270" width="70" height="8" rx="4" fill="#38bdf8" fill-opacity="0.7" />
  <rect x="420" y="326" width="90" height="8" rx="4" fill="#f59e0b" fill-opacity="0.7" />
  <rect x="420" y="382" width="60" height="8" rx="4" fill="#a855f7" fill-opacity="0.7" />
  <rect x="420" y="438" width="80" height="8" rx="4" fill="#22c55e" fill-opacity="0.7" />
  `,
  budgets: (accent) => `
  <rect x="64" y="150" width="472" height="72" rx="16" fill="#0f172a" fill-opacity="0.9" />
  <rect x="64" y="238" width="472" height="72" rx="16" fill="#0f172a" fill-opacity="0.85" />
  <rect x="64" y="326" width="472" height="72" rx="16" fill="#0f172a" fill-opacity="0.9" />
  <rect x="64" y="414" width="472" height="72" rx="16" fill="#0f172a" fill-opacity="0.85" />
  <rect x="90" y="188" width="240" height="10" rx="5" fill="${accent}" fill-opacity="0.7" />
  <rect x="90" y="276" width="200" height="10" rx="5" fill="#38bdf8" fill-opacity="0.7" />
  <rect x="90" y="364" width="260" height="10" rx="5" fill="#f59e0b" fill-opacity="0.7" />
  <rect x="90" y="452" width="180" height="10" rx="5" fill="#a855f7" fill-opacity="0.7" />
  <rect x="360" y="188" width="120" height="8" rx="4" fill="#94a3b8" fill-opacity="0.6" />
  <rect x="360" y="276" width="110" height="8" rx="4" fill="#94a3b8" fill-opacity="0.6" />
  <rect x="360" y="364" width="130" height="8" rx="4" fill="#94a3b8" fill-opacity="0.6" />
  <rect x="360" y="452" width="100" height="8" rx="4" fill="#94a3b8" fill-opacity="0.6" />
  `,
  investments: (accent) => `
  <rect x="64" y="150" width="472" height="180" rx="18" fill="#0f172a" fill-opacity="0.9" />
  <path d="M80 300 C140 270 180 280 220 250 C260 220 320 230 360 200 C400 170 460 180 520 160" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round" />
  <path d="M80 280 C140 260 180 268 220 240 C260 212 320 220 360 208 C400 196 460 200 520 190" fill="none" stroke="#38bdf8" stroke-opacity="0.7" stroke-width="2" stroke-linecap="round" />
  <rect x="64" y="344" width="150" height="96" rx="16" fill="#0f172a" fill-opacity="0.88" />
  <rect x="222" y="344" width="150" height="96" rx="16" fill="#0f172a" fill-opacity="0.85" />
  <rect x="380" y="344" width="156" height="96" rx="16" fill="#0f172a" fill-opacity="0.88" />
  <rect x="86" y="368" width="90" height="8" rx="4" fill="${accent}" fill-opacity="0.7" />
  <rect x="246" y="368" width="80" height="8" rx="4" fill="#38bdf8" fill-opacity="0.7" />
  <rect x="404" y="368" width="90" height="8" rx="4" fill="#f59e0b" fill-opacity="0.7" />
  <rect x="86" y="388" width="60" height="6" rx="3" fill="#94a3b8" fill-opacity="0.6" />
  <rect x="246" y="388" width="60" height="6" rx="3" fill="#94a3b8" fill-opacity="0.6" />
  <rect x="404" y="388" width="60" height="6" rx="3" fill="#94a3b8" fill-opacity="0.6" />
  `,
  recurring: (accent) => `
  <rect x="64" y="150" width="472" height="310" rx="18" fill="#0f172a" fill-opacity="0.9" />
  <rect x="90" y="190" width="70" height="70" rx="12" fill="#111827" fill-opacity="0.9" />
  <rect x="170" y="190" width="70" height="70" rx="12" fill="#111827" fill-opacity="0.85" />
  <rect x="250" y="190" width="70" height="70" rx="12" fill="#111827" fill-opacity="0.9" />
  <rect x="330" y="190" width="70" height="70" rx="12" fill="#111827" fill-opacity="0.85" />
  <rect x="410" y="190" width="70" height="70" rx="12" fill="#111827" fill-opacity="0.9" />
  <rect x="90" y="270" width="70" height="70" rx="12" fill="#111827" fill-opacity="0.85" />
  <rect x="170" y="270" width="70" height="70" rx="12" fill="#111827" fill-opacity="0.9" />
  <rect x="250" y="270" width="70" height="70" rx="12" fill="#111827" fill-opacity="0.85" />
  <rect x="330" y="270" width="70" height="70" rx="12" fill="#111827" fill-opacity="0.9" />
  <rect x="410" y="270" width="70" height="70" rx="12" fill="#111827" fill-opacity="0.85" />
  <rect x="90" y="350" width="70" height="70" rx="12" fill="#111827" fill-opacity="0.9" />
  <rect x="170" y="350" width="70" height="70" rx="12" fill="#111827" fill-opacity="0.85" />
  <rect x="250" y="350" width="70" height="70" rx="12" fill="#111827" fill-opacity="0.9" />
  <rect x="330" y="350" width="70" height="70" rx="12" fill="#111827" fill-opacity="0.85" />
  <rect x="410" y="350" width="70" height="70" rx="12" fill="#111827" fill-opacity="0.9" />
  <circle cx="125" cy="225" r="10" fill="${accent}" fill-opacity="0.7" />
  <circle cx="285" cy="305" r="10" fill="#38bdf8" fill-opacity="0.7" />
  <circle cx="445" cy="385" r="10" fill="#f59e0b" fill-opacity="0.7" />
  `,
  reports: (accent) => `
  <rect x="64" y="150" width="250" height="250" rx="18" fill="#0f172a" fill-opacity="0.9" />
  <rect x="322" y="150" width="214" height="250" rx="18" fill="#0f172a" fill-opacity="0.85" />
  <circle cx="190" cy="275" r="70" fill="none" stroke="${accent}" stroke-width="16" stroke-dasharray="180 60" />
  <circle cx="190" cy="275" r="54" fill="none" stroke="#38bdf8" stroke-opacity="0.7" stroke-width="12" stroke-dasharray="120 80" />
  <rect x="350" y="190" width="30" height="150" rx="10" fill="${accent}" fill-opacity="0.7" />
  <rect x="388" y="220" width="30" height="120" rx="10" fill="#38bdf8" fill-opacity="0.7" />
  <rect x="426" y="250" width="30" height="90" rx="10" fill="#f59e0b" fill-opacity="0.7" />
  <rect x="464" y="210" width="30" height="130" rx="10" fill="#a855f7" fill-opacity="0.7" />
  <rect x="64" y="416" width="472" height="60" rx="16" fill="#0f172a" fill-opacity="0.9" />
  <rect x="90" y="442" width="160" height="8" rx="4" fill="#94a3b8" fill-opacity="0.6" />
  <rect x="270" y="442" width="160" height="8" rx="4" fill="${accent}" fill-opacity="0.7" />
  `,
  import: (accent) => `
  <rect x="120" y="190" width="360" height="230" rx="24" fill="#0f172a" fill-opacity="0.9" stroke="${accent}" stroke-opacity="0.6" stroke-width="2" stroke-dasharray="10 8" />
  <path d="M300 240 L300 340" stroke="${accent}" stroke-width="4" stroke-linecap="round" />
  <path d="M270 270 L300 240 L330 270" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
  <rect x="170" y="356" width="260" height="10" rx="5" fill="#94a3b8" fill-opacity="0.6" />
  <rect x="190" y="380" width="220" height="8" rx="4" fill="#94a3b8" fill-opacity="0.4" />
  `,
  tags: (accent) => `
  <rect x="64" y="150" width="472" height="316" rx="18" fill="#0f172a" fill-opacity="0.9" />
  <rect x="90" y="190" width="120" height="34" rx="17" fill="${accent}" fill-opacity="0.25" stroke="${accent}" stroke-opacity="0.5" />
  <rect x="220" y="190" width="140" height="34" rx="17" fill="#38bdf8" fill-opacity="0.25" stroke="#38bdf8" stroke-opacity="0.5" />
  <rect x="370" y="190" width="120" height="34" rx="17" fill="#f59e0b" fill-opacity="0.25" stroke="#f59e0b" stroke-opacity="0.5" />
  <rect x="90" y="236" width="150" height="34" rx="17" fill="#a855f7" fill-opacity="0.25" stroke="#a855f7" stroke-opacity="0.5" />
  <rect x="250" y="236" width="130" height="34" rx="17" fill="#22c55e" fill-opacity="0.25" stroke="#22c55e" stroke-opacity="0.5" />
  <rect x="390" y="236" width="100" height="34" rx="17" fill="#06b6d4" fill-opacity="0.25" stroke="#06b6d4" stroke-opacity="0.5" />
  <rect x="90" y="282" width="110" height="34" rx="17" fill="#ef4444" fill-opacity="0.25" stroke="#ef4444" stroke-opacity="0.5" />
  <rect x="210" y="282" width="150" height="34" rx="17" fill="#84cc16" fill-opacity="0.25" stroke="#84cc16" stroke-opacity="0.5" />
  <rect x="370" y="282" width="120" height="34" rx="17" fill="#14b8a6" fill-opacity="0.25" stroke="#14b8a6" stroke-opacity="0.5" />
  <rect x="90" y="328" width="140" height="34" rx="17" fill="#e11d48" fill-opacity="0.25" stroke="#e11d48" stroke-opacity="0.5" />
  <rect x="240" y="328" width="160" height="34" rx="17" fill="#0ea5e9" fill-opacity="0.25" stroke="#0ea5e9" stroke-opacity="0.5" />
  <rect x="410" y="328" width="80" height="34" rx="17" fill="${accent}" fill-opacity="0.2" stroke="${accent}" stroke-opacity="0.4" />
  `,
  settings: (accent) => `
  <rect x="64" y="150" width="472" height="70" rx="16" fill="#0f172a" fill-opacity="0.9" />
  <rect x="64" y="238" width="472" height="70" rx="16" fill="#0f172a" fill-opacity="0.85" />
  <rect x="64" y="326" width="472" height="70" rx="16" fill="#0f172a" fill-opacity="0.9" />
  <rect x="64" y="414" width="472" height="70" rx="16" fill="#0f172a" fill-opacity="0.85" />
  <rect x="90" y="178" width="140" height="8" rx="4" fill="#94a3b8" fill-opacity="0.7" />
  <rect x="90" y="266" width="140" height="8" rx="4" fill="#94a3b8" fill-opacity="0.6" />
  <rect x="90" y="354" width="140" height="8" rx="4" fill="#94a3b8" fill-opacity="0.7" />
  <rect x="90" y="442" width="140" height="8" rx="4" fill="#94a3b8" fill-opacity="0.6" />
  <rect x="390" y="170" width="110" height="26" rx="13" fill="#0b1326" stroke="#ffffff" stroke-opacity="0.08" />
  <circle cx="476" cy="183" r="10" fill="${accent}" />
  <rect x="390" y="258" width="110" height="26" rx="13" fill="#0b1326" stroke="#ffffff" stroke-opacity="0.08" />
  <circle cx="404" cy="271" r="10" fill="#94a3b8" />
  <rect x="390" y="346" width="110" height="26" rx="13" fill="#0b1326" stroke="#ffffff" stroke-opacity="0.08" />
  <circle cx="476" cy="359" r="10" fill="#38bdf8" />
  <rect x="390" y="434" width="110" height="26" rx="13" fill="#0b1326" stroke="#ffffff" stroke-opacity="0.08" />
  <circle cx="404" cy="447" r="10" fill="#94a3b8" />
  `,
  alerts: (accent) => `
  <rect x="64" y="150" width="472" height="80" rx="16" fill="#0f172a" fill-opacity="0.9" />
  <rect x="64" y="246" width="472" height="80" rx="16" fill="#0f172a" fill-opacity="0.85" />
  <rect x="64" y="342" width="472" height="80" rx="16" fill="#0f172a" fill-opacity="0.9" />
  <rect x="64" y="438" width="472" height="80" rx="16" fill="#0f172a" fill-opacity="0.85" />
  <rect x="64" y="150" width="6" height="80" rx="3" fill="${accent}" />
  <rect x="64" y="246" width="6" height="80" rx="3" fill="#38bdf8" />
  <rect x="64" y="342" width="6" height="80" rx="3" fill="#f59e0b" />
  <rect x="64" y="438" width="6" height="80" rx="3" fill="#a855f7" />
  <rect x="90" y="180" width="200" height="8" rx="4" fill="#e2e8f0" fill-opacity="0.7" />
  <rect x="90" y="276" width="220" height="8" rx="4" fill="#e2e8f0" fill-opacity="0.7" />
  <rect x="90" y="372" width="210" height="8" rx="4" fill="#e2e8f0" fill-opacity="0.7" />
  <rect x="90" y="468" width="190" height="8" rx="4" fill="#e2e8f0" fill-opacity="0.7" />
  <rect x="400" y="176" width="90" height="8" rx="4" fill="#94a3b8" fill-opacity="0.6" />
  <rect x="400" y="272" width="90" height="8" rx="4" fill="#94a3b8" fill-opacity="0.6" />
  <rect x="400" y="368" width="90" height="8" rx="4" fill="#94a3b8" fill-opacity="0.6" />
  <rect x="400" y="464" width="90" height="8" rx="4" fill="#94a3b8" fill-opacity="0.6" />
  `,
  goals: (accent) => `
  <rect x="64" y="150" width="472" height="140" rx="18" fill="#0f172a" fill-opacity="0.9" />
  <rect x="64" y="306" width="472" height="160" rx="18" fill="#0f172a" fill-opacity="0.85" />
  <circle cx="140" cy="220" r="54" fill="none" stroke="${accent}" stroke-width="12" stroke-dasharray="160 80" />
  <circle cx="140" cy="220" r="36" fill="none" stroke="#38bdf8" stroke-opacity="0.7" stroke-width="10" stroke-dasharray="120 80" />
  <rect x="220" y="188" width="220" height="10" rx="5" fill="#94a3b8" fill-opacity="0.6" />
  <rect x="220" y="210" width="180" height="10" rx="5" fill="${accent}" fill-opacity="0.7" />
  <rect x="220" y="232" width="150" height="10" rx="5" fill="#38bdf8" fill-opacity="0.7" />
  <rect x="90" y="336" width="360" height="12" rx="6" fill="#1f2937" fill-opacity="0.9" />
  <rect x="90" y="336" width="260" height="12" rx="6" fill="${accent}" fill-opacity="0.75" />
  <rect x="90" y="368" width="360" height="12" rx="6" fill="#1f2937" fill-opacity="0.9" />
  <rect x="90" y="368" width="220" height="12" rx="6" fill="#38bdf8" fill-opacity="0.7" />
  <rect x="90" y="400" width="360" height="12" rx="6" fill="#1f2937" fill-opacity="0.9" />
  <rect x="90" y="400" width="190" height="12" rx="6" fill="#f59e0b" fill-opacity="0.7" />
  `,
  login: (accent) => `
  <rect x="120" y="170" width="360" height="260" rx="24" fill="#0f172a" fill-opacity="0.92" stroke="#ffffff" stroke-opacity="0.08" />
  <rect x="150" y="210" width="300" height="42" rx="12" fill="#111827" fill-opacity="0.9" />
  <rect x="150" y="266" width="300" height="42" rx="12" fill="#111827" fill-opacity="0.9" />
  <rect x="150" y="326" width="300" height="46" rx="16" fill="${accent}" fill-opacity="0.7" />
  <rect x="170" y="222" width="120" height="8" rx="4" fill="#94a3b8" fill-opacity="0.6" />
  <rect x="170" y="278" width="160" height="8" rx="4" fill="#94a3b8" fill-opacity="0.6" />
  <rect x="240" y="346" width="140" height="8" rx="4" fill="#0b1120" fill-opacity="0.8" />
  `,
  register: (accent) => `
  <rect x="110" y="150" width="380" height="300" rx="24" fill="#0f172a" fill-opacity="0.92" stroke="#ffffff" stroke-opacity="0.08" />
  <rect x="140" y="190" width="320" height="40" rx="12" fill="#111827" fill-opacity="0.9" />
  <rect x="140" y="240" width="320" height="40" rx="12" fill="#111827" fill-opacity="0.9" />
  <rect x="140" y="290" width="320" height="40" rx="12" fill="#111827" fill-opacity="0.9" />
  <rect x="140" y="346" width="320" height="48" rx="16" fill="${accent}" fill-opacity="0.7" />
  <rect x="160" y="202" width="150" height="8" rx="4" fill="#94a3b8" fill-opacity="0.6" />
  <rect x="160" y="252" width="180" height="8" rx="4" fill="#94a3b8" fill-opacity="0.6" />
  <rect x="160" y="302" width="130" height="8" rx="4" fill="#94a3b8" fill-opacity="0.6" />
  <rect x="260" y="368" width="120" height="8" rx="4" fill="#0b1120" fill-opacity="0.8" />
  `,
};

const makeThumb = (title: string, accent: string, layout: Layout) => {
  const layoutMarkup = layoutMap[layout] ? layoutMap[layout](accent) : '';
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b1120" />
      <stop offset="45%" stop-color="${accent}" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <radialGradient id="glow" cx="0.2" cy="0.15" r="0.9">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>
    <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
      <path d="M28 0H0V28" fill="none" stroke="#ffffff" stroke-opacity="0.04" stroke-width="1" />
    </pattern>
  </defs>
  <rect width="600" height="600" fill="url(#bg)" />
  <rect width="600" height="600" fill="url(#grid)" opacity="0.6" />
  <rect x="36" y="42" width="528" height="516" rx="36" fill="#0b1120" fill-opacity="0.85" stroke="#ffffff" stroke-opacity="0.08" />
  <rect x="36" y="42" width="528" height="60" rx="30" fill="#0f172a" fill-opacity="0.95" />
  <circle cx="70" cy="72" r="6" fill="#22c55e" fill-opacity="0.8" />
  <circle cx="90" cy="72" r="6" fill="#f59e0b" fill-opacity="0.8" />
  <circle cx="110" cy="72" r="6" fill="#ef4444" fill-opacity="0.8" />
  <text x="140" y="78" fill="#cbd5f5" font-size="16" font-family="ui-sans-serif, system-ui" font-weight="600">FinanceApp</text>
  <text x="64" y="132" fill="#e2e8f0" font-size="22" font-family="ui-sans-serif, system-ui" font-weight="600">${title}</text>
  ${layoutMarkup}
  <rect width="600" height="600" fill="url(#glow)" />
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const PRODUCT_SEEDS: ProductSeed[] = [
  {
    title: 'Dashboard total',
    link: '/dashboard',
    accent: '#22c55e',
    layout: 'dashboard',
  },
  {
    title: 'Cuentas claras',
    link: '/dashboard/accounts',
    accent: '#16a34a',
    layout: 'accounts',
  },
  {
    title: 'Categorias limpias',
    link: '/dashboard/categories',
    accent: '#0ea5e9',
    layout: 'categories',
  },
  {
    title: 'Transacciones en foco',
    link: '/dashboard/transactions',
    accent: '#2563eb',
    layout: 'transactions',
  },
  {
    title: 'Presupuestos vivos',
    link: '/dashboard/budgets',
    accent: '#f97316',
    layout: 'budgets',
  },
  {
    title: 'Inversiones en orden',
    link: '/dashboard/investments',
    accent: '#a855f7',
    layout: 'investments',
  },
  {
    title: 'Ingresos recurrentes',
    link: '/dashboard/recurring',
    accent: '#14b8a6',
    layout: 'recurring',
  },
  {
    title: 'Reportes claros',
    link: '/dashboard/reports',
    accent: '#06b6d4',
    layout: 'reports',
  },
  {
    title: 'Importacion rapida',
    link: '/dashboard/import',
    accent: '#f59e0b',
    layout: 'import',
  },
  {
    title: 'Etiquetas utiles',
    link: '/dashboard/tags',
    accent: '#ef4444',
    layout: 'tags',
  },
  {
    title: 'Ajustes precisos',
    link: '/dashboard/settings',
    accent: '#64748b',
    layout: 'settings',
  },
  {
    title: 'Alertas suaves',
    link: '/dashboard',
    accent: '#0f766e',
    layout: 'alerts',
  },
  {
    title: 'Metas visibles',
    link: '/dashboard',
    accent: '#84cc16',
    layout: 'goals',
  },
  {
    title: 'Login seguro',
    link: '/auth/login',
    accent: '#334155',
    layout: 'login',
  },
  {
    title: 'Registro simple',
    link: '/auth/register',
    accent: '#1d4ed8',
    layout: 'register',
  },
];

const PRODUCTS: Product[] = PRODUCT_SEEDS.map((product) => ({
  title: product.title,
  link: product.link,
  thumbnail: makeThumb(product.title, product.accent, product.layout),
}));

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-foreground/10 bg-background/80 backdrop-blur-xl">
        <nav
          className="container mx-auto flex h-16 items-center justify-between px-4"
          aria-label="Navegación principal"
        >
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-sm font-semibold text-foreground/80 transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Volver al inicio</span>
              <span className="sm:hidden">Volver</span>
            </Link>
            <LogoText
              className="hidden gap-2 sm:flex"
              logoClassName="h-8 w-8"
              textClassName="text-lg"
            />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="text-[12px] font-semibold sm:text-sm">
                Entrar
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button
                size="sm"
                className="relative overflow-hidden rounded-full bg-[linear-gradient(135deg,var(--accent-a,#10b981),var(--accent-b,#14b8a6))] px-4 text-[12px] font-semibold text-white shadow-[0_12px_30px_-18px_rgba(16,185,129,0.85)] transition-transform duration-300 hover:-translate-y-0.5 sm:px-5 sm:text-sm"
              >
                <span className="relative z-10">Crear cuenta</span>
              </Button>
            </Link>
          </div>
        </nav>
      </header>
      <HeroParallax products={PRODUCTS} />
    </div>
  );
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
      className="h-[360vh] pt-40 pb-[50vh] overflow-hidden antialiased relative flex flex-col self-auto [perspective:1000px] [transform-style:preserve-3d]"
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
