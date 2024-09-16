// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      ethNodeUrl: "https://mainnet.era.zksync.io" // Store your node URL in an environment variable
    }
  },
  modules: ['@nuxt/ui']

})
