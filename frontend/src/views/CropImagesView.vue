<template>
  <div class="crop-images-view">
    <h2 class="mb-4">Crop Image Management</h2>
    
    <div class="row mb-4">
      <div class="col-md-6">
        <base-card title="Upload Images">
          <crop-image-uploader @images-uploaded="refreshImages" />
        </base-card>
      </div>
      
      <div class="col-md-6">
        <base-card title="Upload CSV Mapping File">
          <csv-file-uploader @file-uploaded="refreshCsvFiles" @file-processed="handleCsvProcessed" />
        </base-card>
      </div>
    </div>
    
    <base-card>
      <template #header>
        <div class="d-flex justify-content-between align-items-center">
          <h5 class="mb-0">Crop Image Gallery</h5>
          <div>
            <base-button 
              size="sm" 
              variant="outline-primary" 
              @click="refreshImages" 
              :loading="loading"
            >
              <i class="bi bi-arrow-clockwise me-1"></i> Refresh
            </base-button>
          </div>
        </div>
      </template>
      
      <crop-image-gallery 
        @edit-image="editImage" 
        @add-images="scrollToUploader"
      />
    </base-card>
    
    <!-- Metadata Editor Modal -->
    <div 
      class="modal fade" 
      id="metadataEditorModal" 
      tabindex="-1" 
      aria-labelledby="metadataEditorModalLabel" 
      aria-hidden="true"
      ref="metadataModal"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="metadataEditorModalLabel">
              Edit Metadata: {{ selectedImage ? selectedImage.sample_id : '' }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div v-if="selectedImage">
              <div class="row mb-3">
                <div class="col-md-4">
                  <div class="image-preview">
                    <img 
                      v-if="selectedImage.image_url" 
                      :src="selectedImage.image_url" 
                      class="img-fluid rounded" 
                      :alt="selectedImage.sample_id"
                    >
                    <div v-else class="no-image">No Image Available</div>
                  </div>
                </div>
                <div class="col-md-8">
                  <metadata-editor 
                    :image-id="selectedImage.id"
                    :initial-metadata="selectedImage.metadata"
                    @metadata-updated="handleMetadataUpdated"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <base-button variant="secondary" data-bs-dismiss="modal">Close</base-button>
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
import CropImageUploader from '@/components/CropImageUploader.vue';
import CsvFileUploader from '@/components/CsvFileUploader.vue';
import CropImageGallery from '@/components/CropImageGallery.vue';
import MetadataEditor from '@/components/MetadataEditor.vue';

export default {
  name: 'CropImagesView',
  components: {
    BaseCard,
    BaseButton,
    CropImageUploader,
    CsvFileUploader,
    CropImageGallery,
    MetadataEditor
  },
  data() {
    return {
      selectedImage: null,
      metadataModal: null
    };
  },
  computed: {
    ...mapGetters(['isLoading']),
    loading() {
      return this.isLoading;
    }
  },
  mounted() {
    this.fetchInitialData();
    // Initialize Bootstrap modal
    this.$nextTick(() => {
      if (typeof bootstrap !== 'undefined') {
        this.metadataModal = new bootstrap.Modal(this.$refs.metadataModal);
      }
    });
  },
  methods: {
    ...mapActions('crop', ['fetchCsvFiles', 'fetchCropImages']),
    
    fetchInitialData() {
      this.fetchCsvFiles();
      this.fetchCropImages();
    },
    
    refreshImages() {
      this.fetchCropImages();
    },
    
    refreshCsvFiles() {
      this.fetchCsvFiles();
    },
    
    handleCsvProcessed() {
      // Refresh both CSV files and images after a CSV file has been processed
      this.refreshCsvFiles();
      this.refreshImages();
      this.$toast?.success('CSV file processed successfully!');
    },
    
    editImage(image) {
      this.selectedImage = image;
      if (this.metadataModal) {
        this.metadataModal.show();
      }
    },
    
    handleMetadataUpdated(updatedMetadata) {
      if (this.selectedImage) {
        this.selectedImage.metadata = updatedMetadata;
        // Refresh the images to ensure we have the latest data
        this.refreshImages();
      }
    },
    
    scrollToUploader() {
      // Scroll to the uploader section
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
};
</script>

<style scoped>
.crop-images-view {
  margin-bottom: 2rem;
}

.image-preview {
  width: 100%;
  height: 180px;
  background-color: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 6px;
}

.image-preview img {
  max-width: 100%;
  max-height: 180px;
  object-fit: contain;
}

.no-image {
  color: #adb5bd;
  font-size: 1rem;
}
</style>
