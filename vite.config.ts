export default defineConfig({
  // Добавь эту строку. Имя должно строго совпадать с названием репозитория на GitHub
  base: '/mobileOffer/', 
  
  plugins: [
    figmaAssetResolver(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
