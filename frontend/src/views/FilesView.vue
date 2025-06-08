<template>
  <div class="files-view">
    <div class="mb-4">
      <router-link to="/" class="btn btn-sm btn-outline-secondary">
        <i class="bi bi-arrow-left me-1"></i> Back
      </router-link>
      <h2 class="mt-3">Greenhouse Data Files</h2>
    </div>
    
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-success" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading files...</p>
    </div>
    
    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>
    
    <div v-else-if="files.length === 0" class="alert alert-info">
      <p class="mb-0">No files uploaded yet. <router-link to="/upload-greenhouse" class="alert-link">Upload your first file</router-link>.</p>
    </div>
    
    <div v-else>
      <div class="mb-3">
        <div class="input-group">
          <span class="input-group-text bg-success text-white">
            <i class="bi bi-search"></i>
          </span>
          <input 
            type="text" 
            class="form-control border-success" 
            placeholder="Search files..." 
            v-model="searchTerm"
          >
        </div>
      </div>
      
      <div class="table-responsive">
        <table class="table table-hover">
          <thead class="bg-success text-white">
            <tr>
              <th>Title</th>
              <th>Upload Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="file in filteredFiles" :key="file.id">
              <td>{{ file.title }}</td>
              <td>{{ formatDate(file.uploaded_at) }}</td>
              <td>
                <span 
                  class="badge" 
                  :class="file.processed ? 'bg-success' : 'bg-warning text-dark'"
                >
                  {{ file.processed ? 'Processed' : 'Pending' }}
                </span>
              </td>
              <td>
                <div class="btn-group">
                  <router-link 
                    :to="{ name: 'file-detail', params: { id: file.id }}" 
                    class="btn btn-sm btn-outline-success"
                  >
                    View Details
                  </router-link>
                  <button 
                    v-if="!file.processed" 
                    class="btn btn-sm btn-success" 
                    @click="processFile(file.id)"
                    :disabled="processingFile === file.id"
                  >
                    <span v-if="processingFile === file.id" class="spinner-border spinner-border-sm me-1"></span>
                    Process
                  </button>
                  <button 
                    class="btn btn-sm btn-outline-danger" 
                    @click="confirmDeleteFile(file)"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="mt-4 text-center">
        <router-link to="/upload-greenhouse" class="btn btn-success">
          <i class="bi bi-upload me-1"></i> Upload New File
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  name: 'FilesView',
  data() {
    return {
      searchTerm: '',
      processingFile: null
    }
  },
  computed: {
    ...mapState(['files', 'loading', 'error']),
    filteredFiles() {
      if (!this.searchTerm) return this.files
      
      const term = this.searchTerm.toLowerCase()
      return this.files.filter(file => 
        file.title.toLowerCase().includes(term)
      )
    }
  },
  created() {
    this.loadFiles()
  },
  methods: {
    ...mapActions(['fetchFiles', 'processFile', 'deleteFile']),
    async loadFiles() {
      try {
        console.log('Fetching files...');
        const files = await this.$store.dispatch('fetchFiles');
        console.log('Files fetched:', files);
        if (files && files.length === 0) {
          console.log('No files returned from API');
        }
      } catch (error) {
        console.error('Error fetching files:', error);
        this.$toast.error('Failed to load files');
      }
    },
    async processFile(fileId) {
      this.processingFile = fileId
      
      try {
        await this.$store.dispatch('processFile', fileId)
        await this.fetchFiles()
        this.$toast.success('File processed successfully')
      } catch (error) {
        const errorMessage = error.response?.data?.error || 
                           error.response?.data?.detail || 
                           error.message || 
                           'Failed to process file';
                           
        if(errorMessage.includes('is not a zip file')) {
          this.$toast.error('The file format is not supported. Please ensure you are uploading a valid Excel file.', {
            timeout: 6000
          });
        } else {
          this.$toast.error(`Processing error: ${errorMessage}`, {
            timeout: 5000
          });
        }
        console.error('Error processing file:', error)
      } finally {
        this.processingFile = null
      }
    },
    async confirmDeleteFile(file) {
      if (confirm(`Are you sure you want to delete ${file.title}?`)) {
        try {
          await this.$store.dispatch('deleteFile', file.id)
          await this.fetchFiles()
          this.$toast.success('File deleted successfully')
        } catch (error) {
          this.$toast.error('Failed to delete file')
          console.error('Error deleting file:', error)
        }
      }
    },
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    }
  }
}
</script>

<style scoped>
.table {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.table thead th {
  border-bottom: none;
}

.badge {
  font-weight: 500;
  padding: 0.5em 0.8em;
}

.btn-group .btn {
  margin-right: 5px;
}
</style>
