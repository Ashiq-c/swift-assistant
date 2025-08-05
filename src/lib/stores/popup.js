import { writable } from 'svelte/store';

// Popup state store
export const popupState = writable({
  show: false,
  message: '',
  type: 'info',
  title: '',
  autoClose: true,
  autoCloseDelay: 3000
});

// Helper functions to show different types of popups
export const showPopup = (message, type = 'info', options = {}) => {
  popupState.set({
    show: true,
    message,
    type,
    title: options.title || '',
    autoClose: options.autoClose !== false,
    autoCloseDelay: options.autoCloseDelay || 3000
  });
};

export const showSuccessPopup = (message, options = {}) => {
  showPopup(message, 'success', options);
};

export const showErrorPopup = (message, options = {}) => {
  showPopup(message, 'error', options);
};

export const showWarningPopup = (message, options = {}) => {
  showPopup(message, 'warning', options);
};

export const showInfoPopup = (message, options = {}) => {
  showPopup(message, 'info', options);
};

export const hidePopup = () => {
  popupState.update(state => ({
    ...state,
    show: false
  }));
};
