// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
var __vite_injected_original_dirname = "/home/project";
var vite_config_default = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  server: {
    // Enable history API fallback for client-side routing
    historyApiFallback: true
  },
  define: {
    // Provide default values for environment variables in development
    "import.meta.env.VITE_GOOGLE_MAPS_API_KEY": JSON.stringify(
      process.env.VITE_GOOGLE_MAPS_API_KEY || ""
    ),
    "import.meta.env.VITE_DISABLE_GOOGLE_MAPS": JSON.stringify(
      process.env.VITE_DISABLE_GOOGLE_MAPS || "true"
    )
  },
  build: {
    // Production optimizations
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        // Remove console.log statements in production
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],
          supabase: ["@supabase/supabase-js"]
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0LXN3YydcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgfSxcbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgLy8gRW5hYmxlIGhpc3RvcnkgQVBJIGZhbGxiYWNrIGZvciBjbGllbnQtc2lkZSByb3V0aW5nXG4gICAgaGlzdG9yeUFwaUZhbGxiYWNrOiB0cnVlLFxuICB9LFxuICBkZWZpbmU6IHtcbiAgICAvLyBQcm92aWRlIGRlZmF1bHQgdmFsdWVzIGZvciBlbnZpcm9ubWVudCB2YXJpYWJsZXMgaW4gZGV2ZWxvcG1lbnRcbiAgICAnaW1wb3J0Lm1ldGEuZW52LlZJVEVfR09PR0xFX01BUFNfQVBJX0tFWSc6IEpTT04uc3RyaW5naWZ5KFxuICAgICAgcHJvY2Vzcy5lbnYuVklURV9HT09HTEVfTUFQU19BUElfS0VZIHx8ICcnXG4gICAgKSxcbiAgICAnaW1wb3J0Lm1ldGEuZW52LlZJVEVfRElTQUJMRV9HT09HTEVfTUFQUyc6IEpTT04uc3RyaW5naWZ5KFxuICAgICAgcHJvY2Vzcy5lbnYuVklURV9ESVNBQkxFX0dPT0dMRV9NQVBTIHx8ICd0cnVlJ1xuICAgICksXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgLy8gUHJvZHVjdGlvbiBvcHRpbWl6YXRpb25zXG4gICAgbWluaWZ5OiAndGVyc2VyJyxcbiAgICB0ZXJzZXJPcHRpb25zOiB7XG4gICAgICBjb21wcmVzczoge1xuICAgICAgICBkcm9wX2NvbnNvbGU6IHRydWUsIC8vIFJlbW92ZSBjb25zb2xlLmxvZyBzdGF0ZW1lbnRzIGluIHByb2R1Y3Rpb25cbiAgICAgICAgZHJvcF9kZWJ1Z2dlcjogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgdmVuZG9yOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbSddLFxuICAgICAgICAgIHJvdXRlcjogWydyZWFjdC1yb3V0ZXItZG9tJ10sXG4gICAgICAgICAgdWk6IFsnQHJhZGl4LXVpL3JlYWN0LWRpYWxvZycsICdAcmFkaXgtdWkvcmVhY3QtZHJvcGRvd24tbWVudSddLFxuICAgICAgICAgIHN1cGFiYXNlOiBbJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcyddLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeU4sU0FBUyxvQkFBb0I7QUFDdFAsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUZqQixJQUFNLG1DQUFtQztBQUt6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBO0FBQUEsSUFFTixvQkFBb0I7QUFBQSxFQUN0QjtBQUFBLEVBQ0EsUUFBUTtBQUFBO0FBQUEsSUFFTiw0Q0FBNEMsS0FBSztBQUFBLE1BQy9DLFFBQVEsSUFBSSw0QkFBNEI7QUFBQSxJQUMxQztBQUFBLElBQ0EsNENBQTRDLEtBQUs7QUFBQSxNQUMvQyxRQUFRLElBQUksNEJBQTRCO0FBQUEsSUFDMUM7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUE7QUFBQSxJQUVMLFFBQVE7QUFBQSxJQUNSLGVBQWU7QUFBQSxNQUNiLFVBQVU7QUFBQSxRQUNSLGNBQWM7QUFBQTtBQUFBLFFBQ2QsZUFBZTtBQUFBLE1BQ2pCO0FBQUEsSUFDRjtBQUFBLElBQ0EsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBLFVBQ1osUUFBUSxDQUFDLFNBQVMsV0FBVztBQUFBLFVBQzdCLFFBQVEsQ0FBQyxrQkFBa0I7QUFBQSxVQUMzQixJQUFJLENBQUMsMEJBQTBCLCtCQUErQjtBQUFBLFVBQzlELFVBQVUsQ0FBQyx1QkFBdUI7QUFBQSxRQUNwQztBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
