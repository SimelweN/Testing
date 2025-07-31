/**
 * Service to track which popups have been shown to users
 * Uses localStorage to persist the information across sessions
 */

export interface PopupTrackingData {
  commitReminderShown: boolean;
  firstUploadShown: boolean;
  postListingShown: boolean;
  shareProfileShown: boolean;
  lastShown: string;
}

const POPUP_TRACKING_KEY = 'rebooked_popup_tracking';

export const getPopupTrackingData = (userId: string): PopupTrackingData => {
  try {
    const stored = localStorage.getItem(`${POPUP_TRACKING_KEY}_${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Error reading popup tracking data:', error);
  }
  
  // Default state - no popups shown
  return {
    commitReminderShown: false,
    firstUploadShown: false,
    postListingShown: false,
    shareProfileShown: false,
    lastShown: new Date().toISOString(),
  };
};

export const updatePopupTrackingData = (userId: string, updates: Partial<PopupTrackingData>): void => {
  try {
    const currentData = getPopupTrackingData(userId);
    const newData = {
      ...currentData,
      ...updates,
      lastShown: new Date().toISOString(),
    };
    localStorage.setItem(`${POPUP_TRACKING_KEY}_${userId}`, JSON.stringify(newData));
  } catch (error) {
    console.warn('Error saving popup tracking data:', error);
  }
};

export const markPopupAsShown = (userId: string, popupType: keyof PopupTrackingData): void => {
  if (popupType === 'lastShown') return; // Don't allow direct setting of lastShown
  updatePopupTrackingData(userId, { [popupType]: true });
};

export const hasPopupBeenShown = (userId: string, popupType: keyof PopupTrackingData): boolean => {
  const data = getPopupTrackingData(userId);
  return data[popupType] === true;
};

export const resetPopupTracking = (userId: string): void => {
  try {
    localStorage.removeItem(`${POPUP_TRACKING_KEY}_${userId}`);
  } catch (error) {
    console.warn('Error resetting popup tracking:', error);
  }
};

export const shouldShowCommitReminder = (userId: string): boolean => {
  return !hasPopupBeenShown(userId, 'commitReminderShown');
};

export const shouldShowFirstUpload = (userId: string): boolean => {
  return !hasPopupBeenShown(userId, 'firstUploadShown');
};

export const shouldShowPostListing = (userId: string): boolean => {
  return !hasPopupBeenShown(userId, 'postListingShown');
};
