import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

const aubergine = '#6B2E4A'

// Preset default pads with white/transparent, which iOS shows as a white frame.
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    transparent: { ...minimal2023Preset.transparent, padding: 0 },
    apple: { sizes: [180], padding: 0, resizeOptions: { background: aubergine } },
    maskable: { sizes: [512], padding: 0.3, resizeOptions: { background: aubergine } },
  },
  images: ['public/logo.svg'],
})
