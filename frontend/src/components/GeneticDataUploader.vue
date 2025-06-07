<template>
  <div class="container mt-4">
    <div class="mb-4">
      <router-link to="/upload" class="btn btn-sm btn-outline-secondary">
        <i class="bi bi-arrow-left me-1"></i> Back
      </router-link>
    </div>
    <div class="row">
      <!-- Left Side: CSV Upload and Preview -->
      <div class="col-md-7">
        <div class="card shadow">
          <div class="card-header bg-primary text-white">
            <h5 class="card-title mb-0">
              <i class="fas fa-upload me-2"></i>Step 1: Upload Genetic Data
            </h5>
          </div>
          <div class="card-body">
            <form @submit.prevent="uploadGeneticData">
              <div class="mb-3">
                <label for="geneticFile" class="form-label">Genetic Data File (CSV or Excel)</label>
                <input
                  type="file"
                  class="form-control"
                  id="geneticFile"
                  accept=".csv,.xlsx"
                  @change="handleFileChange"
                  :class="{ 'is-invalid': fileError }"
                >
                <div class="invalid-feedback" v-if="fileError">{{ fileError }}</div>
                <div class="form-text">
                  Upload a CSV or Excel file containing genetic data. Required columns:
                  <strong>No.</strong> and <strong>F5 Code</strong>
                </div>
                <div class="alert alert-info mt-2">
                  <i class="fas fa-shield-alt me-2"></i>
                  <strong>Security Notice:</strong> Your genetic data will be automatically encrypted using AES-256 encryption for maximum security.
                </div>
              </div>
              
              <div class="d-flex gap-2">
                <button 
                  type="button" 
                  class="btn btn-outline-primary" 
                  @click="previewData"
                  :disabled="!selectedFile || previewing"
                >
                  <i class="fas fa-eye me-1"></i>
                  {{ previewing ? 'Loading...' : 'Preview Data' }}
                </button>
                <button 
                  type="submit" 
                  class="btn btn-primary" 
                  :disabled="!selectedFile || uploading || !previewDataShown"
                >
                  <i class="fas fa-check me-1"></i>
                  {{ uploading ? 'Processing...' : 'Confirm Upload' }}
                </button>
              </div>
            </form>

            <!-- Preview Section -->
            <div v-if="previewDataShown" class="mt-4">
              <h6 class="text-success">
                <i class="fas fa-table me-1"></i>
                Data Preview ({{ previewRows.length }} records found)
              </h6>
              <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                <table class="table table-sm table-striped">
                  <thead class="table-dark sticky-top">
                    <tr>
                      <th v-for="column in previewColumns" :key="column">{{ column }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, index) in previewRows.slice(0, 10)" :key="index">
                      <td v-for="column in previewColumns" :key="column">
                        {{ row[column] || '' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <small class="text-muted">Showing first 10 rows of {{ previewRows.length }} total records</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side: Image Upload -->
      <div class="col-md-5">
        <div class="card shadow" :class="{ 'opacity-50': !geneticDataUploaded }">
          <div class="card-header bg-success text-white">
            <h5 class="card-title mb-0">
              <i class="fas fa-images me-2"></i>Step 2: Upload Fruit Images
            </h5>
          </div>
          <div class="card-body">
            <div v-if="!geneticDataUploaded" class="text-center text-muted">
              <i class="fas fa-lock fa-2x mb-3"></i>
              <p>Please upload and confirm genetic data first</p>
            </div>
            
            <div v-else>
              <div class="alert alert-info">
                <i class="fas fa-info-circle me-1"></i>
                Upload exactly <strong>{{ totalRecords }} images</strong> to match your genetic records
              </div>
              
              <form @submit.prevent="uploadImages">
                <div class="mb-3">
                  <label for="fruitImages" class="form-label">Fruit Images</label>
                  <input
                    type="file"
                    class="form-control"
                    id="fruitImages"
                    accept="image/*"
                    multiple
                    @change="handleImagesChange"
                    :class="{ 'is-invalid': imagesError }"
                  >
                  <div class="invalid-feedback" v-if="imagesError">{{ imagesError }}</div>
                  <div class="form-text">
                    Selected: {{ selectedImages.length }} of {{ totalRecords }} required images
                  </div>
                </div>

                <!-- Image Preview -->
                <div v-if="selectedImages.length > 0" class="mb-3">
                  <h6>Image Preview:</h6>
                  <div class="row g-2">
                    <div 
                      v-for="(image, index) in selectedImages.slice(0, 6)" 
                      :key="index" 
                      class="col-4"
                    >
                      <div class="card">
                        <img 
                          :src="getImagePreview(image)" 
                          class="card-img-top" 
                          style="height: 80px; object-fit: cover;"
                          :alt="`Image ${index + 1}`"
                        >
                        <div class="card-body p-1">
                          <small class="text-muted">{{ image.name }}</small>
                        </div>
                      </div>
                    </div>
                  </div>
                  <small v-if="selectedImages.length > 6" class="text-muted">
                    ...and {{ selectedImages.length - 6 }} more images
                  </small>
                </div>

                <button 
                  type="submit" 
                  class="btn btn-success w-100" 
                  :disabled="selectedImages.length !== totalRecords || uploadingImages"
                >
                  <i class="fas fa-upload me-1"></i>
                  {{ uploadingImages ? 'Uploading Images...' : `Upload ${selectedImages.length} Images` }}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Progress and Messages -->
    <div class="row mt-4">
      <div class="col-12">
        <!-- Success Message -->
        <div v-if="successMessage" class="alert alert-success alert-dismissible fade show">
          <i class="fas fa-check-circle me-2"></i>{{ successMessage }}
          <button type="button" class="btn-close" @click="successMessage = ''"></button>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show">
          <i class="fas fa-exclamation-circle me-2"></i>{{ errorMessage }}
          <button type="button" class="btn-close" @click="errorMessage = ''"></button>
        </div>

        <!-- Progress Steps -->
        <div class="card">
          <div class="card-body">
            <h6>Upload Progress:</h6>
            <div class="d-flex align-items-center">
              <div class="step" :class="{ 'completed': previewDataShown }">
                <i class="fas fa-eye"></i> Preview Data
              </div>
              <div class="step-divider"></div>
              <div class="step" :class="{ 'completed': geneticDataUploaded }">
                <i class="fas fa-database"></i> Upload Genetic Data
              </div>
              <div class="step-divider"></div>
              <div class="step" :class="{ 'completed': imagesUploaded }">
                <i class="fas fa-images"></i> Upload Images
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'GeneticDataUploader',
  data() {
    return {
      selectedFile: null,
      selectedImages: [],
      geneticDataId: null,
      totalRecords: 0,
      fileError: '',
      imagesError: '',
      uploading: false,
      uploadingImages: false,
      previewing: false,
      successMessage: '',
      errorMessage: '',
      previewDataShown: false,
      geneticDataUploaded: false,
      imagesUploaded: false,
      previewRows: [],
      previewColumns: []
    };
  },
  methods: {
    handleFileChange(event) {
      this.selectedFile = event.target.files[0];
      this.fileError = '';
      this.errorMessage = '';
      this.previewDataShown = false;
      this.geneticDataUploaded = false;
    },
    
    handleImagesChange(event) {
      this.selectedImages = Array.from(event.target.files);
      this.imagesError = '';
      this.errorMessage = '';
    },

    async previewData() {
      if (!this.selectedFile) {
        this.fileError = 'Please select a file';
        return;
      }

      this.previewing = true;
      this.errorMessage = '';

      const formData = new FormData();
      formData.append('file', this.selectedFile);

      try {
        const response = await axios.post('/file-uploader/genetic-data/preview/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${this.$store.state.token}`
          }
        });

        this.previewRows = response.data.preview_data;
        this.previewColumns = response.data.columns;
        this.previewDataShown = true;
        this.totalRecords = response.data.total_records;
      } catch (error) {
        this.errorMessage = error.response?.data?.error || 'Error previewing data';
      } finally {
        this.previewing = false;
      }
    },

    async uploadGeneticData() {
      if (!this.selectedFile) {
        this.fileError = 'Please select a file';
        return;
      }

      if (!this.previewDataShown) {
        this.errorMessage = 'Please preview the data first';
        return;
      }

      this.uploading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const formData = new FormData();
      formData.append('file', this.selectedFile);

      try {
        const response = await axios.post('/file-uploader/genetic-data/upload/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${this.$store.state.token}`
          }
        });

        this.geneticDataId = response.data.id;
        this.totalRecords = response.data.total_records;
        this.geneticDataUploaded = true;
        this.successMessage = `Genetic data uploaded successfully! ${this.totalRecords} records processed. Now upload ${this.totalRecords} images.`;
      } catch (error) {
        this.errorMessage = error.response?.data?.error || error.message || 'Error uploading genetic data';
      } finally {
        this.uploading = false;
      }
    },

    async uploadImages() {
      if (!this.selectedImages.length) {
        this.imagesError = 'Please select images';
        return;
      }

      if (this.selectedImages.length !== this.totalRecords) {
        this.imagesError = `Please select exactly ${this.totalRecords} images`;
        return;
      }

      this.uploadingImages = true;
      this.errorMessage = '';
      this.successMessage = '';

      const formData = new FormData();
      formData.append('genetic_data_id', this.geneticDataId);
      this.selectedImages.forEach(image => {
        formData.append('images', image);
      });

      try {
        await axios.post('/file-uploader/genetic-data/images/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${this.$store.state.token}`
          }
        });

        this.imagesUploaded = true;
        this.successMessage = 'Images uploaded and matched with genetic records successfully!';
        setTimeout(() => this.resetForm(), 3000);
      } catch (error) {
        this.errorMessage = error.response?.data?.error || 'Error uploading images';
      } finally {
        this.uploadingImages = false;
      }
    },

    getImagePreview(file) {
      return URL.createObjectURL(file);
    },

    resetForm() {
      this.selectedFile = null;
      this.selectedImages = [];
      this.geneticDataId = null;
      this.totalRecords = 0;
      this.fileError = '';
      this.imagesError = '';
      this.previewDataShown = false;
      this.geneticDataUploaded = false;
      this.imagesUploaded = false;
      this.previewRows = [];
      this.previewColumns = [];
    }
  }
};
</script>

<style scoped>
.step {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 20px;
  background: #f8f9fa;
  color: #6c757d;
  font-size: 14px;
  transition: all 0.3s;
}

.step.completed {
  background: #d4edda;
  color: #155724;
}

.step-divider {
  flex: 1;
  height: 2px;
  background: #dee2e6;
  margin: 0 15px;
}

.card {
  border: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.table {
  font-size: 12px;
}

.opacity-50 {
  opacity: 0.5;
  pointer-events: none;
}
</style> 