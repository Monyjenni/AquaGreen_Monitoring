<template>
  <div class="encryption-status">
    <div class="card">
      <div class="card-header bg-dark text-white">
        <h5 class="mb-0">
          <i class="fas fa-shield-alt me-2"></i>
          Data Encryption Status
        </h5>
      </div>
      <div class="card-body">
        <div v-if="loading" class="text-center">
          <div class="spinner-border text-primary" role="status"></div>
          <p class="mt-2">Loading encryption status...</p>
        </div>
        
        <div v-else-if="encryptionStats">
          <!-- Encryption Overview -->
          <div class="row mb-4">
            <div class="col-md-6">
              <div class="d-flex align-items-center mb-3">
                <i class="fas fa-check-circle text-success fa-2x me-3"></i>
                <div>
                  <h6 class="mb-0">Encryption Enabled</h6>
                  <small class="text-muted">{{ encryptionStats.encryption_algorithm }}</small>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="text-end">
                <div class="progress mb-2" style="height: 25px;">
                  <div 
                    class="progress-bar bg-success" 
                    role="progressbar" 
                    :style="`width: ${encryptionStats.encryption_percentage}%`"
                  >
                    {{ encryptionStats.encryption_percentage }}%
                  </div>
                </div>
                <small class="text-muted">Files Encrypted</small>
              </div>
            </div>
          </div>

          <!-- Statistics Cards -->
          <div class="row">
            <div class="col-md-3 mb-3">
              <div class="card bg-primary text-white">
                <div class="card-body text-center">
                  <i class="fas fa-file-alt fa-2x mb-2"></i>
                  <h4>{{ encryptionStats.total_genetic_files }}</h4>
                  <small>Total Files</small>
                </div>
              </div>
            </div>
            
            <div class="col-md-3 mb-3">
              <div class="card bg-success text-white">
                <div class="card-body text-center">
                  <i class="fas fa-lock fa-2x mb-2"></i>
                  <h4>{{ encryptionStats.encrypted_genetic_files }}</h4>
                  <small>Encrypted Files</small>
                </div>
              </div>
            </div>
            
            <div class="col-md-3 mb-3">
              <div class="card bg-info text-white">
                <div class="card-body text-center">
                  <i class="fas fa-database fa-2x mb-2"></i>
                  <h4>{{ encryptionStats.total_genetic_records }}</h4>
                  <small>Total Records</small>
                </div>
              </div>
            </div>
            
            <div class="col-md-3 mb-3">
              <div class="card bg-warning text-white">
                <div class="card-body text-center">
                  <i class="fas fa-shield-alt fa-2x mb-2"></i>
                  <h4>{{ encryptionStats.encrypted_genetic_records }}</h4>
                  <small>Protected Records</small>
                </div>
              </div>
            </div>
          </div>

          <!-- Security Features -->
          <div class="row mt-4">
            <div class="col-12">
              <h6><i class="fas fa-cog me-2"></i>Security Features</h6>
              <div class="row">
                <div class="col-md-4">
                  <div class="d-flex align-items-center mb-2">
                    <i class="fas fa-check text-success me-2"></i>
                    <span>AES-256 File Encryption</span>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="d-flex align-items-center mb-2">
                    <i class="fas fa-check text-success me-2"></i>
                    <span>Encrypted Genetic Signatures</span>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="d-flex align-items-center mb-2">
                    <i class="fas fa-check text-success me-2"></i>
                    <span>Secure File Downloads</span>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="d-flex align-items-center mb-2">
                    <i class="fas fa-check text-success me-2"></i>
                    <span>Protected Breeding Data</span>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="d-flex align-items-center mb-2">
                    <i class="fas fa-check text-success me-2"></i>
                    <span>Key Derivation (PBKDF2)</span>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="d-flex align-items-center mb-2">
                    <i class="fas fa-check text-success me-2"></i>
                    <span>Metadata Encryption</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="errorMessage" class="alert alert-danger">
          <i class="fas fa-exclamation-circle me-2"></i>{{ errorMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'EncryptionStatus',
  data() {
    return {
      encryptionStats: null,
      loading: true,
      errorMessage: ''
    };
  },
  async mounted() {
    await this.loadEncryptionStatus();
  },
  methods: {
    async loadEncryptionStatus() {
      try {
        this.loading = true;
        const response = await axios.get('/file-uploader/encryption/status/');
        this.encryptionStats = response.data.encryption_stats;
      } catch (error) {
        console.error('Error loading encryption status:', error);
        this.errorMessage = 'Error loading encryption status';
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.encryption-status .card {
  border: none;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.progress {
  border-radius: 15px;
}

.card.bg-primary,
.card.bg-success,
.card.bg-info,
.card.bg-warning {
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-body i.fa-2x {
  opacity: 0.8;
}
</style> 