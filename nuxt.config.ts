import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    "@nuxt/eslint",
    "@nuxt/ui-pro",
    "@nuxt/content",
    "@vueuse/nuxt",
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxt/scripts",
    "@nuxtjs/supabase",
  ],
  ssr: false,

  devtools: {
    enabled: true,
  },

  css: ["~/assets/css/main.css"],

  alias: {
    "jayson/lib/client/browser": "jayson/lib/client/browser",
  },

  ...(process.env.NODE_ENV === "production" && {
    build: {
      transpile: ["rpc-websockets", "@solana/web3.js", "jayson", "bn.js"],
    },
  }),

  routeRules: {
    "/api/**": {
      cors: true,
    },
  },

  sourcemap: {
    server: true,
    client: true,
  },

  future: {
    compatibilityVersion: 4,
  },
  experimental: {
    clientNodeCompat: true,
    inlineRouteRules: true,
  },

  compatibilityDate: "2024-07-11",

  nitro: {
    replace: {
      "import 'jayson/lib/client/browser';":
        "import 'jayson/lib/client/browser/index.js';",
    },
    rollupConfig: {
      external: [
        "borsh",
        "util",
        "secp256k1",
        "@solana/web3.js",
        "@solana/wallet-adapter-phantom",
        "@solana/wallet-adapter-base",
        "jayson",
      ],
    },
  },

  vite: {
    esbuild: {
      target: "esnext",
    },
    build: {
      target: "esnext",
    },
    optimizeDeps: {
      include: [
        "buffer",
        ...(process.env.NODE_ENV === "production" ? [] : ["rpc-websockets"]),
      ],
      ...(process.env.NODE_ENV === "production" && {
        exclude: ["rpc-websockets"],
      }),
      esbuildOptions: {
        target: "esnext",
      },
    },
    plugins: [
      nodePolyfills({
        include: ["stream", "crypto", "zlib", "vm", "events"],
      }),
    ],
    define: {
      "process.env.BROWSER": true,
    },
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: "only-multiline",
        braceStyle: "1tbs",
        quotes: "double",
        semi: true,
        indent: 2,
      },
    },
  },

  supabase: {
    redirect: false,
  },
  uiPro: {
    license: process.env.UI_PRO_LICENSE_KEY,
  },
});
