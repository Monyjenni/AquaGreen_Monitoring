<template>
  <div class="metadata-editor">
    <h5 class="mb-3">Image Metadata</h5>
    
    <div v-if="loading" class="text-center py-3">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    
    <div v-else>
      <!-- Current metadata display -->
      <div v-if="metadata.length > 0" class="current-metadata mb-4">
        <h6>Current Metadata</h6>
        <table class="table table-sm table-hover">
          <thead class="table-light">
            <tr>
              <th>Label</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in metadata" :key="item.id">
              <td>{{ item.label }}</td>
              <td>{{ item.value }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div v-else class="alert alert-info">
        No metadata available for this image.
      </div>
      
      <!-- Add new metadata form -->
      <form @submit.prevent="addMetadata">
        <h6>Add New Metadata</h6>
        
        <div class="mb-3">
          <label for="metadataLabel" class="form-label">Label</label>
          <div class="input-group">
            <input 
              type="text" 
              class="form-control" 
              id="metadataLabel" 
              v-model="newMetadata.label"
              list="commonLabels"
              placeholder="e.g., Crop Type, Growth Stage"
              required
            >
            <datalist id="commonLabels">
              <option v-for="label in metadataLabels" :key="label" :value="label"></option>
            </datalist>
          </div>
        </div>
        
        <div class="mb-3">
          <label for="metadataValue" class="form-label">Value</label>
          <input 
            type="text" 
            class="form-control" 
            id="metadataValue" 
            v-model="newMetadata.value"
            placeholder="e.g., Tomato, Flowering"
            required
          >
        </div>
        
        <div class="d-flex justify-content-between">
          <button type="submit" class="btn btn-primary" :disabled="addingMetadata">
            <span v-if="addingMetadata" class="spinner-border spinner-border-sm me-2" role="status"></span>
            Add Metadata
          </button>
          
          <button 
            type="button" 
            class="btn btn-outline-secondary" 
            @click="addMultiple"
            :disabled="!newMetadata.label || !newMetadata.value"
          >
            Add & Continue
          </button>
        </div>
      </form>
      
      <!-- Batch metadata entry -->
      <div class="mt-4">
        <h6>Batch Metadata Entry</h6>
        <div class="alert alert-light">
          <small>Add multiple metadata items at once using format: <code>label:value</code> (one per line)</small>
        </div>
        
        <div class="mb-3">
          <textarea 
            class="form-control" 
            rows="4" 
            v-model="batchMetadata"
            placeholder="Crop Type:Tomato\nPlant Age:45 days\nHealth Status:Healthy"
          ></textarea>
        </div>
        
        <button 
          type="button" 
          class="btn btn-outline-primary" 
          @click="addBatchMetadata"
          :disabled="!batchMetadata.trim() || addingMetadata"
        >
          <span v-if="addingMetadata" class="spinner-border spinner-border-sm me-2" role="status"></span>
          Add Batch Metadata
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'MetadataEditor',
  props: {
    imageId: {
      type: [Number, String],
      required: true
    },
    initialMetadata: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      metadata: [],
      newMetadata: {
        label: '',
        value: ''
      },
      batchMetadata: '',
      addingMetadata: false
    }
  },
  computed: {
    ...mapGetters('crop', ['getMetadataLabels', 'isLoading']),
    loading() {
      return this.isLoading;
    },
    metadataLabels() {
      return this.getMetadataLabels || [];
    }
  },
  watch: {
    initialMetadata: {
      immediate: true,
      handler(newValue) {
        if (newValue && Array.isArray(newValue)) {
          this.metadata = [...newValue];
        }
      }
    }
  },
  mounted() {
    this.fetchMetadataLabels();
  },
  methods: {
    ...mapActions('crop', ['fetchMetadataLabels', 'addMetadataToImage']),
    
    resetForm() {
      this.newMetadata = {
        label: '',
        value: ''
      };
    },
    
    async addMetadata() {
      if (!this.newMetadata.label || !this.newMetadata.value) return;
      
      this.addingMetadata = true;
      
      try {
        const result = await this.addMetadataToImage({
          imageId: this.imageId,
          metadata: [this.newMetadata]
        });
        
        this.metadata = result.metadata || this.metadata;
        this.$emit('metadata-updated', this.metadata);
        this.$toast?.success('Metadata added successfully');
        this.resetForm();
      } catch (error) {
        console.error('Error adding metadata:', error);
        this.$toast?.error('Failed to add metadata. Please try again.');
      } finally {
        this.addingMetadata = false;
      }
    },
    
    addMultiple() {
      if (!this.newMetadata.label || !this.newMetadata.value) return;
      
      // Create a copy of the current metadata and add it to the list (optimistic UI update)
      const newItem = { ...this.newMetadata };
      this.metadata.push({
        id: `temp-${Date.now()}`,
        ...newItem
      });
      
      // Add to the actual image via API
      this.addMetadataToImage({
        imageId: this.imageId,
        metadata: [newItem]
      }).catch(error => {
        console.error('Error adding metadata:', error);
        this.$toast?.error('Failed to add metadata. Please try again.');
      });
      
      // Reset form for next entry but keep focus
      this.resetForm();
      setTimeout(() => {
        document.getElementById('metadataLabel')?.focus();
      }, 0);
    },
    
    async addBatchMetadata() {
      if (!this.batchMetadata.trim()) return;
      
      const metadataItems = this.parseBatchMetadata();
      if (metadataItems.length === 0) {
        this.$toast?.error('Invalid format. Please use label:value format, one per line.');
        return;
      }
      
      this.addingMetadata = true;
      
      try {
        const result = await this.addMetadataToImage({
          imageId: this.imageId,
          metadata: metadataItems
        });
        
        this.metadata = result.metadata || this.metadata;
        this.$emit('metadata-updated', this.metadata);
        this.$toast?.success(`Added ${metadataItems.length} metadata items`);
        this.batchMetadata = '';
      } catch (error) {
        console.error('Error adding batch metadata:', error);
        this.$toast?.error('Failed to add metadata. Please try again.');
      } finally {
        this.addingMetadata = false;
      }
    },
    
    parseBatchMetadata() {
      const lines = this.batchMetadata.split('\n');
      const metadata = [];
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        
        const colonIndex = trimmed.indexOf(':');
        if (colonIndex === -1) continue;
        
        const label = trimmed.substring(0, colonIndex).trim();
        const value = trimmed.substring(colonIndex + 1).trim();
        
        if (label && value) {
          metadata.push({ label, value });
        }
      }
      
      return metadata;
    }
  }
}
</script>

<style scoped>
.metadata-editor {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
}

.current-metadata {
  max-height: 300px;
  overflow-y: auto;
}

table.table-sm {
  font-size: 0.9rem;
}

.table-hover tbody tr:hover {
  background-color: rgba(40, 167, 69, 0.1);
}
</style>
