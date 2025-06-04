import { createStore } from 'vuex'
import axios from 'axios'
import cropModule from './cropModule'

// Dynamically determine API URL based on hostname
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:8000/api'
  : `http://${window.location.hostname}:8000/api`

export default createStore({
  modules: {
    crop: cropModule
  },
  state: {
    files: [],
    currentFile: null,
    processedData: [],
    loading: false,
    error: null,
    // Authentication state
    token: localStorage.getItem('token') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
    isAuthenticated: !!localStorage.getItem('token')
  },
  getters: {
    isAuthenticated: state => state.isAuthenticated,
    currentUser: state => state.user,
    getAuthToken: state => state.token,
    getFiles: state => state.files,
    getCurrentFile: state => state.currentFile,
    getProcessedData: state => state.processedData,
    isLoading: state => state.loading,
    getError: state => state.error
  },
  mutations: {
    setFiles(state, files) {
      state.files = files
    },
    setCurrentFile(state, file) {
      state.currentFile = file
    },
    setProcessedData(state, data) {
      state.processedData = data
    },
    setLoading(state, loading) {
      state.loading = loading
    },
    setError(state, error) {
      state.error = error
    },
    // Authentication mutations
    setAuth(state, { token, refreshToken, user }) {
      state.token = token
      state.refreshToken = refreshToken
      state.user = user
      state.isAuthenticated = true
      
      // Store in localStorage
      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('user', JSON.stringify(user))
    },
    clearAuth(state) {
      state.token = null
      state.refreshToken = null
      state.user = null
      state.isAuthenticated = false
      
      // Clear localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    },
    removeFile(state, fileId) {
      state.files = state.files.filter(file => file.id !== fileId)
    }
  },
  actions: {
    // Authentication actions
    registerUser({ commit }, userData) {
      commit('setLoading', true)
      commit('setError', null)
      
      console.log('Registration request payload:', userData)
      console.log('Registration endpoint:', `${API_URL}/auth/register/`)
      
      return axios.post(`${API_URL}/auth/register/`, userData)
        .then(response => {
          console.log('Registration success response:', response.data)
          
          // Check if registration requires email verification
          if (response.data && response.data.success) {
            if (response.data.requires_verification) {
              // Return the response with verification info without setting auth state
              // The UI will redirect to OTP verification
              return response.data;
            } else {
              // Standard flow - set auth state
              const { access, refresh, user } = response.data;
              commit('setAuth', { 
                token: access, 
                refreshToken: refresh, 
                user 
              });
              return response.data;
            }
          } else {
            // If registration failed but no error thrown, treat as error
            commit('setError', response.data.errors || 'Registration failed');
            throw { response };
          }
        })
        .catch(error => {
          if (error.response && error.response.data && error.response.data.errors) {
            commit('setError', error.response.data.errors);
          } else {
            commit('setError', error.response?.data || 'Registration failed');
          }
          throw error;
        })
        .finally(() => {
          commit('setLoading', false);
        });
    },
    
    loginUser({ commit }, credentials) {
      commit('setLoading', true)
      commit('setError', null)
      
      return axios.post(`${API_URL}/auth/login/`, credentials)
        .then(response => {
          const { access, refresh, user } = response.data
          commit('setAuth', { 
            token: access, 
            refreshToken: refresh, 
            user 
          })
          return response
        })
        .catch(error => {
          commit('setError', error.response?.data || 'Login failed')
          throw error
        })
        .finally(() => {
          commit('setLoading', false)
        })
    },
    
    refreshToken({ commit, state }) {
      if (!state.refreshToken) {
        return Promise.reject(new Error('No refresh token available'))
      }
      
      return axios.post(`${API_URL}/auth/token/refresh/`, {
        refresh: state.refreshToken
      })
        .then(response => {
          const { access } = response.data
          
          // Update only the access token
          commit('setAuth', { 
            token: access, 
            refreshToken: state.refreshToken, 
            user: state.user 
          })
          
          return response
        })
        .catch(error => {
          // If refresh token is invalid, log the user out
          commit('clearAuth')
          throw error
        })
    },
    
    logout({ commit }) {
      commit('clearAuth')
      return Promise.resolve()
    },
    
    // File management actions
    fetchFiles({ commit, getters }) {
      commit('setLoading', true)
      commit('setError', null)
      
      console.log('Fetching files with auth token:', getters.isAuthenticated ? 'Token exists' : 'No token')
      
      const headers = getters.isAuthenticated ? { Authorization: `Bearer ${getters.getAuthToken}` } : {}
      
      return axios.get(`${API_URL}/excel-files/`, { headers })
        .then(response => {
          console.log('Files API response:', response)
          if (Array.isArray(response.data)) {
            console.log(`Received ${response.data.length} files from API`)
            commit('setFiles', response.data)
            return response.data
          } else {
            console.warn('API response is not an array:', response.data)
            // Try to handle different response formats
            if (response.data && Array.isArray(response.data.results)) {
              console.log(`Using results array with ${response.data.results.length} files`)
              commit('setFiles', response.data.results)
              return response.data.results
            } else {
              console.error('Could not extract files array from response')
              commit('setFiles', [])
              return []
            }
          }
        })
        .catch(error => {
          console.error('Error fetching files:', error.response?.data || error)
          commit('setError', error.response?.data || 'Failed to fetch files')
          throw error
        })
        .finally(() => {
          commit('setLoading', false)
        })
    },
    
    fetchFile({ commit, getters }, fileId) {
      commit('setLoading', true)
      commit('setError', null)
      
      const headers = getters.isAuthenticated ? { Authorization: `Bearer ${getters.getAuthToken}` } : {}
      
      // Try the detail endpoint first, but fall back to standard endpoint if it fails
      return axios.get(`${API_URL}/excel-files/${fileId}/detail/`, { headers })
        .then(response => {
          commit('setCurrentFile', response.data)
          return response.data
        })
        .catch(error => {
          console.warn('Detail endpoint failed, trying standard endpoint:', error.message)
          // If detail endpoint fails, try the standard endpoint
          return axios.get(`${API_URL}/excel-files/${fileId}/`, { headers })
            .then(response => {
              commit('setCurrentFile', response.data)
              return response.data
            })
            .catch(secondError => {
              console.error('Error fetching file details:', secondError.response?.data || secondError)
              commit('setError', secondError.response?.data?.error || 'Failed to fetch file details')
              throw secondError
            })
        })
        .finally(() => {
          commit('setLoading', false)
        })
    },
    
    uploadFile({ commit, getters, dispatch }, formData) {
      commit('setLoading', true)
      commit('setError', null)
      
      const headers = { 
        ...(getters.isAuthenticated ? { Authorization: `Bearer ${getters.getAuthToken}` } : {})
      }
      
      return axios.post(`${API_URL}/excel-files/`, formData, { headers })
        .then(response => {
          console.log('File upload response:', response.data)
          // After successful upload, refresh the files list
          dispatch('fetchFiles')
          
          // Return the response data with additional info for navigation
          return {
            ...response.data,
            uploadSuccess: true
          }
        })
        .catch(error => {
          console.error('Error uploading file:', error.response?.data || error)
          commit('setError', error.response?.data?.error || 'Failed to upload file')
          throw error
        })
        .finally(() => {
          commit('setLoading', false)
        })
    },
    
    processFile({ commit, getters }, fileId) {
      commit('setLoading', true)
      commit('setError', null)
      
      // Validate fileId before making API call
      if (!fileId || fileId === 'undefined' || fileId === 'null') {
        console.error('Invalid file ID for processing:', fileId);
        commit('setError', 'Invalid file ID');
        commit('setLoading', false);
        return Promise.reject(new Error('Invalid file ID'));
      }
      
      const headers = getters.isAuthenticated ? { Authorization: `Bearer ${getters.getAuthToken}` } : {}
      
      // Set a longer timeout for processing requests
      const requestConfig = {
        headers,
        timeout: 60000 // 60 seconds timeout for processing
      };
      
      return axios.post(`${API_URL}/excel-files/${fileId}/process/`, {}, requestConfig)
        .then(response => {
          console.log('File processing response:', response.data);
          return response.data;
        })
        .catch(error => {
          let errorMessage = error.response?.data?.error || error.response?.data || error.message || 'Failed to process file';
          
          if (typeof errorMessage === 'object') {
            errorMessage = JSON.stringify(errorMessage);
          }
          
          console.error('Error processing file:', errorMessage);
          commit('setError', errorMessage);
          throw error;
        })
        .finally(() => {
          commit('setLoading', false);
        })
    },
    
    fetchProcessedData({ commit, getters }, fileId) {
      commit('setLoading', true)
      commit('setError', null)
      
      // Validate fileId before making API call
      if (!fileId || fileId === 'undefined' || fileId === 'null') {
        console.error('Invalid file ID for processed data:', fileId);
        commit('setProcessedData', []);
        commit('setLoading', false);
        return Promise.resolve([]);
      }
      
      console.log('Fetching processed data for file ID:', fileId);
      const headers = getters.isAuthenticated ? { Authorization: `Bearer ${getters.getAuthToken}` } : {}
      
      // Set a longer timeout for large data requests
      const requestConfig = {
        headers,
        timeout: 30000 // 30 seconds timeout for large data
      };
      
      // Create a retry function that can be called if the first attempt fails
      const fetchWithRetry = (attempt = 1, maxAttempts = 3) => {
        return axios.get(`${API_URL}/processed-data/by_file/?file_id=${fileId}`, requestConfig)
          .then(response => {
            console.log('Processed data response:', response);
            // Handle different response formats
            if (response.data && response.data.success && response.data.data) {
              commit('setProcessedData', response.data.data);
              return response.data.data;
            } else if (Array.isArray(response.data)) {
              commit('setProcessedData', response.data);
              return response.data;
            } else {
              console.warn('Unexpected processed data format:', response.data);
              commit('setProcessedData', []);
              return [];
            }
          })
          .catch(error => {
            // If we haven't exhausted our retry attempts and the error is retriable
            if (attempt < maxAttempts && (error.code === 'ECONNABORTED' || error.response?.status >= 500)) {
              console.warn(`Retrying processed data fetch (attempt ${attempt+1}/${maxAttempts})...`);
              // Exponential backoff for retries
              const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
              
              return new Promise(resolve => {
                setTimeout(() => {
                  resolve(fetchWithRetry(attempt + 1, maxAttempts));
                }, backoffDelay);
              });
            }
            
            // If retries exhausted or error not retriable, handle the error
            console.error('Error fetching processed data:', error.response?.data || error);
            commit('setError', error.response?.data?.error || error.response?.data || 'Failed to fetch processed data');
            commit('setProcessedData', []);
            return [];
          });
      };
      
      // Start the fetch with retry logic
      return fetchWithRetry()
        .finally(() => {
          commit('setLoading', false);
        })
    },
    
    deleteFile({ commit, getters }, fileId) {
      commit('setLoading', true)
      commit('setError', null)
      
      const headers = getters.isAuthenticated ? { Authorization: `Bearer ${getters.getAuthToken}` } : {}
      
      return axios.delete(`${API_URL}/excel-files/${fileId}/`, { headers })
        .then(response => {
          // Remove the file from local state
          commit('removeFile', fileId)
          // Reset current file if it's the one being deleted
          if (getters.getCurrentFile && getters.getCurrentFile.id === fileId) {
            commit('setCurrentFile', null)
          }
          return response.data
        })
        .catch(error => {
          console.error('Error deleting file:', error.response?.data || error)
          commit('setError', error.response?.data?.error || error.response?.data || 'Failed to delete file')
          throw error
        })
        .finally(() => {
          commit('setLoading', false)
        })
    },
    
    fetchUserProfile({ commit, getters }) {
      commit('setLoading', true)
      commit('setError', null)
      
      const headers = getters.isAuthenticated ? { Authorization: `Bearer ${getters.getAuthToken}` } : {}
      
      return axios.get(`${API_URL}/auth/profile/`, { headers })
        .then(response => {
          return response.data
        })
        .catch(error => {
          console.error('Error fetching user profile:', error.response?.data || error)
          commit('setError', error.response?.data?.error || error.response?.data || 'Failed to fetch user profile')
          return Promise.reject(error)
        })
        .finally(() => {
          commit('setLoading', false)
        })
    },
    
    updateProfileImage({ commit, getters }, formData) {
      commit('setLoading', true)
      commit('setError', null)
      
      const headers = { 
        'Authorization': `Bearer ${getters.getAuthToken}`,
        'Content-Type': 'multipart/form-data'
      }
      
      return axios.patch(`${API_URL}/auth/profile/`, formData, { headers })
        .then(response => {
          return response.data
        })
        .catch(error => {
          console.error('Error updating profile image:', error.response?.data || error)
          commit('setError', error.response?.data?.error || error.response?.data || 'Failed to update profile image')
          return Promise.reject(error)
        })
        .finally(() => {
          commit('setLoading', false)
        })
    }
  }
})
