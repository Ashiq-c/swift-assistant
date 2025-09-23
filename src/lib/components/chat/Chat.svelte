<script lang="ts">
	import { v4 as uuidv4 } from 'uuid';
	import { toast } from 'svelte-sonner';
	import mermaid from 'mermaid';
	import { PaneGroup, Pane, PaneResizer } from 'paneforge';

	import { getContext, onDestroy, onMount, tick } from 'svelte';
	const i18n: Writable<i18nType> = getContext('i18n');

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	import { get, type Unsubscriber, type Writable } from 'svelte/store';
	import type { i18n as i18nType } from 'i18next';
	import { WEBUI_BASE_URL } from '$lib/constants';

	import {
		chatId,
		chats,
		config,
		type Model,
		models,
		tags as allTags,
		settings,
		showSidebar,
		WEBUI_NAME,
		banners,
		user,
		socket,
		showControls,
		showCallOverlay,
		currentChatPage,
		temporaryChatEnabled,
		mobile,
		showOverview,
		chatTitle,
		showArtifacts,
		tools,
		toolServers,
		selectedFolder
	} from '$lib/stores';
	import {
		convertMessagesToHistory,
		copyToClipboard,
		getMessageContentParts,
		createMessagesList,
		extractSentencesForAudio,
		promptTemplate,
		splitStream,
		sleep,
		removeDetails,
		getPromptVariables,
		processDetails,
		removeAllDetails
	} from '$lib/utils';

	import { generateChatCompletion } from '$lib/apis/ollama';
	import {
		createNewChat,
		getAllTags,
		getChatById,
		getChatList,
		getTagsById,
		updateChatById,
		sendChatMessage,
		createChatViaAPI,
		getChatHistory,
		streamChatMessage,
		testChatAPI
	} from '$lib/apis/chats';
	import { generateOpenAIChatCompletion } from '$lib/apis/openai';
	import { processWeb, processWebSearch, processYoutubeVideo } from '$lib/apis/retrieval';
	import { createOpenAITextStream } from '$lib/apis/streaming';
	import { queryMemory } from '$lib/apis/memories';
	import { getAndUpdateUserLocation, getUserSettings } from '$lib/apis/users';
	import {
		chatCompleted,
		generateQueries,
		chatAction,
		generateMoACompletion,
		stopTask,
		getTaskIdsByChatId
	} from '$lib/apis';
	import { getTools } from '$lib/apis/tools';

	import Banner from '../common/Banner.svelte';
	import MessageInput from '$lib/components/chat/MessageInput.svelte';
	import Messages from '$lib/components/chat/Messages.svelte';
	import Navbar from '$lib/components/chat/Navbar.svelte';
	import { getChatbot, getChatbots } from '$lib/api/chatbots.js';
	import ChatControls from './ChatControls.svelte';
	import EventConfirmDialog from '../common/ConfirmDialog.svelte';
	import Placeholder from './Placeholder.svelte';
	import NotificationToast from '../NotificationToast.svelte';

	import Spinner from '../common/Spinner.svelte';
	import { fade } from 'svelte/transition';

	export let chatIdProp = '';

	let loading = true;

	const eventTarget = new EventTarget();
	let controlPane;
	let controlPaneComponent;

	let messageInput;

	let autoScroll = true;
	let processing = '';
	let messagesContainerElement: HTMLDivElement;

	let navbarElement;

	let showEventConfirmation = false;
	let eventConfirmationTitle = '';
	let eventConfirmationMessage = '';
	let eventConfirmationInput = false;
	let eventConfirmationInputPlaceholder = '';
	let eventConfirmationInputValue = '';
	let eventCallback = null;

	let chatIdUnsubscriber: Unsubscriber | undefined;

	// Static model configuration - no dynamic selection
	let selectedModels = ['static-model'];
	let selectedModelIds = ['static-model'];
	$: selectedModelIds = ['static-model']; // Always use static model

	let selectedToolIds = [];
	let selectedFilterIds = [];
	let imageGenerationEnabled = false;
	let webSearchEnabled = false;
	let codeInterpreterEnabled = false;

	let showCommands = false;

	let chat = null;
	let tags = [];

	let history = {
		messages: {},
		currentId: null
	};

	let taskIds = null;

	// Chat Input
	let prompt = '';
	let chatFiles = [];
	let files = [];
	let params = {};

	// Bot context when navigating with a chatbot id instead of a chat id
	let currentBot = null;
	let botSuggestionPrompts = [];

	$: if (chatIdProp) {
		navigateHandler();
	}

	const navigateHandler = async () => {
		loading = true;

		prompt = '';
		messageInput?.setText('');

		files = [];
		selectedToolIds = [];
		selectedFilterIds = [];
		webSearchEnabled = false;
		imageGenerationEnabled = false;

		const storageChatInput = sessionStorage.getItem(
			`chat-input${chatIdProp ? `-${chatIdProp}` : ''}`
		);

		// Check if we're in frontend-only mode (Custom API)
		const isFrontendOnly = $config?.name?.includes('Custom API') || $config?.auth === false;
		// Force chatbot mode if sidebar passed ?bot=1
		const forceChatbot = $page?.url?.searchParams?.get('bot') === '1';

		if (chatIdProp && !isFrontendOnly && !forceChatbot && (await loadChat())) {
			// Ensure chat history is loaded even if loadChat didn't load it
			if (!chatHistory || chatHistory.length === 0) {
				try {
					const historyRes = await getChatHistory(chatIdProp);
					if (historyRes && historyRes.success && Array.isArray(historyRes.response)) {
						chatHistory = historyRes.response;
						console.log('🔧 Regular mode: loaded chat history as fallback', chatHistory);
					}
				} catch (error) {
					console.error('Failed to load chat history as fallback:', error);
				}
			}

			await tick();
			loading = false;
			window.setTimeout(() => scrollToBottom(), 0);

			await tick();

				// Also attempt to load a chatbot with the same id to populate suggestions/title
				try {
					const fetchedBot = await getChatbot(chatIdProp);
					// Normalize various API response shapes
					currentBot = fetchedBot?.data ?? fetchedBot?.response ?? fetchedBot?.result ?? fetchedBot;
					// Normalize conversation starters shape: array of strings or objects with text
					let startersRaw = currentBot?.conversation_starters ?? currentBot?.conversationStarters ?? [];
					if (!Array.isArray(startersRaw)) startersRaw = [];
					botSuggestionPrompts = startersRaw.map((s) => ({ content: typeof s === 'string' ? s : (s?.text ?? '') })).filter(p => p.content);
					// If chat title is empty or generic, prefer bot name
					if (!($chatTitle?.trim?.()) || $chatTitle === 'New Chat') {
						await chatTitle.set(currentBot?.name || $chatTitle);
					}
				} catch {}

		} else if (chatIdProp && !isFrontendOnly) {
			// Treat param as a chatbot id: load bot and show its starters/greeting in placeholder
			try {
				const fetchedBot = await getChatbot(chatIdProp);
				// Normalize various API response shapes
				currentBot = fetchedBot?.data ?? fetchedBot?.response ?? fetchedBot?.result ?? fetchedBot;
				// Normalize conversation starters shape
				let startersRaw = currentBot?.conversation_starters ?? currentBot?.conversationStarters ?? [];
				if (!Array.isArray(startersRaw)) startersRaw = [];
				botSuggestionPrompts = startersRaw.map((s) => ({ content: typeof s === 'string' ? s : (s?.text ?? '') })).filter(p => p.content);
				// Use bot name as provisional title
				await chatTitle.set(currentBot?.name || '');
				loading = false;
			} catch (e) {
				console.warn('ID is neither chat nor chatbot; redirecting home', e);
				await goto('/');
			}
		} else if (chatIdProp && isFrontendOnly) {
			// Frontend-only mode: create a new chat without backend
			console.log('🔧 Frontend-only mode: creating new chat without backend');
			chatId.set(chatIdProp);

			// Initialize with empty history for new chat
			history = {
				messages: {},
				currentId: null
			};

			selectedModels = ['custom-api'];
			chatTitle.set('New Chat');

				// Best-effort: in frontend-only mode, still load chatbot info for header/suggestions
				try {
					const fetchedBot = await getChatbot(chatIdProp);
					currentBot = fetchedBot?.data ?? fetchedBot?.response ?? fetchedBot?.result ?? fetchedBot;
					let startersRaw = currentBot?.conversation_starters ?? currentBot?.conversationStarters ?? [];
					if (!Array.isArray(startersRaw)) startersRaw = [];
					botSuggestionPrompts = startersRaw.map((s) => ({ content: typeof s === 'string' ? s : (s?.text ?? '') })).filter(p => p.content);
					if (currentBot?.name) {
						chatTitle.set(currentBot.name);
					}
				} catch (e) {
					console.warn('Frontend-only: failed to fetch chatbot details', e);
				}


			// Load chat history for frontend-only mode too
			await loadChatHistoryOnce(chatIdProp);

			await tick();
			loading = false;
			window.setTimeout(() => scrollToBottom(), 0);

			await tick();

			if (storageChatInput) {
				try {
					const input = JSON.parse(storageChatInput);

					if (!$temporaryChatEnabled) {
						messageInput?.setText(input.prompt);
						files = input.files;
						selectedToolIds = input.selectedToolIds;
						selectedFilterIds = input.selectedFilterIds;
						webSearchEnabled = input.webSearchEnabled;
						imageGenerationEnabled = input.imageGenerationEnabled;
						codeInterpreterEnabled = input.codeInterpreterEnabled;
					}
				} catch (e) {}
			}

			const chatInput = document.getElementById('chat-input');
			chatInput?.focus();
		} else {
			await goto('/');
		}
	};

	const onSelect = async (e) => {
		const { type, data } = e;

		if (type === 'prompt') {
			// Handle prompt selection
			messageInput?.setText(data);
		}
	};

	// Session storage for models removed - using static model

	let oldSelectedModelIds = [''];
	$: if (JSON.stringify(selectedModelIds) !== JSON.stringify(oldSelectedModelIds)) {
		onSelectedModelIdsChange();
	}

	const onSelectedModelIdsChange = () => {
		if (oldSelectedModelIds.filter((id) => id).length > 0) {
			resetInput();
		}
		oldSelectedModelIds = selectedModelIds;
	};

	const resetInput = () => {
		console.debug('resetInput');
		setToolIds();

		selectedFilterIds = [];
		webSearchEnabled = false;
		imageGenerationEnabled = false;
		codeInterpreterEnabled = false;
	};

	const setToolIds = async () => {
		if (!$tools) {
			tools.set(await getTools(localStorage.token));
		}

		if (selectedModels.length !== 1) {
			return;
		}

		const model = $models.find((m) => m.id === selectedModels[0]);
		if (model && model?.info?.meta?.toolIds) {
			selectedToolIds = [
				...new Set(
					[...(model?.info?.meta?.toolIds ?? [])].filter((id) => $tools.find((t) => t.id === id))
				)
			];
		} else {
			selectedToolIds = [];
		}
	};

	const showMessage = async (message) => {
		await tick();

		const _chatId = JSON.parse(JSON.stringify($chatId));
		let _messageId = JSON.parse(JSON.stringify(message.id));

		let messageChildrenIds = [];
		if (_messageId === null) {
			messageChildrenIds = Object.keys(history.messages).filter(
				(id) => history.messages[id].parentId === null
			);
		} else {
			messageChildrenIds = history.messages[_messageId].childrenIds;
		}

		while (messageChildrenIds.length !== 0) {
			_messageId = messageChildrenIds.at(-1);
			messageChildrenIds = history.messages[_messageId].childrenIds;
		}

		history.currentId = _messageId;

		await tick();
		await tick();
		await tick();

		if ($settings?.scrollOnBranchChange ?? true) {
			const messageElement = document.getElementById(`message-${message.id}`);
			if (messageElement) {
				messageElement.scrollIntoView({ behavior: 'smooth' });
			}
		}

		await tick();
		saveChatHandler(_chatId, history);
	};

	const chatEventHandler = async (event, cb) => {
		console.log(event);

		if (event.chat_id === $chatId) {
			await tick();
			let message = history.messages[event.message_id];

			if (message) {
				const type = event?.data?.type ?? null;
				const data = event?.data?.data ?? null;

				if (type === 'status') {
					if (message?.statusHistory) {
						message.statusHistory.push(data);
					} else {
						message.statusHistory = [data];
					}
				} else if (type === 'chat:completion') {
					chatCompletionEventHandler(data, message, event.chat_id);
				} else if (type === 'chat:message:delta' || type === 'message') {
					message.content += data.content;
				} else if (type === 'chat:message' || type === 'replace') {
					message.content = data.content;
				} else if (type === 'chat:message:files' || type === 'files') {
					message.files = data.files;
				} else if (type === 'chat:message:follow_ups') {
					message.followUps = data.follow_ups;

					if (autoScroll) {
						scrollToBottom('smooth');
					}
				} else if (type === 'chat:title') {
					chatTitle.set(data);
					currentChatPage.set(1);
					await chats.set(await getChatList(localStorage.token, $currentChatPage));
				} else if (type === 'chat:tags') {
					chat = await getChatById(localStorage.token, $chatId);
					allTags.set(await getAllTags(localStorage.token));
				} else if (type === 'source' || type === 'citation') {
					if (data?.type === 'code_execution') {
						// Code execution; update existing code execution by ID, or add new one.
						if (!message?.code_executions) {
							message.code_executions = [];
						}

						const existingCodeExecutionIndex = message.code_executions.findIndex(
							(execution) => execution.id === data.id
						);

						if (existingCodeExecutionIndex !== -1) {
							message.code_executions[existingCodeExecutionIndex] = data;
						} else {
							message.code_executions.push(data);
						}

						message.code_executions = message.code_executions;
					} else {
						// Regular source.
						if (message?.sources) {
							message.sources.push(data);
						} else {
							message.sources = [data];
						}
					}
				} else if (type === 'notification') {
					const toastType = data?.type ?? 'info';
					const toastContent = data?.content ?? '';

					if (toastType === 'success') {
						toast.success(toastContent);
					} else if (toastType === 'error') {
						toast.error(toastContent);
					} else if (toastType === 'warning') {
						toast.warning(toastContent);
					} else {
						toast.info(toastContent);
					}
				} else if (type === 'confirmation') {
					eventCallback = cb;

					eventConfirmationInput = false;
					showEventConfirmation = true;

					eventConfirmationTitle = data.title;
					eventConfirmationMessage = data.message;
				} else if (type === 'execute') {
					eventCallback = cb;

					try {
						// Use Function constructor to evaluate code in a safer way
						const asyncFunction = new Function(`return (async () => { ${data.code} })()`);
						const result = await asyncFunction(); // Await the result of the async function

						if (cb) {
							cb(result);
						}
					} catch (error) {
						console.error('Error executing code:', error);
					}
				} else if (type === 'input') {
					eventCallback = cb;

					eventConfirmationInput = true;
					showEventConfirmation = true;

					eventConfirmationTitle = data.title;
					eventConfirmationMessage = data.message;
					eventConfirmationInputPlaceholder = data.placeholder;
					eventConfirmationInputValue = data?.value ?? '';
				} else {
					console.log('Unknown message type', data);
				}

				history.messages[event.message_id] = message;
			}
		}
	};

	const onMessageHandler = async (event: {
		origin: string;
		data: { type: string; text: string };
	}) => {
		if (event.origin !== window.origin) {
			return;
		}

		// Replace with your iframe's origin
		if (event.data.type === 'input:prompt') {
			console.debug(event.data.text);

			const inputElement = document.getElementById('chat-input');

			if (inputElement) {
				messageInput?.setText(event.data.text);
				inputElement.focus();
			}
		}

		if (event.data.type === 'action:submit') {
			console.debug(event.data.text);

			if (prompt !== '') {
				await tick();
				submitPrompt(prompt);
			}
		}

		if (event.data.type === 'input:prompt:submit') {
			console.debug(event.data.text);

			if (event.data.text !== '') {
				await tick();
				submitPrompt(event.data.text);
			}
		}
	};

	let pageSubscribe = null;
	onMount(async () => {
		loading = true;
		console.log('mounted');
		window.addEventListener('message', onMessageHandler);
		$socket?.on('chat-events', chatEventHandler);

		pageSubscribe = page.subscribe(async (p) => {
			if (p.url.pathname === '/') {
				await tick();
				initNewChat();
			}
		});

		const storageChatInput = sessionStorage.getItem(
			`chat-input${chatIdProp ? `-${chatIdProp}` : ''}`
		);

		if (!chatIdProp) {
			loading = false;
			await tick();
		} else {
			// If there's a chatIdProp, the navigateHandler will handle setting loading = false
			// But let's ensure it gets called for frontend-only mode
			const isFrontendOnly = $config?.name?.includes('Custom API') || $config?.auth === false;
			if (isFrontendOnly) {
				console.log('🔧 Frontend-only mode: ensuring chat loads properly');
				await navigateHandler();
			}
		}

		if (storageChatInput) {
			prompt = '';
			messageInput?.setText('');

			files = [];
			selectedToolIds = [];
			selectedFilterIds = [];
			webSearchEnabled = false;
			imageGenerationEnabled = false;
			codeInterpreterEnabled = false;

			try {
				const input = JSON.parse(storageChatInput);

				if (!$temporaryChatEnabled) {
					messageInput?.setText(input.prompt);
					files = input.files;
					selectedToolIds = input.selectedToolIds;
					selectedFilterIds = input.selectedFilterIds;
					webSearchEnabled = input.webSearchEnabled;
					imageGenerationEnabled = input.imageGenerationEnabled;
					codeInterpreterEnabled = input.codeInterpreterEnabled;
				}
			} catch (e) {}
		}

		showControls.subscribe(async (value) => {
			if (controlPane && !$mobile) {
				try {
					if (value) {
						controlPaneComponent.openPane();
					} else {
						controlPane.collapse();
					}
				} catch (e) {
					// ignore
				}
			}

			if (!value) {
				showCallOverlay.set(false);
				showOverview.set(false);
				showArtifacts.set(false);
			}
		});

		const chatInput = document.getElementById('chat-input');
		chatInput?.focus();

		chats.subscribe(() => {});

		const id = $chatId || chatIdProp;
		if (id) {
			await loadChatHistoryOnce(id);
		}
	});

	onDestroy(() => {
		pageSubscribe();
		chatIdUnsubscriber?.();
		window.removeEventListener('message', onMessageHandler);
		$socket?.off('chat-events', chatEventHandler);
	});

	// File upload functions

	const uploadGoogleDriveFile = async (fileData) => {
		console.log('Starting uploadGoogleDriveFile with:', {
			id: fileData.id,
			name: fileData.name,
			url: fileData.url,
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		// Validate input
		if (!fileData?.id || !fileData?.name || !fileData?.url || !fileData?.headers?.Authorization) {
			throw new Error('Invalid file data provided');
		}

		const tempItemId = uuidv4();
		const fileItem = {
			type: 'file',
			file: '',
			id: null,
			url: fileData.url,
			name: fileData.name,
			collection_name: '',
			status: 'uploading',
			error: '',
			itemId: tempItemId,
			size: 0
		};

		try {
			files = [...files, fileItem];
			console.log('Processing web file with URL:', fileData.url);

			// Configure fetch options with proper headers
			const fetchOptions = {
				headers: {
					Authorization: fileData.headers.Authorization,
					Accept: '*/*'
				},
				method: 'GET'
			};

			// Attempt to fetch the file
			console.log('Fetching file content from Google Drive...');
			const fileResponse = await fetch(fileData.url, fetchOptions);

			if (!fileResponse.ok) {
				const errorText = await fileResponse.text();
				throw new Error(`Failed to fetch file (${fileResponse.status}): ${errorText}`);
			}

			// Get content type from response
			const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream';
			console.log('Response received with content-type:', contentType);

			// Convert response to blob
			console.log('Converting response to blob...');
			const fileBlob = await fileResponse.blob();

			if (fileBlob.size === 0) {
				throw new Error('Retrieved file is empty');
			}

			console.log('Blob created:', {
				size: fileBlob.size,
				type: fileBlob.type || contentType
			});

			// Create File object with proper MIME type
			const file = new File([fileBlob], fileData.name, {
				type: fileBlob.type || contentType
			});

			console.log('File object created:', {
				name: file.name,
				size: file.size,
				type: file.type
			});

			if (file.size === 0) {
				throw new Error('Created file is empty');
			}

			// If the file is an audio file, provide the language for STT.
			let metadata = null;
			if (
				(file.type.startsWith('audio/') || file.type.startsWith('video/')) &&
				$settings?.audio?.stt?.language
			) {
				metadata = {
					language: $settings?.audio?.stt?.language
				};
			}

			// Upload file to server
			console.log('Uploading file to server...');
			const uploadedFile = await uploadFile(localStorage.token, file, metadata);

			if (!uploadedFile) {
				throw new Error('Server returned null response for file upload');
			}

			console.log('File uploaded successfully:', uploadedFile);

			// Update file item with upload results
			fileItem.status = 'uploaded';
			fileItem.file = uploadedFile;
			fileItem.id = uploadedFile.id;
			fileItem.size = file.size;
			fileItem.collection_name = uploadedFile?.meta?.collection_name;
			fileItem.url = `${WEBUI_API_BASE_URL}/files/${uploadedFile.id}`;

			files = files;
			toast.success($i18n.t('File uploaded successfully'));
		} catch (e) {
			console.error('Error uploading file:', e);
			files = files.filter((f) => f.itemId !== tempItemId);
			toast.error(
				$i18n.t('Error uploading file: {{error}}', {
					error: e.message || 'Unknown error'
				})
			);
		}
	};

	const uploadWeb = async (url) => {
		console.log(url);

		const fileItem = {
			type: 'doc',
			name: url,
			collection_name: '',
			status: 'uploading',
			url: url,
			error: ''
		};

		try {
			files = [...files, fileItem];
			const res = await processWeb(localStorage.token, '', url);

			if (res) {
				fileItem.status = 'uploaded';
				fileItem.collection_name = res.collection_name;
				fileItem.file = {
					...res.file,
					...fileItem.file
				};

				files = files;
			}
		} catch (e) {
			// Remove the failed doc from the files array
			files = files.filter((f) => f.name !== url);
			toast.error(JSON.stringify(e));
		}
	};

	const uploadYoutubeTranscription = async (url) => {
		console.log(url);

		const fileItem = {
			type: 'doc',
			name: url,
			collection_name: '',
			status: 'uploading',
			context: 'full',
			url: url,
			error: ''
		};

		try {
			files = [...files, fileItem];
			const res = await processYoutubeVideo(localStorage.token, url);

			if (res) {
				fileItem.status = 'uploaded';
				fileItem.collection_name = res.collection_name;
				fileItem.file = {
					...res.file,
					...fileItem.file
				};
				files = files;
			}
		} catch (e) {
			// Remove the failed doc from the files array
			files = files.filter((f) => f.name !== url);
			toast.error(`${e}`);
		}
	};

	//////////////////////////
	// Web functions
	//////////////////////////

	const initNewChat = async () => {
		if ($user?.role !== 'admin' && $user?.permissions?.chat?.temporary_enforced) {
			await temporaryChatEnabled.set(true);
		}

		// Simplified model setup - always use static model
		selectedModels = ['static-model'];
		console.log('Using static model configuration:', selectedModels);

		await showControls.set(false);
		await showCallOverlay.set(false);
		await showOverview.set(false);
		await showArtifacts.set(false);

		if ($page.url.pathname.includes('/c/')) {
			window.history.replaceState(history.state, '', `/`);
		}

		autoScroll = true;

		resetInput();
		await chatId.set('');
		await chatTitle.set('');

		history = {
			messages: {},
			currentId: null
		};

		chatFiles = [];
		params = {};
		chatHistory = [];
		// Reset chat history loading tracking
		loadingChatHistory = false;
		lastLoadedChatId = '';

		// Clear any integrated chat history from the history object
		history = {
			messages: {},
			currentId: null
		}; // Clear chat history for new chat

		if ($page.url.searchParams.get('youtube')) {
			uploadYoutubeTranscription(
				`https://www.youtube.com/watch?v=${$page.url.searchParams.get('youtube')}`
			);
		}

		if ($page.url.searchParams.get('load-url')) {
			await uploadWeb($page.url.searchParams.get('load-url'));
		}

		if ($page.url.searchParams.get('web-search') === 'true') {
			webSearchEnabled = true;
		}

		if ($page.url.searchParams.get('image-generation') === 'true') {
			imageGenerationEnabled = true;
		}

		if ($page.url.searchParams.get('code-interpreter') === 'true') {
			codeInterpreterEnabled = true;
		}

		if ($page.url.searchParams.get('tools')) {
			selectedToolIds = $page.url.searchParams
				.get('tools')
				?.split(',')
				.map((id) => id.trim())
				.filter((id) => id);
		} else if ($page.url.searchParams.get('tool-ids')) {
			selectedToolIds = $page.url.searchParams
				.get('tool-ids')
				?.split(',')
				.map((id) => id.trim())
				.filter((id) => id);
		}

		if ($page.url.searchParams.get('call') === 'true') {
			showCallOverlay.set(true);
			showControls.set(true);
		}

		if ($page.url.searchParams.get('q')) {
			const q = $page.url.searchParams.get('q') ?? '';
			messageInput?.setText(q);

			if (q) {
				if (($page.url.searchParams.get('submit') ?? 'true') === 'true') {
					await tick();
					submitPrompt(q);
				}
			}
		}

		// Model filtering removed - using static model
		selectedModels = ['static-model'];

		const userSettings = await getUserSettings(localStorage.token);

		if (userSettings) {
			settings.set(userSettings.ui);
		} else {
			settings.set(JSON.parse(localStorage.getItem('settings') ?? '{}'));
		}

		const chatInput = document.getElementById('chat-input');
		setTimeout(() => chatInput?.focus(), 0);
	};

	const loadChat = async () => {
		chatId.set(chatIdProp);

		if ($temporaryChatEnabled) {
			temporaryChatEnabled.set(false);
		}

		chat = await getChatById(localStorage.token, $chatId).catch(async (error) => {
			// Do not navigate away here; allow caller to treat id as a chatbot id
			return null;
		});

		if (chat) {
			console.log('🔍 Chat loaded for chatId:', $chatId, chat);
			tags = await getTagsById(localStorage.token, $chatId).catch(async (error) => {
				return [];
			});

			const chatContent = chat.chat;

			if (chatContent) {
				console.log('🔍 Chat content:', chatContent);

				selectedModels =
					(chatContent?.models ?? undefined) !== undefined
						? chatContent.models
						: [chatContent.models ?? ''];

				if (!($user?.role === 'admin' || ($user?.permissions?.chat?.multiple_models ?? true))) {
					selectedModels = selectedModels.length > 0 ? [selectedModels[0]] : [''];
				}

				oldSelectedModelIds = selectedModels;

				history =
					(chatContent?.history ?? undefined) !== undefined
						? chatContent.history
						: convertMessagesToHistory(chatContent.messages);

				chatTitle.set(chatContent.title);

				// Load chat history immediately when chat is loaded
				console.log('🔄 Loading chat history for chatId:', $chatId);
				await loadChatHistoryOnce($chatId);
				console.log('🔍 After loadChatHistoryOnce - chatHistory length:', chatHistory?.length || 0);

				// Force immediate integration after loading chat history
				await tick();
				if (chatHistory && chatHistory.length > 0) {
					console.log('🔄 Force integrating chat history immediately after load');
					history = integrateChatHistoryIntoMessages(chatHistory, history);
					integratedChatId = $chatId;
					console.log('✅ Force integration complete - history now has', Object.keys(history.messages).length, 'messages');
				}

				const userSettings = await getUserSettings(localStorage.token);

				if (userSettings) {
					await settings.set(userSettings.ui);
				} else {
					await settings.set(JSON.parse(localStorage.getItem('settings') ?? '{}'));
				}

				params = chatContent?.params ?? {};
				chatFiles = chatContent?.files ?? [];

				autoScroll = true;
				await tick();

				if (history.currentId) {
					for (const message of Object.values(history.messages)) {
						if (message.role === 'assistant') {
							message.done = true;
						}
					}
				}

				const taskRes = await getTaskIdsByChatId(localStorage.token, $chatId).catch((error) => {
					return null;
				});

				if (taskRes) {
					taskIds = taskRes.task_ids;
				}

				await tick();

				return true;
			} else {
				return null;
			}
		}
	};

	const scrollToBottom = async (behavior = 'auto') => {
		await tick();
		if (messagesContainerElement) {
			messagesContainerElement.scrollTo({
				top: messagesContainerElement.scrollHeight,
				behavior
			});
		}
	};
	const chatCompletedHandler = async (chatId, modelId, responseMessageId, messages) => {
		const res = await chatCompleted(localStorage.token, {
			model: modelId,
			messages: messages.map((m) => ({
				id: m.id,
				role: m.role,
				content: m.content,
				info: m.info ? m.info : undefined,
				timestamp: m.timestamp,
				...(m.usage ? { usage: m.usage } : {}),
				...(m.sources ? { sources: m.sources } : {})
			})),
			filter_ids: selectedFilterIds.length > 0 ? selectedFilterIds : undefined,
			model_item: $models.find((m) => m.id === modelId),
			chat_id: chatId,
			session_id: $socket?.id,
			id: responseMessageId
		}).catch((error) => {
			toast.error(`${error}`);
			messages.at(-1).error = { content: error };

			return null;
		});

		if (res !== null && res.messages) {
			// Update chat history with the new messages
			for (const message of res.messages) {
				if (message?.id) {
					// Add null check for message and message.id
					history.messages[message.id] = {
						...history.messages[message.id],
						...(history.messages[message.id].content !== message.content
							? { originalContent: history.messages[message.id].content }
							: {}),
						...message
					};
				}
			}
		}

		await tick();

		if ($chatId == chatId) {
			if (!$temporaryChatEnabled) {
				chat = await updateChatById(localStorage.token, chatId, {
					models: selectedModels,
					messages: messages,
					history: history,
					params: params,
					files: chatFiles
				});

				currentChatPage.set(1);
				await chats.set(await getChatList(localStorage.token, $currentChatPage));
			}
		}

		taskIds = null;
	};

	const chatActionHandler = async (chatId, actionId, modelId, responseMessageId, event = null) => {
		const messages = createMessagesList(history, responseMessageId);

		const res = await chatAction(localStorage.token, actionId, {
			model: modelId,
			messages: messages.map((m) => ({
				id: m.id,
				role: m.role,
				content: m.content,
				info: m.info ? m.info : undefined,
				timestamp: m.timestamp,
				...(m.sources ? { sources: m.sources } : {})
			})),
			...(event ? { event: event } : {}),
			model_item: $models.find((m) => m.id === modelId),
			chat_id: chatId,
			session_id: $socket?.id,
			id: responseMessageId
		}).catch((error) => {
			toast.error(`${error}`);
			messages.at(-1).error = { content: error };
			return null;
		});

		if (res !== null && res.messages) {
			// Update chat history with the new messages
			for (const message of res.messages) {
				history.messages[message.id] = {
					...history.messages[message.id],
					...(history.messages[message.id].content !== message.content
						? { originalContent: history.messages[message.id].content }
						: {}),
					...message
				};
			}
		}

		if ($chatId == chatId) {
			if (!$temporaryChatEnabled) {
				chat = await updateChatById(localStorage.token, chatId, {
					models: selectedModels,
					messages: messages,
					history: history,
					params: params,
					files: chatFiles
				});

				currentChatPage.set(1);
				await chats.set(await getChatList(localStorage.token, $currentChatPage));
			}
		}
	};

	const getChatEventEmitter = async (modelId: string, chatId: string = '') => {
		return setInterval(() => {
			$socket?.emit('usage', {
				action: 'chat',
				model: modelId,
				chat_id: chatId
			});
		}, 1000);
	};

	const createMessagePair = async (userPrompt) => {
		messageInput?.setText('');
		// Using static model - no validation needed
		const modelId = 'static-model';
		const model = { id: 'static-model', name: 'Static Model' }; // Mock model object

		const messages = createMessagesList(history, history.currentId);
		const parentMessage = messages.length !== 0 ? messages.at(-1) : null;

		const userMessageId = uuidv4();
		const responseMessageId = uuidv4();

		const userMessage = {
			id: userMessageId,
			parentId: parentMessage ? parentMessage.id : null,
			childrenIds: [responseMessageId],
			role: 'user',
			content: userPrompt ? userPrompt : `[PROMPT] ${userMessageId}`,
			timestamp: Math.floor(Date.now() / 1000)
		};

		const responseMessage = {
			id: responseMessageId,
			parentId: userMessageId,
			childrenIds: [],
			role: 'assistant',
			content: `[RESPONSE] ${responseMessageId}`,
			done: true,

			model: modelId,
			modelName: model.name ?? model.id,
			modelIdx: 0,
			timestamp: Math.floor(Date.now() / 1000)
		};

		if (parentMessage) {
			parentMessage.childrenIds.push(userMessageId);
			history.messages[parentMessage.id] = parentMessage;
		}
		history.messages[userMessageId] = userMessage;
		history.messages[responseMessageId] = responseMessage;

		history.currentId = responseMessageId;

		await tick();

		if (autoScroll) {
			scrollToBottom();
		}

		if (messages.length === 0) {
			await initChatHandler(history);
		} else {
			await saveChatHandler($chatId, history);
		}
	};

	const addMessages = async ({ modelId, parentId, messages }) => {
		const model = $models.filter((m) => m.id === modelId).at(0);

		let parentMessage = history.messages[parentId];
		let currentParentId = parentMessage ? parentMessage.id : null;
		for (const message of messages) {
			let messageId = uuidv4();

			if (message.role === 'user') {
				const userMessage = {
					id: messageId,
					parentId: currentParentId,
					childrenIds: [],
					timestamp: Math.floor(Date.now() / 1000),
					...message
				};

				if (parentMessage) {
					parentMessage.childrenIds.push(messageId);
					history.messages[parentMessage.id] = parentMessage;
				}

				history.messages[messageId] = userMessage;
				parentMessage = userMessage;
				currentParentId = messageId;
			} else {
				const responseMessage = {
					id: messageId,
					parentId: currentParentId,
					childrenIds: [],
					done: true,
					model: model.id,
					modelName: model.name ?? model.id,
					modelIdx: 0,
					timestamp: Math.floor(Date.now() / 1000),
					...message
				};

				if (parentMessage) {
					parentMessage.childrenIds.push(messageId);
					history.messages[parentMessage.id] = parentMessage;
				}

				history.messages[messageId] = responseMessage;
				parentMessage = responseMessage;
				currentParentId = messageId;
			}
		}

		history.currentId = currentParentId;
		await tick();

		if (autoScroll) {
			scrollToBottom();
		}

		if (messages.length === 0) {
			await initChatHandler(history);
		} else {
			await saveChatHandler($chatId, history);
		}
	};

	const chatCompletionEventHandler = async (data, message, chatId) => {
		const { id, done, choices, content, sources, selected_model_id, error, usage } = data;

		if (error) {
			await handleOpenAIError(error, message);
		}

		if (sources) {
			message.sources = sources;
		}

		if (choices) {
			if (choices[0]?.message?.content) {
				// Non-stream response
				message.content += choices[0]?.message?.content;
			} else {
				// Stream response
				let value = choices[0]?.delta?.content ?? '';
				if (message.content == '' && value == '\n') {
					console.log('Empty response');
				} else {
					message.content += value;

					if (navigator.vibrate && ($settings?.hapticFeedback ?? false)) {
						navigator.vibrate(5);
					}

					// Emit chat event for TTS
					const messageContentParts = getMessageContentParts(
						removeAllDetails(message.content),
						$config?.audio?.tts?.split_on ?? 'punctuation'
					);
					messageContentParts.pop();

					// dispatch only last sentence and make sure it hasn't been dispatched before
					if (
						messageContentParts.length > 0 &&
						messageContentParts[messageContentParts.length - 1] !== message.lastSentence
					) {
						message.lastSentence = messageContentParts[messageContentParts.length - 1];
						eventTarget.dispatchEvent(
							new CustomEvent('chat', {
								detail: {
									id: message.id,
									content: messageContentParts[messageContentParts.length - 1]
								}
							})
						);
					}
				}
			}
		}

		if (content) {
			// REALTIME_CHAT_SAVE is disabled
			message.content = content;

			if (navigator.vibrate && ($settings?.hapticFeedback ?? false)) {
				navigator.vibrate(5);
			}

			// Emit chat event for TTS
			const messageContentParts = getMessageContentParts(
				removeAllDetails(message.content),
				$config?.audio?.tts?.split_on ?? 'punctuation'
			);
			messageContentParts.pop();

			// dispatch only last sentence and make sure it hasn't been dispatched before
			if (
				messageContentParts.length > 0 &&
				messageContentParts[messageContentParts.length - 1] !== message.lastSentence
			) {
				message.lastSentence = messageContentParts[messageContentParts.length - 1];
				eventTarget.dispatchEvent(
					new CustomEvent('chat', {
						detail: {
							id: message.id,
							content: messageContentParts[messageContentParts.length - 1]
						}
					})
				);
			}
		}

		if (selected_model_id) {
			message.selectedModelId = selected_model_id;
			message.arena = true;
		}

		if (usage) {
			message.usage = usage;
		}

		history.messages[message.id] = message;

		if (done) {
			message.done = true;

			if ($settings.responseAutoCopy) {
				copyToClipboard(message.content);
			}

			if ($settings.responseAutoPlayback && !$showCallOverlay) {
				await tick();
				document.getElementById(`speak-button-${message.id}`)?.click();
			}

			// Emit chat event for TTS
			let lastMessageContentPart =
				getMessageContentParts(
					removeAllDetails(message.content),
					$config?.audio?.tts?.split_on ?? 'punctuation'
				)?.at(-1) ?? '';
			if (lastMessageContentPart) {
				eventTarget.dispatchEvent(
					new CustomEvent('chat', {
						detail: { id: message.id, content: lastMessageContentPart }
					})
				);
			}
			eventTarget.dispatchEvent(
				new CustomEvent('chat:finish', {
					detail: {
						id: message.id,
						content: message.content
					}
				})
			);

			history.messages[message.id] = message;
			await chatCompletedHandler(
				chatId,
				message.model,
				message.id,
				createMessagesList(history, message.id)
			);
		}

		console.log(data);
		if (autoScroll) {
			scrollToBottom();
		}
	};

	//////////////////////////
	// Chat functions
	//////////////////////////

	const submitPrompt = async (userPrompt, { _raw = false } = {}) => {
		console.log('submitPrompt', userPrompt, $chatId);

		const messages = createMessagesList(history, history.currentId);
		// Model validation removed - using static model
		selectedModels = ['static-model'];

		if (userPrompt === '' && files.length === 0) {
			toast.error($i18n.t('Please enter a prompt'));
			return;
		}
		// Model validation removed - using static model

		if (messages.length != 0 && messages.at(-1).done != true) {
			// Response not done
			return;
		}
		if (messages.length != 0 && messages.at(-1).error && !messages.at(-1).content) {
			// Error in response
			toast.error($i18n.t(`Oops! There was an error in the previous response.`));
			return;
		}
		if (
			files.length > 0 &&
			files.filter((file) => file.type !== 'image' && file.status === 'uploading').length > 0
		) {
			toast.error(
				$i18n.t(`Oops! There are files still uploading. Please wait for the upload to complete.`)
			);
			return;
		}
		if (
			($config?.file?.max_count ?? null) !== null &&
			files.length + chatFiles.length > $config?.file?.max_count
		) {
			toast.error(
				$i18n.t(`You can only chat with a maximum of {{maxCount}} file(s) at a time.`, {
					maxCount: $config?.file?.max_count
				})
			);
			return;
		}

		messageInput?.setText('');

		// Reset chat input textarea
		if (!($settings?.richTextInput ?? true)) {
			const chatInputElement = document.getElementById('chat-input');

			if (chatInputElement) {
				await tick();
				chatInputElement.style.height = '';
			}
		}

		const _files = JSON.parse(JSON.stringify(files));
		chatFiles.push(..._files.filter((item) => ['doc', 'file', 'collection'].includes(item.type)));
		chatFiles = chatFiles.filter(
			// Remove duplicates
			(item, index, array) =>
				array.findIndex((i) => JSON.stringify(i) === JSON.stringify(item)) === index
		);

		files = [];
		messageInput?.setText('');

		// Create user message
		let userMessageId = uuidv4();
		let userMessage = {
			id: userMessageId,
			parentId: messages.length !== 0 ? messages.at(-1).id : null,
			childrenIds: [],
			role: 'user',
			content: userPrompt,
			files: _files.length > 0 ? _files : undefined,
			timestamp: Math.floor(Date.now() / 1000), // Unix epoch
			models: selectedModels
		};

		// Add message to history and Set currentId to messageId
		history.messages[userMessageId] = userMessage;
		history.currentId = userMessageId;

		// Append messageId to childrenIds of parent message
		if (messages.length !== 0) {
			history.messages[messages.at(-1).id].childrenIds.push(userMessageId);
		}

		// focus on chat input
		const chatInput = document.getElementById('chat-input');
		chatInput?.focus();

		// Session storage removed - using static model

		await sendPrompt(history, userPrompt, userMessageId, { newChat: true });
	};

	const sendPromptToCustomAPI = async (prompt: string) => {
		console.log('🔄 Intercepting chat request for custom API');

		try {
			// Create response message
			const responseMessageId = uuidv4();
			const responseMessage = {
				id: responseMessageId,
				parentId: history.currentId,
				childrenIds: [],
				role: 'assistant',
				content: '',
				timestamp: Math.floor(Date.now() / 1000),
				models: ['custom-api'],
				done: false
			};

			// Add response message to history
			history.messages[responseMessageId] = responseMessage;
			history.messages[history.currentId].childrenIds.push(responseMessageId);
			history.currentId = responseMessageId;
			history = history;

			// Scroll to bottom
			await tick();
			if (autoScroll) {
				scrollToBottom();
			}

			console.log('🚀 Sending message to chat API with chat ID:', $chatId);
			console.log('🔧 API Base URL:', import.meta.env.VITE_API_BASE_URL);

				// If we're in chatbot mode (?bot=1), ensure a real chat exists before sending
				try {
					const forceChatbot = $page?.url?.searchParams?.get('bot') === '1';
					if (forceChatbot) {
						const routeId = chatIdProp; // this is the chatbot id from the URL
						if (!$chatId || $chatId === routeId) {
							console.log('🧩 No real chat yet for bot; creating chat via API for chatbot:', routeId);
							// Resolve numeric primary key for chatbot (backend requires pk, not uid)
							let chatbotPk = null;
							try {
								if (!currentBot) {
									const fetchedBot = await getChatbot(routeId).catch(() => null);
									currentBot = fetchedBot?.data ?? fetchedBot?.response ?? fetchedBot?.result ?? fetchedBot;
								}
								let maybeId = currentBot?.id;
								if (typeof maybeId === 'number') {
									chatbotPk = maybeId;
								} else if (typeof maybeId === 'string' && /^\d+$/.test(maybeId)) {
									chatbotPk = Number(maybeId);
								}
								if (chatbotPk === null) {
									const list = await getChatbots({ page_size: 50 }).catch(() => null);
									const items = Array.isArray(list?.results)
										? list.results
										: Array.isArray(list?.records)
										? list.records
										: Array.isArray(list?.data?.results)
										? list.data.results
										: Array.isArray(list?.data?.records)
										? list.data.records
										: Array.isArray(list)
										? list
										: [];
									const found = items.find((it) => String(it?.uid ?? it?.id) === String(routeId));
									if (found && (typeof found.id === 'number' || /^\d+$/.test(String(found.id)))) {
										chatbotPk = Number(found.id);
									}
								}
							} catch {}
							// If numeric pk not available, fall back to UID; backend may accept chatbot_uid
							const chatbotIdentifier = chatbotPk === null ? String(routeId) : String(chatbotPk);
							const created = await createChatViaAPI(localStorage.getItem('token') || '', chatbotIdentifier);
							if (created?.success && created?.chat) {
								chatId.set(created.chat);
								try { history.replaceState(null, '', `/c/${created.chat}`); } catch {}
								console.log('✅ Created chat for bot. New chat id:', created.chat);
							} else {
								console.warn('⚠️ Failed to create chat for chatbot', created);
								toast.error('Could not start chat for this bot.');
								return;
							}
						}
					}
				} catch (err) {
					console.error('❌ Error ensuring chat for chatbot:', err);
					toast.error('Failed to start chat for this bot');
					return;
				}

			console.log('🔑 Token exists:', !!localStorage.getItem('token'));

			// Run comprehensive API test to diagnose issues
			console.log('🧪 Running API diagnostics...');
			await testChatAPI();

			// Build an effective prompt using chatbot persona/guardrails when in bot mode
			let effectivePrompt = prompt;
			try {
				const inBotMode = ($page?.url?.searchParams?.get('bot') === '1') || !!currentBot;
				if (inBotMode && currentBot) {
					// Keep the original user prompt for display
					effectivePrompt = prompt;

					// Add bot persona as system context (this will be handled separately in the API call)
					const personaParts: string[] = [];
					if (currentBot?.name) personaParts.push(`Name: ${currentBot.name}`);
					if (currentBot?.bot_role) personaParts.push(`Role: ${currentBot.bot_role}`);
					if (currentBot?.description) personaParts.push(`Description: ${currentBot.description}`);
					if (currentBot?.instructions) personaParts.push(`Instructions: ${currentBot.instructions}`);
					const personaText = personaParts.join('\n');
					const guardrail = 'You must strictly stay within the bot\'s described domain. If the user asks for topics outside this scope (e.g., different programming languages if you are a Python tutor), politely refuse and steer them back to the supported scope.';

					// Store the system context for use in API calls
					window.currentBotSystemContext = `System:\n${personaText}\n\nPolicy: ${guardrail}`;
				}
			} catch {}
			// Call the new chat API with the specific chat ID
			const response = await sendChatMessage($chatId, effectivePrompt);

			console.log('📥 Raw API response:', response);

			if (!response) {
				throw new Error('Failed to get response from API - response is null/undefined. Check console for detailed error logs.');
			}

			console.log('📥 Chat API response:', response);

			// Parse the response based on your API's format
			let responseContent = 'No response from API';

			if (response.success && response.response !== undefined) {
				// Your API response format
				responseContent = response.response || 'Empty response';
			} else if (response.choices && response.choices.length > 0 && response.choices[0].message) {
				// OpenAI-style response format
				responseContent = response.choices[0].message.content || 'Empty response';
			} else if (response.content) {
				// Alternative content field
				responseContent = response.content;
			} else if (typeof response === 'string') {
				// Direct string response
				responseContent = response;
			}

			console.log('📝 Parsed response content:', responseContent);

			// Update the response message with the API response
			history.messages[responseMessageId].content = responseContent;
			history.messages[responseMessageId].done = true;
			history = history;

			// Scroll to bottom
			await tick();
			if (autoScroll) {
				scrollToBottom();
			}

		} catch (error) {
			console.error('❌ Error calling custom API:', error);

			// Update response message with error
			if (history.messages[history.currentId]) {
				history.messages[history.currentId].content = `Error: ${error.message}`;
				history.messages[history.currentId].done = true;
				history.messages[history.currentId].error = true;
				history = history;
			}

			toast.error(`Failed to get response: ${error.message}`);
		}
	};

// 	const sendPromptToCustomAPI = async (prompt: string) => {
// 	console.log('🔄 Intercepting chat request for custom API');

// 	try {
// 		const responseMessageId = uuidv4();
// 		const responseMessage = {
// 			id: responseMessageId,
// 			parentId: history.currentId,
// 			childrenIds: [],
// 			role: 'assistant',
// 			content: '',
// 			timestamp: Math.floor(Date.now() / 1000),
// 			models: ['custom-api'],
// 			done: false
// 		};

// 		history.messages[responseMessageId] = responseMessage;
// 		history.messages[history.currentId].childrenIds.push(responseMessageId);
// 		history.currentId = responseMessageId;
// 		history = history;

// 		await tick();
// 		if (autoScroll) scrollToBottom();

// 		console.log('🚀 Sending message to chat API with chat ID:', $chatId);
// 		await testChatAPI();

// 		// Use a buffer to collect streamed tokens
// 		let responseContent = '';

// 		const response = await sendChatMessage($chatId, prompt, (token: string) => {
// 			responseContent += token;

// 			// Optionally update UI in real-time:
// 			history.messages[responseMessageId].content = responseContent;
// 			history = history;

// 			if (autoScroll) scrollToBottom();
// 		});

// 		console.log('📥 Raw API response:', response);

// 		if (!response) {
// 			throw new Error('Failed to get response from API - response is null/undefined. Check console for detailed error logs.');
// 		}

// 		console.log('📝 Final response content:', responseContent);

// 		history.messages[responseMessageId].done = true;
// 		history = history;

// 		await tick();
// 		if (autoScroll) scrollToBottom();

// 	} catch (error) {
// 		console.error('❌ Error calling custom API:', error);

// 		if (history.messages[history.currentId]) {
// 			history.messages[history.currentId].content = `Error: ${error.message}`;
// 			history.messages[history.currentId].done = true;
// 			history.messages[history.currentId].error = true;
// 			history = history;
// 		}

// 		toast.error(`Failed to get response: ${error.message}`);
// 	}
// };


	// Streaming version of the custom API function
	const sendPromptToCustomAPIStreaming = async (prompt: string) => {
		console.log('🔄 Intercepting chat request for custom API (Streaming)');

		try {
			// Create response message
			const responseMessageId = uuidv4();
			const responseMessage = {
				id: responseMessageId,
				parentId: history.currentId,
				childrenIds: [],
				role: 'assistant',
				content: '',
				timestamp: Math.floor(Date.now() / 1000),
				models: ['custom-api'],
				done: false,
				streaming: true
			};

			// Add response message to history
			history.messages[responseMessageId] = responseMessage;
			history.messages[history.currentId].childrenIds.push(responseMessageId);
			history.currentId = responseMessageId;
			history = history;

			// Scroll to bottom
			await tick();
			if (autoScroll) {
				scrollToBottom();
			}

			console.log('🚀 Starting streaming chat with chat ID:', $chatId);

			// Use the streaming API
			await streamChatMessage($chatId, prompt, {
				onStart: () => {
					console.log('📡 Stream started');
					responseMessage.streaming = true;
					history.messages[responseMessageId] = responseMessage;
					history = history;
				},
				onChunk: (chunk) => {
					console.log('📥 Received chunk:', chunk);
					// Update message content in real-time
					responseMessage.content += chunk;
					history.messages[responseMessageId] = responseMessage;
					history = history;

					// Auto-scroll to bottom during streaming
					if (autoScroll) {
						setTimeout(scrollToBottom, 10);
					}
				},
				onComplete: (fullResponse) => {
					console.log('✅ Stream complete. Full response:', fullResponse);
					// Mark as complete
					responseMessage.done = true;
					responseMessage.streaming = false;
					history.messages[responseMessageId] = responseMessage;
					history = history;

					// Final scroll to bottom
					setTimeout(() => {
						if (autoScroll) {
							scrollToBottom();
						}
					}, 100);
				},
				onError: (error) => {
					console.error('❌ Streaming error:', error);
					// Handle error
					responseMessage.content = `Error: ${error.message}`;
					responseMessage.error = { content: error.message };
					responseMessage.done = true;
					responseMessage.streaming = false;
					history.messages[responseMessageId] = responseMessage;
					history = history;

					// Scroll to bottom on error
					setTimeout(() => {
						if (autoScroll) {
							scrollToBottom();
						}
					}, 100);
				}
			});

		} catch (error) {
			console.error('❌ Error setting up streaming:', error);

			// Update response message with error
			if (history.messages[history.currentId]) {
				history.messages[history.currentId].content = `Error: ${error.message}`;
				history.messages[history.currentId].done = true;
				history.messages[history.currentId].error = true;
				history.messages[history.currentId].streaming = false;
				history = history;
			}

			toast.error(`Failed to get response: ${error.message}`);
		}
	};

	const sendPrompt = async (
		_history,
		prompt: string,
		parentId: string,
		{ modelId = null, modelIdx = null, newChat = false } = {}
	) => {
		if (autoScroll) {
			scrollToBottom();
		}

		// Check if we're in frontend-only mode (Custom API)
		const isFrontendOnly = $config?.name?.includes('Custom API') || $config?.auth === false;

		console.log('🔧 sendPrompt called - config:', $config);
		console.log('🔧 isFrontendOnly:', isFrontendOnly);

		if (isFrontendOnly) {
			console.log('🔄 Frontend-only mode: using custom API handler');
			await sendPromptToCustomAPI(prompt);
			return;
		}

		console.log('🔧 Using original backend flow');

		// Force frontend-only mode for now
		console.log('🔄 Forcing frontend-only mode');

		// 🔄 STREAMING: To enable streaming, replace the line below with:
		// await sendPromptToCustomAPIStreaming(prompt);
		await sendPromptToCustomAPI(prompt);
		return;

		let _chatId = JSON.parse(JSON.stringify($chatId));
		_history = JSON.parse(JSON.stringify(_history));

		const responseMessageIds: Record<PropertyKey, string> = {};
		// If modelId is provided, use it, else use selected model
		let selectedModelIds = modelId ? [modelId] : selectedModels;

		// Create response messages for each selected model
		for (const [_modelIdx, modelId] of selectedModelIds.entries()) {
			const model = $models.filter((m) => m.id === modelId).at(0);

			if (model) {
				let responseMessageId = uuidv4();
				let responseMessage = {
					parentId: parentId,
					id: responseMessageId,
					childrenIds: [],
					role: 'assistant',
					content: '',
					model: model.id,
					modelName: model.name ?? model.id,
					modelIdx: modelIdx ? modelIdx : _modelIdx,
					timestamp: Math.floor(Date.now() / 1000) // Unix epoch
				};

				// Add message to history and Set currentId to messageId
				history.messages[responseMessageId] = responseMessage;
				history.currentId = responseMessageId;

				// Append messageId to childrenIds of parent message
				if (parentId !== null && history.messages[parentId]) {
					// Add null check before accessing childrenIds
					history.messages[parentId].childrenIds = [
						...history.messages[parentId].childrenIds,
						responseMessageId
					];
				}

				responseMessageIds[`${modelId}-${modelIdx ? modelIdx : _modelIdx}`] = responseMessageId;
			}
		}
		history = history;

		// Create new chat if newChat is true and first user message
		if (newChat && _history.messages[_history.currentId].parentId === null) {
			_chatId = await initChatHandler(_history);
		}

		await tick();

		_history = JSON.parse(JSON.stringify(history));
		// Save chat after all messages have been created
		await saveChatHandler(_chatId, _history);

		await Promise.all(
			selectedModelIds.map(async (modelId, _modelIdx) => {
				console.log('modelId', modelId);
				// For static model, create a mock model object
				let model = $models.filter((m) => m.id === modelId).at(0);

				if (!model && modelId === 'static-model') {
					// Create mock model for static-model
					model = {
						id: 'static-model',
						name: 'Static Model',
						info: {
							meta: {
								capabilities: {
									vision: true
								}
							}
						}
					};
				}

				if (model) {
					const messages = createMessagesList(_history, parentId);
					// If there are image files, check if model is vision capable
					const hasImages = messages.some((message) =>
						message.files?.some((file) => file.type === 'image')
					);

					if (hasImages && !(model.info?.meta?.capabilities?.vision ?? true)) {
						toast.error(
							$i18n.t('Model {{modelName}} is not vision capable', {
								modelName: model.name ?? model.id
							})
						);
					}

					let responseMessageId =
						responseMessageIds[`${modelId}-${modelIdx ? modelIdx : _modelIdx}`];
					const chatEventEmitter = await getChatEventEmitter(model.id, _chatId);

					scrollToBottom();
					await sendPromptSocket(_history, model, responseMessageId, _chatId);

					if (chatEventEmitter) clearInterval(chatEventEmitter);
				} else {
					toast.error($i18n.t(`Model {{modelId}} not found`, { modelId }));
				}
			})
		);

		currentChatPage.set(1);
		chats.set(await getChatList(localStorage.token, $currentChatPage));
	};

	const sendPromptSocket = async (_history, model, responseMessageId, _chatId) => {
		const chatMessages = createMessagesList(history, history.currentId);
		const responseMessage = _history.messages[responseMessageId];

		// Check if responseMessage exists before accessing its properties
		if (!responseMessage) {
			console.error('Response message not found:', responseMessageId);
			return;
		}

		const userMessage = _history.messages[responseMessage.parentId];

		const chatMessageFiles = chatMessages
			.filter((message) => message.files)
			.flatMap((message) => message.files);

		// Filter chatFiles to only include files that are in the chatMessageFiles
		chatFiles = chatFiles.filter((item) => {
			const fileExists = chatMessageFiles.some((messageFile) => messageFile.id === item.id);
			return fileExists;
		});

		let files = JSON.parse(JSON.stringify(chatFiles));
		files.push(
			...(userMessage?.files ?? []).filter((item) =>
				['doc', 'text', 'file', 'note', 'collection'].includes(item.type)
			)
		);
		// Remove duplicates
		files = files.filter(
			(item, index, array) =>
				array.findIndex((i) => JSON.stringify(i) === JSON.stringify(item)) === index
		);

		scrollToBottom();
		eventTarget.dispatchEvent(
			new CustomEvent('chat:start', {
				detail: {
					id: responseMessageId
				}
			})
		);
		await tick();

		const stream =
			model?.info?.params?.stream_response ??
			$settings?.params?.stream_response ??
			params?.stream_response ??
			true;

		let messages = [
			params?.system || $settings.system
				? {
						role: 'system',
						content: `${promptTemplate(
							params?.system ?? $settings?.system ?? '',
							$user?.name,
							$settings?.userLocation
								? await getAndUpdateUserLocation(localStorage.token).catch((err) => {
										console.error(err);
										return undefined;
									})
								: undefined
						)}`
					}
				: undefined,
			...createMessagesList(_history, responseMessageId).map((message) => ({
				...message,
				content: processDetails(message.content)
			}))
		].filter((message) => message);

		messages = messages
			.map((message, idx, arr) => ({
				role: message.role,
				...((message.files?.filter((file) => file.type === 'image').length > 0 ?? false) &&
				message.role === 'user'
					? {
							content: [
								{
									type: 'text',
									text: message?.merged?.content ?? message.content
								},
								...message.files
									.filter((file) => file.type === 'image')
									.map((file) => ({
										type: 'image_url',
										image_url: {
											url: file.url
										}
									}))
							]
						}
					: {
							content: message?.merged?.content ?? message.content
						})
			}))
			.filter((message) => message?.role === 'user' || message?.content?.trim());

		const res = await generateOpenAIChatCompletion(
			localStorage.token,
			{
				stream: stream,
				model: model.id,
				messages: messages,
				params: {
					...$settings?.params,
					...params,
					stop:
						(params?.stop ?? $settings?.params?.stop ?? undefined)
							? (params?.stop.split(',').map((token) => token.trim()) ?? $settings.params.stop).map(
									(str) => decodeURIComponent(JSON.parse('"' + str.replace(/\"/g, '\\"') + '"'))
								)
							: undefined
				},

				files: (files?.length ?? 0) > 0 ? files : undefined,

				filter_ids: selectedFilterIds.length > 0 ? selectedFilterIds : undefined,
				tool_ids: selectedToolIds.length > 0 ? selectedToolIds : undefined,
				tool_servers: $toolServers,

				features: {
					image_generation:
						$config?.features?.enable_image_generation &&
						($user?.role === 'admin' || $user?.permissions?.features?.image_generation)
							? imageGenerationEnabled
							: false,
					code_interpreter:
						$config?.features?.enable_code_interpreter &&
						($user?.role === 'admin' || $user?.permissions?.features?.code_interpreter)
							? codeInterpreterEnabled
							: false,
					web_search:
						$config?.features?.enable_web_search &&
						($user?.role === 'admin' || $user?.permissions?.features?.web_search)
							? webSearchEnabled || ($settings?.webSearch ?? false) === 'always'
							: false,
					memory: $settings?.memory ?? false
				},
				variables: {
					...getPromptVariables(
						$user?.name,
						$settings?.userLocation
							? await getAndUpdateUserLocation(localStorage.token).catch((err) => {
									console.error(err);
									return undefined;
								})
							: undefined
					)
				},
				model_item: $models.find((m) => m.id === model.id),

				session_id: $socket?.id,
				chat_id: $chatId,
				id: responseMessageId,

				background_tasks: {
					...(!$temporaryChatEnabled &&
					(messages.length == 1 ||
						(messages.length == 2 &&
							messages.at(0)?.role === 'system' &&
							messages.at(1)?.role === 'user')) &&
					(selectedModels[0] === model.id)
						? {
								title_generation: $settings?.title?.auto ?? true,
								tags_generation: $settings?.autoTags ?? true
							}
						: {}),
					follow_up_generation: $settings?.autoFollowUps ?? true
				},

				...(stream && (model.info?.meta?.capabilities?.usage ?? false)
					? {
							stream_options: {
								include_usage: true
							}
						}
					: {})
			},
			`${WEBUI_BASE_URL}/api`
		).catch(async (error) => {
			toast.error(`${error}`);

			responseMessage.error = {
				content: error
			};
			responseMessage.done = true;

			history.messages[responseMessageId] = responseMessage;
			history.currentId = responseMessageId;

			return null;
		});

		if (res) {
			if (res.error) {
				await handleOpenAIError(res.error, responseMessage);
			} else {
				if (taskIds) {
					taskIds.push(res.task_id);
				} else {
					taskIds = [res.task_id];
				}

				// Check for custom API response
				if (typeof window !== 'undefined' && (window as any).__customAPIResponse) {
					console.log('🎯 Processing custom API response directly');
					const customResponse = (window as any).__customAPIResponse;

					// Clear the stored response
					delete (window as any).__customAPIResponse;

					// Process the response directly
					if (customResponse.choices && customResponse.choices[0] && customResponse.choices[0].message) {
						const content = customResponse.choices[0].message.content;
						console.log('📝 Setting message content:', content);

						// Update the response message directly
						responseMessage.content = content;
						responseMessage.done = true;
						responseMessage.model = customResponse.model || 'qwen-3b-coder';

						// Update the history
						history.messages[responseMessageId] = responseMessage;
						history.currentId = responseMessageId;

						// Save the chat
						await saveChatHandler($chatId, history);

						console.log('✅ Custom response processed successfully');
					}
				}
			}
		}

		await tick();
		scrollToBottom();
	};

	const handleOpenAIError = async (error, responseMessage) => {
		let errorMessage = '';
		let innerError;

		if (error) {
			innerError = error;
		}

		console.error(innerError);
		if ('detail' in innerError) {
			// FastAPI error
			toast.error(innerError.detail);
			errorMessage = innerError.detail;
		} else if ('error' in innerError) {
			// OpenAI error
			if ('message' in innerError.error) {
				toast.error(innerError.error.message);
				errorMessage = innerError.error.message;
			} else {
				toast.error(innerError.error);
				errorMessage = innerError.error;
			}
		} else if ('message' in innerError) {
			// OpenAI error
			toast.error(innerError.message);
			errorMessage = innerError.message;
		}

		responseMessage.error = {
			content: $i18n.t(`Uh-oh! There was an issue with the response.`) + '\n' + errorMessage
		};
		responseMessage.done = true;

		if (responseMessage.statusHistory) {
			responseMessage.statusHistory = responseMessage.statusHistory.filter(
				(status) => status.action !== 'knowledge_search'
			);
		}

		history.messages[responseMessage.id] = responseMessage;
	};

	const stopResponse = async () => {
		if (taskIds) {
			for (const taskId of taskIds) {
				const res = await stopTask(localStorage.token, taskId).catch((error) => {
					toast.error(`${error}`);
					return null;
				});
			}

			taskIds = null;

			const responseMessage = history.messages[history.currentId];
			// Set all response messages to done
			if (responseMessage && responseMessage.parentId && history.messages[responseMessage.parentId]) {
				for (const messageId of history.messages[responseMessage.parentId].childrenIds) {
					history.messages[messageId].done = true;
				}
			}

			history.messages[history.currentId] = responseMessage;

			if (autoScroll) {
				scrollToBottom();
			}
		}
	};

	const submitMessage = async (parentId, prompt) => {
		let userPrompt = prompt;
		let userMessageId = uuidv4();

		let userMessage = {
			id: userMessageId,
			parentId: parentId,
			childrenIds: [],
			role: 'user',
			content: userPrompt,
			models: selectedModels,
			timestamp: Math.floor(Date.now() / 1000) // Unix epoch
		};

		if (parentId !== null) {
			history.messages[parentId].childrenIds = [
				...history.messages[parentId].childrenIds,
				userMessageId
			];
		}

		history.messages[userMessageId] = userMessage;
		history.currentId = userMessageId;

		await tick();

		if (autoScroll) {
			scrollToBottom();
		}

		await sendPrompt(history, userPrompt, userMessageId);
	};

	const regenerateResponse = async (message) => {
		console.log('regenerateResponse');

		if (history.currentId) {
			let userMessage = history.messages[message.parentId];
			let userPrompt = userMessage.content;

			if (autoScroll) {
				scrollToBottom();
			}

			if ((userMessage?.models ?? [...selectedModels]).length == 1) {
				// If user message has only one model selected, sendPrompt automatically selects it for regeneration
				await sendPrompt(history, userPrompt, userMessage.id);
			} else {
				// If there are multiple models selected, use the model of the response message for regeneration
				// e.g. many model chat
				await sendPrompt(history, userPrompt, userMessage.id, {
					modelId: message.model,
					modelIdx: message.modelIdx
				});
			}
		}
	};

	const continueResponse = async () => {
		console.log('continueResponse');
		const _chatId = JSON.parse(JSON.stringify($chatId));

		if (history.currentId && history.messages[history.currentId].done == true) {
			const responseMessage = history.messages[history.currentId];
			responseMessage.done = false;
			await tick();

			const model = $models
				.filter((m) => m.id === (responseMessage?.selectedModelId ?? responseMessage.model))
				.at(0);

			if (model) {
				await sendPromptSocket(history, model, responseMessage.id, _chatId);
			}
		}
	};

	const mergeResponses = async (messageId, responses, _chatId) => {
		console.log('mergeResponses', messageId, responses);
		const message = history.messages[messageId];
		const mergedResponse = {
			status: true,
			content: ''
		};
		message.merged = mergedResponse;
		history.messages[messageId] = message;

		try {
			const [res, controller] = await generateMoACompletion(
				localStorage.token,
				message.model,
				history.messages[message.parentId].content,
				responses
			);

			if (res && res.ok && res.body) {
				const textStream = await createOpenAITextStream(res.body, $settings.splitLargeChunks);
				for await (const update of textStream) {
					const { value, done, sources, error, usage } = update;
					if (error || done) {
						break;
					}

					if (mergedResponse.content == '' && value == '\n') {
						continue;
					} else {
						mergedResponse.content += value;
						history.messages[messageId] = message;
					}

					if (autoScroll) {
						scrollToBottom();
					}
				}

				await saveChatHandler(_chatId, history);
			} else {
				console.error(res);
			}
		} catch (e) {
			console.error(e);
		}
	};

	const initChatHandler = async (history) => {
		let _chatId = $chatId;

		if (!$temporaryChatEnabled) {
			chat = await createNewChat(
				localStorage.token,
				{
					id: _chatId,
					title: $i18n.t('New Chat'),
					models: selectedModels,
					system: $settings.system ?? undefined,
					params: params,
					history: history,
					messages: createMessagesList(history, history.currentId),
					tags: [],
					timestamp: Date.now()
				},
				$selectedFolder?.id
			);

			_chatId = chat.id;
			await chatId.set(_chatId);

			window.history.replaceState(history.state, '', `/c/${_chatId}`);

			await tick();

			await chats.set(await getChatList(localStorage.token, $currentChatPage));
			currentChatPage.set(1);

			selectedFolder.set(null);
		} else {
			_chatId = 'local';
			await chatId.set('local');
		}
		await tick();

		return _chatId;
	};

	const saveChatHandler = async (_chatId, history) => {
		if ($chatId == _chatId) {
			if (!$temporaryChatEnabled) {
				chat = await updateChatById(localStorage.token, _chatId, {
					models: selectedModels,
					history: history,
					messages: createMessagesList(history, history.currentId),
					params: params,
					files: chatFiles
				});
				currentChatPage.set(1);
				await chats.set(await getChatList(localStorage.token, $currentChatPage));
			}
		}
	};

	let chatHistory = [];
	let loadingChatHistory = false;
	let lastLoadedChatId = '';

	// Helper function to load chat history only once per chat
	const loadChatHistoryOnce = async (chatId) => {
		if (!chatId || chatId === '' || loadingChatHistory || lastLoadedChatId === chatId) {
			return;
		}

		loadingChatHistory = true;
		lastLoadedChatId = chatId;

		try {
			console.log('🔄 Loading chat history for chatId:', chatId);
			console.log('🔍 API endpoint:', `http://127.0.0.1:8000/api/v1/chat-history/${chatId}/`);
			const historyRes = await getChatHistory(chatId);
			console.log('🔍 API response:', historyRes);
			if (historyRes && historyRes.success && Array.isArray(historyRes.response)) {
				chatHistory = historyRes.response;
				console.log('✅ Chat history loaded successfully:', chatHistory.length, 'messages');
			} else {
				chatHistory = [];
				console.log('❌ No chat history found or invalid response:', historyRes);
			}
		} catch (error) {
			console.error('❌ Failed to load chat history:', error);
			console.log('🔍 This might indicate the backend server is not running on port 8000');
			chatHistory = [];
		} finally {
			loadingChatHistory = false;
		}
	};

	// Debug reactive statement to track chatHistory changes
	$: if (chatHistory) {
		console.log('🔍 Chat history updated:', chatHistory.length, 'messages', chatHistory);
	}

	// Debug reactive statement to track placeholder visibility
	$: {
		const showMessages = $settings?.landingPageMode === 'chat' || createMessagesList(history, history.currentId).length > 0 || (chatHistory && chatHistory.length > 0);
		console.log('🔍 Show messages container:', showMessages, {
			landingPageMode: $settings?.landingPageMode,
			currentMessagesCount: createMessagesList(history, history.currentId).length,
			chatHistoryCount: chatHistory?.length || 0
		});
	}

	// Function to convert chatHistory to proper message format and integrate with history
	const integrateChatHistoryIntoMessages = (chatHistory, currentHistory) => {
		if (!chatHistory || chatHistory.length === 0) {
			return currentHistory;
		}

		const integratedHistory = { ...currentHistory };
		let lastMessageId = null;
		let firstHistoryMessageId = null;

		// Convert each chat history item into proper message format
		chatHistory.forEach((msg, index) => {
			if (msg.user) {
				// Create user message
				const userMessageId = `history-user-${index}`;
				if (!firstHistoryMessageId) firstHistoryMessageId = userMessageId;

				integratedHistory.messages[userMessageId] = {
					id: userMessageId,
					parentId: lastMessageId,
					childrenIds: [],
					role: 'user',
					content: msg.user,
					timestamp: msg.created_at ? new Date(msg.created_at).getTime() : Date.now(),
					models: selectedModels || ['static-model']
				};

				if (lastMessageId && integratedHistory.messages[lastMessageId]) {
					integratedHistory.messages[lastMessageId].childrenIds.push(userMessageId);
				}
				lastMessageId = userMessageId;
			}

			if (msg.system) {
				// Create assistant message
				const assistantMessageId = `history-assistant-${index}`;

				integratedHistory.messages[assistantMessageId] = {
					id: assistantMessageId,
					parentId: lastMessageId,
					childrenIds: [],
					role: 'assistant',
					content: msg.system,
					timestamp: msg.created_at ? new Date(msg.created_at).getTime() : Date.now(),
					models: selectedModels || ['static-model'],
					done: true
				};

				if (lastMessageId && integratedHistory.messages[lastMessageId]) {
					integratedHistory.messages[lastMessageId].childrenIds.push(assistantMessageId);
				}
				lastMessageId = assistantMessageId;
			}
		});

		// If there are existing messages, connect them to the chat history
		if (currentHistory.currentId && lastMessageId) {
			integratedHistory.messages[currentHistory.currentId].parentId = lastMessageId;
			if (integratedHistory.messages[lastMessageId]) {
				integratedHistory.messages[lastMessageId].childrenIds.push(currentHistory.currentId);
			}
		} else if (firstHistoryMessageId) {
			// If no current messages, set the first history message as current
			integratedHistory.currentId = lastMessageId;
		}

		return integratedHistory;
	};

	// Track if we've already integrated history for this chat
	let integratedChatId = null;

	// Reactive statement as backup integration (only if not already integrated)
	$: if (chatHistory && chatHistory.length > 0 && $chatId && integratedChatId !== $chatId) {
		const hasHistoryMessages = Object.keys(history?.messages ?? {}).some(id => id.startsWith('history-'));

		if (!hasHistoryMessages) {
			console.log('� Backup integration for chatId:', $chatId, 'with', chatHistory.length, 'messages');
			history = integrateChatHistoryIntoMessages(chatHistory, history);
			integratedChatId = $chatId;
			console.log('✅ Backup integration complete');
		}
	}

	// Reset integration tracking and chat history when starting new chat
	$: if (!$chatId || ($chatId && integratedChatId && integratedChatId !== $chatId)) {
		integratedChatId = null;
		if (!$chatId) {
			// Clear chat history for new chats
			chatHistory = [];
			console.log('🔄 Starting new chat - cleared chat history');
		}
	}

	// Debug reactive statement to track chatId changes
	$: if ($chatId) {
		console.log('🔍 ChatId changed to:', $chatId);
		// Load chat history when chatId changes (as a backup)
		loadChatHistoryOnce($chatId);
	}


</script>

<svelte:head>
	<title>
		Swift
	</title>
</svelte:head>

<audio id="audioElement" src="" style="display: none;" />

<EventConfirmDialog
	bind:show={showEventConfirmation}
	title={eventConfirmationTitle}
	message={eventConfirmationMessage}
	input={eventConfirmationInput}
	inputPlaceholder={eventConfirmationInputPlaceholder}
	inputValue={eventConfirmationInputValue}
	on:confirm={(e) => {
		if (e.detail) {
			eventCallback(e.detail);
		} else {
			eventCallback(true);
		}
	}}
	on:cancel={() => {
		eventCallback(false);
	}}
/>

<div
	class="h-screen max-h-[100dvh] transition-width duration-200 ease-in-out {$showSidebar
		? '  md:max-w-[calc(100%-260px)]'
		: ' '} w-full max-w-full flex flex-col"
	id="chat-container"
>
	{#if !loading}
		<div in:fade={{ duration: 50 }} class="w-full h-full flex flex-col">
			{#if $settings?.backgroundImageUrl ?? null}
				<div
					class="absolute {$showSidebar
						? 'md:max-w-[calc(100%-260px)] md:translate-x-[260px]'
						: ''} top-0 left-0 w-full h-full bg-cover bg-center bg-no-repeat"
					style="background-image: url({$settings.backgroundImageUrl})  "
				/>

				<div
					class="absolute top-0 left-0 w-full h-full bg-linear-to-t from-white to-white/85 dark:from-gray-900 dark:to-gray-900/90 z-0"
				/>
			{/if}

			<PaneGroup direction="horizontal" class="w-full h-full">
				<Pane defaultSize={50} class="h-full flex relative max-w-full flex-col">
					<Navbar
						bind:this={navbarElement}
						chat={{
							id: $chatId,
							chat: {
								title: $chatTitle,
								models: ['static-model'],
								system: $settings.system ?? undefined,
								params: params,
								history: history,
								timestamp: Date.now()
							}
						}}
						{history}
						title={$chatTitle}
						shareEnabled={!!history.currentId}
						{initNewChat}
						showBanners={!showCommands}
					/>

					<div class="flex flex-col flex-auto z-10 w-full @container">
						{#if $settings?.landingPageMode === 'chat' || createMessagesList(history, history.currentId).length > 0 || (chatHistory && chatHistory.length > 0)}
							<div
								class=" pb-2.5 flex flex-col justify-between w-full flex-auto overflow-auto h-0 max-w-full z-10 scrollbar-hidden"
								id="messages-container"
								bind:this={messagesContainerElement}
								on:scroll={(e) => {
									autoScroll =
										messagesContainerElement.scrollHeight - messagesContainerElement.scrollTop <=
										messagesContainerElement.clientHeight + 5;
								}}
							>
								<div class=" h-full w-full flex flex-col">
									<!-- Chatbot Name Header (when in bot mode) -->
									{#if (currentBot && currentBot.name) || ($page?.url?.searchParams?.get('bot') === '1' && $chatTitle && $chatTitle !== 'New Chat' && $chatTitle !== '')}
										<div class="flex items-center justify-center py-3 px-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
											<div class="flex items-center space-x-3 max-w-xs">
												{#if currentBot && currentBot.picture}
													<img
														src={currentBot.picture}
														alt="{currentBot.name} avatar"
														class="w-6 h-6 rounded-full object-cover flex-shrink-0"
													/>
												{:else}
													<div class="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
														<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.476L3 21l2.476-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
														</svg>
													</div>
												{/if}
												<div class="flex items-center space-x-2 min-w-0">
													<span class="text-sm font-medium text-gray-900 truncate">
														{currentBot && currentBot.name ? currentBot.name : $chatTitle}
													</span>
													<svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
													</svg>
												</div>
											</div>
										</div>
									{/if}

									<!-- Main chat messages -->
									<Messages
										className={currentBot && currentBot.name ? 'h-full flex pt-2' : 'h-full flex pt-8'}
										chatId={$chatId}
										bind:history
										bind:autoScroll
										bind:prompt
										{chatHistory}
										{selectedModels}
										{sendPrompt}
										{showMessage}
										{submitMessage}
										{continueResponse}
										{regenerateResponse}
										{mergeResponses}
										{chatActionHandler}
										{addMessages}
										bottomPadding={files.length > 0}
										{onSelect}
										{currentBot}
									/>
								</div>
							</div>

							<div class=" pb-2">
								<MessageInput
									bind:this={messageInput}
									{history}
									{taskIds}
									{selectedModels}
									bind:files
									bind:prompt
									bind:autoScroll
									bind:selectedToolIds
									bind:selectedFilterIds
									bind:imageGenerationEnabled
									bind:codeInterpreterEnabled
									bind:webSearchEnabled
									bind:showCommands
									toolServers={$toolServers}
									transparentBackground={$settings?.backgroundImageUrl ?? false}
									{stopResponse}
									{createMessagePair}
									onChange={(input) => {
										if (!$temporaryChatEnabled) {
											if (input.prompt !== null) {
												sessionStorage.setItem(
													`chat-input${$chatId ? `-${$chatId}` : ''}`,
													JSON.stringify(input)
												);
											} else {
												sessionStorage.removeItem(`chat-input${$chatId ? `-${$chatId}` : ''}`);
											}
										}
									}}
									on:upload={async (e) => {
										const { type, data } = e.detail;

										if (type === 'web') {
											await uploadWeb(data);
										} else if (type === 'youtube') {
											await uploadYoutubeTranscription(data);
										} else if (type === 'google-drive') {
											await uploadGoogleDriveFile(data);
										}
									}}
									on:submit={async (e) => {
										if (e.detail || files.length > 0) {
											await tick();
											submitPrompt(
												($settings?.richTextInput ?? true)
													? e.detail.replaceAll('\n\n', '\n')
													: e.detail
											);
										}
									}}
								/>

								<div
									class="absolute bottom-1 text-xs text-gray-500 text-center line-clamp-1 right-0 left-0"
								>
									<!-- {$i18n.t('LLMs can make mistakes. Verify important information.')} -->
								</div>
							</div>
						{:else}
							<div class="overflow-auto w-full h-full flex items-center">
								<Placeholder
									{history}
									{selectedModels}
									botName={currentBot?.name}
									botRole={currentBot?.bot_role}
									botGreeting={currentBot?.greeting_message}
									botImage={(currentBot && currentBot.picture) ? currentBot.picture : ''}
									botSuggestionPrompts={botSuggestionPrompts}
									bind:messageInput
									bind:files
									bind:prompt
									bind:autoScroll
									bind:selectedToolIds
									bind:selectedFilterIds
									bind:imageGenerationEnabled
									bind:codeInterpreterEnabled
									bind:webSearchEnabled
									bind:showCommands
									transparentBackground={$settings?.backgroundImageUrl ?? false}
									toolServers={$toolServers}
									{stopResponse}
									{createMessagePair}
									{onSelect}
									on:upload={async (e) => {
										const { type, data } = e.detail;

										if (type === 'web') {
											await uploadWeb(data);
										} else if (type === 'youtube') {
											await uploadYoutubeTranscription(data);
										}
									}}
									on:submit={async (e) => {
										if (e.detail || files.length > 0) {
											await tick();
											submitPrompt(
												($settings?.richTextInput ?? true)
													? e.detail.replaceAll('\n\n', '\n')
													: e.detail
											);
										}
									}}
								/>
							</div>
						{/if}
					</div>
				</Pane>

				<ChatControls
					bind:this={controlPaneComponent}
					bind:history
					bind:chatFiles
					bind:params
					bind:files
					bind:pane={controlPane}
					chatId={$chatId}
					modelId={selectedModelIds?.at(0) ?? null}
					models={selectedModelIds.reduce((a, e, i, arr) => {
						const model = $models.find((m) => m.id === e);
						if (model) {
							return [...a, model];
						}
						return a;
					}, [])}
					{submitPrompt}
					{stopResponse}
					{showMessage}
					{eventTarget}
				/>
			</PaneGroup>
		</div>
	{:else if loading}
		<div class=" flex items-center justify-center h-full w-full">
			<div class="m-auto">
				<Spinner className="size-5" />
			</div>
		</div>
	{/if}
</div>
