/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*'
      }
    ];
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-Requested-With,Content-Type,Authorization' }
        ]
      }
    ];
  },
  webpack: (config, { dev, isServer }) => {
    // Optimize development builds
    if (dev && !isServer) {
      config.optimization.splitChunks = false;
      config.optimization.runtimeChunk = false;
    }
    return config;
  }
}

module.exports = nextConfig
