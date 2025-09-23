<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { v4 as uuidv4 } from 'uuid';

	import { goto } from '$app/navigation';
	import {
		user,
		chats,
		settings,
		showSettings,
		chatId,
		tags,
		showSidebar,
		showSearch,
		mobile,
		showArchivedChats,
		pinnedChats,
		scrollPaginationEnabled,
		currentChatPage,
		temporaryChatEnabled,
		channels,
		socket,
		config,
		isApp,
		models,
		selectedFolder
	} from '$lib/stores';
	import { onMount, getContext, tick, onDestroy } from 'svelte';

	const i18n = getContext('i18n');

	import {
		getChatList,
		getAllTags,
		getPinnedChatList,
		toggleChatPinnedStatusById,
		getChatById,
		updateChatFolderIdById,
		importChat,
		createChatViaAPI,
		getRecentChats
	} from '$lib/apis/chats';
	import { getChatbots } from '$lib/api/chatbots.js';
	import { createNewFolder, getFolders, updateFolderParentIdById } from '$lib/apis/folders';
	import { WEBUI_BASE_URL } from '$lib/constants';
	import { extractUserMessage } from '$lib/utils';

	import ArchivedChatsModal from './ArchivedChatsModal.svelte';
	import UserMenu from './Sidebar/UserMenu.svelte';
	import ChatItem from './Sidebar/ChatItem.svelte';
	import Spinner from '../common/Spinner.svelte';
	import Loader from '../common/Loader.svelte';
	import AddFilesPlaceholder from '../AddFilesPlaceholder.svelte';
	import Folder from '../common/Folder.svelte';
	import Plus from '../icons/Plus.svelte';
	import Tooltip from '../common/Tooltip.svelte';
	import Folders from './Sidebar/Folders.svelte';
	import { getChannels, createNewChannel } from '$lib/apis/channels';
	import ChannelModal from './Sidebar/ChannelModal.svelte';
	import ChannelItem from './Sidebar/ChannelItem.svelte';
	import PencilSquare from '../icons/PencilSquare.svelte';
	import Home from '../icons/Home.svelte';
	import Search from '../icons/Search.svelte';
	import SearchModal from './SearchModal.svelte';

	const BREAKPOINT = 768;

	let navElement;
	let shiftKey = false;

	let selectedChatId = null;
	let showDropdown = false;
	let showPinnedChat = true;

	let showCreateChannel = false;

	// Pagination variables
	let chatListLoading = false;
	let allChatsLoaded = false;

	let folders = {};
	let newFolderId = null;

	let recentChats = [];
	let chatbots = [];
	let loadingChatbots = false;

	const initFolders = async () => {
		const folderList = await getFolders(localStorage.token).catch((error) => {
			toast.error(`${error}`);
			return [];
		});
		const safeFolderList = Array.isArray(folderList) ? folderList : [];

		folders = {};

		// First pass: Initialize all folder entries
		for (const folder of safeFolderList) {
			// Ensure folder is added to folders with its data
			folders[folder.id] = { ...(folders[folder.id] || {}), ...folder };

			if (newFolderId && folder.id === newFolderId) {
				folders[folder.id].new = true;
				newFolderId = null;
			}
		}

		// Second pass: Tie child folders to their parents
		for (const folder of safeFolderList) {
			if (folder.parent_id) {
				// Ensure the parent folder is initialized if it doesn't exist
				if (!folders[folder.parent_id]) {
					folders[folder.parent_id] = {}; // Create a placeholder if not already present
				}

				// Initialize childrenIds array if it doesn't exist and add the current folder id
				folders[folder.parent_id].childrenIds = folders[folder.parent_id].childrenIds
					? [...folders[folder.parent_id].childrenIds, folder.id]
					: [folder.id];

				// Sort the children by updated_at field
				folders[folder.parent_id].childrenIds.sort((a, b) => {
					return folders[b].updated_at - folders[a].updated_at;
				});
			}
		}
	};

	const loadChatbots = async (showToast = false) => {
		try {
			loadingChatbots = true;
			const response = await getChatbots({ page_size: 10 }); // Load first 10 chatbots
			console.log('Chatbots API response:', response);

			// Handle different response structures; only include items that have a real id/uid
			const list = Array.isArray(response?.results)
				? response.results
				: Array.isArray(response?.records)
				? response.records
				: Array.isArray(response?.data?.results)
				? response.data.results
				: Array.isArray(response?.data?.records)
				? response.data.records
				: Array.isArray(response)
				? response
				: [];

			chatbots = list
				.filter((chatbot) => chatbot && (chatbot.id != null || chatbot.uid != null))
				.map((chatbot) => ({ ...chatbot, id: String(chatbot.id ?? chatbot.uid) }));

			console.log('Loaded chatbots (filtered, with real IDs):', chatbots);

			if (showToast && chatbots.length > 0) {
				toast.success(`Loaded ${chatbots.length} chatbot${chatbots.length === 1 ? '' : 's'}`);
			}
		} catch (error) {
			console.error('Error loading chatbots:', error);
			chatbots = [];
			if (showToast) {
				toast.error('Failed to load chatbots');
			}
		} finally {
			loadingChatbots = false;
		}
	};

	// Function to refresh chatbots (can be called from other components)
	const refreshChatbots = async () => {
		await loadChatbots(true);
	};

	// Make refreshChatbots available globally for other components to call
	if (typeof window !== 'undefined') {
		window.refreshSidebarChatbots = refreshChatbots;
	}

	const createFolder = async (name = 'Untitled') => {
		if (name === '') {
			toast.error($i18n.t('Folder name cannot be empty.'));
			return;
		}

		const rootFolders = Object.values(folders).filter((folder) => folder.parent_id === null);
		if (rootFolders.find((folder) => folder.name.toLowerCase() === name.toLowerCase())) {
			// If a folder with the same name already exists, append a number to the name
			let i = 1;
			while (
				rootFolders.find((folder) => folder.name.toLowerCase() === `${name} ${i}`.toLowerCase())
			) {
				i++;
			}

			name = `${name} ${i}`;
		}

		// Add a dummy folder to the list to show the user that the folder is being created
		const tempId = uuidv4();
		folders = {
			...folders,
			tempId: {
				id: tempId,
				name: name,
				created_at: Date.now(),
				updated_at: Date.now()
			}
		};

		const res = await createNewFolder(localStorage.token, name).catch((error) => {
			toast.error(`${error}`);
			return null;
		});

		if (res) {
			newFolderId = res.id;
			await initFolders();
		}
	};

	const initChannels = async () => {
		await channels.set(await getChannels(localStorage.token));
	};

	const initChatList = async () => {
		// Reset pagination variables
		tags.set(await getAllTags(localStorage.token));
		pinnedChats.set(await getPinnedChatList(localStorage.token));
		initFolders();

		currentChatPage.set(1);
		allChatsLoaded = false;

		await chats.set(await getChatList(localStorage.token, $currentChatPage));

		// Enable pagination
		scrollPaginationEnabled.set(true);
	};

	const loadMoreChats = async () => {
		chatListLoading = true;

		currentChatPage.set($currentChatPage + 1);

		let newChatList = [];

		newChatList = await getChatList(localStorage.token, $currentChatPage);

		// once the bottom of the list has been reached (no results) there is no need to continue querying
		allChatsLoaded = newChatList.length === 0;
		await chats.set([...($chats ? $chats : []), ...newChatList]);

		chatListLoading = false;
	};

	const importChatHandler = async (items, pinned = false, folderId = null) => {
		console.log('importChatHandler', items, pinned, folderId);
		for (const item of items) {
			console.log(item);
			if (item.chat) {
				await importChat(
					localStorage.token,
					item.chat,
					item?.meta ?? {},
					pinned,
					folderId,
					item?.created_at ?? null,
					item?.updated_at ?? null
				);
			}
		}

		initChatList();
	};

	const newChatHandler = async () => {
		try {
			// Call the external API to create a new chat
			const response = await createChatViaAPI(localStorage.token);
			
			if (response && response.success) {
				// Set the chat ID and navigate to the chat
				const newChatId = response.chat;
				chatId.set(newChatId);
				await goto(`/c/${newChatId}`);
				
				// Show success message
				toast.success('Chat created successfully');
			} else {
				// Fallback to original behavior if API fails
				console.error('Failed to create chat via API:', response);
				chatId.set('');
				await goto('/');
				toast.error('Failed to create chat');
			}
		} catch (error) {
			console.error('Error creating chat:', error);
			// Fallback to original behavior
			chatId.set('');
			await goto('/');
			toast.error('Error creating chat');
		}

		if ($mobile) {
			showSidebar.set(false);
		}
	};

	const inputFilesHandler = async (files) => {
		console.log(files);

		for (const file of files) {
			const reader = new FileReader();
			reader.onload = async (e) => {
				const content = e.target.result;

				try {
					const chatItems = JSON.parse(content);
					importChatHandler(chatItems);
				} catch {
					toast.error($i18n.t(`Invalid file format.`));
				}
			};

			reader.readAsText(file);
		}
	};

	const tagEventHandler = async (type, tagName, chatId) => {
		console.log(type, tagName, chatId);
		if (type === 'delete') {
			initChatList();
		} else if (type === 'add') {
			initChatList();
		}
	};

	let draggedOver = false;

	const onDragOver = (e) => {
		e.preventDefault();

		// Check if a file is being draggedOver.
		if (e.dataTransfer?.types?.includes('Files')) {
			draggedOver = true;
		} else {
			draggedOver = false;
		}
	};

	const onDragLeave = () => {
		draggedOver = false;
	};

	const onDrop = async (e) => {
		e.preventDefault();
		console.log(e); // Log the drop event

		// Perform file drop check and handle it accordingly
		if (e.dataTransfer?.files) {
			const inputFiles = Array.from(e.dataTransfer?.files);

			if (inputFiles && inputFiles.length > 0) {
				console.log(inputFiles); // Log the dropped files
				inputFilesHandler(inputFiles); // Handle the dropped files
			}
		}

		draggedOver = false; // Reset draggedOver status after drop
	};

	let touchstart;
	let touchend;

	function checkDirection() {
		const screenWidth = window.innerWidth;
		const swipeDistance = Math.abs(touchend.screenX - touchstart.screenX);
		if (touchstart.clientX < 40 && swipeDistance >= screenWidth / 8) {
			if (touchend.screenX < touchstart.screenX) {
				showSidebar.set(false);
			}
			if (touchend.screenX > touchstart.screenX) {
				showSidebar.set(true);
			}
		}
	}

	const onTouchStart = (e) => {
		touchstart = e.changedTouches[0];
		console.log(touchstart.clientX);
	};

	const onTouchEnd = (e) => {
		touchend = e.changedTouches[0];
		checkDirection();
	};

	const onKeyDown = (e) => {
		if (e.key === 'Shift') {
			shiftKey = true;
		}
	};

	const onKeyUp = (e) => {
		if (e.key === 'Shift') {
			shiftKey = false;
		}
	};

	const onFocus = () => {};

	const onBlur = () => {
		shiftKey = false;
		selectedChatId = null;
	};

	onMount(async () => {
		showPinnedChat = localStorage?.showPinnedChat ? localStorage.showPinnedChat === 'true' : true;

		mobile.subscribe((value) => {
			if ($showSidebar && value) {
				showSidebar.set(false);
			}

			if ($showSidebar && !value) {
				const navElement = document.getElementsByTagName('nav')[0];
				if (navElement) {
					navElement.style['-webkit-app-region'] = 'drag';
				}
			}

			if (!$showSidebar && !value) {
				showSidebar.set(true);
			}
		});

		showSidebar.set(!$mobile ? localStorage.sidebar === 'true' : false);
		showSidebar.subscribe((value) => {
			localStorage.sidebar = value;

			// nav element is not available on the first render
			const navElement = document.getElementsByTagName('nav')[0];

			if (navElement) {
				if ($mobile) {
					if (!value) {
						navElement.style['-webkit-app-region'] = 'drag';
					} else {
						navElement.style['-webkit-app-region'] = 'no-drag';
					}
				} else {
					navElement.style['-webkit-app-region'] = 'drag';
				}
			}
		});

		chats.subscribe((value) => {
			if ($selectedFolder) {
				initFolders();
			}
		});

		await initChannels();
		await initChatList();
		await loadChatbots();

		const recent = await getRecentChats();
		if (recent && recent.success && Array.isArray(recent.response)) {
			recentChats = recent.response;
		}

		window.addEventListener('keydown', onKeyDown);
		window.addEventListener('keyup', onKeyUp);

		window.addEventListener('touchstart', onTouchStart);
		window.addEventListener('touchend', onTouchEnd);

		window.addEventListener('focus', onFocus);
		window.addEventListener('blur', onBlur);

		const dropZone = document.getElementById('sidebar');

		dropZone?.addEventListener('dragover', onDragOver);
		dropZone?.addEventListener('drop', onDrop);
		dropZone?.addEventListener('dragleave', onDragLeave);
	});

	onDestroy(() => {
		window.removeEventListener('keydown', onKeyDown);
		window.removeEventListener('keyup', onKeyUp);

		window.removeEventListener('touchstart', onTouchStart);
		window.removeEventListener('touchend', onTouchEnd);

		window.removeEventListener('focus', onFocus);
		window.removeEventListener('blur', onBlur);

		const dropZone = document.getElementById('sidebar');

		dropZone?.removeEventListener('dragover', onDragOver);
		dropZone?.removeEventListener('drop', onDrop);
		dropZone?.removeEventListener('dragleave', onDragLeave);
	});
