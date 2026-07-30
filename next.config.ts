import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This forces Next.js to compile the 'ai' and '@ai-sdk/openai' packages
  // which resolves the "Module not found" error during the build process
  transpilePackages: ['ai', '@ai-sdk/openai'],
};

export default nextConfig;