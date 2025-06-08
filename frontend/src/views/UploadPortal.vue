<template>
    <div class="container">
      <div class="mb-4">
        <router-link to="/" class="btn btn-sm btn-outline-secondary">
          <i class="bi bi-arrow-left me-1"></i> Back
        </router-link>
      </div>
      <div class="text-center mb-5">
        <img src="@/assets/images/Logo.png" alt="Logo" class="mb-3" style="height: 128px;">
        <h1 class="display-5 fw-bold mb-2">AquaGreen Upload Center</h1>
        <p class="lead text-muted">Easily upload and manage your Greenhouse and Genetic data. Choose a portal below to get started.</p>
      </div>
      <div class="row justify-content-center g-4">
        <div class="col-md-5">
          <div class="card h-100 shadow-lg portal-card text-center">
            <div class="card-body d-flex flex-column align-items-center justify-content-center py-5">
              <span class="portal-icon mb-3 bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center">
                <i class="fas fa-seedling fa-2x text-success"></i>
              </span>
              <h4 class="card-title mb-2">Greenhouse Data Upload</h4>
              <p class="card-text text-muted mb-4">Upload and manage your greenhouse data files (Excel/CSV format) for plant growth and environment tracking.</p>
              <router-link to="/upload-greenhouse" class="btn btn-success btn-lg px-4">Go to Greenhouse Upload</router-link>
            </div>
          </div>
        </div>
        <div class="col-md-5">
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
    </div>
</template>

<script>
export default {
  name: 'UploadPortal'
}
</script>

<style scoped>
.upload-portal-bg {
  background: linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%);
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