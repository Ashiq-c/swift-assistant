// Fallback splash screen removal
console.log('🔄 Loader.js executing...');

// Remove splash screen after a maximum timeout to prevent infinite loading
const SPLASH_TIMEOUT = 10000; // 10 seconds

let splashRemoved = false;

function removeSplashScreen() {
  if (splashRemoved) return;

  const splash = document.getElementById('splash-screen');
  if (splash) {
    console.log('🗑️ Removing splash screen (fallback)');
    splash.remove();
    splashRemoved = true;
  }
}

// Try to remove splash screen when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded, waiting for app initialization...');
    // Give the app 3 seconds to initialize, then remove splash screen
    setTimeout(removeSplashScreen, 3000);
  });
} else {
  // DOM is already ready
  console.log('📄 DOM already ready, waiting for app initialization...');
  setTimeout(removeSplashScreen, 3000);
}

// Absolute fallback - remove splash screen after timeout regardless
setTimeout(() => {
  if (!splashRemoved) {
    console.log('⏰ Timeout reached, force removing splash screen');
    removeSplashScreen();
  }
}, SPLASH_TIMEOUT);

// Also try to remove when window loads
window.addEventListener('load', () => {
  console.log('🪟 Window loaded');
  setTimeout(removeSplashScreen, 1000);
});

console.log('✅ Loader.js setup complete');