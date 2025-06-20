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
            accept=".xlsx,.xls"
            required
          />
          <div class="form-text">Accepted formats: .xlsx, .xls (Excel files)</div>
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
        
        <div v-if="nethouseIds && Object.keys(nethouseIds).length > 0" class="mt-4">
          <h5>Nethouse ID Summary</h5>
          <div class="alert alert-info">
            <p class="mb-2"><strong>Total Nethouse IDs found:</strong> {{ Object.keys(nethouseIds).length }}</p>
          </div>
          <table class="table table-bordered">
            <thead>
              <tr>
                <th>Nethouse ID</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(count, nethouseId) in nethouseIds" :key="nethouseId">
                <td>{{ nethouseId }}</td>
                <td>{{ count }}</td>
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
      nethouseIds: null,
      nethouseIdColumnName: null
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
      
      const validTypes = [
        'application/vnd.ms-excel', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
      const isValidExtension = ['xlsx', 'xls'].includes(fileExtension);
      
      if (!validTypes.includes(selectedFile.type) && !isValidExtension) {
        this.fileError = 'Invalid file type. Please upload an Excel file (.xlsx or .xls)';
        this.file = null;
        return;
      }
      
      const maxSize = 10 * 1024 * 1024;  
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
          
          this.processNethouseIds(json, headers);
          
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
    
    processNethouseIds(json, headers) {
      this.nethouseIds = {};
      this.nethouseIdColumnName = null;
      
      if (json.length <= 1) return;  
      
      const possibleColumns = headers.filter(header => 
        header && typeof header === 'string' && 
        (header.toLowerCase().includes('nethouse') || 
         header.toLowerCase().includes('house') || 
         header.toLowerCase().includes('id') ||
         header.toLowerCase().includes('nh')));
      
      let nethouseIdColumn = null;
      
      if (possibleColumns.length > 0) {
        nethouseIdColumn = headers.indexOf(possibleColumns[0]);
        this.nethouseIdColumnName = possibleColumns[0];
      } else {
        for (let colIdx = 0; colIdx < headers.length; colIdx++) {
          let idCandidates = 0;
          const checkRows = Math.min(10, json.length - 1);  
          
          for (let rowIdx = 1; rowIdx <= checkRows; rowIdx++) {
            const row = json[rowIdx];
            if (row && row[colIdx] && 
                (typeof row[colIdx] === 'number' || 
                 (typeof row[colIdx] === 'string' && /^\d{3,4}$/.test(row[colIdx])))) {
              idCandidates++;
            }
          }
          
          if (idCandidates > checkRows * 0.7) {
            nethouseIdColumn = colIdx;
            this.nethouseIdColumnName = headers[colIdx];
            break;
          }
        }
      }
      
      if (nethouseIdColumn !== null) {
        for (let i = 1; i < json.length; i++) {
          const row = json[i];
          if (row && row[nethouseIdColumn]) {
            const nethouseId = String(row[nethouseIdColumn]);  
            this.nethouseIds[nethouseId] = (this.nethouseIds[nethouseId] || 0) + 1;
          }
        }
      }
    },
    async uploadFile() {
      if (!this.file) {
        this.$toast?.error('Please select a file to upload');
        return;
      }

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
        
        this.$toast?.success('File uploaded successfully');
        
        if (response && response.id) {
          this.$router.push(`/files/${response.id}`);
        } else {
          this.$router.push('/files');
        }
      } catch (error) {
        console.error('Upload error:', error.response?.data || error);
        
        if (error.response?.data?.error) {
          this.$toast?.error(`Error: ${error.response.data.error}`);
        } else if (error.response?.data?.detail) {
          this.$toast?.error(`Error: ${error.response.data.detail}`);
        } else if (error.response?.data) {
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
