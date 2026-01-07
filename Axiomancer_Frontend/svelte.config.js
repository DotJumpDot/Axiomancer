import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import("@sveltejs/vite-plugin-svelte").SvelteConfig} */
export default {
  // Consult https://svelte.dev/docs#compile-time-svelte-preprocess
  // for more information about preprocessors
  preprocess: vitePreprocess(),
  compilerOptions: {
    // Suppress unused CSS selector warnings
    css: "external",
  },
  onwarn: (warning, handler) => {
    // Suppress css-unused-selector warnings
    if (warning.code === "css-unused-selector") return;
    handler(warning);
  },
};
