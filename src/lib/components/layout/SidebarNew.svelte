<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { v4 as uuidv4 } from 'uuid';

	import { goto } from '$app/navigation';
	import {
		user,
		chats,
		showSidebar,
		showSearch,
		mobile,
		chatId,
		config
	} from '$lib/stores';
	import { onMount, getContext } from 'svelte';

	const i18n = getContext('i18n');

	import { getChatList, createChatViaAPI, getRecentChats } from '$lib/apis/chats';
	import { extractUserMessage } from '$lib/utils';
	import UserMenu from './Sidebar/UserMenu.svelte';
	import PencilSquare from '../icons/PencilSquare.svelte';
	import Search from '../icons/Search.svelte';

	let selectedChatId = null;
	let recentChats = [];

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

	const initChatList = async () => {
		chats.set(await getChatList(localStorage.token, 1));
	};

	onMount(async () => {
		await initChatList();

		const recent = await getRecentChats();
		if (recent && recent.success && Array.isArray(recent.response)) {
			recentChats = recent.response;
		}

		// Initialize sidebar visibility - show by default on non-mobile devices
		mobile.subscribe((value) => {
			if (value) {
				// On mobile, hide sidebar by default
				showSidebar.set(false);
			} else {
				// On desktop, show sidebar by default unless explicitly hidden
				const savedState = localStorage.getItem('sidebar');
				showSidebar.set(savedState !== 'false');
			}
		});

		// Save sidebar state to localStorage when it changes
		showSidebar.subscribe((value) => {
			localStorage.setItem('sidebar', value.toString());
		});
	});
</script>

<!-- Purple Gradient Icon Sidebar -->
<div
	class="h-screen max-h-[100dvh] min-h-screen select-none w-[56px] shrink-0 text-white text-sm fixed z-30 top-0 left-0 flex flex-col"
	style="background: linear-gradient(180deg, #375A7F 0%, #8B49DE 100%);"
>
	<!-- Logo Section - Top Bar Height -->
	<div class="h-12 flex items-center justify-center flex-shrink-0" style="background: linear-gradient(180deg, #375A7F 0%, #8B49DE 100%);">
		<div class="w-8 h-8 bg-white rounded-full flex items-center justify-center">
			<span class="text-sm font-bold" style="color: #375A7F;">OI</span>
		</div>
	</div>

	<!-- Navigation Icons -->
	<div class="flex flex-col space-y-3 flex-1 items-center py-3">
		<!-- Home Icon -->
		<button
			class="p-3 rounded-lg hover:bg-white/10 transition"
			on:click={() => {
				goto('/');
			}}
			aria-label="Home"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
			</svg>
		</button>

		<!-- Archive/Library Icon -->
		<button
			class="p-3 rounded-lg hover:bg-white/10 transition"
			on:click={() => {
				goto('/workspace');
			}}
			aria-label="Library"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
			</svg>
		</button>

		<!-- Cube/3D Icon -->
		<button
			class="p-3 rounded-lg hover:bg-white/10 transition"
			aria-label="3D Models"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
			</svg>
		</button>

		<!-- Document/Notes Icon -->
		<button
			class="p-3 rounded-lg hover:bg-white/10 transition"
			aria-label="Documents"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
			</svg>
		</button>

		<!-- Users/People Icon -->
		<button
			class="p-3 rounded-lg hover:bg-white/10 transition"
			aria-label="Users"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
			</svg>
		</button>

		<!-- Copyright/Legal Icon -->
		<button
			class="p-3 rounded-lg hover:bg-white/10 transition"
			aria-label="Copyright"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
			</svg>
		</button>

		<!-- Headphones/Support Icon -->
		<button
			class="p-3 rounded-lg hover:bg-white/10 transition"
			aria-label="Support"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
			</svg>
		</button>

		<!-- Power/Logout Icon -->
		<button
			class="p-3 rounded-lg hover:bg-white/10 transition"
			aria-label="Logout"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
			</svg>
		</button>
	</div>

	<!-- Bottom Section -->
	<div class="flex flex-col space-y-3 mb-4">
		<!-- User Profile -->
		{#if $user !== undefined}
			<UserMenu>
				<button
					class="p-2 hover:bg-white/10 rounded transition"
					aria-label="User Menu"
				>
					<img
						src={$user?.profile_image_url || '/assets/images/avatar.png'}
						class="w-8 h-8 object-cover rounded-full"
						alt="User profile"
					/>
				</button>
			</UserMenu>
		{/if}

		<!-- Arrow/Expand Icon -->
		<button
			class="p-2 hover:bg-white/10 rounded transition"
			on:click={() => {
				showSidebar.set(!$showSidebar);
			}}
			aria-label="Toggle Sidebar"
		>
			<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
				<path
					fill-rule="evenodd"
					d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
					clip-rule="evenodd"
				/>
			</svg>
		</button>
	</div>
</div>

<!-- Expandable Content Sidebar -->
<div
	id="content-sidebar"
	class="h-screen max-h-[100dvh] min-h-screen select-none {$showSidebar
		? 'md:relative w-[260px] max-w-[260px]'
		: '-translate-x-[260px] w-[0px]'} transition-width duration-200 ease-in-out shrink-0 text-gray-900 text-sm fixed z-40 top-0 left-[56px] overflow-x-hidden"
	style="background: #FFFFFF;"
	data-state={$showSidebar}
