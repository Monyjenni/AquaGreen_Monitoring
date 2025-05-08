<template>
  <div class="card crop-image-card mb-4">
    <div class="card-img-container">
      <img v-if="image.image_url" :src="image.image_url" class="card-img-top crop-image" :alt="image.sample_id">
      <div v-else class="no-image">No Image Available</div>
    </div>
    <div class="card-body">
      <h5 class="card-title">{{ image.sample_id }}</h5>
      <p v-if="image.description" class="card-text">{{ image.description }}</p>
      
      <div class="metadata-section mt-3" v-if="image.metadata && image.metadata.length > 0">
        <h6 class="metadata-title">Metadata</h6>
        <div class="metadata-tags">
          <span v-for="meta in image.metadata" :key="meta.id" class="badge bg-light text-dark me-2 mb-2">
            {{ meta.label }}: {{ meta.value }}
          </span>
        </div>
      </div>
      
      <div class="mt-3 d-flex justify-content-between">
        <button @click="$emit('view-details', image)" class="btn btn-sm btn-outline-primary">
          View Details
        </button>
        <button v-if="showEdit" @click="$emit('edit-image', image)" class="btn btn-sm btn-outline-secondary">
          Edit
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CropImageCard',
  props: {
    image: {
      type: Object,
      required: true
    },
    showEdit: {
      type: Boolean,
      default: true
    }
  },
  emits: ['view-details', 'edit-image']
}
</script>

<style scoped>
.crop-image-card {
  transition: transform 0.3s;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.crop-image-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.card-img-container {
  height: 200px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
}

.crop-image {
  object-fit: cover;
  width: 100%;
  height: 100%;
}

.no-image {
  color: #adb5bd;
  font-size: 1rem;
}

.metadata-title {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: #6c757d;
}

.metadata-tags {
  display: flex;
  flex-wrap: wrap;
}
</style>
