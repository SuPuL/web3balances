/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.externals.push({
      "utf-8-validate": "commonjs utf-8-validate",
      bufferutil: "commonjs bufferutil",
    });
    return config;
  },
  env: {
    NEXT_PUBLIC_MORALIS_API_KEY: process.env.NEXT_PUBLIC_MORALIS_API_KEY,
  },
  experimental: {
    swcPlugins: [
      [
        'next-superjson-plugin',
        {
          excluded: [],
        },
      ],
    ],
  },
};

module.exports = nextConfig;
