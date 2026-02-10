/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@guschlbauer/shared'],
  experimental: {
    serverComponentsExternalPackages: ['@azure/msal-node', 'better-sqlite3'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
