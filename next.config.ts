import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  serverExternalPackages: ['nodemailer', 'pdf-lib', 'qrcode', 'archiver'],
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    formats: ['image/webp'],
    qualities: [75, 90],
  },
};

export default nextConfig;
