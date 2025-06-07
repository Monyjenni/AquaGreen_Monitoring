<template>
  <div class="csv-files-container">
    <div class="csv-files-view">
    <div class="mb-4">
      <router-link to="/" class="btn btn-sm btn-outline-secondary">
        <i class="bi bi-arrow-left me-1"></i> Back
      </router-link>
      <h2 class="mt-3">CSV File Management</h2>
    </div>
    
    <div class="row mb-4">
      <div class="col-md-6">
        <base-card title="Upload CSV Mapping File">
          <csv-file-uploader @file-uploaded="handleFileUploaded" @file-processed="handleFileProcessed" />
        </base-card>
      </div>
      
      <div class="col-md-6">
        <base-card title="CSV Files Information">
          <div class="guidelines">
            <h5>About CSV Mapping Files</h5>
            <p>CSV files are used to link metadata to crop images:</p>
            <ul>
              <li><strong>Required:</strong> A 'sample_id' column is required to match images</li>
              <li><strong>Processing:</strong> After uploading, click 'Process' to analyze the file</li>
              <li><strong>Delete:</strong> You can remove files that are no longer needed</li>
            </ul>
            
            <div v-if="showDeletionWarning" class="alert alert-warning alert-dismissible fade show" role="alert">
              <i class="bi bi-info-circle me-2"></i>
              <strong>Note:</strong> CSV files linked to images cannot be deleted until the link is removed.
              <button type="button" class="btn-close" @click="showDeletionWarning = false" aria-label="Close"></button>
            </div>
          </div>
        </base-card>
      </div>
    </div>
    
    <base-card>
      <template #header>
        <div class="d-flex justify-content-between align-items-center">
          <h5 class="mb-0">CSV Files</h5>
          <div>
            <base-button 
              size="sm" 
              variant="outline-primary" 
              @click="refreshFiles" 
              :loading="loading"
            >
              <i class="bi bi-arrow-clockwise me-1"></i> Refresh
            </base-button>
          </div>
        </div>
      </template>
      
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" aria-hidden="true"></div>
        <span class="visually-hidden">Loading...</span>
        <p class="mt-2 text-muted">Loading CSV files...</p>
      </div>
      
      <div v-else-if="csvFiles.length === 0" class="text-center py-5 bg-light rounded">
        <div class="display-1 text-muted mb-3">
          <i class="bi bi-file-earmark-spreadsheet"></i>
        </div>
        <h4 class="text-muted">No CSV Files Found</h4>
        <p class="text-muted">Upload CSV mapping files to get started.</p>
      </div>
      
      <div v-else>
        <div class="table-responsive">
          <table class="table table-hover">
            <thead class="table-light">
              <tr>
                <th>File Name</th>
                <th>Uploaded</th>
                <th>Images</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="file in csvFiles" :key="file.id" 
                  :class="{ 'selected-row': selectedFileId === file.id }"
                  @click="toggleFileSelection(file.id)">
                <td>{{ file.name }}</td>
                <td>{{ formatDate(file.uploaded_at) }}</td>
                <td>
                  <span class="badge bg-info rounded-pill">{{ file.crop_images_count || 0 }}</span>
                </td>
                <td>
                  <div class="btn-group btn-group-sm">
                    <base-button 
                      variant="outline-primary" 
                      @click.stop="viewRelatedImages(file.id)"
                    >
                      View Images
                    </base-button>
                    <base-button 
                      variant="outline-success" 
                      @click.stop="processFile(file.id)"
                      :disabled="processing === file.id"
                    >
                      <span v-if="processing === file.id" class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
                      <span v-if="processing === file.id" class="visually-hidden">Processing file...</span>
                      Process
                    </base-button>
                    <base-button 
                      variant="outline-info" 
                      @click.stop="toggleFileSelection(file.id)"
                    >
                      <i class="bi bi-bar-chart-line me-1"></i>
                      {{ selectedFileId === file.id ? 'Hide Chart' : 'Show Chart' }}
                    </base-button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <transition name="fade">
          <div v-if="selectedFileId" class="mt-4">
            <base-card>
              <template #header>
                <h5 class="mb-0">CSV Data Visualization</h5>
              </template>
              <csv-data-visualization 
                :selected-file-id="selectedFileId"
                @data-loaded="handleDataLoaded"
              />
            </base-card>
          </div>
        </transition>
      </div>
    </base-card>
  </div>
  
  <!-- Delete Confirmation Modal -->
  <div class="modal fade" v-if="showDeleteConfirmation" tabindex="-1" style="display: block; background-color: rgba(0,0,0,0.5);">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Confirm Deletion</h5>
          <button type="button" class="btn-close" aria-label="Close" @click="cancelDelete"></button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete the CSV file <strong>{{ fileToDelete?.name }}</strong>?</p>
          <p class="text-danger">This action cannot be undone and may affect related crop images.</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="cancelDelete">Cancel</button>
          <button type="button" class="btn btn-danger" @click="deleteFile" :disabled="deleting">
            <span v-if="deleting" class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
            <span v-if="deleting" class="visually-hidden">Deleting file...</span>
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import BaseCard from '@/components/common/BaseCard.vue';
import BaseButton from '@/components/common/BaseButton.vue';
import CsvFileUploader from '@/components/CsvFileUploader.vue';
import CsvDataVisualization from '@/components/CsvDataVisualization.vue';

