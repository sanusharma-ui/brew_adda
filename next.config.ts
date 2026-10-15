import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';

export default function config(phase: string): NextConfig {
  return {
    // Keep builds isolated from a running development server.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next' : '.next-production',
    poweredByHeader: false,
    async headers() {
      return [{ source: '/:path*', headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ] }];
    },
  };
}
