import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Standard production Next.js config */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
