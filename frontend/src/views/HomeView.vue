<template>
  <div class="home">
    <div class="jumbotron bg-light p-5 rounded mb-4">
      <h1 class="display-4 text-success">Dashboard</h1>
      <hr class="my-4">
      <p>Upload your files, visualize data, and analyze greenhouse metrics in one place.</p>
      <router-link to="/upload" class="btn btn-success btn-lg">Upload Data File</router-link>
    </div>
    


    <div class="row">
      <div class="col-md-6 mb-4">
        <div class="card h-100 shadow-lg portal-card text-center">
          <div class="card-body d-flex flex-column align-items-center justify-content-center py-5">
            <span class="portal-icon mb-3 bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center">
              <i class="fas fa-seedling fa-2x text-success"></i>
            </span>
            <h4 class="card-title mb-2">Greenhouse Data Upload</h4>
            <p class="card-text text-muted mb-4">Upload and manage your greenhouse data files (Excel format) for plant growth and environment tracking.</p>
            <router-link to="/upload-greenhouse" class="btn btn-success btn-lg px-4">Go to Greenhouse Upload</router-link>
          </div>
        </div>
      </div>
      
      <div class="col-md-6 mb-4">
        <div class="card h-100 shadow-lg portal-card text-center">
          <div class="card-body d-flex flex-column align-items-center justify-content-center py-5">
            <span class="portal-icon mb-3 bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center">
              <i class="fas fa-dna fa-2x text-primary"></i>
            </span>
            <h4 class="card-title mb-2">Genetic Data Upload</h4>
            <p class="card-text text-muted mb-4">Upload genetic data (CSV/Excel) and match fruit images for advanced genetic mapping and analysis.</p>
            <router-link to="/genetic-data" class="btn btn-primary btn-lg px-4">Go to Genetic Upload</router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Encryption Status Section -->
    <div class="row mt-5">
      <div class="col-12">
        <EncryptionStatus />
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import EncryptionStatus from '@/components/EncryptionStatus.vue'

export default defineComponent({
  name: 'HomeView',
  components: {
    EncryptionStatus
  },
  data() {
    return {
      selectedFileId: null
    }
  }
})
</script>

<style scoped>
.jumbotron {
  background-color: #d1e7dd !important;
  border-left: 5px solid #198754;
}

.card {
  transition: transform 0.3s;
}

.card:hover {
  transform: translateY(-5px);
}

.hero-section {
  background: linear-gradient(135deg, #4caf50 0%, #2e7d33 100%);
  color: white;
  padding: 4rem 0;
  margin-bottom: 2rem;
}

.portal-card {
  border: none;
  border-radius: 1.5rem;
  transition: box-shadow 0.2s, transform 0.2s;
}

.portal-card:hover {
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  transform: translateY(-4px) scale(1.02);
}

.portal-icon {
  width: 72px;
  height: 72px;
  font-size: 2.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
</style>
