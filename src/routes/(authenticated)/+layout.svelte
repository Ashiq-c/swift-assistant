<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { onMount, tick, getContext } from 'svelte';
	import { openDB, deleteDB } from 'idb';
	import fileSaver from 'file-saver';
	const { saveAs } = fileSaver;
	import mermaid from 'mermaid';

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';

	import { getKnowledgeBases } from '$lib/apis/knowledge';
	import { getFunctions } from '$lib/apis/functions';
	import { getModels, getToolServersData, getVersionUpdates } from '$lib/apis';
	import { getAllTags } from '$lib/apis/chats';
	import { getPrompts } from '$lib/apis/prompts';
	import { getTools } from '$lib/apis/tools';
	import { getBanners } from '$lib/apis/configs';
	import { getUserSettings } from '$lib/apis/users';

	import { WEBUI_VERSION } from '$lib/constants';
	import { compareVersion } from '$lib/utils';

	import {
		config,
		user,
		settings,
		models,
		prompts,
		knowledge,
		tools,
		functions,
		tags,
		banners,
		showSettings,
		showChangelog,
		temporaryChatEnabled,
		toolServers,
		showSearch,
		chats
	} from '$lib/stores';

	import Sidebar from '$lib/components/layout/SidebarNew.svelte';
	import TopBar from '$lib/components/layout/TopBar.svelte';
	import SettingsModal from '$lib/components/chat/SettingsModal.svelte';
	// import ChangelogModal from '$lib/components/ChangelogModal.svelte';
	import AccountPending from '$lib/components/layout/Overlay/AccountPending.svelte';
	import UpdateInfoToast from '$lib/components/layout/UpdateInfoToast.svelte';
	import Spinner from '$lib/components/common/Spinner.svelte';

	let loaded = false;
	let showSidebar = false;

	let showUpdateInfoToast = false;

	const getModelsHandler = async () => {
		models.set(await getModels(localStorage.token));
	};

	const getPromptsHandler = async () => {
		prompts.set(await getPrompts(localStorage.token));
	};

	const getKnowledgeBasesHandler = async () => {
		knowledge.set(await getKnowledgeBases(localStorage.token));
	};

	const getToolsHandler = async () => {
		tools.set(await getTools(localStorage.token));
	};

	const getFunctionsHandler = async () => {
		functions.set(await getFunctions(localStorage.token));
	};

	const getTagsHandler = async () => {
		tags.set(await getAllTags(localStorage.token));
	};

	const getBannersHandler = async () => {
		banners.set(await getBanners(localStorage.token));
	};

	const getUserSettingsHandler = async () => {
		settings.set(await getUserSettings(localStorage.token));
	};

	const getToolServersHandler = async () => {
		toolServers.set(await getToolServersData(localStorage.token));
	};

	onMount(async () => {
		if ($user === undefined) {
			await goto('/');
		}

		loaded = true;

		await Promise.all([
			getModelsHandler(),
			getPromptsHandler(),
			getKnowledgeBasesHandler(),
			getToolsHandler(),
			getFunctionsHandler(),
			getTagsHandler(),
			getBannersHandler(),
			getUserSettingsHandler(),
			getToolServersHandler()
		]);

		if ($config?.features?.enable_version_update_check ?? true) {
			const versionUpdates = await getVersionUpdates(localStorage.token).catch((error) => {
				console.log(error);
				return null;
			});

			if (versionUpdates) {
				if (compareVersion(WEBUI_VERSION, versionUpdates.latest.tag_name)) {
					showUpdateInfoToast = true;
				}
			}
		}
	});
</script>

<svelte:head>
	<title>Swift</title>
</svelte:head>

{#if loaded}
	<div class="app relative">
		<div class="flex h-screen max-h-[100dvh] w-full">
			<Sidebar bind:show={showSidebar} />

			<div class="flex flex-col flex-1 max-h-[100dvh] overflow-hidden">
				<TopBar bind:showSidebar />

				<div class="flex flex-col flex-1 max-h-full overflow-hidden">
					<slot />
				</div>
			</div>
		</div>

		<SettingsModal bind:show={$showSettings} />
		<!-- <ChangelogModal bind:show={$showChangelog} /> -->

		{#if $user?.role !== 'user'}
			<AccountPending />
		{/if}

		{#if showUpdateInfoToast}
			<UpdateInfoToast bind:show={showUpdateInfoToast} />
		{/if}
	</div>
{:else}
	<div class="flex items-center justify-center h-screen">
		<Spinner className="size-6" />
	</div>
{/if}
