import { defineConfig, loadEnv } from "@rsbuild/core"
import { pluginReact } from "@rsbuild/plugin-react"

const { publicVars } = loadEnv({ prefixes: ["VITE_"] })

export default defineConfig({
  plugins: [pluginReact()],
  html: {
    template: "./public/index.html",
  },
  source: {
    entry: {
      index: "./src/index.tsx",
    },
    define: publicVars,
  },
  output: {
    target: "web",
  },
  tools: {
    postcss: {
      postcssOptions: {
        plugins: ["tailwindcss", "autoprefixer"],
      },
    },
  },
})