</script>

<ArchivedChatsModal
	bind:show={$showArchivedChats}
	onUpdate={async () => {
		await initChatList();
	}}
/>

<ChannelModal
	bind:show={showCreateChannel}
	onSubmit={async ({ name, access_control }) => {
		const res = await createNewChannel(localStorage.token, {
			name: name,
			access_control: access_control
		}).catch((error) => {
			toast.error(`${error}`);
			return null;
		});

		if (res) {
			$socket.emit('join-channels', { auth: { token: $user?.token } });
			await initChannels();
			showCreateChannel = false;
		}
	}}
/>

<!-- svelte-ignore a11y-no-static-element-interactions -->

{#if $showSidebar}
	<div
		class=" {$isApp
			? ' ml-[4.5rem] md:ml-0'
			: ''} fixed md:hidden z-40 top-0 right-0 left-0 bottom-0 bg-black/60 w-full min-h-screen h-screen flex justify-center overflow-hidden overscroll-contain"
		on:mousedown={() => {
			showSidebar.set(!$showSidebar);
		}}
	/>
{/if}

<SearchModal
	bind:show={$showSearch}
	onClose={() => {
		if ($mobile) {
			showSidebar.set(false);
		}
	}}
/>

<!-- Icon Sidebar -->
<div
	class="h-screen max-h-[100dvh] min-h-screen select-none w-[56px] shrink-0 text-white text-sm fixed z-50 top-0 left-0 flex flex-col items-center py-4 space-y-4"
	style="background: linear-gradient(180deg, #375A7F 0%, #8B49DE 100%);"
