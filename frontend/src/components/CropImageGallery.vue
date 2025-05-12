<template>
  <div class="crop-image-gallery">
    <!-- Filters section -->
    <div class="card mb-4">
      <div class="card-header bg-light d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Image Filters</h5>
        <button 
          class="btn btn-sm btn-outline-secondary" 
          @click="toggleFilters"
        >
          {{ showFilters ? 'Hide Filters' : 'Show Filters' }}
        </button>
      </div>
      <div class="card-body" v-if="showFilters">
        <div class="row g-3">
          <div class="col-md-4">
            <label for="csvFileFilter" class="form-label">CSV File</label>
            <select class="form-select" id="csvFileFilter" v-model="filters.csvFile">
              <option value="">All CSV Files</option>
              <option v-for="file in csvFiles" :key="file.id" :value="file.id">{{ file.name }}</option>
            </select>
          </div>
          
          <div class="col-md-4">
            <label for="sampleIdFilter" class="form-label">Sample ID</label>
            <input 
              type="text" 
              class="form-control" 
              id="sampleIdFilter" 
              v-model="filters.sampleId" 
              placeholder="Filter by sample ID"
            >
          </div>
          
          <div class="col-md-4">
            <label for="metadataLabelFilter" class="form-label">Metadata Label</label>
            <select class="form-select" id="metadataLabelFilter" v-model="filters.metadataLabel">
              <option value="">All Labels</option>
              <option v-for="label in metadataLabels" :key="label" :value="label">{{ label }}</option>
            </select>
          </div>
          
          <div class="col-md-4" v-if="filters.metadataLabel">
            <label for="metadataValueFilter" class="form-label">Metadata Value</label>
            <input 
              type="text" 
              class="form-control" 
              id="metadataValueFilter" 
              v-model="filters.metadataValue" 
              placeholder="Filter by value"
            >
          </div>
        </div>
        
        <div class="d-flex justify-content-end mt-3">
          <button 
            class="btn btn-sm btn-outline-danger me-2" 
            @click="clearFilters"
            :disabled="!hasActiveFilters"
          >
            Clear Filters
          </button>
          <button class="btn btn-sm btn-primary" @click="applyFilters">
            Apply Filters
          </button>
        </div>
      </div>
    </div>
    
    <!-- Images grid -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2 text-muted">Loading images...</p>
    </div>
    
    <div v-else-if="cropImages.length === 0" class="text-center py-5 bg-light rounded">
      <div class="display-1 text-muted mb-3">
        <i class="bi bi-images"></i>
      </div>
      <h4 class="text-muted">No Images Found</h4>
      <p class="text-muted">Try adjusting your filters or upload new images.</p>
      <div class="mt-3">
        <button class="btn btn-primary" @click="$emit('add-images')">
          Upload Images
        </button>
      </div>
    </div>
    
    <div v-else>
      <div class="d-flex justify-content-between mb-3 align-items-center">
        <h5>{{ cropImages.length }} Images Found</h5>
        <div class="btn-group">
          <button 
            class="btn btn-sm" 
            :class="{ 'btn-primary': viewMode === 'grid', 'btn-outline-primary': viewMode !== 'grid' }"
            @click="viewMode = 'grid'"
          >
            Grid
          </button>
          <button 
            class="btn btn-sm" 
            :class="{ 'btn-primary': viewMode === 'list', 'btn-outline-primary': viewMode !== 'list' }"
            @click="viewMode = 'list'"
          >
            List
          </button>
        </div>
      </div>
      
      <!-- Grid view -->
      <div v-if="viewMode === 'grid'" class="row row-cols-1 row-cols-md-3 row-cols-lg-4 g-4">
        <div v-for="image in cropImages" :key="image.id" class="col">
          <crop-image-card 
            :image="image" 
            @view-details="viewImageDetails" 
            @edit-image="editImage"
          />
        </div>
      </div>
      
      <!-- List view -->
      <div v-else class="list-view">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead class="table-light">
              <tr>
                <th>Image</th>
                <th>Sample ID</th>
                <th>Description</th>
                <th>Metadata</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="image in cropImages" :key="image.id">
                <td class="image-cell">
                  <img 
                    v-if="image.image_url" 
                    :src="image.image_url" 
                    class="thumbnail" 
                    :alt="image.sample_id"
                  >
                  <div v-else class="no-image">No Image</div>
                </td>
                <td>{{ image.sample_id }}</td>
                <td>{{ image.description || 'N/A' }}</td>
                <td>
                  <div class="metadata-badges" v-if="image.metadata && image.metadata.length > 0">
                    <span 
                      v-for="meta in image.metadata.slice(0, 2)" 
                      :key="meta.id" 
                      class="badge bg-light text-dark me-1"
                    >
                      {{ meta.label }}: {{ meta.value }}
                    </span>
                    <span v-if="image.metadata.length > 2" class="badge bg-secondary">
                      +{{ image.metadata.length - 2 }} more
                    </span>
                  </div>
                  <span v-else class="text-muted">No metadata</span>
                </td>
                <td>
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" @click="viewImageDetails(image)">
                      View
                    </button>
                    <button class="btn btn-outline-secondary" @click="editImage(image)">
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Load more button if needed -->
      <div v-if="hasMoreImages" class="text-center mt-4">
        <button 
          class="btn btn-outline-primary" 
          @click="loadMoreImages"
          :disabled="loadingMore"
        >
          <span v-if="loadingMore" class="spinner-border spinner-border-sm me-2" role="status"></span>
          Load More Images
        </button>
      </div>
    </div>
    
    <!-- Image details modal -->
    <div 
      class="modal fade" 
      id="imageDetailsModal" 
      tabindex="-1" 
      aria-labelledby="imageDetailsModalLabel" 
      aria-hidden="true"
      ref="imageModal"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="imageDetailsModalLabel">
              {{ selectedImage ? selectedImage.sample_id : 'Image Details' }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" v-if="selectedImage">
            <div class="row">
              <div class="col-md-6">
                <div class="image-container mb-3">
                  <img 
                    v-if="selectedImage.image_url" 
                    :src="selectedImage.image_url" 
                    class="img-fluid rounded" 
                    :alt="selectedImage.sample_id"
                  >
                  <div v-else class="no-image-large">No Image Available</div>
                </div>
                <div class="image-info">
                  <p v-if="selectedImage.description" class="mb-2">{{ selectedImage.description }}</p>
                  <p class="text-muted mb-2">
                    Uploaded: {{ formatDate(selectedImage.uploaded_at) }}
                  </p>
                  <p v-if="selectedImage.user_details" class="text-muted mb-0">
                    By: {{ selectedImage.user_details.username }}
                  </p>
                </div>
              </div>
              <div class="col-md-6">
                <h6>Metadata</h6>
                <div v-if="selectedImage.metadata && selectedImage.metadata.length > 0">
                  <table class="table table-sm">
                    <thead class="table-light">
                      <tr>
                        <th>Label</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="meta in selectedImage.metadata" :key="meta.id">
                        <td>{{ meta.label }}</td>
                        <td>{{ meta.value }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-else class="alert alert-info">
                  No metadata available for this image.
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              data-bs-dismiss="modal"
            >
              Close
            </button>
            <button 
              v-if="selectedImage" 
              type="button" 
              class="btn btn-primary"
              @click="editImage(selectedImage)"
            >
              Edit Metadata
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import CropImageCard from './CropImageCard.vue';

export default {
  name: 'CropImageGallery',
  components: {
    CropImageCard
  },
  data() {
    return {
      showFilters: true,
      filters: {
        csvFile: '',
        sampleId: '',
        metadataLabel: '',
        metadataValue: ''
      },
      appliedFilters: {},
      viewMode: 'grid',
      selectedImage: null,
      imageModal: null,
      loadingMore: false,
      hasMoreImages: false,
      currentPage: 1
    }
  },
  computed: {
    ...mapGetters('crop', ['getCsvFiles', 'getCropImages', 'getMetadataLabels', 'isLoading']),
    loading() {
      return this.isLoading;
    },
    csvFiles() {
      return this.getCsvFiles || [];
    },
    cropImages() {
      return this.getCropImages || [];
    },
    metadataLabels() {
      return this.getMetadataLabels || [];
    },
    hasActiveFilters() {
      return Object.values(this.filters).some(value => value !== '');
    }
  },
  mounted() {
    this.fetchInitialData();
    // Initialize Bootstrap modal
    this.$nextTick(() => {
      if (typeof bootstrap !== 'undefined') {
        this.imageModal = new bootstrap.Modal(this.$refs.imageModal);
      }
    });
  },
  methods: {
    ...mapActions('crop', ['fetchCsvFiles', 'fetchCropImages', 'fetchMetadataLabels']),
    
    async fetchInitialData() {
      await Promise.all([
        this.fetchCsvFiles(),
        this.fetchMetadataLabels(),
        this.fetchCropImages() // Initial fetch without filters
      ]);
    },
    
    toggleFilters() {
      this.showFilters = !this.showFilters;
    },
    
    clearFilters() {
      this.filters = {
        csvFile: '',
        sampleId: '',
        metadataLabel: '',
        metadataValue: ''
      };
      this.applyFilters();
    },
    
    applyFilters() {
      this.appliedFilters = { ...this.filters };
      this.currentPage = 1;
      this.fetchCropImages(this.filters);
    },
    
    async loadMoreImages() {
      this.loadingMore = true;
      this.currentPage += 1;
      
      // In a real implementation, you would pass page number to the API
      // This is a placeholder for pagination functionality
      try {
        // Simulating additional load
        await new Promise(resolve => setTimeout(resolve, 500));
        this.hasMoreImages = false; // For now, assume no more images after first load
      } catch (error) {
        console.error('Error loading more images:', error);
      } finally {
        this.loadingMore = false;
      }
    },
    
    viewImageDetails(image) {
      this.selectedImage = image;
      if (this.imageModal) {
        this.imageModal.show();
      }
    },
    
    editImage(image) {
      // Close modal if open
      if (this.imageModal) {
        this.imageModal.hide();
      }
      this.$emit('edit-image', image);
    },
    
    formatDate(dateString) {
      if (!dateString) return 'Unknown';
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }
}
</script>

<style scoped>
.crop-image-gallery {
  margin-bottom: 2rem;
}

.thumbnail {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

.no-image {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  color: #adb5bd;
  font-size: 0.7rem;
  border-radius: 4px;
}

.no-image-large {
  width: 100%;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  color: #adb5bd;
  font-size: 1rem;
  border-radius: 8px;
}

.image-cell {
  width: 80px;
}

.metadata-badges {
  display: flex;
  flex-wrap: wrap;
  max-width: 200px;
}

.image-container {
  background-color: #f8f9fa;
  border-radius: 8px;
  text-align: center;
  padding: 8px;
}
</style>
