<template>
  <div class="image-uploader card">
    <div class="card-header bg-light">
      <h5 class="mb-0">Upload Crop Images</h5>
    </div>
    <div class="card-body">
      <form @submit.prevent="uploadImages">
        <div class="mb-3">
          <label for="csvFile" class="form-label">CSV Mapping File</label>
          <select 
            class="form-select" 
            id="csvFile" 
            v-model="selectedCsvId"
            required
          >
            <option value="">Select a CSV mapping file</option>
            <option v-for="file in csvFiles" :key="file.id" :value="file.id">
              {{ file.title }}
            </option>
          </select>
          <div class="form-text">Select a CSV file to associate with these images.</div>
        </div>
        
        <div class="mb-3">
          <label for="sampleIdPrefix" class="form-label">Sample ID Prefix</label>
          <input 
            type="text" 
            class="form-control" 
            id="sampleIdPrefix" 
            v-model="sampleIdPrefix" 
            placeholder="IMG"
          >
          <div class="form-text">Images will be named with this prefix followed by sequential numbers.</div>
        </div>
        
        <div class="mb-3">
          <label for="cropImages" class="form-label">Crop Images</label>
          <input 
            type="file" 
            class="form-control" 
            id="cropImages" 
            @change="handleFileSelection"
            accept="image/*"
            multiple
            required
          >
          <div class="form-text">You can select multiple image files at once.</div>
        </div>
        
        <div v-if="selectedFiles.length > 0" class="selected-files mb-3">
          <h6>Selected Files ({{ selectedFiles.length }}):</h6>
          <ul class="list-group">
            <li v-for="(file, index) in selectedFilesToShow" :key="index" class="list-group-item">
              {{ file.name }} ({{ formatFileSize(file.size) }})
            </li>
            <li v-if="selectedFiles.length > 5" class="list-group-item text-center">
              ... and {{ selectedFiles.length - 5 }} more files
            </li>
          </ul>
        </div>
        
        <div class="progress mb-3" v-if="uploading">
          <div 
            class="progress-bar progress-bar-striped progress-bar-animated" 
            role="progressbar" 
            :style="{ width: uploadProgress + '%' }" 
            :aria-valuenow="uploadProgress" 
            aria-valuemin="0" 
            aria-valuemax="100"
          >
            {{ uploadProgress }}%
          </div>
        </div>
        
        <div class="d-grid gap-2">
          <button 
            type="submit" 
            class="btn btn-primary" 
            :disabled="!selectedFiles.length || !selectedCsvId || uploading"
          >
            <span v-if="uploading" class="spinner-border spinner-border-sm me-2" role="status"></span>
            Upload Images
          </button>
        </div>
      </form>
      
      <div v-if="uploadSuccess" class="alert alert-success mt-3">
        {{ uploadedFiles }} images uploaded successfully!
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'CropImageUploader',
  data() {
    return {
      selectedCsvId: '',
      sampleIdPrefix: 'IMG',
      selectedFiles: [],
      uploading: false,
      uploadProgress: 0,
      uploadSuccess: false,
      uploadedFiles: 0
    }
  },
  computed: {
    ...mapGetters('crop', ['getCsvFiles']),
    csvFiles() {
      return this.getCsvFiles;
    },
    selectedFilesToShow() {
      // Show only first 5 files to avoid cluttering the UI
      return this.selectedFiles.slice(0, 5);
    }
  },
  mounted() {
    this.fetchCsvFiles();
  },
  methods: {
    ...mapActions('crop', ['fetchCsvFiles', 'uploadCropImages']),
    
    handleFileSelection(event) {
      const files = Array.from(event.target.files);
      this.selectedFiles = files;
      this.uploadSuccess = false;
    },
    
    async uploadImages() {
      if (!this.selectedFiles.length || !this.selectedCsvId) return;
      
      this.uploading = true;
      this.uploadProgress = 0;
      
      try {
        // Simulating upload progress
        const progressInterval = setInterval(() => {
          if (this.uploadProgress < 90) {
            this.uploadProgress += 10;
          }
        }, 300);
        
        const result = await this.uploadCropImages({
          csvFileId: this.selectedCsvId,
          images: this.selectedFiles,
          sampleIdPrefix: this.sampleIdPrefix
        });
        
        clearInterval(progressInterval);
        this.uploadProgress = 100;
        
        this.uploadSuccess = true;
        this.uploadedFiles = result.images ? result.images.length : 0;
        this.$emit('images-uploaded', result);
        
        // Reset form for next upload
        this.resetForm();
      } catch (error) {
        console.error('Error uploading images:', error);
        this.$toast?.error('Failed to upload images. Please try again.');
      } finally {
        setTimeout(() => {
          this.uploading = false;
        }, 500); // Keep progress bar visible briefly
      }
    },
    
    resetForm() {
      this.selectedFiles = [];
      // Reset the file input by clearing its value
      const fileInput = document.getElementById('cropImages');
      if (fileInput) fileInput.value = '';
    },
    
    formatFileSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
      else return (bytes / 1048576).toFixed(1) + ' MB';
    }
  }
}
</script>

<style scoped>
.image-uploader {
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s ease;
}

.image-uploader:hover {
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.selected-files {
  max-height: 200px;
  overflow-y: auto;
}
</style>
