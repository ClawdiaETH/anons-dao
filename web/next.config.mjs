/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://base-mainnet.g.alchemy.com https://mainnet.base.org https://base.gateway.tenderly.co https://base-rpc.publicnode.com https://1rpc.io",
              "frame-src 'self'"
            ].join('; ')
          }
        ]
      }
    ];
  }
};

export default nextConfig;
