import axios from 'axios'

// API URL should match the one in the main store
const API_URL = 'http://127.0.0.1:8000/api'

const cropModule = {
  namespaced: true,
  state: {
    csvFiles: [],
    currentCsvFile: null,
    csvColumns: [],
    csvColumnTypes: {},
    csvData: [],
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
    getCsvColumns: state => state.csvColumns,
    getCsvColumnTypes: state => state.csvColumnTypes,
    getCsvData: state => state.csvData,
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
    removeCsvFile(state, fileId) {
      state.csvFiles = state.csvFiles.filter(file => file.id !== fileId)
    },
    setCurrentCsvFile(state, file) {
      state.currentCsvFile = file
    },
    setCsvColumns(state, columns) {
      state.csvColumns = columns
    },
    setCsvColumnTypes(state, columnTypes) {
      state.csvColumnTypes = columnTypes
    },
    setCsvData(state, data) {
      state.csvData = data
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
    
    uploadCsvFile({ commit, rootGetters }, formData) {
      commit('setLoading', true)
      commit('setError', null)
      
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
    
    processCsvFile({ commit }, fileId) {
      commit('setLoading', true)
      
      return axios.post(`${API_URL}/csv-files/${fileId}/process/`)
        .then(response => {
          commit('setLoading', false)
          return response.data
        })
        .catch(error => {
          commit('setLoading', false)
          commit('setError', error.response?.data || error.message)
          throw error
        })
    },
    
    deleteCsvFile({ commit }, fileId) {
      commit('setLoading', true)
      
      return axios.delete(`${API_URL}/csv-files/${fileId}/`)
        .then(response => {
          commit('removeCsvFile', fileId)
          commit('setLoading', false)
          return { success: true, data: response.data }
        })
        .catch(error => {
          commit('setLoading', false)
          
          // Extract meaningful error message from response
          const errorMessage = error.response?.data?.error || 
                             error.response?.data?.detail ||
                             error.message || 
                             'An error occurred while deleting the file';
          
          commit('setError', errorMessage)
          
          // Return structured error object instead of throwing
          return { 
            success: false, 
            error: errorMessage,
            linkedToImages: errorMessage.includes('linked to') 
          }
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
    },
    
    fetchCsvFilePreview({ commit, rootGetters }, fileId) {
      commit('setLoading', true)
      commit('setError', null)
      
      const headers = rootGetters.isAuthenticated ? { Authorization: `Bearer ${rootGetters.getAuthToken}` } : {}
      
      return axios.get(`${API_URL}/csv-files/${fileId}/preview/`, { headers })
        .then(response => {
          const { columns, column_types } = response.data;
          commit('setCsvColumns', columns)
          commit('setCsvColumnTypes', column_types)
          return response.data
        })
        .catch(error => {
          commit('setError', error.response?.data || 'Failed to fetch CSV preview')
          throw error
        })
        .finally(() => {
          commit('setLoading', false)
        })
    },
    
    fetchCsvData({ commit, rootGetters }, { fileId, selectedColumns = [] }) {
      commit('setLoading', true)
      commit('setError', null)
      
      const headers = rootGetters.isAuthenticated ? { Authorization: `Bearer ${rootGetters.getAuthToken}` } : {}
      let params = { file_id: fileId }
      
      // Add selected columns to query params if provided
      if (selectedColumns && selectedColumns.length > 0) {
        params['columns[]'] = selectedColumns
      }
      
      return axios.get(`${API_URL}/csv-data/`, { headers, params })
        .then(response => {
          commit('setCsvColumns', response.data.columns)
          commit('setCsvData', response.data.rows)
          commit('setCsvColumnTypes', response.data.column_types)
          return response.data
        })
        .catch(error => {
          commit('setError', error.response?.data || 'Failed to fetch CSV data')
          throw error
        })
        .finally(() => {
          commit('setLoading', false)
        })
    }
  }
}

export default cropModule
