<template>
  <div class="upload-view">
    <div class="mb-4">
      <router-link to="/upload" class="btn btn-sm btn-outline-secondary">
        <i class="bi bi-arrow-left me-1"></i> Back
      </router-link>
      <h2 class="mt-3 text-success">Upload Greenhouse Data</h2>
    </div>
    
    <BaseCard class="mb-4">
      <template #header>
        <h5 class="card-title mb-0">Upload Data File</h5>
      </template>
      
      <form @submit.prevent="uploadFile">
        <div class="mb-3">
          <label for="title" class="form-label">Title</label>
          <input
            type="text"
            class="form-control"
            id="title"
            v-model="title"
            placeholder="Enter a descriptive title for your data"
            required
          />
          <div class="form-text">Give your file a meaningful name related to your greenhouse data.</div>
        </div>
        
        <div class="mb-3">
          <label for="file" class="form-label">Data File</label>
          <input
            type="file"
            class="form-control"
            id="file"
            @change="handleFileChange"
            accept=".xlsx,.xls,.csv"
            required
          />
          <div class="form-text">Accepted formats: .xlsx, .xls (Excel files), .csv (CSV files)</div>
        </div>
        
        <div v-if="fileError" class="alert alert-danger">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          {{ fileError }}
        </div>
        <div v-if="previewError" class="alert alert-danger">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          {{ previewError }}
        </div>
        <div v-if="error" class="alert alert-danger">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          {{ typeof error === 'object' ? Object.values(error).flat().join(', ') : error }}
        </div>
        <div class="d-flex gap-2 mb-3">
          <BaseButton 
            variant="info" 
            :disabled="!file || previewLoading" 
            :loading="previewLoading"
            @click="previewFile"
          >
            Preview Data
          </BaseButton>
          <BaseButton 
            variant="success" 
            :disabled="loading || !file || !previewData.length" 
            :loading="loading"
            type="submit"
          >
            Confirm Upload
          </BaseButton>
        </div>
        <div v-if="previewData.length">
          <h5>Data Preview (first 5 rows)</h5>
          <table class="table table-bordered">
            <thead>
              <tr>
                <th v-for="header in Object.keys(previewData[0])" :key="header">{{ header }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in previewData" :key="idx">
                <td v-for="header in Object.keys(row)" :key="header">{{ row[header] }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </form>
    </BaseCard>
    
    <BaseCard>
      <template #header>
        <h5 class="card-title mb-0">Upload Guidelines</h5>
      </template>
      
      <h6 class="card-subtitle mb-3 text-success">How to prepare your greenhouse data files:</h6>
      <ul class="list-group list-group-flush mb-3">
        <li class="list-group-item bg-light">
          <i class="bi bi-check-circle-fill text-success me-2"></i>
          Ensure your Excel file contains greenhouse data in a structured format
        </li>
        <li class="list-group-item bg-light">
          <i class="bi bi-check-circle-fill text-success me-2"></i>
          Include headers in your Excel file for better data identification
        </li>
        <li class="list-group-item">
          <i class="bi bi-check-circle-fill text-success me-2"></i>
          Maximum file size: 10MB
        </li>
      </ul>
      <div class="alert alert-success">
        <i class="bi bi-info-circle-fill me-2"></i>
        After uploading, you can view and analyze your data in the <router-link to="/files" class="alert-link">Files section</router-link>.
      </div>
    </BaseCard>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import * as XLSX from 'xlsx';
import BaseButton from '@/components/common/BaseButton.vue';
import BaseCard from '@/components/common/BaseCard.vue';

export default {
  name: 'UploadView',
  components: {
    BaseButton,
    BaseCard
  },
  data() {
    return {
      title: '',
      file: null,
      fileError: null,
      previewData: [],
      previewLoading: false,
      previewError: null,
      isUploading: false,
      uploadProgress: 0,
    };
  },
  computed: {
    ...mapState(['loading', 'error'])
  },
  methods: {
    ...mapActions(['uploadFile']),
    handleFileChange(event) {
      const selectedFile = event.target.files[0];
      this.fileError = null;
      
      if (!selectedFile) {
        this.file = null;
        return;
      }
      
      // Check file type
      const validTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!validTypes.includes(selectedFile.type)) {
        this.fileError = 'Invalid file type. Please upload an Excel file (.xlsx or .xls)';
        this.file = null;
        return;
      }
      
      // Check file size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (selectedFile.size > maxSize) {
        this.fileError = 'File is too large. Maximum size is 10MB';
        this.file = null;
        return;
      }
      
      this.file = selectedFile;
    },
    async previewFile() {
      this.previewError = null;
      this.previewLoading = true;
      try {
        this.previewData = await this.parseExcel(this.file);
      } catch (err) {
        this.previewError = 'Failed to parse file';
      } finally {
        this.previewLoading = false;
      }
    },
    parseExcel(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheet];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          const headers = json[0] || [];
          const rows = json.slice(1, 6);
          const result = rows.map(row => {
            const obj = {};
            headers.forEach((header, idx) => {
              obj[header] = row[idx];
            });
            return obj;
          });
          resolve(result);
        };
        reader.onerror = err => reject(err);
        reader.readAsArrayBuffer(file);
      });
    },
    async uploadFile() {
      if (!this.file) {
        this.$toast?.error('Please select a file to upload');
        return;
      }

      // Check if file is empty
      if (this.file.size === 0) {
        this.$toast?.error('File is empty. Please select a valid file.');
        return;
      }

      this.isUploading = true;
      this.uploadProgress = 0;
      
      try {
        const formData = new FormData();
        formData.append('title', this.title);
        formData.append('file', this.file);
        
        const response = await this.$store.dispatch('uploadFile', formData);
        
        // Handle success
        this.$toast?.success('File uploaded successfully');
        
        // Navigate directly to the file detail view instead of the files list
        if (response && response.id) {
          this.$router.push(`/files/${response.id}`);
        } else {
          this.$router.push('/files');
        }
      } catch (error) {
        // Handle error
        console.error('Upload error:', error.response?.data || error);
        
        // Display structured error messages
        if (error.response?.data?.error) {
          this.$toast?.error(`Error: ${error.response.data.error}`);
        } else if (error.response?.data?.detail) {
          this.$toast?.error(`Error: ${error.response.data.detail}`);
        } else if (error.response?.data) {
          // If it's an object with multiple errors
          if (typeof error.response.data === 'object') {
            const errorMsg = Object.entries(error.response.data)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ');
            this.$toast?.error(`Validation errors: ${errorMsg}`);
          } else {
            this.$toast?.error(`Error: ${error.response.data}`);
          }
        } else {
          this.$toast?.error('Failed to upload file. Please try again.');
        }
      } finally {
        this.isUploading = false;
      }
    }
  }
};
</script>

<style scoped>
.upload-view h1 {
  margin-bottom: 2rem;
}

.form-text {
  font-size: 0.85rem;
  color: #6c757d;
}

.list-group-item {
  border-left: none;
  border-right: none;
}

.list-group-item:first-child {
  border-top: none;
}

.list-group-item:last-child {
  border-bottom: none;
}
</style>
