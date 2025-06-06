<template>
  <div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2><i class="fas fa-dna me-2"></i>Genetic Data Management</h2>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading genetic data...</p>
    </div>

    <!-- No Data State -->
    <div v-else-if="geneticDataList.length === 0" class="text-center">
      <i class="fas fa-database fa-3x text-muted mb-3"></i>
      <h4>No Genetic Data Found</h4>
      <p class="text-muted">Upload your first genetic data file to get started</p>
      <router-link to="/genetic-data" class="btn btn-primary">
        <i class="fas fa-upload me-1"></i>Go to Upload Page
      </router-link>
    </div>

    <!-- Data List -->
    <div v-else>
      <div class="row">
        <div class="col-md-4 mb-4" v-for="geneticData in geneticDataList" :key="geneticData.id">
          <div class="card h-100 shadow-sm">
            <div class="card-header bg-light">
              <h6 class="card-title mb-0">
                <i class="fas fa-file-csv me-1"></i>
                Genetic Data #{{ geneticData.id }}
              </h6>
              <small class="text-muted">{{ formatDate(geneticData.uploaded_at) }}</small>
            </div>
            <div class="card-body">
              <div class="mb-2">
                <strong>Records:</strong> {{ geneticData.total_records }}
              </div>
              <div class="mb-2">
                <strong>File Type:</strong> {{ geneticData.file_type.toUpperCase() }}
              </div>
              <div class="mb-3">
                <span class="badge me-2" :class="geneticData.processed ? 'bg-success' : 'bg-warning'">
                  {{ geneticData.processed ? 'Processed' : 'Processing' }}
                </span>
                <span v-if="geneticData.is_encrypted" class="badge bg-primary">
                  <i class="fas fa-lock me-1"></i>Encrypted
                </span>
                <span v-else class="badge bg-secondary">
                  <i class="fas fa-unlock me-1"></i>Not Encrypted
                </span>
              </div>
              <div class="d-grid gap-2">
                <button 
                  class="btn btn-outline-primary btn-sm"
                  @click="viewDetails(geneticData)"
                >
                  <i class="fas fa-eye me-1"></i>View Details
                </button>
                <button 
                  v-if="geneticData.is_encrypted"
                  class="btn btn-outline-success btn-sm"
                  @click="downloadSecureFile(geneticData)"
                >
                  <i class="fas fa-download me-1"></i>Secure Download
                </button>
                <button 
                  class="btn btn-outline-danger btn-sm"
                  @click="confirmDelete(geneticData)"
                >
                  <i class="fas fa-trash me-1"></i>Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Details Modal -->
    <div class="modal fade" id="detailsModal" tabindex="-1" ref="detailsModal">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fas fa-dna me-2"></i>
              Genetic Data Details - #{{ selectedData?.id }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div v-if="loadingDetails" class="text-center">
              <div class="spinner-border text-primary" role="status"></div>
              <p>Loading details...</p>
            </div>
            <div v-else-if="selectedData">
              <!-- Summary -->
              <div class="row mb-4">
                <div class="col-md-2">
                  <div class="card bg-primary text-white">
                    <div class="card-body text-center">
                      <h4>{{ selectedData.total_records }}</h4>
                      <small>Total Records</small>
                    </div>
                  </div>
                </div>
                <div class="col-md-2">
                  <div class="card bg-success text-white">
                    <div class="card-body text-center">
                      <h4>{{ recordsWithImages }}</h4>
                      <small>With Images</small>
                    </div>
                  </div>
                </div>
                <div class="col-md-2">
                  <div class="card bg-warning text-white">
                    <div class="card-body text-center">
                      <h4>{{ recordsWithoutImages }}</h4>
                      <small>Without Images</small>
                    </div>
                  </div>
                </div>
                <div class="col-md-2">
                  <div class="card bg-info text-white">
                    <div class="card-body text-center">
                      <h4>{{ selectedData.file_type.toUpperCase() }}</h4>
                      <small>File Type</small>
                    </div>
                  </div>
                </div>
                <div class="col-md-2">
                  <div class="card text-white" :class="selectedData.is_encrypted ? 'bg-dark' : 'bg-secondary'">
                    <div class="card-body text-center">
                      <h4><i :class="selectedData.is_encrypted ? 'fas fa-lock' : 'fas fa-unlock'"></i></h4>
                      <small>{{ selectedData.is_encrypted ? 'Encrypted' : 'Not Encrypted' }}</small>
                    </div>
                  </div>
                </div>
                <div class="col-md-2" v-if="selectedData.is_encrypted && selectedData.original_size">
                  <div class="card bg-purple text-white" style="background-color: #6f42c1 !important;">
                    <div class="card-body text-center">
                      <h6>{{ formatFileSize(selectedData.original_size) }}</h6>
                      <small>Original Size</small>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Detailed Records with Images -->
              <div class="row">
                <div class="col-12">
                  <h6><i class="fas fa-table me-1"></i>Genetic Records with Images</h6>
                  <div v-for="record in geneticRecords" :key="record.id" class="card mb-3">
                    <div class="card-header">
                      <div class="row align-items-center">
                        <div class="col-md-8">
                          <h6 class="mb-0">
                            <strong>Record #{{ record.record_number }}</strong> - 
                            <span class="text-primary">{{ record.f5_code }}</span>
                          </h6>
                        </div>
                        <div class="col-md-4 text-end">
                          <span v-if="record.image" class="badge bg-success">
                            <i class="fas fa-image me-1"></i>Has Image
                          </span>
                          <span v-else class="badge bg-warning">
                            <i class="fas fa-exclamation me-1"></i>No Image
                          </span>
                        </div>
                      </div>
                    </div>
                    <div class="card-body">
                      <div class="row">
                        <!-- Image Column -->
                        <div class="col-md-3">
                          <div v-if="record.image" class="text-center">
                            <img 
                              :src="getImageUrl(record.image.image)" 
                              class="img-fluid rounded"
                              style="max-height: 200px; cursor: pointer;"
                              @click="viewImage(record.image)"
                              :alt="record.f5_code"
                            >
                            <p class="mt-2 small text-muted">{{ record.image.sample_id }}</p>
                          </div>
                          <div v-else class="text-center text-muted">
                            <i class="fas fa-image fa-3x mb-2"></i>
                            <p>No Image Available</p>
                          </div>
                        </div>
                        
                        <!-- Data Columns -->
                        <div class="col-md-9">
                          <div class="row">
                            <div class="col-md-6">
                              <table class="table table-sm">
                                <tr>
                                  <td><strong>Location:</strong></td>
                                  <td>{{ record.location || '-' }}</td>
                                </tr>
                                <tr>
                                  <td><strong>F5 Fruit #:</strong></td>
                                  <td>{{ record.f5_fruit_number || '-' }}</td>
                                </tr>
                                <tr>
                                  <td><strong>F6 Full Name:</strong></td>
                                  <td>{{ record.f6_full_name || '-' }}</td>
                                </tr>
                                <tr>
                                  <td><strong>6th Code:</strong></td>
                                  <td>{{ record.sixth_code || '-' }}</td>
                                </tr>
                                <tr>
                                  <td><strong>Fruit No.:</strong></td>
                                  <td>{{ record.fruit_number || '-' }}</td>
                                </tr>
                                <tr>
                                  <td><strong>Pollination Date:</strong></td>
                                  <td>{{ record.pollination_date || '-' }}</td>
                                </tr>
                                <tr>
                                  <td><strong>Harvest Date:</strong></td>
                                  <td>{{ record.harvest_date || '-' }}</td>
                                </tr>
                              </table>
                            </div>
                            <div class="col-md-6">
                              <table class="table table-sm">
                                <tr>
                                  <td><strong>Fruit Weight (Kg):</strong></td>
                                  <td>{{ record.fruit_weight || '-' }}</td>
                                </tr>
                                <tr>
                                  <td><strong>Fruit Length (cm):</strong></td>
                                  <td>{{ record.fruit_length || '-' }}</td>
                                </tr>
                                <tr>
                                  <td><strong>Fruit Width (cm):</strong></td>
                                  <td>{{ record.fruit_width || '-' }}</td>
                                </tr>
                                <tr>
                                  <td><strong>Rind Thickness (mm):</strong></td>
                                  <td>{{ record.rind_thickness || '-' }}</td>
                                </tr>
                                <tr>
                                  <td><strong>Flesh Color:</strong></td>
                                  <td>{{ record.flesh_color || '-' }}</td>
                                </tr>
                                <tr>
                                  <td><strong>Brix Content (%):</strong></td>
                                  <td>{{ record.brix_content || '-' }}</td>
                                </tr>
                                <tr>
                                  <td><strong>Seeds Quantity:</strong></td>
                                  <td>{{ record.seeds_quantity || '-' }}</td>
                                </tr>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal fade" id="deleteModal" tabindex="-1" ref="deleteModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Confirm Delete</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to delete this genetic data?</p>
            <div v-if="dataToDelete" class="alert alert-warning">
              <strong>Genetic Data #{{ dataToDelete.id }}</strong><br>
              <small>{{ dataToDelete.total_records }} records will be permanently deleted.</small>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-danger" @click="deleteData" :disabled="deleting">
              <i class="fas fa-trash me-1"></i>
              {{ deleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Viewer Modal -->
    <div class="modal fade" id="imageModal" tabindex="-1" ref="imageModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ selectedImage?.sample_id }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-center">
            <img 
              v-if="selectedImage"
              :src="getImageUrl(selectedImage.image)" 
              class="img-fluid"
              :alt="selectedImage.sample_id"
            >
            <div class="mt-3">
              <p><strong>Description:</strong> {{ selectedImage?.description || 'No description' }}</p>
              <p><strong>Uploaded:</strong> {{ formatDate(selectedImage?.uploaded_at) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="successMessage" class="alert alert-success alert-dismissible fade show mt-3">
      <i class="fas fa-check-circle me-2"></i>{{ successMessage }}
      <button type="button" class="btn-close" @click="successMessage = ''"></button>
    </div>

    <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show mt-3">
      <i class="fas fa-exclamation-circle me-2"></i>{{ errorMessage }}
      <button type="button" class="btn-close" @click="errorMessage = ''"></button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { Modal } from 'bootstrap';

export default {
  name: 'GeneticDataView',
  data() {
    return {
      geneticDataList: [],
      selectedData: null,
      geneticRecords: [],
      loading: true,
      loadingDetails: false,
      selectedImage: null,
      dataToDelete: null,
      deleting: false,
      successMessage: '',
      errorMessage: '',
      detailsModalInstance: null,
      imageModalInstance: null,
      deleteModalInstance: null
    };
  },
  computed: {
    recordsWithImages() {
      return this.geneticRecords.filter(record => record.image).length;
    },
    recordsWithoutImages() {
      return this.geneticRecords.filter(record => !record.image).length;
    }
  },
  async mounted() {
    await this.loadGeneticData();
    
    // Initialize modals
    this.$nextTick(() => {
      if (this.$refs.detailsModal) {
        this.detailsModalInstance = new Modal(this.$refs.detailsModal);
      }
      if (this.$refs.imageModal) {
        this.imageModalInstance = new Modal(this.$refs.imageModal);
      }
      if (this.$refs.deleteModal) {
        this.deleteModalInstance = new Modal(this.$refs.deleteModal);
      }
    });
  },
  methods: {
    async loadGeneticData() {
      try {
        this.loading = true;
        const response = await axios.get('/file-uploader/genetic-data/');
        this.geneticDataList = response.data;
      } catch (error) {
        console.error('Error loading genetic data:', error);
        this.errorMessage = 'Error loading genetic data';
      } finally {
        this.loading = false;
      }
    },
    
    async viewDetails(geneticData) {
      try {
        this.selectedData = geneticData;
        this.loadingDetails = true;
        this.detailsModalInstance.show();
        
        const response = await axios.get(`/file-uploader/genetic-data/${geneticData.id}/records/`);
        this.geneticRecords = response.data;
      } catch (error) {
        console.error('Error loading genetic records:', error);
        this.errorMessage = 'Error loading genetic records';
      } finally {
        this.loadingDetails = false;
      }
    },
    
    confirmDelete(geneticData) {
      this.dataToDelete = geneticData;
      this.deleteModalInstance.show();
    },
    
    async deleteData() {
      try {
        this.deleting = true;
        await axios.delete(`/file-uploader/genetic-data/${this.dataToDelete.id}/`);
        
        this.successMessage = `Genetic Data #${this.dataToDelete.id} deleted successfully`;
        this.deleteModalInstance.hide();
        await this.loadGeneticData(); // Reload the list
      } catch (error) {
        console.error('Error deleting genetic data:', error);
        this.errorMessage = 'Error deleting genetic data';
      } finally {
        this.deleting = false;
        this.dataToDelete = null;
      }
    },
    
    viewImage(image) {
      this.selectedImage = image;
      this.imageModalInstance.show();
    },
    
    getImageUrl(imagePath) {
      return `http://127.0.0.1:8000${imagePath}`;
    },
    
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    async downloadSecureFile(geneticData) {
      try {
        const response = await axios.get(
          `/file-uploader/genetic-data/${geneticData.id}/download/`,
          { responseType: 'blob' }
        );
        
        // Create blob link to download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        
        // Get filename from response headers or use default
        const contentDisposition = response.headers['content-disposition'];
        let filename = `genetic_data_${geneticData.id}.csv`;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
        
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        this.successMessage = 'File downloaded successfully (decrypted)';
      } catch (error) {
        console.error('Error downloading file:', error);
        this.errorMessage = 'Error downloading encrypted file';
      }
    },
    
    formatFileSize(bytes) {
      if (!bytes) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
  }
};
</script>

<style scoped>
.card {
  transition: transform 0.2s;
}

.card:hover {
  transform: translateY(-2px);
}

.img-thumbnail:hover {
  transform: scale(1.1);
  transition: transform 0.2s;
}

.table td {
  padding: 0.25rem 0.5rem;
  border: none;
}

.table td:first-child {
  width: 40%;
}
</style> 