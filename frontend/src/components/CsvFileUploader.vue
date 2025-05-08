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
          >
          <div class="form-text">Upload a CSV file with mapping information for crop images.</div>
        </div>
        
        <div class="d-grid gap-2">
          <button 
            type="submit" 
            class="btn btn-primary" 
            :disabled="!selectedFile || loading"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
            Upload CSV File
          </button>
        </div>
      </form>
      
      <div v-if="uploadSuccess" class="alert alert-success mt-3">
        CSV file uploaded successfully! 
        <button @click="processFile" class="btn btn-sm btn-outline-success ms-2" :disabled="processing">
          <span v-if="processing" class="spinner-border spinner-border-sm me-2" role="status"></span>
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
      const file = event.target.files[0];
      if (file) {
        this.selectedFile = file;
        // Set default title based on filename if title is empty
        if (!this.title) {
          this.title = file.name.replace(/\.csv$/i, '');
        }
      }
    },
    
    async uploadFile() {
      if (!this.selectedFile) return;
      
      try {
        const fileData = await this.uploadCsvFile({
          title: this.title,
          file: this.selectedFile
        });
        
        this.uploadSuccess = true;
        this.uploadedFileId = fileData.id;
        this.$emit('file-uploaded', fileData);
        
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
      // Reset the file input by clearing its value
      const fileInput = document.getElementById('csvFile');
      if (fileInput) fileInput.value = '';
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
