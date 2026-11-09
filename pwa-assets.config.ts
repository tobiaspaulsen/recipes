import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

const terracotta = '#B4502D'

// Preset default pads with white/transparent, which iOS shows as a white frame.
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    transparent: { ...minimal2023Preset.transparent, padding: 0 },
    apple: { sizes: [180], padding: 0, resizeOptions: { background: terracotta } },
    maskable: { sizes: [512], padding: 0.3, resizeOptions: { background: terracotta } },
  },
  images: ['public/logo.svg'],
})
