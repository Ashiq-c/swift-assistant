import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit()
	],
	define: {
		APP_VERSION: JSON.stringify(process.env.npm_package_version),
		APP_BUILD_HASH: JSON.stringify(process.env.APP_BUILD_HASH || 'vercel-build')
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
			}
		}
	},
	ssr: {
		external: [
			'sharp',
			'canvas',
			'jspdf',
			'katex',
			'highlight.js',
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
});
