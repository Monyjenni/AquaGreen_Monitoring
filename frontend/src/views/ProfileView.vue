<template>
  <div class="profile-view container py-5">
    <div class="mb-4">
      <button @click="$router.go(-1)" class="btn btn-sm btn-outline-secondary">
        <i class="bi bi-arrow-left me-1"></i> Back
      </button>
    </div>
    
    <div class="row justify-content-center">
      <div class="col-md-8">
        <BaseCard>
          <template #header>
            <h5 class="mb-0">User Profile</h5>
          </template>
          
          <div v-if="loading" class="text-center p-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
          
          <div v-else-if="error" class="alert alert-danger">
            {{ error }}
          </div>
          
          <div v-else>
            <div class="text-center mb-4">
              <div class="avatar-circle mb-3">
                <span class="initials">{{ userInitials }}</span>
              </div>
              <h4>{{ user.username }}</h4>
              <p class="text-muted">{{ user.email }}</p>
              <div class="text-muted small">
                <p class="mb-1"><i class="bi bi-calendar3"></i> Member since: {{ formatDate(user.date_joined) }}</p>
                <p class="mb-0"><i class="bi bi-clock"></i> Last login: {{ formatDate(user.last_login) }}</p>
              </div>
            </div>
            
            <div class="row mt-4">
              <div class="col-md-6 mb-3">
                <div class="card h-100">
                  <div class="card-body">
                    <h5 class="card-title">Files</h5>
                    <h3 class="text-primary">{{ stats.fileCount }}</h3>
                    <p class="text-muted">Total files uploaded</p>
                  </div>
                </div>
              </div>
              
              <div class="col-md-6 mb-3">
                <div class="card h-100">
                  <div class="card-body">
                    <h5 class="card-title">Processed</h5>
                    <h3 class="text-success">{{ stats.processedCount }}</h3>
                    <p class="text-muted">Files processed</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="mt-4">
              <h5>Account Details</h5>
              <table class="table">
                <tbody>
                  <tr>
                    <th scope="row" style="width: 40%">Username</th>
                    <td>{{ user.username }}</td>
                  </tr>
                  <tr>
                    <th scope="row">Email</th>
                    <td>{{ user.email }}</td>
                  </tr>
                  <tr>
                    <th scope="row">Member Since</th>
                    <td>{{ formatDate(user.date_joined) }}</td>
                  </tr>
                  <tr>
                    <th scope="row">Last Login</th>
                    <td>{{ formatDate(user.last_login) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import BaseCard from '@/components/common/BaseCard.vue';

export default {
  name: 'ProfileView',
  components: {
    BaseCard
  },
  data() {
    return {
      loading: true,
      error: null,
      user: {},
      stats: {
        fileCount: 0,
        processedCount: 0
      }
    };
  },
  computed: {
    ...mapState(['isAuthenticated']),
    userInitials() {
      if (!this.user.username) return '';
      return this.user.username.charAt(0).toUpperCase();
    }
  },
  mounted() {
    this.fetchUserProfile();
  },
  methods: {
    async fetchUserProfile() {
      this.loading = true;
      try {
        // Fetch user profile
        const response = await this.$store.dispatch('fetchUserProfile');
        console.log('User profile data:', response);
        
        // Directly set the user data from response
        this.user = {
          ...response,
          // Make sure date fields are available or set defaults
          date_joined: response.date_joined || 'Not available',
          last_login: response.last_login || 'Not available'
        };
        
        // Get file statistics
        const files = await this.$store.dispatch('fetchFiles');
        this.stats.fileCount = files.length;
        this.stats.processedCount = files.filter(file => file.processed).length;
      } catch (error) {
        console.error('Error fetching profile:', error);
        this.error = 'Failed to load profile data. Please try again.';
      } finally {
        this.loading = false;
      }
    },
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      try {
        const date = new Date(dateString);
        // Check if date is valid
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
      } catch (error) {
        console.error('Error formatting date:', error);
        return 'N/A';
      }
    }
  }
};
</script>

<style scoped>
.avatar-circle {
  width: 100px;
  height: 100px;
  background-color: #198754;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
}

.initials {
  font-size: 48px;
  color: white;
  font-weight: bold;
}
</style>
