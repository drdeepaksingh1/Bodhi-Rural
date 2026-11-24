/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep release verification isolated from a running local dev server.
  distDir: process.env.BODHI_NEXT_DIST_DIR || '.next',
};

export default nextConfig;
