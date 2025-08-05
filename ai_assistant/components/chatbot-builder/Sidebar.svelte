<script>
	// Placeholder for sidebar logic
</script>

<div class="cb-sidebar">
	<div class="cb-sidebar-logo">🤖</div>
	<nav class="cb-sidebar-nav">
		<a href="#" class="cb-sidebar-link active">Builder</a>
		<a href="#" class="cb-sidebar-link">Bots</a>
		<a href="#" class="cb-sidebar-link">Settings</a>
	</nav>
</div>

<style>
.cb-sidebar {
	width: 72px;
	height: 100vh;
	background: linear-gradient(180deg, #375A7F 0%, #8B49DE 100%);
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 24px 0;
}
.cb-sidebar-logo {
	font-size: 2rem;
	margin-bottom: 2rem;
}
.cb-sidebar-nav {
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
}
.cb-sidebar-link {
	color: #fff;
	text-decoration: none;
	font-weight: 500;
	padding: 8px 12px;
	border-radius: 8px;
	transition: background 0.2s;
}
.cb-sidebar-link.active, .cb-sidebar-link:hover {
	background: rgba(255,255,255,0.12);
}
</style>
