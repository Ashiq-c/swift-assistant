<script lang="ts">
	import { onMount } from 'svelte';
	import { sendChatMessage } from '$lib/apis/chats';

	let chatId = '2bb89bc9-7bb7-4f20-b459-6829a75ac92c';
	let prompt = 'hi';
	let response = '';
	let isStreaming = false;
	let error = '';
	let streamingEnabled = true;

	const testNonStreaming = async () => {
		response = '';
		error = '';
		isStreaming = true;

		try {
			console.log('🧪 Testing non-streaming API...');
			const result = await sendChatMessage(chatId, prompt);
			
			if (result) {
				if (result.success && result.response) {
					response = result.response;
				} else if (result.token) {
					response = result.token;
				} else if (typeof result === 'string') {
					response = result;
				} else {
					response = JSON.stringify(result, null, 2);
				}
			} else {
				error = 'No response received';
			}
		} catch (err) {
			error = err.message;
			console.error('❌ Non-streaming test error:', err);
		} finally {
			isStreaming = false;
		}
	};

	const testStreaming = async () => {
		response = '';
		error = '';
		isStreaming = true;

		try {
			console.log('🧪 Testing streaming API...');
			await sendChatMessage(chatId, prompt, {
				stream: true,
				onChunk: (chunk) => {
					console.log('📥 Chunk received:', chunk);
					response += chunk;
				},
				onComplete: (fullResponse) => {
					console.log('✅ Streaming complete:', fullResponse);
					response = fullResponse;
					isStreaming = false;
				},
				onError: (err) => {
					console.error('❌ Streaming error:', err);
					error = err.message;
					isStreaming = false;
				}
			});
		} catch (err) {
			error = err.message;
			console.error('❌ Streaming test error:', err);
			isStreaming = false;
		}
	};

	const runTest = () => {
		if (streamingEnabled) {
			testStreaming();
		} else {
			testNonStreaming();
		}
	};
</script>

<div class="container mx-auto p-6 max-w-4xl">
	<h1 class="text-3xl font-bold mb-6">Chat API Streaming Test</h1>
	
	<div class="bg-white rounded-lg shadow-md p-6 mb-6">
		<h2 class="text-xl font-semibold mb-4">Configuration</h2>
		
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
			<div>
				<label for="chatId" class="block text-sm font-medium text-gray-700 mb-2">Chat ID:</label>
				<input 
					id="chatId"
					bind:value={chatId} 
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="Enter chat ID"
				/>
			</div>
			
			<div>
				<label for="prompt" class="block text-sm font-medium text-gray-700 mb-2">Prompt:</label>
				<input 
					id="prompt"
					bind:value={prompt} 
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="Enter your prompt"
				/>
			</div>
		</div>

		<div class="mb-4">
			<label class="flex items-center">
				<input 
					type="checkbox" 
					bind:checked={streamingEnabled}
					class="mr-2"
				/>
				<span class="text-sm font-medium text-gray-700">Enable Streaming</span>
			</label>
		</div>

		<button 
			on:click={runTest}
			disabled={isStreaming}
			class="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
		>
			{isStreaming ? 'Testing...' : streamingEnabled ? 'Test Streaming API' : 'Test Non-Streaming API'}
		</button>
	</div>

	{#if error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
			<h3 class="text-lg font-semibold text-red-800 mb-2">Error</h3>
			<p class="text-red-700">{error}</p>
		</div>
	{/if}

	{#if response || isStreaming}
		<div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
			<h3 class="text-lg font-semibold text-gray-800 mb-2">
				Response {isStreaming ? '(Streaming...)' : ''}
			</h3>
			<div class="bg-white border rounded p-3 min-h-[100px] whitespace-pre-wrap font-mono text-sm">
				{response || (isStreaming ? 'Waiting for response...' : '')}
				{#if isStreaming}
					<span class="animate-pulse">|</span>
				{/if}
			</div>
		</div>
	{/if}

	<div class="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
		<h3 class="text-lg font-semibold text-blue-800 mb-2">API Information</h3>
		<div class="text-sm text-blue-700 space-y-1">
			<p><strong>Endpoint:</strong> <code>http://127.0.0.1:8000/api/v1/chat/{chatId}/</code></p>
			<p><strong>Method:</strong> POST</p>
			<p><strong>Headers:</strong> Cache-Control: no-cache, Authorization: Bearer [token]</p>
			<p><strong>Body:</strong> FormData with "prompt" field</p>
			<p><strong>Streaming:</strong> {streamingEnabled ? 'Enabled (stream=true parameter added)' : 'Disabled'}</p>
		</div>
	</div>

	<div class="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
		<h3 class="text-lg font-semibold text-gray-800 mb-2">Usage Examples</h3>
		<div class="text-sm text-gray-700 space-y-4">
			<div>
				<h4 class="font-medium">Non-Streaming:</h4>
				<pre class="bg-white border rounded p-2 mt-1 overflow-x-auto"><code>{`import { sendChatMessage } from '$lib/apis/chats';

const response = await sendChatMessage(chatId, prompt);
console.log(response);`}</code></pre>
			</div>
			
			<div>
				<h4 class="font-medium">Streaming:</h4>
				<pre class="bg-white border rounded p-2 mt-1 overflow-x-auto"><code>{`import { sendChatMessage } from '$lib/apis/chats';

await sendChatMessage(chatId, prompt, {
  stream: true,
  onChunk: (chunk) => {
    console.log('Received:', chunk);
    // Update UI with streaming text
  },
  onComplete: (fullResponse) => {
    console.log('Complete:', fullResponse);
  },
  onError: (error) => {
    console.error('Error:', error);
  }
});`}</code></pre>
			</div>
		</div>
	</div>
</div>

<style>
	.container {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}
</style>