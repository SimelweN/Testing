
const FIRST_UPLOAD_KEY = 'rebooked_first_upload_completed';

export const hasCompletedFirstUpload = (userId: string): boolean => {
  const stored = localStorage.getItem(FIRST_UPLOAD_KEY);
  const completedUsers: string[] = stored ? JSON.parse(stored) : [];
  return completedUsers.includes(userId);
};

export const markFirstUploadCompleted = (userId: string): void => {
  const stored = localStorage.getItem(FIRST_UPLOAD_KEY);
  const completedUsers: string[] = stored ? JSON.parse(stored) : [];
  
  if (!completedUsers.includes(userId)) {
    completedUsers.push(userId);
    localStorage.setItem(FIRST_UPLOAD_KEY, JSON.stringify(completedUsers));
  }
};
