/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Turbopack para compilación más rápida en desarrollo
  // Usa: next dev --turbo

  // Optimizaciones de compilación
  compiler: {
    // Elimina console.logs en producción
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Configuración experimental para mejor rendimiento
  experimental: {
    // Optimiza imports de librerías grandes
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'recharts',
      'date-fns',
      'framer-motion',
    ],
  },

  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