>
	<!-- Logo -->
	<div class="flex items-center justify-center w-8 h-8">
		<img
			crossorigin="anonymous"
			src="{$config?.ui?.logo_url ? $config?.ui?.logo_url : '/favicon.png'}"
			class="size-6 object-cover rounded"
			alt="logo"
		/>
	</div>

	<!-- Navigation Icons -->
	<div class="flex flex-col space-y-2">
		<!-- Home -->
		<button class="p-2 rounded-lg hover:bg-white/10 transition">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
			</svg>
		</button>

		<!-- Library -->
		<button class="p-2 rounded-lg hover:bg-white/10 transition">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
			</svg>
		</button>

		<!-- Models -->
		<button class="p-2 rounded-lg hover:bg-white/10 transition">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
			</svg>
		</button>

		<!-- Users -->
		<button class="p-2 rounded-lg hover:bg-white/10 transition">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
			</svg>
		</button>

		<!-- Settings -->
		<button class="p-2 rounded-lg hover:bg-white/10 transition">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
			</svg>
		</button>

		<!-- Workspace -->
		<button class="p-2 rounded-lg hover:bg-white/10 transition">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0H8m0 0H6a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0h8m-8 0v4a2 2 0 002 2h4a2 2 0 002-2v-4m-8 0V10a2 2 0 012-2h4a2 2 0 012 2v4"></path>
			</svg>
		</button>

		<!-- Knowledge -->
		<button class="p-2 rounded-lg hover:bg-white/10 transition">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
			</svg>
		</button>

		<!-- Tools -->
		<button class="p-2 rounded-lg hover:bg-white/10 transition">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
			</svg>
		</button>
	</div>

	<!-- Bottom Icons -->
	<div class="flex-1 flex flex-col justify-end space-y-2">
		<!-- Toggle Sidebar -->
		<button
			on:click={() => showSidebar.set(!$showSidebar)}
			class="p-2 rounded-lg hover:bg-white/10 transition"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path>
			</svg>
		</button>

		<!-- Notes -->
		{#if $user?.role === 'admin' || $user?.permissions?.workspace?.knowledge}
			<a
				class="p-2 rounded-lg hover:bg-white/10 transition"
				href="/notes"
				on:click={() => {
					selectedChatId = null;
					chatId.set('');

					if ($mobile) {
						showSidebar.set(false);
					}
				}}
				draggable="false"
			>
				<svg
					class="w-5 h-5"
					aria-hidden="true"
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					fill="none"
					viewBox="0 0 24 24"
				>
					<path
						stroke="currentColor"
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 3v4a1 1 0 0 1-1 1H5m4 8h6m-6-4h6m4-8v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7.914a1 1 0 0 1 .293-.707l3.914-3.914A1 1 0 0 1 9.914 3H18a1 1 0 0 1 1 1Z"
					/>
				</svg>
			</a>
		{/if}

		<!-- User Profile -->
		<button class="p-2 rounded-lg hover:bg-white/10 transition">
			<div class="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
				<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
					<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
				</svg>
			</div>
		</button>
	</div>
</div>

<!-- Expandable Content Sidebar -->
<div
	bind:this={navElement}
	id="content-sidebar"
	class="h-screen max-h-[100dvh] min-h-screen select-none {$showSidebar
		? 'md:relative w-[260px] max-w-[260px]'
		: '-translate-x-[260px] w-[0px]'} {$isApp
		? `ml-[56px] md:ml-[56px] `
		: 'transition-width duration-200 ease-in-out'}  shrink-0 text-gray-900 text-sm fixed z-40 top-0 left-[56px] overflow-x-hidden border-r border-gray-200"
	style="background: #FAFAFA;"
	data-state={$showSidebar}
