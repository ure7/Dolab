import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents is off on purpose: every Dolab page is personal (depends on
  // the logged-in user), so caching rules would add complexity with no benefit.
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
