/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Prevent Next.js from bundling server-only packages.
  // pdf-parse reads test fixtures at import time that break the bundler.
  // Prisma client must stay external so it can load its native bindings.
  serverExternalPackages: ["pdf-parse", "@prisma/client", "prisma"],
}

export default nextConfig
