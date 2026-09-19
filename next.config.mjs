import createNextIntlPlugin from 'next-intl/plugin';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
   reactStrictMode: false,
   outputFileTracingRoot: projectRoot,
   allowedDevOrigins: ['172.17.144.1', '192.168.160.1'],
   async headers() {
      return [
         {
            source: '/api/:path*',
            headers: [
               { key: 'Access-Control-Allow-Origin', value: '*' },
               { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
               { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With' },
            ],
         },
         {
            source: '/(.*)',
            headers: [
               { key: 'X-Content-Type-Options', value: 'nosniff' },
               { key: 'X-Frame-Options', value: 'DENY' },
               { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
               { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
            ],
         },
      ];
   },
};

export default withNextIntl(nextConfig);
