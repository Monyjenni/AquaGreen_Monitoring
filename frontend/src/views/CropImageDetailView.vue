<template>
  <div class="crop-image-detail-view">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0">Crop Image Details</h2>
      <div>
        <base-button 
          variant="outline-secondary" 
          @click="$router.push({ name: 'crop-images' })"
          size="sm"
        >
          <i class="bi bi-arrow-left me-1"></i> Back to Gallery
        </base-button>
      </div>
    </div>
    
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2 text-muted">Loading image details...</p>
    </div>
    
    <div v-else-if="!image" class="text-center py-5 bg-light rounded">
      <div class="display-1 text-muted mb-3">
        <i class="bi bi-image"></i>
      </div>
      <h4 class="text-muted">Image Not Found</h4>
      <p class="text-muted">The requested image could not be found or has been deleted.</p>
      <base-button 
        variant="primary" 
        @click="$router.push({ name: 'crop-images' })"
      >
        Return to Gallery
      </base-button>
    </div>
    
    <div v-else class="row">
      <div class="col-md-5 mb-4">
        <base-card>
          <div class="image-container mb-3">
            <img 
              v-if="image.image_url" 
              :src="image.image_url" 
              class="img-fluid rounded" 
              :alt="image.sample_id"
            >
            <div v-else class="no-image">No Image Available</div>
          </div>
          
          <div class="image-info">
            <h4>{{ image.sample_id }}</h4>
            <p v-if="image.description" class="mb-3">{{ image.description }}</p>
            
            <table class="table table-sm">
              <tbody>
                <tr>
                  <th scope="row" style="width: 40%">Uploaded</th>
                  <td>{{ formatDate(image.uploaded_at) }}</td>
                </tr>
                <tr v-if="image.user_details">
                  <th scope="row">Uploaded By</th>
                  <td>{{ image.user_details.username }}</td>
                </tr>
                <tr v-if="csvFile">
                  <th scope="row">CSV File</th>
                  <td>{{ csvFile.title }}</td>
                </tr>
              </tbody>
            </table>
            
            <div class="d-grid gap-2 mt-3">
              <base-button 
                variant="primary" 
                @click="editMetadata"
              >
                <i class="bi bi-pencil me-1"></i> Edit Metadata
              </base-button>
            </div>
          </div>
        </base-card>
      </div>
      
      <div class="col-md-7">
        <base-card title="Metadata">
          <div v-if="!image.metadata || image.metadata.length === 0" class="alert alert-info">
            <i class="bi bi-info-circle me-2"></i>
            No metadata available for this image.
          </div>
          
          <div v-else>
            <table class="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="meta in image.metadata" :key="meta.id">
                  <td>{{ meta.label }}</td>
                  <td>{{ meta.value }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <template #footer>
            <base-button 
              variant="outline-primary" 
              @click="editMetadata"
              class="float-end"
            >
              <i class="bi bi-plus me-1"></i> Add Metadata
            </base-button>
          </template>
        </base-card>
        
        <base-card title="Related Images" class="mt-4">
          <div v-if="relatedImages.length === 0" class="alert alert-info">
            <i class="bi bi-info-circle me-2"></i>
            No other images from the same CSV file.
          </div>
          
          <div v-else class="related-images row row-cols-2 row-cols-md-3 row-cols-lg-4 g-3">
            <div v-for="related in relatedImages" :key="related.id" class="col">
              <div 
                class="related-image-card" 
                :class="{ 'active': related.id === image.id }"
                @click="viewRelatedImage(related.id)"
              >
                <img 
                  v-if="related.image_url" 
                  :src="related.image_url" 
                  class="img-thumbnail" 
                  :alt="related.sample_id"
                >
                <div v-else class="no-thumb">No Image</div>
                <div class="sample-id">{{ related.sample_id }}</div>
              </div>
            </div>
          </div>
        </base-card>
      </div>
    </div>
    
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
              Edit Metadata: {{ image ? image.sample_id : '' }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <metadata-editor 
              v-if="image"
              :image-id="image.id"
              :initial-metadata="image.metadata"
              @metadata-updated="handleMetadataUpdated"
            />
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
import MetadataEditor from '@/components/MetadataEditor.vue';

export default {
  name: 'CropImageDetailView',
  components: {
    BaseCard,
    BaseButton,
    MetadataEditor
  },
  data() {
    return {
      imageId: null,
      metadataModal: null,
      relatedImages: []
    };
  },
  computed: {
    ...mapGetters('crop', ['getCropImages', 'getCurrentCropImage', 'getCsvFiles', 'isLoading']),
    image() {
      return this.getCurrentCropImage;
    },
    loading() {
      return this.isLoading;
    },
    csvFile() {
      if (!this.image || !this.image.csv_file) return null;
      return this.getCsvFiles.find(file => file.id === this.image.csv_file);
    }
  },
  watch: {
    '$route.params.id': {
      immediate: true,
      handler(newId) {
        if (newId) {
          this.imageId = newId;
          this.fetchImageDetails();
        }
      }
    }
  },
  mounted() {
    this.fetchCsvFiles();
    // Initialize Bootstrap modal
    this.$nextTick(() => {
      if (typeof bootstrap !== 'undefined') {
        this.metadataModal = new bootstrap.Modal(this.$refs.metadataModal);
      }
    });
  },
  methods: {
    ...mapActions('crop', ['fetchCropImage', 'fetchCropImages', 'fetchCsvFiles']),
    
    async fetchImageDetails() {
      try {
        await this.fetchCropImage(this.imageId);
        // If image was found and has a csv_file, fetch related images
        if (this.image && this.image.csv_file) {
          this.fetchRelatedImages();
        }
      } catch (error) {
        console.error('Error fetching image details:', error);
        this.$toast?.error('Failed to load image details');
      }
    },
    
    async fetchRelatedImages() {
      try {
        // Fetch all images with the same CSV file
        await this.fetchCropImages({ csvFile: this.image.csv_file });
        // Filter out the current image and limit to a reasonable number
        this.relatedImages = this.getCropImages
          .filter(img => img.id !== this.image.id)
          .slice(0, 12);
      } catch (error) {
        console.error('Error fetching related images:', error);
      }
    },
    
    editMetadata() {
      if (this.metadataModal) {
        this.metadataModal.show();
      }
    },
    
    handleMetadataUpdated() {
      // Refresh the image data to get the latest metadata
      this.fetchImageDetails();
    },
    
    viewRelatedImage(imageId) {
      this.$router.push({ name: 'crop-image-detail', params: { id: imageId } });
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
.crop-image-detail-view {
  margin-bottom: 2rem;
}

.image-container {
  background-color: #f8f9fa;
  border-radius: 8px;
  text-align: center;
  padding: 8px;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-container img {
  max-height: 400px;
  object-fit: contain;
}

.no-image {
  color: #adb5bd;
  font-size: 1.2rem;
}

.related-image-card {
  cursor: pointer;
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
  border-radius: 4px;
  overflow: hidden;
  height: 120px;
}

.related-image-card.active {
  border: 2px solid #0d6efd;
}

.related-image-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.related-image-card img {
  width: 100%;
  height: 90px;
  object-fit: cover;
}

.related-image-card .no-thumb {
  height: 90px;
  background-color: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #adb5bd;
  font-size: 0.8rem;
}

.related-image-card .sample-id {
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 0.7rem;
  padding: 3px 6px;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
