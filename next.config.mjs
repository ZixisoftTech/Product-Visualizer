/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['@imgly/background-removal-node', 'onnxruntime-node', 'sharp'],
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
