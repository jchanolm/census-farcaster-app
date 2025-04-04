/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL', // Or you can use 'SAMEORIGIN' if you want to be more restrictive
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.warpcast.com https://warpcast.com;",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;