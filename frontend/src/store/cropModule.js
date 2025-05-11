import axios from 'axios'

// API URL should match the one in the main store
const API_URL = 'http://127.0.0.1:8000/api'

const cropModule = {
  namespaced: true,
  state: {
    csvFiles: [],
    currentCsvFile: null,
    cropImages: [],
    currentCropImage: null,
    metadata: [],
    metadataLabels: [],
    loading: false,
    error: null
  },
  getters: {
    getCsvFiles: state => state.csvFiles,
    getCurrentCsvFile: state => state.currentCsvFile,
    getCropImages: state => state.cropImages,
    getCurrentCropImage: state => state.currentCropImage,
    getMetadata: state => state.metadata,
    getMetadataLabels: state => state.metadataLabels,
    isLoading: state => state.loading,
    getError: state => state.error
  },
  mutations: {
    setCsvFiles(state, files) {
      state.csvFiles = files
    },
    setCurrentCsvFile(state, file) {
      state.currentCsvFile = file
    },
    setCropImages(state, images) {
      state.cropImages = images
    },
    setCurrentCropImage(state, image) {
      state.currentCropImage = image
    },
    setMetadata(state, metadata) {
      state.metadata = metadata
    },
    setMetadataLabels(state, labels) {
      state.metadataLabels = labels
    },
    setLoading(state, loading) {
      state.loading = loading
    },
    setError(state, error) {
      state.error = error
    },
    addCsvFile(state, file) {
      state.csvFiles.unshift(file)
    },
    addCropImage(state, image) {
      state.cropImages.unshift(image)
    },
    updateCropImage(state, updatedImage) {
      const index = state.cropImages.findIndex(img => img.id === updatedImage.id)
      if (index !== -1) {
        state.cropImages.splice(index, 1, updatedImage)
      }
    }
  },
  actions: {
    // CSV File actions
    fetchCsvFiles({ commit, rootGetters }) {
      commit('setLoading', true)
      commit('setError', null)
      
      const headers = rootGetters.isAuthenticated ? { Authorization: `Bearer ${rootGetters.getAuthToken}` } : {}
      
      return axios.get(`${API_URL}/csv-files/`, { headers })
        .then(response => {
          commit('setCsvFiles', response.data)
          return response.data
        })
        .catch(error => {
          commit('setError', error.response?.data || 'Failed to fetch CSV files')
          throw error
        })
        .finally(() => {
          commit('setLoading', false)
        })
    },
    
    fetchCsvFile({ commit, rootGetters }, fileId) {
      commit('setLoading', true)
      commit('setError', null)
      
      const headers = rootGetters.isAuthenticated ? { Authorization: `Bearer ${rootGetters.getAuthToken}` } : {}
      
      return axios.get(`${API_URL}/csv-files/${fileId}/`, { headers })
        .then(response => {
          commit('setCurrentCsvFile', response.data)
          return response.data
        })
        .catch(error => {
          commit('setError', error.response?.data || 'Failed to fetch CSV file')
          throw error
        })
        .finally(() => {
          commit('setLoading', false)
        })
    },
    
    uploadCsvFile({ commit, rootGetters }, { title, file }) {
      commit('setLoading', true)
      commit('setError', null)
      
      const formData = new FormData()
      formData.append('title', title)
      formData.append('file', file)
      
      const headers = {
        'Content-Type': 'multipart/form-data',
        ...(rootGetters.isAuthenticated ? { Authorization: `Bearer ${rootGetters.getAuthToken}` } : {})
      }
      
      return axios.post(`${API_URL}/csv-files/`, formData, { headers })
        .then(response => {
          commit('addCsvFile', response.data)
          return response.data
        })
        .catch(error => {
          commit('setError', error.response?.data || 'Failed to upload CSV file')
          throw error
        })
        .finally(() => {
          commit('setLoading', false)
        })
    },
    
    processCsvFile({ commit, rootGetters }, fileId) {
      commit('setLoading', true)
      commit('setError', null)
      
      const headers = rootGetters.isAuthenticated ? { Authorization: `Bearer ${rootGetters.getAuthToken}` } : {}
      
      return axios.post(`${API_URL}/csv-files/${fileId}/process/`, {}, { headers })
        .then(response => {
          return response.data
        })
        .catch(error => {
          commit('setError', error.response?.data || 'Failed to process CSV file')
          throw error
        })
        .finally(() => {
          commit('setLoading', false)
        })
    },
    
    // Crop Image actions
    fetchCropImages({ commit, rootGetters }, filters = {}) {
      commit('setLoading', true)
      commit('setError', null)
      
      const headers = rootGetters.isAuthenticated ? { Authorization: `Bearer ${rootGetters.getAuthToken}` } : {}
      
      // Build query parameters
      const params = {}
      if (filters.csvFile) params.csv_file = filters.csvFile
      if (filters.sampleId) params.sample_id = filters.sampleId
      if (filters.metadataLabel) params.metadata_label = filters.metadataLabel
      if (filters.metadataValue) params.metadata_value = filters.metadataValue
      
      return axios.get(`${API_URL}/crop-images/`, { headers, params })
        .then(response => {
          commit('setCropImages', response.data)
          return response.data
        })
        .catch(error => {
          commit('setError', error.response?.data || 'Failed to fetch crop images')
          throw error
        })
        .finally(() => {
          commit('setLoading', false)
        })
    },
    
    fetchCropImage({ commit, rootGetters }, imageId) {
      commit('setLoading', true)
      commit('setError', null)
      
      const headers = rootGetters.isAuthenticated ? { Authorization: `Bearer ${rootGetters.getAuthToken}` } : {}
      
      return axios.get(`${API_URL}/crop-images/${imageId}/`, { headers })
        .then(response => {
          commit('setCurrentCropImage', response.data)
          return response.data
        })
        .catch(error => {
          commit('setError', error.response?.data || 'Failed to fetch crop image')
          throw error
        })
        .finally(() => {
          commit('setLoading', false)
        })
    },
    
    uploadCropImages({ commit, rootGetters }, formData) {
      commit('setLoading', true)
      commit('setError', null)
      
      const headers = {
        ...(rootGetters.isAuthenticated ? { Authorization: `Bearer ${rootGetters.getAuthToken}` } : {})
      }
      
      return axios.post(`${API_URL}/crop-images/upload_images/`, formData, { headers })
        .then(response => {
          // Add the newly uploaded images to the state
          if (response.data.images && Array.isArray(response.data.images)) {
            response.data.images.forEach(image => {
              commit('addCropImage', image)
            })
          }
          return response.data
        })
        .catch(error => {
          commit('setError', error.response?.data?.error || 'Failed to upload images')
          throw error
        })
        .finally(() => {
          commit('setLoading', false)
        })
    },
    
    // Metadata actions
    fetchMetadataLabels({ commit, rootGetters }) {
      commit('setLoading', true)
      
      const headers = rootGetters.isAuthenticated ? { Authorization: `Bearer ${rootGetters.getAuthToken}` } : {}
      
      return axios.get(`${API_URL}/crop-images/metadata_labels/`, { headers })
        .then(response => {
          commit('setMetadataLabels', response.data)
          return response.data
        })
        .catch(error => {
          console.error('Failed to fetch metadata labels:', error)
          // Don't set error state for this non-critical operation
          return []
        })
        .finally(() => {
          commit('setLoading', false)
        })
    },
    
    addMetadataToImage({ commit, rootGetters }, { imageId, metadata }) {
      commit('setLoading', true)
      commit('setError', null)
      
      const headers = rootGetters.isAuthenticated ? { Authorization: `Bearer ${rootGetters.getAuthToken}` } : {}
      
      return axios.post(`${API_URL}/crop-images/${imageId}/add_metadata/`, { metadata }, { headers })
        .then(response => {
          // If we have the current image open, update it with the new metadata
          if (response.data.metadata && Array.isArray(response.data.metadata)) {
            return this.dispatch('crop/fetchCropImage', imageId)
          }
          return response.data
        })
        .catch(error => {
          commit('setError', error.response?.data || 'Failed to add metadata')
          throw error
        })
        .finally(() => {
          commit('setLoading', false)
        })
    }
  }
}

export default cropModule
