/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Configure for Vercel deployment
  // No additional configuration needed for standard Vercel deployment

  // Proxy configuration to bypass CORS during development
  async rewrites() {
    return [
      {
        source: '/api/paymaster/:path*',
        destination: 'https://lazorkit-paymaster.onrender.com/:path*',
      },
    ];
  },

  // Webpack configuration for Solana web3.js compatibility
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },

  // Environment variables that will be available at build time
  env: {
    // Default to Devnet RPC if not specified
    NEXT_PUBLIC_SOLANA_RPC_URL:
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",
    // Default USDC Devnet mint address
    NEXT_PUBLIC_USDC_MINT:
      process.env.NEXT_PUBLIC_USDC_MINT ||
      "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    // Default Solana Explorer URL
    NEXT_PUBLIC_EXPLORER_URL:
      process.env.NEXT_PUBLIC_EXPLORER_URL || "https://explorer.solana.com",
  },
};

module.exports = nextConfig;
