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
                <strong>Important:</strong> Please name your images to match F5 codes (e.g., "F5-A001.jpg") for automatic matching.
                Images will be mapped to genetic records based on F5 code, regardless of upload order.
              </div>
              
              <form @submit.prevent="uploadImages">
                <div class="mb-3">
                  <label for="fruitImages" class="form-label">Fruit Images</label>
                  <div class="form-group">
                    <input
                      type="file"
                      class="form-control mb-3"
                      @change="handleImagesChange"
                      multiple
                      accept="image/*"
                      :disabled="uploadingImages"
                    >
                    
                    <!-- Mapping Status Summary -->
                    <div class="d-flex justify-content-between align-items-center mb-3 p-2 border rounded">
                      <div>
                        <div>Selected: <strong>{{ selectedImages.length }}</strong> images</div>
                        <div>Mapped by F5 code: <strong>{{ Object.keys(imagesByF5Code).length }}</strong> images</div>
                      </div>
                      <div class="text-end">
                        <span class="badge" :class="{
                          'bg-success': selectedImages.length > 0 && Object.keys(imagesByF5Code).length === selectedImages.length,
                          'bg-warning': selectedImages.length > 0 && Object.keys(imagesByF5Code).length > 0 && Object.keys(imagesByF5Code).length < selectedImages.length,
                          'bg-danger': selectedImages.length > 0 && Object.keys(imagesByF5Code).length === 0
                        }">
                          {{ selectedImages.length > 0 ? (Object.keys(imagesByF5Code).length / selectedImages.length * 100).toFixed(0) + '% Mapped' : 'No Images' }}
                        </span>
                      </div>
                    </div>
                  
                    <div v-if="imagesError" class="alert alert-danger mb-3">
                      <i class="fas fa-exclamation-circle me-2"></i>
                      {{ imagesError }}
                    </div>
                  </div>
                  
                  <!-- Image Preview -->
                  <div class="row g-2">
                    <div 
                      v-for="(image, index) in selectedImages" 
                      :key="index" 
                      class="col-4 mb-2"
                    >
                      <div class="card position-relative">
                        <button 
                          type="button" 
                          class="position-absolute btn btn-sm btn-danger p-1" 
                          style="top: -8px; right: -8px; border-radius: 50%; z-index: 2;"
                          @click="removeImage(index)"
                        >
                          <i class="fas fa-times"></i>
                        </button>
                        <img 
                          :src="getImagePreview(image)" 
                          class="card-img-top" 
                          style="height: 80px; object-fit: cover;"
                          :alt="`Preview ${index + 1}`"
                        >
                        <div class="card-body p-1">
                          <div class="d-flex justify-content-between align-items-center">
                            <small class="text-truncate me-1">{{ image.name }}</small>
                            <span v-if="getF5CodeFromFileName(image.name)" 
                                  class="badge bg-success text-white">
                              {{ getF5CodeFromFileName(image.name) }}
                            </span>
                            <span v-else class="badge bg-danger text-white">No F5 Code</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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
      imagesByF5Code: {}, // Map of F5 codes to image files
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
      const files = event.target.files;
      if (!files || !files.length) {
        this.imagesError = 'Please select images';
        return;
      }
      
      this.selectedImages = Array.from(files);
      this.imagesError = '';

      // Extract F5 codes from file names and create a mapping
      this.imagesByF5Code = {};
      this.validateAndMapImages();
    },

    /**
     * Validates image filenames and maps them to F5 codes
     */
    validateAndMapImages() {
      this.imagesByF5Code = {};
      this.imagesError = '';
      
      const imagesWithoutF5Codes = [];
      const duplicateF5Codes = new Set();
      const seenF5Codes = new Set();
      
      for (let i = 0; i < this.selectedImages.length; i++) {
        const file = this.selectedImages[i];
        const f5Code = this.getF5CodeFromFileName(file.name);
        
        if (f5Code) {
          // Check if this F5 code has been seen before
          if (seenF5Codes.has(f5Code)) {
            duplicateF5Codes.add(f5Code);
          } else {
            seenF5Codes.add(f5Code);
            this.imagesByF5Code[f5Code] = file;
          }
        } else {
          imagesWithoutF5Codes.push(file.name);
        }
      }
      
      // Generate appropriate error messages
      if (imagesWithoutF5Codes.length > 0) {
        const examples = imagesWithoutF5Codes.slice(0, 3).map(name => `"${name}"`).join(', ');
        this.imagesError = `${imagesWithoutF5Codes.length} image(s) don't have valid F5 codes in their filenames (e.g., ${examples}${imagesWithoutF5Codes.length > 3 ? ', ...' : ''}). Please rename your images to include F5 codes (e.g., F5-A001.jpg).`;
        return false;
      }
      
      if (duplicateF5Codes.size > 0) {
        const examples = Array.from(duplicateF5Codes).slice(0, 3).join(', ');
        this.imagesError = `You have multiple images with the same F5 codes: ${examples}${duplicateF5Codes.size > 3 ? ', ...' : ''}. Each F5 code should have only one image.`;
        return false;
      }
      
      return Object.keys(this.imagesByF5Code).length > 0;
    },

    /**
     * Extracts F5 code from filename
     * @param {string} fileName - The name of the file
     * @return {string|null} - The F5 code or null if not found
     */
    getF5CodeFromFileName(fileName) {
      const f5CodeRegex = /F5-[A-Za-z0-9]+/;
      const match = fileName.match(f5CodeRegex);
      return match ? match[0] : null;
    },
    
    /**
     * Removes an image from the selected images array
     * @param {number} index - The index of the image to remove
     */
    removeImage(index) {
      if (index >= 0 && index < this.selectedImages.length) {
        // Create a new array without the removed image
        this.selectedImages = this.selectedImages.filter((_, i) => i !== index);
        
        // Re-validate and map the remaining images
        this.validateAndMapImages();
      }
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

      // Check if we have F5 code matches in filenames
      const f5CodeMatches = Object.keys(this.imagesByF5Code).length;
      if (f5CodeMatches === 0) {
        this.imagesError = 'No F5 codes found in image filenames. Please name images to match F5 codes (e.g., "F5-A001.jpg")';
        return;
      }

      this.uploadingImages = true;
      this.errorMessage = '';
      this.successMessage = '';

      const formData = new FormData();
      formData.append('genetic_data_id', this.geneticDataId);
      
      // Add mapping information to formData
      const mapping = {};
      Object.keys(this.imagesByF5Code).forEach(f5Code => {
        const image = this.imagesByF5Code[f5Code];
        formData.append('images', image);
        // Store mapping between image name and F5 code
        mapping[image.name] = f5Code;
      });
      
      // Add the mapping JSON as a separate field
      formData.append('f5_code_mapping', JSON.stringify(mapping));

      try {
        await axios.post('/file-uploader/genetic-data/images/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${this.$store.state.token}`
          }
        });

        this.imagesUploaded = true;
        this.successMessage = `${f5CodeMatches} images mapped to F5 codes and uploaded successfully!`;
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