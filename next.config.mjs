/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/favicon.ico',
        destination: '/icon.svg',
        permanent: true,
      },
      {
        source: '/favicon.png',
        destination: '/icon.svg',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
