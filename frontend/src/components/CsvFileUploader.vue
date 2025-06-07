<template>
  <div class="csv-uploader card">
    <div class="card-header bg-light">
      <h5 class="mb-0">Upload CSV Mapping File</h5>
    </div>
    <div class="card-body">
      <form @submit.prevent="uploadFile">
        <div class="mb-3">
          <label for="fileTitle" class="form-label">Title</label>
          <input 
            type="text" 
            class="form-control" 
            id="fileTitle" 
            v-model="title" 
            placeholder="Enter a descriptive title"
            required
          >
        </div>
        
        <div class="mb-3">
          <label for="csvFile" class="form-label">CSV File</label>
          <input 
            type="file" 
            class="form-control" 
            id="csvFile" 
            @change="handleFileSelection"
            accept=".csv"
            required
            :class="{ 'is-invalid': fileError }"
          >
          <div class="invalid-feedback" v-if="fileError">{{ fileError }}</div>
          <div class="form-text">Upload a CSV file containing a <code>F5 Code</code> column to match with your fruit images.</div>
        </div>
        
        <div class="d-grid gap-2">
          <button 
            type="submit" 
            class="btn btn-success" 
            :disabled="!selectedFile || loading"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
            <span v-if="loading" class="visually-hidden">Loading...</span>
            Upload CSV File
          </button>
        </div>
      </form>
      
      <div v-if="uploadSuccess" class="alert alert-success mt-3" role="alert">
        CSV file uploaded successfully! 
        <button @click="processFile" class="btn btn-sm btn-outline-success ms-2" :disabled="processing">
          <span v-if="processing" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
          <span v-if="processing" class="visually-hidden">Processing...</span>
          Process Now
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'CsvFileUploader',
  data() {
    return {
      title: '',
      selectedFile: null,
      uploadSuccess: false,
      uploadedFileId: null,
      processing: false,
      fileError: '',
    }
  },
  computed: {
    ...mapGetters(['isLoading']),
    loading() {
      return this.isLoading;
    }
  },
  methods: {
    ...mapActions('crop', ['uploadCsvFile', 'processCsvFile']),
    
    handleFileSelection(event) {
      this.fileError = '';
      const file = event.target.files[0];
      
      if (!file) {
        return;
      }
      
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        this.fileError = 'Please select a valid CSV file';
        this.selectedFile = null;
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.fileError = 'File size exceeds the maximum limit of 10MB';
        this.selectedFile = null;
        return;
      }
      
      // Read the file to check for F5 Code column and validate CSV format
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          const lines = content.split('\n').filter(line => line.trim() !== '');
          
          if (lines.length === 0) {
            this.fileError = 'CSV file appears to be empty';
            this.selectedFile = null;
            return;
          }
          
          const firstLine = lines[0].toLowerCase();
          const columnCount = firstLine.split(',').length;
          
          if (columnCount < 2) {
            this.fileError = 'CSV file must have at least two columns';
            this.selectedFile = null;
            return;
          }
          
          if (!firstLine.includes('f5 code')) {
            this.fileError = 'CSV file must contain a "F5 Code" column';
            this.selectedFile = null;
            return;
          }
          
          // Check for data consistency in the first few rows
          if (lines.length > 1) {
            for (let i = 1; i < Math.min(5, lines.length); i++) {
              const rowColumns = lines[i].split(',').length;
              if (rowColumns !== columnCount) {
                this.fileError = 'CSV file has inconsistent column counts. Please check your data.';
                this.selectedFile = null;
                return;
              }
            }
          }
          
          this.selectedFile = file;
          // Set default title based on filename if title is empty
          if (!this.title) {
            this.title = file.name.replace(/\.csv$/i, '');
          }
        } catch (error) {
          console.error('Error parsing CSV header:', error);
          this.fileError = 'Error reading file. Please try again.';
          this.selectedFile = null;
        }
      };
      
      reader.onerror = () => {
        this.fileError = 'Error reading file. Please try again.';
        this.selectedFile = null;
      };
      
      reader.readAsText(file);
    },
    
    async uploadFile() {
      if (!this.selectedFile) return;
      
      try {
        const formData = new FormData();
        formData.append('name', this.title); // Changed from 'title' to 'name' to match backend
        formData.append('file', this.selectedFile);
        
        const fileData = await this.uploadCsvFile(formData);
        
        this.uploadSuccess = true;
        this.uploadedFileId = fileData.id;
        this.$emit('file-uploaded', fileData);
        
        // Display success toast
        this.$toast?.success('CSV file uploaded successfully!');
        
        // Reset form for next upload
        this.resetForm();
      } catch (error) {
        console.error('Error uploading file:', error);
        this.$toast?.error('Failed to upload file. Please try again.');
      }
    },
    
    async processFile() {
      if (!this.uploadedFileId) return;
      
      this.processing = true;
      try {
        const result = await this.processCsvFile(this.uploadedFileId);
        this.$toast?.success(`CSV file processed successfully! ${result.created} records created.`);
        this.$emit('file-processed', { id: this.uploadedFileId, result });
      } catch (error) {
        console.error('Error processing file:', error);
        this.$toast?.error('Failed to process file. Please try again.');
      } finally {
        this.processing = false;
        this.uploadSuccess = false;
        this.uploadedFileId = null;
      }
    },
    
    resetForm() {
      this.title = '';
      this.selectedFile = null;
      this.uploadSuccess = false;
      // Reset the file input by clearing its value
      const fileInput = document.getElementById('csvFile');
      if (fileInput) fileInput.value = '';
      
      // Wait one tick to ensure DOM updates
      this.$nextTick(() => {
        // Force re-render of the file input
        const container = document.querySelector('.csv-uploader');
        if (container) container.style.opacity = '0.99';
        setTimeout(() => {
          if (container) container.style.opacity = '1';
        }, 10);
      });
    }
  }
}
</script>

<style scoped>
.csv-uploader {
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s ease;
}

.csv-uploader:hover {
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
</style>
