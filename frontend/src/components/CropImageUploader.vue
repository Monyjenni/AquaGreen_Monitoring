<template>
  <div class="image-uploader card">
    <div class="card-header bg-light">
      <h5 class="mb-0">Upload Crop Images</h5>
    </div>
    <div class="card-body">
      <form @submit.prevent="uploadImages">
        <div class="mb-3">
          <label for="csvFile" class="form-label">
            CSV Mapping File
            <i class="bi bi-info-circle ms-1" data-bs-toggle="tooltip" title="Choose a CSV file that contains sample IDs and metadata for your crop images."></i>
          </label>
          <select 
            class="form-select" 
            id="csvFile" 
            v-model="selectedCsvId"
            required
          >
            <option value="">Select a CSV mapping file</option>
            <option v-for="file in csvFiles" :key="file.id" :value="file.id">
              {{ file.name || 'Unnamed File' }}
            </option>
          </select>
          <div class="form-text">This links your images to sample IDs and metadata in the CSV file.</div>
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
            class="btn btn-success" 
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
        
        const formData = new FormData();
        formData.append('csv_file', this.selectedCsvId);
        formData.append('sample_id_prefix', this.sampleIdPrefix);
        
        // Append all image files
        this.selectedFiles.forEach(file => {
          formData.append('images', file);
        });
        
        const result = await this.uploadCropImages(formData);
        
        clearInterval(progressInterval);
        this.uploadProgress = 100;
        
        this.uploadSuccess = true;
        // Make sure we count uploaded images correctly
        this.uploadedFiles = result?.images?.length || this.selectedFiles.length;
        this.$emit('images-uploaded', result);
        
        // Display success toast
        this.$toast?.success(`${this.uploadedFiles} images uploaded successfully!`);
        
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
      this.uploadSuccess = false;
      this.uploadedFiles = 0;
      
      // Reset the file input by clearing its value
      const fileInput = document.getElementById('cropImages');
      if (fileInput) fileInput.value = '';
      
      // Force DOM update to ensure the file input is truly reset
      this.$nextTick(() => {
        const container = document.querySelector('.image-uploader');
        if (container) {
          container.style.opacity = '0.99';
          setTimeout(() => {
            if (container) container.style.opacity = '1';
          }, 10);
        }
      });
    },
    
    formatFileSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
      else return (bytes / 1048576).toFixed(1) + ' MB';
    },
    
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString();
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
