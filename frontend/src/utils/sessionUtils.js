
const SESSION_TIMEOUT_KEY = 'lastActivityTime';
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;
export function initSessionTimeout(logoutCallback) {

  updateLastActivity();
  

  const activityEvents = ['mousedown', 'keypress', 'scroll', 'touchstart'];
  activityEvents.forEach(event => {
    window.addEventListener(event, updateLastActivity);
  });
  

  const intervalId = setInterval(() => {
    checkInactivity(logoutCallback);
  }, 60000);
  
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
