import vercelAdapter from '@sveltejs/adapter-vercel';

import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'; // ✅ correct import
import * as child_process from 'node:child_process';
import fs from 'node:fs';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: vercelAdapter({ runtime: 'nodejs20.x' }),
		paths: {
			base: '',
			assets: ''
		},
		version: {
			name: (() => {
				try {
					return child_process.execSync('git rev-parse HEAD').toString().trim();
				} catch {
					try {
						return (
							JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8'))?.version || Date.now().toString()
						);
					} catch {
						return Date.now().toString();
					}
				}
			})(),
			pollInterval: 60000
		}
	},

	vitePlugin: {},

	onwarn: (warning, handler) => {
		if (warning.code === 'css-unused-selector') return;
		handler(warning);
	}
};

export default config;
