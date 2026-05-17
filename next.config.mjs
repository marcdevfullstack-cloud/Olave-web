/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.afriknovatech.com',
      },
    ],
  },
};

export default nextConfig;