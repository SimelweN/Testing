// vite.config.ts
import { defineConfig } from "file:///app/code/node_modules/vite/dist/node/index.js";
import react from "file:///app/code/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "/app/code";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      // More resilient HMR configuration
      overlay: false,
      // Disable error overlay that might interfere
      clientPort: 8080,
      // Ensure client connects to correct port
      // Add timeout and retry configuration
      timeout: 6e4,
      // 60 second timeout for better stability
      // Handle connection errors gracefully
      skipErrors: true,
      // Improve error handling
      errorHandler: (err, context) => {
        console.debug("[HMR] Error handled gracefully:", err.message);
      }
    },
    // Add CORS headers for better cross-origin support
    cors: {
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"]
    },
    // Improve connection stability
    strictPort: false,
    // Add headers for better development experience
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
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
            "@radix-ui/react-toast"
          ],
          supabase: ["@supabase/supabase-js"],
          utils: ["clsx", "tailwind-merge", "date-fns"]
        },
        // Add hash to filenames for cache busting
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]"
      }
    },
    // Optimize chunk size warning limit
    chunkSizeWarningLimit: 1e3,
    // Enable source maps for debugging
    sourcemap: mode === "development",
    // Minify in production
    minify: mode === "production" ? "esbuild" : false,
    // Target modern browsers for better performance
    target: "esnext"
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@supabase/supabase-js"
    ]
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvYXBwL2NvZGVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9hcHAvY29kZS92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vYXBwL2NvZGUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiBcIjo6XCIsXG4gICAgcG9ydDogODA4MCxcbiAgICBobXI6IHtcbiAgICAgIC8vIE1vcmUgcmVzaWxpZW50IEhNUiBjb25maWd1cmF0aW9uXG4gICAgICBvdmVybGF5OiBmYWxzZSwgLy8gRGlzYWJsZSBlcnJvciBvdmVybGF5IHRoYXQgbWlnaHQgaW50ZXJmZXJlXG4gICAgICBjbGllbnRQb3J0OiA4MDgwLCAvLyBFbnN1cmUgY2xpZW50IGNvbm5lY3RzIHRvIGNvcnJlY3QgcG9ydFxuICAgICAgLy8gQWRkIHRpbWVvdXQgYW5kIHJldHJ5IGNvbmZpZ3VyYXRpb25cbiAgICAgIHRpbWVvdXQ6IDYwMDAwLCAvLyA2MCBzZWNvbmQgdGltZW91dCBmb3IgYmV0dGVyIHN0YWJpbGl0eVxuICAgICAgLy8gSGFuZGxlIGNvbm5lY3Rpb24gZXJyb3JzIGdyYWNlZnVsbHlcbiAgICAgIHNraXBFcnJvcnM6IHRydWUsXG4gICAgICAvLyBJbXByb3ZlIGVycm9yIGhhbmRsaW5nXG4gICAgICBlcnJvckhhbmRsZXI6IChlcnIsIGNvbnRleHQpID0+IHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhcIltITVJdIEVycm9yIGhhbmRsZWQgZ3JhY2VmdWxseTpcIiwgZXJyLm1lc3NhZ2UpO1xuICAgICAgfSxcbiAgICB9LFxuICAgIC8vIEFkZCBDT1JTIGhlYWRlcnMgZm9yIGJldHRlciBjcm9zcy1vcmlnaW4gc3VwcG9ydFxuICAgIGNvcnM6IHtcbiAgICAgIG9yaWdpbjogdHJ1ZSxcbiAgICAgIGNyZWRlbnRpYWxzOiB0cnVlLFxuICAgICAgbWV0aG9kczogW1wiR0VUXCIsIFwiUE9TVFwiLCBcIlBVVFwiLCBcIkRFTEVURVwiLCBcIk9QVElPTlNcIl0sXG4gICAgICBhbGxvd2VkSGVhZGVyczogW1wiQ29udGVudC1UeXBlXCIsIFwiQXV0aG9yaXphdGlvblwiXSxcbiAgICB9LFxuICAgIC8vIEltcHJvdmUgY29ubmVjdGlvbiBzdGFiaWxpdHlcbiAgICBzdHJpY3RQb3J0OiBmYWxzZSxcbiAgICAvLyBBZGQgaGVhZGVycyBmb3IgYmV0dGVyIGRldmVsb3BtZW50IGV4cGVyaWVuY2VcbiAgICBoZWFkZXJzOiB7XG4gICAgICBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIixcbiAgICAgIFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kc1wiOiBcIkdFVCwgUE9TVCwgUFVULCBERUxFVEUsIE9QVElPTlNcIixcbiAgICAgIFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVyc1wiOiBcIkNvbnRlbnQtVHlwZSwgQXV0aG9yaXphdGlvblwiLFxuICAgIH0sXG4gIH0sXG4gIHBsdWdpbnM6IFtyZWFjdCgpXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICB9LFxuICB9LFxuICBidWlsZDoge1xuICAgIC8vIE9wdGltaXplIGJ1aWxkIG91dHB1dFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICAvLyBTcGxpdCB2ZW5kb3IgY2h1bmtzIGZvciBiZXR0ZXIgY2FjaGluZ1xuICAgICAgICAgIHZlbmRvcjogW1wicmVhY3RcIiwgXCJyZWFjdC1kb21cIl0sXG4gICAgICAgICAgcm91dGVyOiBbXCJyZWFjdC1yb3V0ZXItZG9tXCJdLFxuICAgICAgICAgIHVpOiBbXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1kaWFsb2dcIixcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LWRyb3Bkb3duLW1lbnVcIixcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LXRvYXN0XCIsXG4gICAgICAgICAgXSxcbiAgICAgICAgICBzdXBhYmFzZTogW1wiQHN1cGFiYXNlL3N1cGFiYXNlLWpzXCJdLFxuICAgICAgICAgIHV0aWxzOiBbXCJjbHN4XCIsIFwidGFpbHdpbmQtbWVyZ2VcIiwgXCJkYXRlLWZuc1wiXSxcbiAgICAgICAgfSxcbiAgICAgICAgLy8gQWRkIGhhc2ggdG8gZmlsZW5hbWVzIGZvciBjYWNoZSBidXN0aW5nXG4gICAgICAgIGNodW5rRmlsZU5hbWVzOiBcImFzc2V0cy9bbmFtZV0tW2hhc2hdLmpzXCIsXG4gICAgICAgIGVudHJ5RmlsZU5hbWVzOiBcImFzc2V0cy9bbmFtZV0tW2hhc2hdLmpzXCIsXG4gICAgICAgIGFzc2V0RmlsZU5hbWVzOiBcImFzc2V0cy9bbmFtZV0tW2hhc2hdLltleHRdXCIsXG4gICAgICB9LFxuICAgIH0sXG4gICAgLy8gT3B0aW1pemUgY2h1bmsgc2l6ZSB3YXJuaW5nIGxpbWl0XG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxuICAgIC8vIEVuYWJsZSBzb3VyY2UgbWFwcyBmb3IgZGVidWdnaW5nXG4gICAgc291cmNlbWFwOiBtb2RlID09PSBcImRldmVsb3BtZW50XCIsXG4gICAgLy8gTWluaWZ5IGluIHByb2R1Y3Rpb25cbiAgICBtaW5pZnk6IG1vZGUgPT09IFwicHJvZHVjdGlvblwiID8gXCJlc2J1aWxkXCIgOiBmYWxzZSxcbiAgICAvLyBUYXJnZXQgbW9kZXJuIGJyb3dzZXJzIGZvciBiZXR0ZXIgcGVyZm9ybWFuY2VcbiAgICB0YXJnZXQ6IFwiZXNuZXh0XCIsXG4gIH0sXG4gIC8vIE9wdGltaXplIGRlcGVuZGVuY2llc1xuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBpbmNsdWRlOiBbXG4gICAgICBcInJlYWN0XCIsXG4gICAgICBcInJlYWN0LWRvbVwiLFxuICAgICAgXCJyZWFjdC1yb3V0ZXItZG9tXCIsXG4gICAgICBcIkBzdXBhYmFzZS9zdXBhYmFzZS1qc1wiLFxuICAgIF0sXG4gIH0sXG59KSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTZNLFNBQVMsb0JBQW9CO0FBQzFPLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFGakIsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQSxFQUN6QyxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixLQUFLO0FBQUE7QUFBQSxNQUVILFNBQVM7QUFBQTtBQUFBLE1BQ1QsWUFBWTtBQUFBO0FBQUE7QUFBQSxNQUVaLFNBQVM7QUFBQTtBQUFBO0FBQUEsTUFFVCxZQUFZO0FBQUE7QUFBQSxNQUVaLGNBQWMsQ0FBQyxLQUFLLFlBQVk7QUFDOUIsZ0JBQVEsTUFBTSxtQ0FBbUMsSUFBSSxPQUFPO0FBQUEsTUFDOUQ7QUFBQSxJQUNGO0FBQUE7QUFBQSxJQUVBLE1BQU07QUFBQSxNQUNKLFFBQVE7QUFBQSxNQUNSLGFBQWE7QUFBQSxNQUNiLFNBQVMsQ0FBQyxPQUFPLFFBQVEsT0FBTyxVQUFVLFNBQVM7QUFBQSxNQUNuRCxnQkFBZ0IsQ0FBQyxnQkFBZ0IsZUFBZTtBQUFBLElBQ2xEO0FBQUE7QUFBQSxJQUVBLFlBQVk7QUFBQTtBQUFBLElBRVosU0FBUztBQUFBLE1BQ1AsK0JBQStCO0FBQUEsTUFDL0IsZ0NBQWdDO0FBQUEsTUFDaEMsZ0NBQWdDO0FBQUEsSUFDbEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBO0FBQUEsSUFFTCxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUE7QUFBQSxVQUVaLFFBQVEsQ0FBQyxTQUFTLFdBQVc7QUFBQSxVQUM3QixRQUFRLENBQUMsa0JBQWtCO0FBQUEsVUFDM0IsSUFBSTtBQUFBLFlBQ0Y7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQSxVQUNBLFVBQVUsQ0FBQyx1QkFBdUI7QUFBQSxVQUNsQyxPQUFPLENBQUMsUUFBUSxrQkFBa0IsVUFBVTtBQUFBLFFBQzlDO0FBQUE7QUFBQSxRQUVBLGdCQUFnQjtBQUFBLFFBQ2hCLGdCQUFnQjtBQUFBLFFBQ2hCLGdCQUFnQjtBQUFBLE1BQ2xCO0FBQUEsSUFDRjtBQUFBO0FBQUEsSUFFQSx1QkFBdUI7QUFBQTtBQUFBLElBRXZCLFdBQVcsU0FBUztBQUFBO0FBQUEsSUFFcEIsUUFBUSxTQUFTLGVBQWUsWUFBWTtBQUFBO0FBQUEsSUFFNUMsUUFBUTtBQUFBLEVBQ1Y7QUFBQTtBQUFBLEVBRUEsY0FBYztBQUFBLElBQ1osU0FBUztBQUFBLE1BQ1A7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLEVBQUU7IiwKICAibmFtZXMiOiBbXQp9Cg==