>
	<div
		class="flex flex-col h-screen max-h-[100dvh] w-[260px] overflow-x-hidden z-50 {$showSidebar
			? ''
			: 'invisible'}"
	>
		<!-- Top spacing to align with logo -->
		<div class="h-12 flex-shrink-0"></div>

		<!-- Content with padding -->
		<div class="flex flex-col h-full p-3">
		<!-- Inner content container with background -->
		<div class="flex flex-col h-full overflow-hidden" style="background: #FAFAFA;">
			<!-- Header with back arrow and title -->
			<div class="px-6 py-4 bg-white">
				<div class="flex items-center space-x-3">
					<button
						class="p-1 hover:bg-gray-100 rounded transition"
						on:click={() => {
							window.history.back();
						}}
						aria-label="Go Back"
					>
						<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
						</svg>
					</button>
					<h1 class="text-lg font-medium text-gray-900">Chatbot Name</h1>
				</div>
			</div>

			<!-- Content Area -->
			<div class="flex-1 overflow-y-auto" style="background: #FAFAFA;">
			<!-- Top spacing -->
			<div class="h-4"></div>

			<!-- Copy icon in top right -->
			<div class="px-6 mb-4">
				<div class="flex justify-end">
					<button class="p-2 hover:bg-gray-100 rounded transition">
						<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
						</svg>
					</button>
				</div>
			</div>

			<!-- Main Action Buttons -->
			<div class="px-6 space-y-2 mb-6">
				<!-- New Chat Button -->
				<button
					class="w-full flex items-center space-x-4 px-0 py-3 text-left hover:bg-gray-100 rounded-lg transition"
					on:click={() => {
						newChatHandler();
					}}
				>
					<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
					</svg>
					<span class="text-gray-800 font-medium">New Chat</span>
				</button>

				<!-- Search Chat -->
				<button
					class="w-full flex items-center space-x-4 px-0 py-3 text-left hover:bg-gray-100 rounded-lg transition"
					on:click={() => {
						showSearch.set(true);
					}}
				>
					<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
					</svg>
					<span class="text-gray-800 font-medium">Search Chat</span>
				</button>

				<!-- Library -->
				<!-- <button
					class="w-full flex items-center space-x-4 px-0 py-3 text-left hover:bg-gray-100 rounded-lg transition"
					on:click={() => {
						goto('/workspace');
					}}
				>
					<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
					</svg>
					<span class="text-gray-800 font-medium">Library</span>
				</button> -->
			</div>

			<!-- Bots Section -->
			<div class="px-6 mb-6">
				<h3 class="text-xs font-medium text-gray-500 mb-3">Bots</h3>
				<div class="space-y-2">
					<div class="flex items-center space-x-3 py-1.5 hover:bg-gray-50 rounded-lg transition cursor-pointer">
						<div class="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
							<div class="w-2 h-2 bg-purple-500 rounded-full"></div>
						</div>
						<span class="text-gray-700 font-medium">Biology Teacher</span>
					</div>
					<div class="flex items-center space-x-3 py-1.5 hover:bg-gray-50 rounded-lg transition cursor-pointer">
						<div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
							<div class="w-2 h-2 bg-blue-500 rounded-full"></div>
						</div>
						<span class="text-gray-700 font-medium">Biology Teacher</span>
					</div>
				</div>
			</div>

			<!-- Recent Chats Section -->
			<div class="px-6">
				<h3 class="text-xs font-medium text-gray-500 mb-3">Recent Chats</h3>
				<div class="space-y-1">
					{#if recentChats.length === 0}
						<div class="px-3 py-2 text-gray-400 text-sm">No recent chats</div>
					{:else}
						{#each recentChats as chat}
							<div class="px-3 py-2 hover:bg-gray-100 rounded-lg transition cursor-pointer" on:click={() => goto(`/c/${chat.id}`)}>
								<p class="text-gray-700 text-sm truncate">{extractUserMessage(chat.title)}</p>
							</div>
						{/each}
					{/if}
				</div>
			</div>
			</div>
		</div>
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
