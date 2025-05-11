<template>
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
        <base-card title="CSV File Guidelines">
          <div class="guidelines">
            <h5>Creating Effective CSV Mapping Files</h5>
            <p>Your CSV file should include these key columns:</p>
            <ul>
              <li><strong>sample_id</strong> - Unique identifier for each crop sample</li>
              <li><strong>description</strong> (optional) - Description of the crop image</li>
            </ul>
            <p>Additional columns will be treated as metadata for the crop images.</p>
            <p>Example format:</p>
            <div class="csv-example p-2 rounded bg-light">
              <code>sample_id,description,crop_type,plant_age,health_status</code><br>
              <code>CROP_001,Young tomato plant,Tomato,14 days,Healthy</code><br>
              <code>CROP_002,Mature lettuce,Lettuce,45 days,Pest damage</code>
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
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
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
                <th>Title</th>
                <th>Uploaded</th>
                <th>Images</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="file in csvFiles" :key="file.id">
                <td>{{ file.title }}</td>
                <td>{{ formatDate(file.uploaded_at) }}</td>
                <td>
                  <span class="badge bg-info rounded-pill">{{ file.crop_images_count || 0 }}</span>
                </td>
                <td>
                  <div class="btn-group btn-group-sm">
                    <base-button 
                      variant="outline-primary" 
                      @click="viewRelatedImages(file.id)"
                    >
                      View Images
                    </base-button>
                    <base-button 
                      variant="outline-success" 
                      @click="processFile(file.id)"
                      :disabled="processing === file.id"
                    >
                      <span v-if="processing === file.id" class="spinner-border spinner-border-sm me-1" role="status"></span>
                      Process
                    </base-button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </base-card>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import BaseCard from '@/components/common/BaseCard.vue';
import BaseButton from '@/components/common/BaseButton.vue';
import CsvFileUploader from '@/components/CsvFileUploader.vue';

export default {
  name: 'CsvFilesView',
  components: {
    BaseCard,
    BaseButton,
    CsvFileUploader
  },
  data() {
    return {
      processing: null
    };
  },
  computed: {
    ...mapGetters('crop', ['getCsvFiles', 'isLoading']),
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
    ...mapActions('crop', ['fetchCsvFiles', 'processCsvFile']),
    
    refreshFiles() {
      this.fetchCsvFiles();
    },
    
    handleFileUploaded(file) {
      this.$toast?.success(`File "${file.title}" uploaded successfully!`);
      this.refreshFiles();
    },
    
    handleFileProcessed(result) {
      this.$toast?.success(`File processed successfully! ${result.created} records created.`);
      this.refreshFiles();
    },
    
    async processFile(fileId) {
      this.processing = fileId;
      
      try {
        const result = await this.processCsvFile(fileId);
        this.$toast?.success(`CSV file processed: ${result.created} created, ${result.updated} updated`);
        this.refreshFiles();
      } catch (error) {
        console.error('Error processing file:', error);
        this.$toast?.error('Failed to process file. Please try again.');
      } finally {
        this.processing = null;
      }
    },
    
    viewRelatedImages(fileId) {
      // Navigate to the crop images view with a filter for this CSV file
      this.$router.push({ 
        name: 'crop-images', 
        query: { csv_file: fileId } 
      });
    },
    
    formatDate(dateString) {
      if (!dateString) return 'Unknown';
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
