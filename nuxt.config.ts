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

  devtools: {
    enabled: true
  },

  css: ["~/assets/css/main.css"],

  alias: {
    "jayson/lib/client/browser": "jayson/lib/client/browser",
    "rpc-websockets": "rpc-websockets",
  },

  routeRules: {
    "/api/**": {
      cors: true
    }
  },

  sourcemap: {
    server: true,
    client: true,
  },

  future: {
    compatibilityVersion: 4
  },
  experimental: {
    clientNodeCompat: true,
    inlineRouteRules: true,
  },

  compatibilityDate: "2024-07-11",

  vite: {
    esbuild: {
      target: "esnext"
    },
    build: {
      target: "esnext"
    },
    optimizeDeps: {
      include: ["@coral-xyz/anchor", "@solana/web3.js", "buffer", "rpc-websockets"],
      esbuildOptions: {
        target: "esnext"
      }
    },
    plugins: [
      nodePolyfills({
        include: ["stream", "crypto", "zlib", "vm", "events"],
      }),
    ],
    define: {
      "process.env.BROWSER": true
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: "only-multiline",
        braceStyle: "1tbs",
        quotes: "double",
        semi: true,
        indent: 2
      }
    }
  },

  supabase: {
    redirect: false
  },
  uiPro: {
    license: process.env.UI_PRO_LICENSE_KEY
  },
});
