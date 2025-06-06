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
          <label for="cropImages" class="form-label">Image Folder Upload</label>
          <input 
            type="file" 
            class="form-control" 
            id="cropImages" 
            @change="handleFileSelection"
            accept="image/*"
            multiple
            required
            webkitdirectory
            directory
          >
          <div class="form-text">Upload a folder containing your crop images.</div>
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
          <progress :value="uploadProgress" max="100" class="w-100" aria-label="Upload progress">
            {{ uploadProgress }}%
          </progress>
        </div>
        
        <div class="d-grid gap-2">
          <button 
            type="submit" 
            class="btn btn-success" 
            :disabled="!selectedFiles.length || !selectedCsvId || uploading"
          >
            <span v-if="uploading" class="spinner-border spinner-border-sm me-2"></span>
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
import { defineComponent } from 'vue';
import { mapGetters, mapActions } from 'vuex';

export default defineComponent({
  data() {
    return {
      selectedCsvId: '',
      sampleIdPrefix: 'CROP',
      selectedFiles: [],
      uploading: false,
      uploadProgress: 0,
      uploadSuccess: false,
      uploadedFiles: 0,
      validationErrors: [],
      csvVersions: {}
    };
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
    ...mapActions('crop', ['fetchCsvFiles', 'uploadCropImages', 'fetchCsvFile']),
    
    handleFileSelection(event) {
      const files = event.target.files;
      if (!files.length) return;
      
      // Get folder name from path
      let folderName = '';
      if (files.length > 0 && files[0].webkitRelativePath) {
        // Extract folder name from the first file's path
        const pathParts = files[0].webkitRelativePath.split('/');
        if (pathParts.length > 1) {
          folderName = pathParts[0];
        }
      }
      
      // Check if we got a folder name
      if (folderName) {
        console.log(`Selected folder: ${folderName}`);
      }
      
      // Filter for image files only
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
      const validFiles = Array.from(files).filter(file => validImageTypes.includes(file.type));
      const invalidFiles = Array.from(files).filter(file => !validImageTypes.includes(file.type));
      
      // Process only valid image files
      this.selectedFiles = validFiles;
      
      // Warn about invalid files if any
      if (invalidFiles.length > 0) {
        console.warn('Warning: Some selected files are not supported image formats:', invalidFiles.map(f => f.name));
        this.$toast?.warning(`${invalidFiles.length} files skipped - only JPG, PNG, and GIF formats are supported.`);
      }
      
      // Check if we found any valid images
      if (this.selectedFiles.length === 0) {
        this.$toast?.error('No valid image files found in the selected folder. Please select a folder containing images.');
        return;
      }
      
      // Success message for valid files
      this.$toast?.info(`Found ${this.selectedFiles.length} valid image files in ${folderName || 'selected folder'}.`); 
      this.uploadSuccess = false;
    },
    
    async uploadImages() {
      this.uploading = true;
      this.uploadProgress = 0;
      this.uploadSuccess = false;
      this.validationErrors = [];
      
      // Setup progress simulation
      const progressInterval = setInterval(() => {
        if (this.uploadProgress < 90) {
          this.uploadProgress += 5;
        }
      }, 300);
      
      try {
        // Validate before upload
        if (!this.selectedCsvId) {
          throw new Error('Please select a CSV file first');
        }
        
        // Get CSV file details to validate against
        const csvFile = await this.fetchCsvDetails(this.selectedCsvId);
        
        // Validate images against CSV
        const validationResult = await this.validateImagesWithCsv(csvFile);
        if (!validationResult) {
          clearInterval(progressInterval);
          this.uploading = false;
          return;
        }
        
        // Prepare form data for upload
        const formData = new FormData();
        formData.append('csv_id', this.selectedCsvId);
        formData.append('sample_id_prefix', this.sampleIdPrefix);
        
        // Add all files to the form data
        this.selectedFiles.forEach(file => {
          formData.append('images', file);
        });
        
        // Upload the images
        const response = await this.uploadCropImages(formData);
        
        // Complete the progress bar
        this.uploadProgress = 100;
        clearInterval(progressInterval);
        
        // Check if we got a successful response with images
        if (response && response.images && response.images.length > 0) {
          // Only mark as success if we actually got images back
          this.uploadSuccess = true;
          this.uploadedFiles = response.images.length;
          this.$toast?.success(`Successfully uploaded ${this.uploadedFiles} images!`);
          
          // Emit event to notify parent component
          this.$emit('images-uploaded', response.images);
        } else {
          // Even if server returns 200 but no images, treat as failure
          console.error('Upload error: Server returned success but no images');
          this.$toast?.error('Upload failed. No images were saved.');
          this.uploadSuccess = false;
        }
        
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
      return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
    },
    
    async fetchCsvDetails(csvId) {
      try {
        const csvFile = await this.fetchCsvFile(csvId);
        return csvFile;
      } catch (error) {
        console.error('Error fetching CSV details:', error);
        throw new Error('Failed to fetch CSV file details');
      }
    },
    
    validateImagesWithCsv(csvFile) {
      // Check if CSV file has been processed
      if (!csvFile.processed) {
        this.$toast?.error('CSV file has not been processed yet. Please process it first.');
        return false;
      }

      // Check if CSV file has row labels (from 'No.' column)
      if (!csvFile.metadata || !csvFile.metadata.row_labels || csvFile.metadata.row_labels.length === 0) {
        this.$toast?.error('CSV file does not contain any valid "No." labels. Please check the file format.');
        return false;
      }

      // Ensure image count matches row label count
      if (this.selectedFiles.length !== csvFile.metadata.row_labels.length) {
        this.$toast?.error(`Number of images (${this.selectedFiles.length}) does not match number of rows (${csvFile.metadata.row_labels.length}) in the CSV.`);
        return false;
      }

      return true;
    }
  }
});
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