export default {
  name: 'CsvFilesView',
  components: {
    BaseCard,
    BaseButton,
    CsvFileUploader,
    CsvDataVisualization
  },
  data() {
    return {
      processing: null,
      fileToDelete: null,
      showDeleteConfirmation: false,
      deleting: false,
      showDeletionWarning: false,
      selectedFileId: null,
      visualizationData: null
    };
  },
  computed: {
    ...mapGetters('crop', ['getCsvFiles', 'isLoading', 'getError']),
    csvFiles() {
      return this.getCsvFiles || [];
    },
    loading() {
      return this.isLoading;
    }
  },
  mounted() {
    this.fetchCsvFiles();
  },
  methods: {
    ...mapActions('crop', ['fetchCsvFiles', 'processCsvFile', 'deleteCsvFile']),
    refreshFiles() {
      this.fetchCsvFiles();
    },
    handleFileUploaded() {
      this.fetchCsvFiles();
    },
    handleFileProcessed() {
      this.fetchCsvFiles();
    },
    viewRelatedImages(fileId) {
      this.$router.push({ name: 'CropImagesView', query: { csv_file: fileId } });
    },
    async processFile(fileId) {
      this.processing = fileId;
      try {
        await this.processCsvFile(fileId);
        this.fetchCsvFiles(); // Refresh the list after processing
      } catch (error) {
        console.error('Error processing file:', error);
      } finally {
        this.processing = null;
      }
    },
    toggleFileSelection(fileId) {
      if (this.selectedFileId === fileId) {
        this.selectedFileId = null;
        this.visualizationData = null;
      } else {
        this.selectedFileId = fileId;
      }
    },
    handleDataLoaded(data) {
      this.visualizationData = data;
    },
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleString();
    },
    
    confirmDelete(file) {
      this.fileToDelete = file;
      this.showDeleteConfirmation = true;
    },
    
    cancelDelete() {
      this.fileToDelete = null;
      this.showDeleteConfirmation = false;
    },
    
    async deleteFile() {
      this.deleting = true;
      const result = await this.$store.dispatch('deleteCsvFile', this.fileToDelete.id);
      
      if (result.success) {
        this.showDeleteConfirmation = false;
        this.fileToDelete = null;
        this.$toast.success('File deleted successfully');
        // Refresh the list to ensure UI is synchronized with backend
        this.refreshFiles();
      } else {
        console.error('Error deleting file:', result.error);
        
        // Show appropriate message based on error type
        if (result.linkedToImages) {
          // Make sure the warning is visible
          this.showDeletionWarning = true;
          
          this.$toast.error(result.error, {
            timeout: 6000  // Show longer for important messages
          });
          
          // Navigate to related images to help the user unlink them
          setTimeout(() => {
            this.viewRelatedImages(this.fileToDelete.id);
          }, 1500);
        } else {
          this.$toast.error(`Error deleting file: ${result.error}`);
        }
      }
      
      this.deleting = false;
      this.showDeleteConfirmation = false;
    }
  }
};
</script>

<style scoped>
.csv-files-view {
  margin-bottom: 2rem;
}

.guidelines {
  font-size: 0.95rem;
}

.csv-example {
  font-size: 0.85rem;
  overflow-x: auto;
  white-space: nowrap;
  margin-top: 10px;
}
</style>
