<script lang="ts">
	import { toast } from 'svelte-sonner';

	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	import { getSessionUser, userSignIn, userSignUp } from '$lib/apis/auths';
	import { config, user } from '$lib/stores';

	import OnBoarding from '$lib/components/OnBoarding.svelte';

	let loaded = false;
	let mode = 'signin';

	let name = '';
	let email = '';
	let password = '';
	let errorMessage = '';
	let isLoading = false;

	let onboarding = false;

	const querystringValue = (key: string) => {
		const urlParams = new URLSearchParams(window.location.search);
		return urlParams.get(key);
	};

	const checkOauthCallback = async () => {
		const code = querystringValue('code');
		const state = querystringValue('state');

		if (code && state) {
			const url = new URL(window.location.href);
			url.searchParams.delete('code');
			url.searchParams.delete('state');
			window.history.replaceState({}, document.title, url.toString());

			const sessionUser = await getSessionUser(localStorage.token).catch((error) => {
				toast.error(error);
				return null;
			});

			if (sessionUser) {
				const redirectPath = querystringValue('redirect') || '/home';
				goto(redirectPath);
			}
		}
	};

	const signInHandler = async () => {
		const sessionUser = await getSessionUser(localStorage.token).catch((error) => {
			toast.error(error);
			return null;
		});

		if (sessionUser) {
			const redirectPath = querystringValue('redirect') || '/home';
			goto(redirectPath);
		}
	};

	const signInSubmitHandler = async () => {
		// Clear any previous error and set loading state
		errorMessage = '';
		isLoading = true;

		try {
			const formdata = new FormData();
			formdata.append("email", email);
			formdata.append("password", password);

			const requestOptions: RequestInit = {
				method: "POST",
				body: formdata,
				redirect: "follow" as RequestRedirect
			};

			const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}api/v1/signin/`, requestOptions);
			const result = await response.json();

			if (result.result === "success") {
				// Store the tokens in localStorage
				localStorage.setItem('token', result.token.access_token);
				localStorage.setItem('refresh_token', result.token.refresh_token);
				localStorage.setItem('token_type', result.token.token_type);
				localStorage.setItem('token_scope', result.token.scope);

				// Redirect to chat page with the chat_id
				goto(`/c/${result.chat_id}`);
			} else {
				// Show error message
				errorMessage = result.message || 'Login failed. Please check your credentials.';
			}
		} catch (error) {
			console.error('Login error:', error);
			errorMessage = 'Network error. Please try again.';
		} finally {
			// Always reset loading state
			isLoading = false;
		}
	};

	const signUpSubmitHandler = async () => {
		const sessionUser = await userSignUp(name, email, password, '').catch((error) => {
			toast.error(error);
			return null;
		});

		if (sessionUser) {
			const redirectPath = querystringValue('redirect') || '/home';
			goto(redirectPath);
		}
	};

	// Simple loader animation
	const showMainContent = () => {
		setTimeout(() => {
			loaded = true;
		}, 1500); // Show for 1.5 seconds
	};

	onMount(async () => {
		// Start simple loader
		showMainContent();

		// Check OAuth callback first
		await checkOauthCallback();

		// Only redirect if we have a valid session token and can verify the user
		if (localStorage.token) {
			try {
				const sessionUser = await getSessionUser(localStorage.token);
				if (sessionUser) {
					const redirectPath = querystringValue('redirect') || '/home';
					goto(redirectPath);
					return;
				}
			} catch (error) {
				// Invalid token, clear it and show signin
				localStorage.removeItem('token');
			}
		}

		// Check if auth is disabled (for development/custom API mode)
		if (($config?.features?.auth_trusted_header ?? false) || $config?.features?.auth === false) {
			await signInHandler();
		} else {
			onboarding = false;
		}
	});
</script>

<svelte:head>
	<title>Swift</title>
</svelte:head>

<OnBoarding
	bind:show={onboarding}
	getStartedHandler={() => {
		onboarding = false;
		mode = 'signup';
	}}
/>

<div class="w-full h-screen max-h-[100dvh] text-white relative">
	<!-- Splash Screen with Loader -->
	{#if !loaded}
		<div 
			id="signin-splash-screen"
			class="fixed inset-0 z-50 flex items-center justify-center"
			style="background: linear-gradient(180deg, #375a7f 0%, #8b49de 100%);"
		>
			<div class="flex flex-col items-center">
				<!-- Swift Logo -->
				<div class="mb-8 animate-pulse">
					<img
						src={'/assets/images/swift_logo.png'}
						alt="Swift Logo"
						class="w-24 h-24 object-contain"
					/>
				</div>

				<!-- Loading Text -->
				<!-- <div class="mt-4 text-white text-sm opacity-80 animate-pulse">
					Initializing Swift...
				</div> -->
			</div>
		</div>
	{/if}

	<div class="w-full h-full absolute top-0 left-0" style="background: linear-gradient(180deg, #375a7f 0%, #8b49de 100%);"></div>

	<div class="w-full absolute top-0 left-0 right-0 h-8 drag-region" />

	{#if loaded}
		<div class="fixed m-10 z-50 animate-fade-in">
			<div class="flex space-x-2">
				<div class=" self-center">
					<div class="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
						S
					</div>
				</div>
			</div>
		</div>

		<div class="relative z-50 w-full h-full px-5 py-4">
			<div class="w-full h-full flex justify-center items-center">
				<div class="w-full max-w-md">
					<div class="text-center text-white mb-8">
						<div class="flex justify-center mb-4">
							<img
								src={'/assets/images/swift_logo.png'}
								alt="Swift Logo"
								class="w-16 h-16 object-contain"
							/>
						</div>
						<div class="text-lg font-medium mb-2">Welcome Back</div>
						<div class="text-sm text-white/80">
							Sign in to continue to your account
						</div>
					</div>

					<div class="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
						{#if errorMessage}
							<div class="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-white text-sm">
								{errorMessage}
							</div>
						{/if}

						<form class="flex flex-col space-y-4" on:submit|preventDefault>
							{#if mode === 'signup'}
								<div>
									<label class="block text-sm font-medium text-white mb-2">
										Full Name
									</label>
									<input
										bind:value={name}
										type="text"
										class="w-full rounded-xl py-3 px-4 text-white bg-white/20 border border-white/30 placeholder-white/60 outline-none focus:border-white/50 focus:bg-white/25 transition-all"
										autocomplete="name"
										placeholder="Enter your full name"
										required
									/>
								</div>
							{/if}

							<div>
								<label class="block text-sm font-medium text-white mb-2">
									Email Address
								</label>
								<input
									bind:value={email}
									type="email"
									class="w-full rounded-xl py-3 px-4 text-white bg-white/20 border border-white/30 placeholder-white/60 outline-none focus:border-white/50 focus:bg-white/25 transition-all"
									autocomplete="email"
									placeholder="Enter your email"
									required
								/>
							</div>

							<div>
								<label class="block text-sm font-medium text-white mb-2">
									Password
								</label>
								<input
									bind:value={password}
									type="password"
									class="w-full rounded-xl py-3 px-4 text-white bg-white/20 border border-white/30 placeholder-white/60 outline-none focus:border-white/50 focus:bg-white/25 transition-all"
									autocomplete="current-password"
									placeholder="Enter your password"
									required
								/>
							</div>

							<div class="pt-2">
								{#if mode === 'signin'}
									<button
										class="w-full rounded-xl bg-white text-gray-900 py-3 px-4 font-semibold hover:bg-white/90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
										type="submit"
										disabled={isLoading}
										on:click={signInSubmitHandler}
									>
										{#if isLoading}
											<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
												<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
												<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
											Signing In...
										{:else}
											Sign In
										{/if}
									</button>
								{:else}
									<button
										class="w-full rounded-xl bg-white text-gray-900 py-3 px-4 font-semibold hover:bg-white/90 transition-all shadow-lg"
										type="submit"
										on:click={signUpSubmitHandler}
									>
										Create Account
									</button>
								{/if}
							</div>

							<div class="text-center pt-2">
								<button
									class="text-sm text-white/80 hover:text-white transition-colors"
									type="button"
									on:click={() => {
										mode = mode === 'signin' ? 'signup' : 'signin';
									}}
								>
									{mode === 'signin' ? "" : 'Already have an account? Sign in'}
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	.animate-fade-in {
		animation: fade-in 0.5s ease-out;
	}
</style>
