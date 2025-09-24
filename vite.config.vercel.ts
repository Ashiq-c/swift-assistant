import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
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
		})
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
					// More aggressive chunking for Vercel
					if (id.includes('node_modules')) {
						// Split large libraries into separate chunks
						if (id.includes('@huggingface/transformers')) return 'vendor-transformers';
						if (id.includes('mermaid')) return 'vendor-mermaid';
						if (id.includes('katex')) return 'vendor-katex';
						if (id.includes('highlight.js')) return 'vendor-highlight';
						if (id.includes('chart.js') || id.includes('d3')) return 'vendor-charts';
						if (id.includes('@tiptap') || id.includes('prosemirror')) return 'vendor-editor';
						if (id.includes('bits-ui') || id.includes('lucide-svelte')) return 'vendor-ui';
						if (id.includes('lodash') || id.includes('uuid') || id.includes('js-yaml')) return 'vendor-utils';
						if (id.includes('marked') || id.includes('dompurify')) return 'vendor-markdown';
						if (id.includes('@codemirror')) return 'vendor-codemirror';
						if (id.includes('svelte') || id.includes('@sveltejs')) return 'vendor-svelte';
						// Group remaining node_modules into smaller chunks
						return 'vendor-misc';
					}
					// Split application code by route/feature
					if (id.includes('src/routes')) {
						if (id.includes('chatbot-builder')) return 'app-chatbot-builder';
						if (id.includes('chat') || id.includes('/c/')) return 'app-chat';
						return 'app-routes';
					}
					if (id.includes('src/lib/components/chatbot-builder')) return 'app-chatbot-builder';
					if (id.includes('src/lib/components/chat')) return 'app-chat';
					if (id.includes('src/lib/components')) return 'app-components';
					if (id.includes('src/lib/apis')) return 'app-apis';
					if (id.includes('src/lib')) return 'app-lib';
				}
			}
		},
		chunkSizeWarningLimit: 500, // Lower warning limit for Vercel
		target: 'esnext',

	},
	worker: {
		format: 'es'
	},
	esbuild: {
		pure: ['console.log', 'console.debug', 'console.info'],
		legalComments: 'none'
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
});
