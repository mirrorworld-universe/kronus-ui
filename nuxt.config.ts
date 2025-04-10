// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    "@nuxt/eslint",
    "@nuxt/ui-pro",
    "@nuxt/content",
    "@vueuse/nuxt",
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxt/scripts"
  ],
  ssr: false,

  devtools: {
    enabled: true
  },

  css: ["~/assets/css/main.css"],

  routeRules: {
    "/api/**": {
      cors: true
    }
  },

  future: {
    compatibilityVersion: 4
  },
  experimental: {
    clientNodeCompat: true
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
      include: ["@coral-xyz/anchor", "@solana/web3.js", "buffer"],
      esbuildOptions: {
        target: "esnext"
      }
    },
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
  uiPro: {
    license: process.env.UI_PRO_LICENSE_KEY
  },
});
