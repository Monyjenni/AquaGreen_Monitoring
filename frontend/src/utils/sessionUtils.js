// Session timeout manager
const SESSION_TIMEOUT_KEY = 'lastActivityTime';
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
export function initSessionTimeout(logoutCallback) {
  // Record initial activity
  updateLastActivity();
  
  // Set up activity listeners
  const activityEvents = ['mousedown', 'keypress', 'scroll', 'touchstart'];
  activityEvents.forEach(event => {
    window.addEventListener(event, updateLastActivity);
  });
  
  // Start the timeout checker
  const intervalId = setInterval(() => {
    checkInactivity(logoutCallback);
  }, 60000); // Check every minute
  
  return () => {
    activityEvents.forEach(event => {
      window.removeEventListener(event, updateLastActivity);
    });
    clearInterval(intervalId);
  };
}
export function updateLastActivity() {
  localStorage.setItem(SESSION_TIMEOUT_KEY, Date.now().toString());
}


export function checkInactivity(logoutCallback) {
  const lastActivity = localStorage.getItem(SESSION_TIMEOUT_KEY);
  
  if (!lastActivity) {
    updateLastActivity();
    return;
  }
  
  const now = Date.now();
  const lastActivityTime = parseInt(lastActivity, 10);
  const timeSinceLastActivity = now - lastActivityTime;
  
  if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
    localStorage.removeItem(SESSION_TIMEOUT_KEY);
    logoutCallback();
  }
}
