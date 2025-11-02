import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// تحسينات Vite للأداء
export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },

  // تحسين 1: Build Optimization
  build: {
    // تقسيم الكود إلى chunks منفصلة
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['wouter'],
          'ui-vendor': ['lucide-react', 'framer-motion'],
          'query-vendor': ['@tanstack/react-query'],
          'trpc-vendor': ['@trpc/client', '@trpc/react-query'],
        },
      },
    },
    
    // تحسين حجم Bundle
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // إزالة console.log في production
        drop_debugger: true,
      },
    },
    
    // تحسين الأداء
    chunkSizeWarningLimit: 1000,
    sourcemap: false, // تعطيل sourcemaps في production
  },

  // تحسين 2: Server Optimization
  server: {
    port: 3000,
    strictPort: true,
    hmr: {
      overlay: true,
    },
  },

  // تحسين 3: Preview Optimization
  preview: {
    port: 3000,
    strictPort: true,
  },

  // تحسين 4: Dependency Optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'wouter',
      '@tanstack/react-query',
      '@trpc/client',
      '@trpc/react-query',
    ],
  },
});
