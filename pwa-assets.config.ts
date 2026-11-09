import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

const terracotta = '#B4502D'

// The preset's defaults pad the apple and maskable icons on white, which shows as a white
// frame on the iOS home screen. The logo is already full-bleed, so fill with its own colour.
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    apple: { sizes: [180], padding: 0, resizeOptions: { background: terracotta } },
    maskable: { sizes: [512], padding: 0.3, resizeOptions: { background: terracotta } },
  },
  images: ['public/logo.svg'],
})
