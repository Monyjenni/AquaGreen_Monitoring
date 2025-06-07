<template>
  <div class="home">
    <div class="jumbotron bg-light p-5 rounded mb-4">
      <h1 class="display-4 text-success">Dashboard</h1>
      <hr class="my-4">
      <p>Upload your files, visualize data, and analyze greenhouse metrics in one place.</p>
      <router-link to="/upload" class="btn btn-success btn-lg">Upload Data File</router-link>
    </div>
    


    <div class="row mt-5">
      <div class="col-md-6 mb-4">
        <div class="card h-100 border-success">
          <div class="card-header bg-success text-white">
            <h5 class="card-title mb-0">Plant Growth Analysis</h5>
          </div>
          <div class="card-body">
            <p class="card-text">Upload, view, and analyze greenhouse data and metrics.</p>
            <ul class="mb-3">
              <li>Track growth rates over time</li>
              <li>Compare different plant varieties</li>
              <li>Identify optimal growing conditions</li>
              <li>Upload and manage Excel files</li>
            </ul>
            <div class="d-flex flex-wrap gap-2">
              <router-link to="/upload" class="btn btn-outline-success">Upload Files</router-link>
              <router-link to="/files" class="btn btn-outline-success">View Files</router-link>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-md-6 mb-4">
        <div class="card h-100 border-success">
          <div class="card-header bg-success text-white">
            <h5 class="card-title mb-0">Genetic Mapping Images</h5>
          </div>
          <div class="card-body">
            <p class="card-text">Manage crop images and CSV files for genetic analysis.</p>
            <ul class="mb-3">
              <li>Upload and manage crop images with metadata</li>
              <li>Process CSV mapping files for crop data</li>
              <li>View gene expression heat maps</li>
              <li>Analyze genetic markers</li>
              <li>Compare genetic variations</li>
            </ul>
            <div class="d-flex flex-wrap gap-2">
              <router-link to="/crop-images" class="btn btn-outline-success">Manage Crop Images</router-link>
              <router-link to="/csv-files" class="btn btn-outline-success">Manage CSV Files</router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'HomeView',
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
</style>
