<template>
  <div class="modal fade" id="namingGuideModal" tabindex="-1" aria-labelledby="namingGuideModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="namingGuideModalLabel">Crop Image & CSV File Naming Guide</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <ul class="nav nav-tabs" id="guideTab">
            <li class="nav-item">
              <button class="nav-link active" id="csv-tab" data-bs-toggle="tab" data-bs-target="#csv-content" type="button" aria-controls="csv-content">CSV Structure</button>
            </li>
            <li class="nav-item">
              <button class="nav-link" id="image-tab" data-bs-toggle="tab" data-bs-target="#image-content" type="button" aria-controls="image-content">Image Naming</button>
            </li>
            <li class="nav-item">
              <button class="nav-link" id="workflow-tab" data-bs-toggle="tab" data-bs-target="#workflow-content" type="button" aria-controls="workflow-content">Upload Workflow</button>
            </li>
          </ul>
          <div class="tab-content p-3" id="guideTabContent">
            <!-- CSV Structure Tab -->
            <div class="tab-pane fade show active" id="csv-content" role="tabpanel" aria-labelledby="csv-tab">
              <h4>CSV Metadata File Format</h4>
              <p>Your CSV metadata file should contain these columns:</p>
              <ul>
                <li><code>sample_id</code> (Required): Unique identifier for each crop sample (e.g., CROP_001)</li>
                <li>Additional fields (Optional): Add any relevant metadata like species, growth stage, health status, etc.</li>
              </ul>
              
              <h5>Example CSV Structure</h5>
              <div class="bg-light p-3 mb-3 rounded">
                <pre class="mb-0"><code>sample_id,species,cultivation_date,plant_age_days,growth_stage,health_status,description
CROP_001,Lettuce,2025-01-15,45,Mature,Healthy,Romaine lettuce sample with normal growth pattern
CROP_002,Lettuce,2025-01-15,45,Mature,Infected,Romaine lettuce sample showing early signs of fungal infection</code></pre>
              </div>
              
              <div class="alert alert-info">
                <i class="bi bi-info-circle-fill me-2"></i> 
                You can download our <a :href="sampleCsvUrl" download="sample_lettuce.csv" class="alert-link">sample CSV template</a> to get started.
              </div>
            </div>
            
            <!-- Image Naming Tab -->
            <div class="tab-pane fade" id="image-content" role="tabpanel" aria-labelledby="image-tab">
              <h4>Image Naming Convention</h4>
              <p>When uploading crop images, follow these naming conventions:</p>
              
              <h5>Basic Format</h5>
              <p><code>{SAMPLE_ID}V{VERSION_NUMBER}</code></p>
              <p>Example: <code>CROP_001V1.jpg</code>, <code>CROP_001V2.jpg</code>, <code>CROP_001V3.jpg</code></p>
              
              <h5>Sample ID</h5>
              <p>Must match exactly with the <code>sample_id</code> field in your CSV file</p>
              <p>Example: If CSV has <code>CROP_001</code>, your image should start with <code>CROP_001</code></p>
              
              <h5>Version Number</h5>
              <p>Append <code>V{number}</code> to indicate different versions/angles of the same sample</p>
              <p>Example: <code>CROP_001V1.jpg</code> (first view), <code>CROP_001V2.jpg</code> (second view)</p>
              
              <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle-fill me-2"></i> 
                Image names that don't match any sample_id in the CSV file will be rejected.
              </div>
            </div>
            
            <!-- Workflow Tab -->
            <div class="tab-pane fade" id="workflow-content" role="tabpanel" aria-labelledby="workflow-tab">
              <h4>Upload Workflow</h4>
              <ol>
                <li>First, upload your CSV metadata file through the "Upload CSV Mapping File" section</li>
                <li>Process the CSV file by clicking "Process Now" after upload</li>
                <li>Select the processed CSV file when uploading images</li>
                <li>Upload your crop images - they will be automatically validated against the CSV sample IDs</li>
              </ol>
              
              <h5>Folder Structure (Recommended)</h5>
              <p>Organize your image files in folders by crop type or experiment:</p>
              <div class="bg-light p-3 mb-3 rounded">
                <pre class="mb-0"><code>Lettuce_Experiment_2025/
├── CROP_001V1.jpg
├── CROP_001V2.jpg
├── CROP_002V1.jpg
├── CROP_002V2.jpg
└── ...</code></pre>
              </div>
              
              <h5>Best Practices</h5>
              <ul>
                <li>Keep sample IDs consistent across related experiments</li>
                <li>Use descriptive names for CSV files (e.g., <code>lettuce_growth_study_2025.csv</code>)</li>
                <li>Include sufficient metadata in your CSV to support later analysis</li>
                <li>Take multiple viewpoints (versions) of the same sample when relevant</li>
              </ul>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <a :href="guideDocUrl" download="crop_image_naming_guide.md" class="btn btn-outline-primary me-auto">
            <i class="bi bi-download me-1"></i> Download Full Guide
          </a>
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'NamingGuideModal',
  data() {
    return {
      sampleCsvUrl: '/sample_lettuce.csv',
      guideDocUrl: '/crop_image_naming_guide.md'
    };
  },
  mounted() {
    // Initialize Bootstrap modal when component is mounted
    if (typeof window !== 'undefined' && window.bootstrap) {
      const modalElement = document.getElementById('namingGuideModal');
      if (modalElement) {
        // Initialize modal without storing the reference since we don't need it later
        new window.bootstrap.Modal(modalElement);
        
        this.$nextTick(() => {
          // Enable tab functionality
          const tabTriggerList = document.querySelectorAll('#guideTab button');
          tabTriggerList.forEach(tabTriggerEl => {
            tabTriggerEl.addEventListener('click', event => {
              event.preventDefault();
              const target = tabTriggerEl.getAttribute('data-bs-target');
              if (target) {
                const tabContent = document.querySelector(target);
                const allContent = document.querySelectorAll('.tab-pane');
                // Hide all tabs
                allContent.forEach(el => {
                  el.classList.remove('show', 'active');
                });
                // Show selected tab
                if (tabContent) {
                  tabContent.classList.add('show', 'active');
                }
                // Update active state
                document.querySelectorAll('#guideTab button').forEach(btn => {
                  btn.classList.remove('active');
                });
                tabTriggerEl.classList.add('active');
              }
            });
          });
        });
      }
    }
  }
});
</script>

<style scoped>
.modal-body {
  max-height: 70vh;
  overflow-y: auto;
}

pre {
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 10px;
  font-size: 0.9rem;
  overflow-x: auto;
}

code {
  color: #198754;
  font-weight: 500;
}
</style>
