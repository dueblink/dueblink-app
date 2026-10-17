import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This forces Next.js to compile the 'ai' and '@ai-sdk/openai' packages
  // which resolves the "Module not found" error during the build process
  transpilePackages: ['ai', '@ai-sdk/openai'],

  // Google sign-in on our own domain:
  // dueblink.com/__/auth/... is quietly passed on to Firebase, so the
  // Google popup can say "continue to dueblink.com" instead of the
  // Firebase address. Users never see the Firebase address.
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: 'https://dueblink-1ab08.firebaseapp.com/__/auth/:path*',
      },
      {
        source: '/__/firebase/:path*',
        destination: 'https://dueblink-1ab08.firebaseapp.com/__/firebase/:path*',
      },
    ];
  },
};

export default nextConfig;
