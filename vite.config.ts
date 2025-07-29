import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Provide default values for environment variables in development
    'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(
      process.env.VITE_GOOGLE_MAPS_API_KEY || ''
    ),
    'import.meta.env.VITE_DISABLE_GOOGLE_MAPS': JSON.stringify(
      process.env.VITE_DISABLE_GOOGLE_MAPS || 'true'
    ),
  },
  build: {
    // Optimize bundle size and performance
    target: 'esnext',
    minify: 'terser',
    cssMinify: true,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // UI component libraries
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip'
          ],

          // Charts and data visualization
          'charts': ['recharts'],

          // External APIs and services
          'api-vendor': [
            '@supabase/supabase-js',
            '@tanstack/react-query',
            'axios'
          ],

          // Maps and location services
          'maps': ['@react-google-maps/api'],

          // University data (largest static data)
          'university-data': [
            './src/constants/universities/complete-26-universities',
            './src/constants/universities/complete-sa-universities',
            './src/constants/universities/comprehensive-course-database',
            './src/constants/universities/comprehensive-programs'
          ],

          // Form handling
          'forms': [
            'react-hook-form',
            '@hookform/resolvers',
            'zod'
          ],

          // Utilities
          'utils': [
            'date-fns',
            'clsx',
            'class-variance-authority',
            'tailwind-merge'
          ]
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Optimize for production
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    },
    // Set chunk size warning limit
    chunkSizeWarningLimit: 500
  },
  // Optimize dev server
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      '@tanstack/react-query'
    ]
  }
})
