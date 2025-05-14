import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap/dist/js/bootstrap.bundle.js'
import axios from 'axios'

// Clear login session when the app is first loaded
// Using modern approach instead of deprecated navigation API
const clearLoginSession = () => {
  // Clear localStorage tokens to force login
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
  
  // Also clear Vuex state
  store?.commit('clearAuth')
}

// Check if this is a fresh page load (not a refresh)
if (window.location.href.includes('://localhost:8080/')) {
  clearLoginSession()
}

const app = createApp(App)
  .use(store)
  .use(router)

// Create a better toast plugin with more visually appealing design
app.config.globalProperties.$toast = {
  success(message) {
    this._showToast(message, 'success', 'bi-check-circle-fill');
  },
  error(message) {
    this._showToast(message, 'danger', 'bi-exclamation-triangle-fill');
  },
  warning(message) {
    this._showToast(message, 'warning', 'bi-exclamation-circle-fill');
  },
  info(message) {
    this._showToast(message, 'info', 'bi-info-circle-fill');
  },
  _showToast(message, type, icon) {
    const toastContainer = document.getElementById('toast-container') || this._createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast show toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
      <div class="toast-header bg-${type} text-white">
        <i class="bi ${icon} me-2"></i>
        <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">
        ${message}
      </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300); // Remove after animation
    }, 5000);
    
    // Add click listener to close button
    const closeBtn = toast.querySelector('.btn-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
      });
    }
  },
  _createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '1080';
    
    // Add styles for animations
    const style = document.createElement('style');
    style.textContent = `
      .toast { 
        opacity: 1; 
        transition: opacity 0.3s ease-out; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        margin-bottom: 10px;
      }
      .toast.fade-out { 
        opacity: 0; 
      }
      .toast-success { border-left: 4px solid #198754; }
      .toast-danger { border-left: 4px solid #dc3545; }
      .toast-warning { border-left: 4px solid #ffc107; }
      .toast-info { border-left: 4px solid #0dcaf0; }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(container);
    return container;
  }
}

axios.defaults.baseURL = 'http://127.0.0.1:8000/api'

axios.interceptors.request.use(
  config => {
    if (store.getters.isAuthenticated) {
      // Ensure we're using the proper token format for Django Rest Framework
      config.headers.Authorization = `Bearer ${store.getters.getAuthToken}`
    }
    return config
  },
  error => Promise.reject(error)
)

axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        await store.dispatch('refreshToken')
        const token = store.getters.getAuthToken
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        originalRequest.headers['Authorization'] = `Bearer ${token}`
        return axios(originalRequest)
      } catch (err) {
        // Display toast error on authentication failure
        app.config.globalProperties.$toast.error('Session expired. Please log in again.')
        store.commit('clearAuth')
        router.push('/login')
        return Promise.reject(err)
      }
    }
    return Promise.reject(error)
  }
)

app.mount('#app')
