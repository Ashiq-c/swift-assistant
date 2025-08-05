<script lang="ts">
	import { getContext } from 'svelte';
	import { toast } from 'svelte-sonner';

	import {
		WEBUI_NAME,
		banners,
		chatId,
		config,
		mobile,
		settings,
		showArchivedChats,
		showControls,
		showSidebar,
		temporaryChatEnabled,
		user
	} from '$lib/stores';

	import { slide } from 'svelte/transition';
	import { page } from '$app/stores';

	import ShareChatModal from '../chat/ShareChatModal.svelte';
	import Tooltip from '../common/Tooltip.svelte';
	import Menu from '$lib/components/layout/Navbar/Menu.svelte';
	import UserMenu from '$lib/components/layout/Sidebar/UserMenu.svelte';
	import MenuLines from '../icons/MenuLines.svelte';
	import AdjustmentsHorizontal from '../icons/AdjustmentsHorizontal.svelte';

	import PencilSquare from '../icons/PencilSquare.svelte';
	import Banner from '../common/Banner.svelte';

	const i18n = getContext('i18n');

	export let initNewChat: Function;
	export let title: string = $WEBUI_NAME;
	export let shareEnabled: boolean = false;

	export let chat;
	export let history;
	export let showBanners = true;

	let closedBannerIds = [];

	let showShareChatModal = false;
	let showDownloadChatModal = false;
</script>

<ShareChatModal bind:show={showShareChatModal} chatId={$chatId} />

<button
	id="new-chat-button"
	class="hidden"
	on:click={() => {
		initNewChat();
	}}
	aria-label="New Chat"
/>

<nav class="sticky top-0 z-30 w-full bg-white drag-region">
	<div class="flex items-center justify-between w-full px-4 py-3">
		<!-- Left side: Back arrow only -->
		<div class="flex items-center">
			<button
				class="p-1 hover:bg-gray-100 rounded transition"
				on:click={() => {
					// Handle back navigation
					window.history.back();
				}}
				aria-label="Go Back"
			>
				<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
				</svg>
			</button>
		</div>

		<!-- Right side: Icons -->
		<div class="flex items-center space-x-2">
			<!-- Hamburger menu (only show when sidebar is hidden) -->
			<button
				id="sidebar-toggle-button"
				class="{$showSidebar ? 'md:hidden' : ''} cursor-pointer p-2 flex rounded-xl hover:bg-gray-100 transition"
				on:click={() => {
					showSidebar.set(!$showSidebar);
				}}
				aria-label="Toggle Sidebar"
			>
				<div class="m-auto self-center">
					<MenuLines />
				</div>
			</button>

			<!-- Controls button -->
			<!-- <Tooltip content={$i18n.t('Controls')}>
				<button
					class="p-2 rounded-xl hover:bg-gray-100 transition"
					on:click={async () => {
						await showControls.set(!$showControls);
					}}
					aria-label="Controls"
				>
					<div class="m-auto self-center">
						<AdjustmentsHorizontal className="size-5 text-gray-600" strokeWidth="0.5" />
					</div>
				</button>
			</Tooltip> -->

			<!-- Chat menu -->
			{#if shareEnabled && chat && (chat.id || $temporaryChatEnabled)}
				<Menu
					{chat}
					{shareEnabled}
					shareHandler={() => {
						showShareChatModal = !showShareChatModal;
					}}
					downloadHandler={() => {
						showDownloadChatModal = !showDownloadChatModal;
					}}
				>
					<button
						class="p-2 rounded-xl hover:bg-gray-100 transition"
						id="chat-context-menu-button"
					>
						<div class="m-auto self-center">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="size-5 text-gray-600"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
								/>
							</svg>
						</div>
					</button>
				</Menu>
			{/if}

			<!-- User menu -->
			{#if $user !== undefined && $user !== null}
				<UserMenu
					className="max-w-[240px]"
					role={$user?.role}
					help={true}
					on:show={(e) => {
						if (e.detail === 'archived-chat') {
							showArchivedChats.set(true);
						}
					}}
				>
					<div class="select-none flex rounded-xl p-1.5 hover:bg-gray-100 transition">
						<div class="self-center">
							<span class="sr-only">{$i18n.t('User menu')}</span>
							<img
								src={$user?.profile_image_url}
								class="size-6 object-cover rounded-full"
								alt=""
								draggable="false"
							/>
						</div>
					</div>
				</UserMenu>
			{/if}

		</div>
	</div>

	{#if $temporaryChatEnabled && $chatId === 'local'}
		<div class=" w-full z-30 text-center">
			<div class="text-xs text-gray-500">{$i18n.t('Temporary Chat')}</div>
		</div>
	{/if}

	<div class="absolute top-[100%] left-0 right-0 h-fit">
		{#if !history.currentId && !$chatId && ($banners.length > 0 || ($config?.license_metadata?.type ?? null) === 'trial' || (($config?.license_metadata?.seats ?? null) !== null && $config?.user_count > $config?.license_metadata?.seats))}
			<div class=" w-full z-30 mt-5">
				<div class=" flex flex-col gap-1 w-full">
					{#if ($config?.license_metadata?.type ?? null) === 'trial'}
						<Banner
							banner={{
								type: 'info',
								title: 'Trial License',
								content: $i18n.t(
									'You are currently using a trial license. Please contact support to upgrade your license.'
								)
							}}
						/>
					{/if}

					{#if ($config?.license_metadata?.seats ?? null) !== null && $config?.user_count > $config?.license_metadata?.seats}
						<Banner
							banner={{
								type: 'error',
								title: 'License Error',
								content: $i18n.t(
									'Exceeded the number of seats in your license. Please contact support to increase the number of seats.'
								)
							}}
						/>
					{/if}

					{#if showBanners}
						{#each $banners.filter((b) => ![...JSON.parse(localStorage.getItem('dismissedBannerIds') ?? '[]'), ...closedBannerIds].includes(b.id)) as banner}
							<Banner
								{banner}
								on:dismiss={(e) => {
									const bannerId = e.detail;

									if (banner.dismissible) {
										localStorage.setItem(
											'dismissedBannerIds',
											JSON.stringify(
												[
													bannerId,
													...JSON.parse(localStorage.getItem('dismissedBannerIds') ?? '[]')
												].filter((id) => $banners.find((b) => b.id === id))
											)
										);
									} else {
										closedBannerIds = [...closedBannerIds, bannerId];
									}
								}}
							/>
						{/each}
					{/if}
				</div>
			</div>
		{/if}
	</div>
</nav>
