// Temporarily disabled to reduce bundle size - Kokoro TTS functionality unavailable
// This worker has been disabled because @huggingface/transformers and kokoro-js
// dependencies were removed to reduce bundle size for Vercel deployment

self.onmessage = async (event) => {
	const { type } = event.data;

	if (type === 'init') {
		self.postMessage({
			status: 'init:error',
			error: 'Kokoro TTS is temporarily disabled to reduce bundle size'
		});
	}

	if (type === 'generate') {
		self.postMessage({
			status: 'generate:error',
			error: 'Kokoro TTS is temporarily disabled to reduce bundle size'
		});
	}

	if (type === 'status') {
		self.postMessage({
			status: 'status:check',
			initialized: false,
			error: 'Kokoro TTS is temporarily disabled to reduce bundle size'
		});
	}
};
