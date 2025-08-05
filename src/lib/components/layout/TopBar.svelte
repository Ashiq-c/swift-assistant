<script lang="ts">
	import { showSidebar, config, user } from '$lib/stores';
	import MenuLines from '../icons/MenuLines.svelte';
	import UserMenu from './Sidebar/UserMenu.svelte';
	import { onMount } from 'svelte';

	let showNotifications = false;

	// Close notifications when clicking outside
	onMount(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (showNotifications && !(event.target as Element)?.closest('.notification-container')) {
				showNotifications = false;
			}
		};

		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	});
</script>

<!-- Top Bar -->
<div class="h-12 bg-white shadow-md flex items-center justify-between fixed top-0 left-0 right-0 z-50">
	<!-- Left side - Menu Button Only -->
	<div class="flex items-center h-full">
		<!-- Menu Toggle Button -->
		<div class="px-4">
			<button
				class="p-1.5 hover:bg-gray-100 rounded transition"
				on:click={() => {
					showSidebar.set(!$showSidebar);
				}}
				aria-label="Toggle Menu"
			>
				<MenuLines />
			</button>
		</div>
	</div>

	<!-- Right side - Notifications and User Menu -->
	<div class="flex items-center space-x-3">
		<!-- Notification Bell -->
		<div class="relative notification-container">
			<button
				class="p-2 hover:bg-gray-100 rounded-full transition relative"
				on:click={() => {
					showNotifications = !showNotifications;
				}}
				aria-label="Notifications"
			>
				<svg class="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
					<path d="M10 2C7.79086 2 6 3.79086 6 6V8C6 9.10457 5.10457 10 4 10H3C2.44772 10 2 10.4477 2 11C2 11.5523 2.44772 12 3 12H17C17.5523 12 18 11.5523 18 11C18 10.4477 17.5523 10 17 10H16C14.8954 10 14 9.10457 14 8V6C14 3.79086 12.2091 2 10 2Z"/>
					<path d="M8.5 14C8.5 15.3807 9.11929 16 10.5 16C11.8807 16 12.5 15.3807 12.5 14H8.5Z"/>
				</svg>
				<!-- Notification dot -->
				<div class="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
			</button>

			<!-- Notifications Dropdown -->
			{#if showNotifications}
				<div class="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg z-50">
					<div class="p-4">
						<h3 class="font-semibold text-gray-900">Notifications</h3>
					</div>
					<div class="p-4">
						<p class="text-gray-500 text-sm">No new notifications</p>
					</div>
				</div>
			{/if}
		</div>

		<!-- User Avatar with Menu -->
		{#if $user !== undefined}
			<UserMenu>
				<button
					class="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition"
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
	</div>
</div>
