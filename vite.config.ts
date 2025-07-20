import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      // Configure HMR for cloud environment (Fly.io)
      overlay: false, // Disable error overlay
      clientPort: process.env.FLY_APP_NAME ? 443 : 8080,
      host: process.env.FLY_APP_NAME
        ? `${process.env.FLY_APP_NAME}.fly.dev`
        : "localhost",
      protocol: process.env.FLY_APP_NAME ? "wss" : "ws",
      timeout: 60000,
      // Enhanced error handling for cloud deployment
      skipErrors: true,
      errorHandler: (err, context) => {
        console.debug(
          "[HMR] Connection error handled gracefully:",
          err.message,
        );
        // Don't throw errors for network connectivity issues
        return null;
      },
    },
    // Add CORS headers for better cross-origin support
    cors: {
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    // Improve connection stability
    strictPort: false,
    // Add headers for better development experience
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize build output
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          ui: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-toast",
          ],
          supabase: ["@supabase/supabase-js"],
          utils: ["clsx", "tailwind-merge", "date-fns"],
        },
        // Add hash to filenames for cache busting
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    // Optimize chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging
    sourcemap: mode === "development",
    // Minify in production
    minify: mode === "production" ? "esbuild" : false,
    // Target modern browsers for better performance
    target: "esnext",
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@supabase/supabase-js",
    ],
  },
}));
