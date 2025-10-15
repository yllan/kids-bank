import { cloudflare } from '@cloudflare/vite-plugin';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [tailwindcss(), tanstackRouter({}), react(), VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "kids-bank",
        short_name: "kids-bank",
        description: "kids-bank - PWA Application",
        theme_color: "#0c0c0c",
      },
      pwaAssets: { disabled: false, config: true },
      devOptions: { enabled: true },
    }), cloudflare()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});