>
	<div
		class="flex flex-col h-screen max-h-[100dvh] w-[260px] overflow-x-hidden z-50 {$showSidebar
			? ''
			: 'invisible'}"
	>
		<!-- Header with back arrow and title -->
		<div class="px-4 py-3 border-b border-gray-100 bg-white">
			<div class="flex items-center space-x-3">
				<button
					class="p-1 hover:bg-gray-100 rounded"
					on:click={() => showSidebar.set(false)}
				>
					<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
					</svg>
				</button>
				<h2 class="text-lg font-semibold text-gray-900">Chatbot Name</h2>
			</div>
		</div>

		<!-- Content Area -->
		<div class="flex-1 overflow-y-auto bg-white">
			<!-- Main Action Buttons -->
			<div class="px-3 py-3 space-y-1">
				<!-- New Chat Button -->
				<button
					class="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-100 rounded-lg transition"
					on:click={() => {
						newChatHandler();
					}}
				>
					<PencilSquare className="w-4 h-4 text-gray-600" />
					<span class="text-gray-700 text-sm">New Chat</span>
				</button>

				<!-- Search Chat Button -->
				<button
					class="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-100 rounded-lg transition"
					on:click={() => {
						showSearch.set(true);
					}}
				>
					<Search className="w-4 h-4 text-gray-600" />
					<span class="text-gray-700 text-sm">Search Chat</span>
				</button>

				<!-- Library Button -->
				<button
					class="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-100 rounded-lg transition"
					on:click={() => {
						// Add library functionality here
					}}
				>
					<svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
					</svg>
					<span class="text-gray-700 text-sm">Library</span>
				</button>

				<!-- Chatbot Builder Button -->
				<button
					class="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-100 rounded-lg transition"
					on:click={() => {
						goto('/chatbot-builder');
						if ($mobile) {
							showSidebar.set(false);
						}
					}}
				>
					<svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
					</svg>
					<span class="text-gray-700 text-sm">Chatbot Builder</span>
				</button>
			</div>

			<!-- Chatbots Section -->
			<div class="px-3 py-2">
				<div class="flex items-center justify-between mb-2 px-3">
					<div class="text-xs font-medium text-gray-500">My Chatbots ({chatbots.length})</div>
					<div class="flex items-center space-x-2">
						<button
							class="text-xs text-gray-500 hover:text-gray-700 transition-colors"
							on:click={() => refreshChatbots()}
							title="Refresh chatbots"
							disabled={loadingChatbots}
						>
							{#if loadingChatbots}
								<div class="animate-spin rounded-full h-3 w-3 border-b border-gray-500"></div>
							{:else}
								↻
							{/if}
						</button>
						<button
							class="text-xs text-blue-600 hover:text-blue-800 transition-colors"
							on:click={() => {
								goto('/chatbot-builder');
								if ($mobile) {
									showSidebar.set(false);
								}
							}}
							title="Create new chatbot"
						>
							+ New
						</button>
					</div>
				</div>

				{#if loadingChatbots}
					<div class="flex items-center justify-center py-4">
						<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
						<span class="ml-2 text-xs text-gray-500">Loading...</span>
					</div>
				{:else if chatbots.length === 0}
					<div class="text-center py-4 px-3">
						<p class="text-xs text-gray-400 mb-2">No chatbots yet</p>
						<button
							class="text-xs text-blue-600 hover:text-blue-800 transition-colors"
							on:click={() => {
								goto('/chatbot-builder');
								if ($mobile) {
									showSidebar.set(false);
								}
							}}
						>
							Create your first chatbot
						</button>
					</div>
				{:else}
					<div class="space-y-1 max-h-48 overflow-y-auto">
						{#each chatbots as chatbot (chatbot.id)}
							<button
								class="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-100 rounded-lg transition cursor-pointer text-left"
								on:click={() => {
									// Use the guaranteed unique ID and force Chat screen to treat it as a chatbot id
									goto(`/c/${chatbot.id}?bot=1`);
									if ($mobile) {
										showSidebar.set(false);
									}
								}}
								title="Chat with {chatbot.name}"
							>
								{#if chatbot.picture}
									<img src={chatbot.picture} alt="{chatbot.name} avatar" class="w-6 h-6 rounded-full object-cover flex-shrink-0" />
								{:else}
									<div class="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
										<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.476L3 21l2.476-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
										</svg>
									</div>
								{/if}
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium text-gray-700 truncate">{chatbot.name}</p>
									{#if chatbot.bot_role}
										<p class="text-xs text-gray-500 truncate">{chatbot.bot_role}</p>
									{/if}
								</div>
								{#if chatbot.primary_language}
									<div class="flex-shrink-0">
										<span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
											{chatbot.primary_language.name.slice(0, 2).toUpperCase()}
										</span>
									</div>
								{/if}
							</button>
						{/each}
					</div>

					{#if chatbots.length >= 10}
						<div class="mt-2 text-center px-3">
							<button
								class="text-xs text-blue-600 hover:text-blue-800 transition-colors"
								on:click={() => {
									goto('/c/new');
									if ($mobile) {
										showSidebar.set(false);
									}
								}}
							>
								View all chatbots →
							</button>
						</div>
					{/if}
				{/if}
			</div>

			<!-- Recent Chats Section -->
			<div class="px-3 py-2">
				<div class="text-xs font-medium text-gray-500 mb-2 px-3">Recent Chats</div>
				<div class="space-y-1">
					{#if recentChats.length === 0}
						<div class="px-3 py-2 text-gray-400 text-sm">No recent chats</div>
					{:else}
						{#each recentChats as chat}
							<div
								class="px-3 py-2 hover:bg-gray-100 rounded-lg transition cursor-pointer {chat.id === $chatId ? 'bg-blue-100' : ''}"
								on:click={() => goto(`/c/${chat.id}`)}
							>
								<p class="text-gray-700 text-sm truncate">{extractUserMessage(chat.title)}</p>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</div>

		<!-- User Menu at Bottom -->
		<div class="px-4 py-3 border-t border-gray-100 bg-white">
			{#if $user !== undefined}
				<UserMenu>
					<button
						class="flex items-center space-x-3 w-full px-3 py-2 hover:bg-gray-50 rounded-lg transition"
						aria-label="User Menu"
					>
						<div class="flex-shrink-0">
							<img
								src={$user?.profile_image_url}
								class="w-8 h-8 object-cover rounded-full"
								alt="User profile1111"
							/>
						</div>
						<div class="flex-1 text-left">
							<div class="text-sm font-medium text-gray-900">{$user?.name}</div>
							<div class="text-xs text-gray-500">admin</div>
						</div>
					</button>
				</UserMenu>
			{/if}
		</div>
	</div>
</div>




<style>
	.scrollbar-hidden:active::-webkit-scrollbar-thumb,
	.scrollbar-hidden:focus::-webkit-scrollbar-thumb,
	.scrollbar-hidden:hover::-webkit-scrollbar-thumb {
		visibility: visible;
	}
	.scrollbar-hidden::-webkit-scrollbar-thumb {
		visibility: hidden;
	}
</style>
