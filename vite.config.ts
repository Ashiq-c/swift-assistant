import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const apiTarget = env.PUBLIC_CUSTOM_API_BASE_URL || 'http://127.0.0.1:8000/';

	return {
		plugins: [
			sveltekit(),
			viteStaticCopy({
				targets: [
					{
						// only copy needed WASM files for client-side usage
						src: 'node_modules/onnxruntime-web/dist/*.jsep.*',
						dest: 'wasm'
					}
				]
			}),
			visualizer({ open: false }) // set to true if you want to auto-open analyzer in browser
		],
		define: {
			APP_VERSION: JSON.stringify(process.env.npm_package_version),
			APP_BUILD_HASH: JSON.stringify(process.env.APP_BUILD_HASH || 'dev-build')
		},
		build: {
			sourcemap: false,
			minify: true,
			cssMinify: true,
			rollupOptions: {
				output: {
					manualChunks: (id) => {
						// Simple chunking to avoid loading issues
						if (id.includes('node_modules')) {
							// Only split the largest libraries
							if (id.includes('katex')) return 'vendor-katex';
							if (id.includes('highlight.js')) return 'vendor-highlight';
							if (id.includes('svelte') || id.includes('@sveltejs')) return 'vendor-svelte';
							// Group everything else together
							return 'vendor-misc';
						}
						// Keep app code together for faster loading
						if (id.includes('src/lib/components')) return 'app-components';
						if (id.includes('src/lib/apis')) return 'app-apis';
						if (id.includes('src/lib')) return 'app-lib';
					}
				}
			},
			chunkSizeWarningLimit: 1000, // Allow larger chunks for better loading
			target: 'esnext',
		},
		worker: {
			format: 'es'
		},
		esbuild: {
			pure: process.env.ENV === 'dev' ? [] : ['console.log', 'console.debug'],
			legalComments: 'none'
		},
		server: {
			proxy: {
				'/api': {
					target: 'http://localhost:8080',
					changeOrigin: true,
					secure: false
				},
				'/ollama': {
					target: 'http://localhost:8080',
					changeOrigin: true,
					secure: false
				},
				'/custom-api': {
					target: apiTarget,
					changeOrigin: true,
					secure: false,
					rewrite: (path) => path.replace(/^\/custom-api/, '/api')
				}
			}
		},
		ssr: {
			external: [
				'@huggingface/transformers',
				'pdfjs-dist',
				'sharp',
				'canvas',
				'html2canvas-pro',
				'jspdf',
				'mermaid',
				'chart.js',
				'katex',
				'highlight.js',
				'leaflet',
				'prosemirror-view',
				'prosemirror-state',
				'prosemirror-model',
				'prosemirror-commands',
				'prosemirror-keymap',
				'prosemirror-history',
				'prosemirror-schema-basic',
				'prosemirror-schema-list',
				'prosemirror-markdown',
				'prosemirror-tables',
				'prosemirror-collab',
				'@tiptap/core',
				'@tiptap/starter-kit',
				'@tiptap/extension-bubble-menu',
				'@tiptap/extension-character-count',
				'@tiptap/extension-code-block-lowlight',
				'@tiptap/extension-floating-menu',
				'@tiptap/extension-highlight',
				'@tiptap/extension-history',
				'@tiptap/extension-link',
				'@tiptap/extension-placeholder',
				'@tiptap/extension-table',
				'@tiptap/extension-table-cell',
				'@tiptap/extension-table-header',
				'@tiptap/extension-table-row',
				'@tiptap/extension-task-item',
				'@tiptap/extension-task-list',
				'@tiptap/extension-typography',
				'@tiptap/extension-underline',
				'@tiptap/pm',
				'codemirror',
				'@codemirror/lang-javascript',
				'@codemirror/lang-python',
				'@codemirror/language-data',
				'@codemirror/theme-one-dark'
			],
			noExternal: ['onnxruntime-web', '@sveltejs/kit']
		}
	};
});
