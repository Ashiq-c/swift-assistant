<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { onMount, getContext, createEventDispatcher } from 'svelte';
	const i18n = getContext('i18n');
	const dispatch = createEventDispatcher();

	import { artifactCode, chatId, settings, showArtifacts, showControls, showSidebar } from '$lib/stores';
	import { copyToClipboard, createMessagesList } from '$lib/utils';

	import XMark from '../icons/XMark.svelte';
	import ArrowsPointingOut from '../icons/ArrowsPointingOut.svelte';
	import Tooltip from '../common/Tooltip.svelte';
	import SvgPanZoom from '../common/SVGPanZoom.svelte';
	import ArrowLeft from '../icons/ArrowLeft.svelte';
	import ArrowDownTray from '../icons/ArrowDownTray.svelte';

	export let overlay = false;
	export let history;
	let messages = [];

	let contents: Array<{ type: string; content: string; id?: string }> = [];
	let selectedContentIdx = 0;

	let copied = false;
	let iframeElement: HTMLIFrameElement;
	let iframeKey = 0; // Force iframe refresh

	// Update messages when history changes
	$: if (history) {
		messages = createMessagesList(history, history.currentId);
	} else {
		messages = [];
	}

	// Process contents when artifactCode changes - this takes priority
	let lastArtifactCode: string | null = null;
	$: if ($artifactCode !== lastArtifactCode) {
		console.log('🔄 artifactCode changed from', lastArtifactCode ? 'value' : 'null', 'to', $artifactCode ? 'value' : 'null');
		lastArtifactCode = $artifactCode;
		processArtifactCode();
	}

	// Process contents when messages change, but only if no artifactCode
	$: if (messages && messages.length > 0 && !$artifactCode) {
		console.log('📝 Processing messages because no artifactCode');
		processMessages();
	}

	// Process artifactCode exclusively - this takes priority over everything
	const processArtifactCode = () => {
		console.log('🎯 processArtifactCode called');
		console.log('🔍 Current artifactCode:', $artifactCode ? 'HAS_VALUE' : 'NULL');

		// Always clear contents first to prevent any previous content
		console.log('🧹 Clearing contents array...');
		contents = [];
		selectedContentIdx = 0;

		if ($artifactCode && typeof $artifactCode === 'string' && $artifactCode.trim()) {
			console.log('📄 Processing artifactCode preview:', ($artifactCode as string).substring(0, 100) + '...');

			const code = $artifactCode as string;
			let renderedContent = '';

			// Check if the code is already a complete HTML document
			if (code.includes('<!DOCTYPE html>') || code.includes('<html')) {
				// Use the code as-is if it's already a complete HTML document
				renderedContent = code;
				console.log('✅ Using complete HTML document');
			} else {
				// Wrap the code in a basic HTML structure
				renderedContent = `
					<!DOCTYPE html>
					<html lang="en">
					<head>
						<meta charset="UTF-8">
						<meta name="viewport" content="width=device-width, initial-scale=1.0">
						<style>
							body {
								margin: 0;
								padding: 0;
							}
						</style>
					</head>
					<body>
						${code}
					</body>
					</html>
				`;
				console.log('✅ Wrapped code in HTML structure');
			}

			// Force iframe refresh by incrementing key and adding unique ID
			iframeKey++;
			const uniqueId = `artifact-${Date.now()}-${iframeKey}`;

			contents = [{ type: 'iframe', content: renderedContent, id: uniqueId }];
			selectedContentIdx = 0;
			console.log('✅ Created SINGLE content from artifactCode, length:', renderedContent.length, 'id:', uniqueId);
		} else {
			console.log('❌ artifactCode cleared - will process messages if available');
			// If artifactCode is cleared and we have messages, process them
			if (messages && messages.length > 0) {
				processMessages();
			}
		}
	};

	// Process messages only when no artifactCode is available
	const processMessages = () => {
		console.log('📝 processMessages called');

		// Always clear contents first
		contents = [];

		messages.forEach((message, idx) => {
			if (message?.role !== 'user' && message?.content) {
				const codeBlockContents = message.content.match(/```[\s\S]*?```/g);
				let codeBlocks = [];

				if (codeBlockContents) {
					codeBlockContents.forEach((block) => {
						const lang = block.split('\n')[0].replace('```', '').trim().toLowerCase();
						const code = block.replace(/```[\s\S]*?\n/, '').replace(/```$/, '');
						codeBlocks.push({ lang, code });
					});
				}

				let htmlContent = '';
				let cssContent = '';
				let jsContent = '';

				codeBlocks.forEach((block) => {
					const { lang, code } = block;

					if (lang === 'html') {
						htmlContent += code + '\n';
					} else if (lang === 'css') {
						cssContent += code + '\n';
					} else if (lang === 'javascript' || lang === 'js') {
						jsContent += code + '\n';
					}
				});

				const inlineHtml = message.content.match(/<html>[\s\S]*?<\/html>/gi);
				const inlineCss = message.content.match(/<style>[\s\S]*?<\/style>/gi);
				const inlineJs = message.content.match(/<script>[\s\S]*?<\/script>/gi);

				if (inlineHtml) {
					inlineHtml.forEach((block) => {
						const content = block.replace(/<\/?html>/gi, ''); // Remove <html> tags
						htmlContent += content + '\n';
					});
				}
				if (inlineCss) {
					inlineCss.forEach((block) => {
						const content = block.replace(/<\/?style>/gi, ''); // Remove <style> tags
						cssContent += content + '\n';
					});
				}
				if (inlineJs) {
					inlineJs.forEach((block) => {
						const content = block.replace(/<\/?script>/gi, ''); // Remove <script> tags
						jsContent += content + '\n';
					});
				}

				if (htmlContent || cssContent || jsContent) {
					const renderedContent = `
                        <!DOCTYPE html>
                        <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
							<${''}style>
								${cssContent}
							</${''}style>
                        </head>
                        <body>
                            ${htmlContent}

							<${''}script>
                            	${jsContent}
							</${''}script>
                        </body>
                        </html>
                    `;
					contents = [...contents, { type: 'iframe', content: renderedContent }];
					console.log('Added iframe content, total contents:', contents.length);
					console.log('-------------------------renderedContent-------------------------', renderedContent)
				} else {
					// Check for SVG content
					for (const block of codeBlocks) {
						if (block.lang === 'svg' || (block.lang === 'xml' && block.code.includes('<svg'))) {
							contents = [...contents, { type: 'svg', content: block.code }];
						}
					}
				}
			}
		});

		if (contents.length === 0) {
			console.log('No contents found, hiding artifacts');
			showControls.set(false);
			showArtifacts.set(false);
		}

		selectedContentIdx = contents ? contents.length - 1 : 0;
	};

	function navigateContent(direction: 'prev' | 'next') {
		console.log(selectedContentIdx);

		selectedContentIdx =
			direction === 'prev'
				? Math.max(selectedContentIdx - 1, 0)
				: Math.min(selectedContentIdx + 1, contents.length - 1);

		console.log(selectedContentIdx);
	}

	const iframeLoadHandler = () => {
		console.log('🖼️ Iframe loaded');
		console.log('🖼️ Iframe content window:', !!iframeElement.contentWindow);


		// hide sidebar
		showSidebar.set(false);

		if (iframeElement.contentWindow?.document?.body) {
			console.log('🖼️ Iframe body content:', iframeElement.contentWindow.document.body.innerHTML.substring(0, 200) + '...');
		}

		iframeElement.contentWindow.addEventListener(
			'click',
			function (e) {
				const target = e.target.closest('a');
				if (target && target.href) {
					e.preventDefault();
					const url = new URL(target.href, iframeElement.baseURI);
					if (url.origin === window.location.origin) {
						iframeElement.contentWindow.history.pushState(
							null,
							'',
							url.pathname + url.search + url.hash
						);
					} else {
						console.info('External navigation blocked:', url.href);
					}
				}
			},
			true
		);

		// Cancel drag when hovering over iframe
		iframeElement.contentWindow.addEventListener('mouseenter', function (e) {
			e.preventDefault();
			iframeElement.contentWindow.addEventListener('dragstart', (event) => {
				event.preventDefault();
			});
		});
	};

	const showFullScreen = () => {
		if (iframeElement.requestFullscreen) {
			iframeElement.requestFullscreen();
		} else if (iframeElement.webkitRequestFullscreen) {
			iframeElement.webkitRequestFullscreen();
		} else if (iframeElement.msRequestFullscreen) {
			iframeElement.msRequestFullscreen();
		}
	};

	const downloadArtifact = () => {
		const blob = new Blob([contents[selectedContentIdx].content], { type: 'text/html' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `artifact-${$chatId}-${selectedContentIdx}.html`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	onMount(() => {
		// Removed artifactCode subscription as it's now handled by reactive statements
	});
</script>

<div class=" w-full h-full relative flex flex-col bg-gray-50 dark:bg-gray-850">
	<div class="w-full h-full flex flex-col flex-1 relative">
		{#if contents.length > 0}
			<!-- Header with close buttons -->
			<div
				class="pointer-events-auto z-20 flex justify-between items-center p-2.5 font-primar text-gray-900 dark:text-white flex-shrink-0"
			>
				<!-- <button
					class="self-center pointer-events-auto p-1 rounded-full bg-white dark:bg-gray-850"
					on:click={() => {
						showArtifacts.set(false);
					}}
				>
					<ArrowLeft className="size-3.5 text-gray-900 dark:text-white" />
				</button> -->

				<div class="flex-1 flex items-center justify-between pr-1">
					<div class="flex items-center space-x-2">
						<!-- <div class="flex items-center gap-0.5 self-center min-w-fit" dir="ltr">
							<button
								class="self-center p-1 hover:bg-black/5 dark:hover:bg-white/5 dark:hover:text-white hover:text-black rounded-md transition disabled:cursor-not-allowed"
								on:click={() => navigateContent('prev')}
								disabled={contents.length <= 1}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2.5"
									class="size-3.5"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M15.75 19.5 8.25 12l7.5-7.5"
									/>
								</svg>
							</button>

							<div class="text-xs self-center dark:text-gray-100 min-w-fit">
								{$i18n.t('Version {{selectedVersion}} of {{totalVersions}}', {
									selectedVersion: selectedContentIdx + 1,
									totalVersions: contents.length
								})}
							</div>

							<button
								class="self-center p-1 hover:bg-black/5 dark:hover:bg-white/5 dark:hover:text-white hover:text-black rounded-md transition disabled:cursor-not-allowed"
								on:click={() => navigateContent('next')}
								disabled={contents.length <= 1}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2.5"
									class="size-3.5"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="m8.25 4.5 7.5 7.5-7.5 7.5"
									/>
								</svg>
							</button>
						</div> -->
					</div>

					<div class="flex items-center gap-1.5">
						<button
							class="copy-code-button bg-none border-none text-xs bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 transition rounded-md px-1.5 py-0.5"
							on:click={() => {
								copyToClipboard(contents[selectedContentIdx].content);
								copied = true;

								setTimeout(() => {
									copied = false;
								}, 2000);
							}}>{copied ? $i18n.t('Copied') : $i18n.t('Copy')}</button
						>

						<Tooltip content={$i18n.t('Download')}>
							<button
								class=" bg-none border-none text-xs bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 transition rounded-md p-0.5"
								on:click={downloadArtifact}
							>
								<ArrowDownTray className="size-3.5" />
							</button>
						</Tooltip>

						{#if contents[selectedContentIdx].type === 'iframe'}
							<Tooltip content={$i18n.t('Open in full screen')}>
								<button
									class=" bg-none border-none text-xs bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 transition rounded-md p-0.5"
									on:click={showFullScreen}
								>
									<ArrowsPointingOut className="size-3.5" />
								</button>
							</Tooltip>
						{/if}
					</div>
				</div>

				<button
					class="self-center pointer-events-auto p-1 rounded-full bg-white dark:bg-gray-850"
					on:click={() => {
						dispatch('close');
						showControls.set(false);
						showArtifacts.set(false);
					}}
				>
					<XMark className="size-3.5 text-gray-900 dark:text-white" />
				</button>
			</div>
		{/if}

		{#if overlay}
			<div class=" absolute top-0 left-0 right-0 bottom-0 z-10"></div>
		{/if}

		<!-- Content area - takes remaining space after header -->
		<div class="flex-1 w-full overflow-hidden">
			<div class="h-full flex flex-col">
				{#if contents.length > 0}
					<div class="max-w-full w-full h-full">
						{#if contents[selectedContentIdx].type === 'iframe'}
							{#key contents[selectedContentIdx].id || contents[selectedContentIdx].content}
								<iframe
									bind:this={iframeElement}
									title="Content"
									srcdoc={contents[selectedContentIdx].content}
									class="w-full border-0 h-full rounded-none"
									sandbox="allow-scripts allow-downloads{($settings?.iframeSandboxAllowForms ?? false)
										? ' allow-forms'
										: ''}{($settings?.iframeSandboxAllowSameOrigin ?? false)
										? ' allow-same-origin'
										: ''}"
									on:load={iframeLoadHandler}
								></iframe>
							{/key}
						{:else if contents[selectedContentIdx].type === 'svg'}
							<SvgPanZoom
								className=" w-full h-full max-h-full overflow-hidden"
								svg={contents[selectedContentIdx].content}
							/>
						{/if}
					</div>
				{:else}
					<div class="m-auto font-medium text-xs text-gray-900 dark:text-white">
						No HTML, CSS, or JavaScript content found.
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
