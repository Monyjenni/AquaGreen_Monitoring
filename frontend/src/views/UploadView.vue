<template>
  <div class="upload-view">
    <BackButton />
    <h1 class="text-success mb-4">Upload Greenhouse Data</h1>
    
    <BaseCard class="mb-4">
      <template #header>
        <h5 class="card-title mb-0">Upload Excel File</h5>
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
          <label for="file" class="form-label">Excel File</label>
          <input
            type="file"
            class="form-control"
            id="file"
            @change="handleFileChange"
            accept=".xlsx,.xls"
            required
          />
          <div class="form-text">Accepted formats: .xlsx, .xls (Excel files only)</div>
        </div>
        
        <div v-if="fileError" class="alert alert-danger">
          {{ fileError }}
        </div>
        <div v-if="previewError" class="alert alert-danger">
          {{ previewError }}
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
          Ensure your Excel file contains greenhouse sensor data in a structured format
        </li>
        <li class="list-group-item">
          <i class="bi bi-check-circle-fill text-success me-2"></i>
          Our system automatically detects and processes all columns in your Excel file
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
import BackButton from '@/components/common/BackButton.vue';

export default {
  name: 'UploadView',
  components: {
    BaseButton,
    BaseCard,
    BackButton
  },
  data() {
    return {
      title: '',
      file: null,
      fileError: null,
      previewData: [],
      previewLoading: false,
      previewError: null
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
        return;
      }
      
      const formData = new FormData();
      formData.append('title', this.title);
      formData.append('file', this.file);
      
      try {
        await this.$store.dispatch('uploadFile', formData);
        this.$router.push('/files');
      } catch (error) {
        // Error will be handled by the store and displayed in the app
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
