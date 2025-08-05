<script>
	import { activeSection } from '$lib/chatbot-builder-stores.js';

	let currentSection = 'overview';

	// Subscribe to active section
	$: currentSection = $activeSection;

	function setActiveSection(sectionId) {
		activeSection.set(sectionId);
	}
</script>

<!-- Chatbot Builder Sidebar -->
<div
	class="chatbot-builder-sidebar h-screen max-h-[100dvh] min-h-screen select-none w-[72px] shrink-0 text-white text-sm fixed z-50 top-0 left-0 flex flex-col"
	style="background: linear-gradient(180deg, #375A7F 0%, #8B49DE 100%);"
>
	<!-- Logo Section -->
	<div class="h-16 flex items-center justify-center flex-shrink-0">
		<div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
			<span class="text-2xl">🤖</span>
		</div>
	</div>

	<!-- Navigation Icons -->
	<div class="flex flex-col space-y-4 px-3 flex-1">
		<!-- Builder Icon -->
		<button
			class="p-3 rounded-lg hover:bg-white/10 transition {currentSection === 'overview' || currentSection === 'behavior' || currentSection === 'language' || currentSection === 'grading' || currentSection === 'capabilities' || currentSection === 'session' ? 'bg-white/20' : ''}"
			on:click={() => setActiveSection('overview')}
			aria-label="Builder"
		>
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
			</svg>
		</button>

		<!-- Bots Icon -->
		<button
			class="p-3 rounded-lg hover:bg-white/10 transition"
			aria-label="My Bots"
		>
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
			</svg>
		</button>

		<!-- Analytics Icon -->
		<button
			class="p-3 rounded-lg hover:bg-white/10 transition"
			aria-label="Analytics"
		>
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
			</svg>
		</button>

		<!-- Templates Icon -->
		<button
			class="p-3 rounded-lg hover:bg-white/10 transition"
			aria-label="Templates"
		>
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
			</svg>
		</button>
	</div>

	<!-- Bottom Section -->
	<div class="flex flex-col space-y-3 mb-4 px-3">
		<!-- Settings Icon -->
		<button
			class="p-3 rounded-lg hover:bg-white/10 transition"
			aria-label="Settings"
		>
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
			</svg>
		</button>

		<!-- Help Icon -->
		<button
			class="p-3 rounded-lg hover:bg-white/10 transition"
			aria-label="Help"
		>
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
		</button>
	</div>
</div>