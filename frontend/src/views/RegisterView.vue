<template>
  <div class="register-container">
    <BaseCard class="register-card">
      <div class="card-body">
        <h2 class="text-center mb-4">
          <span class="brand-name">Aqua<span class="text-success">Green</span></span>
        </h2>
        <div v-if="error" class="alert alert-danger">{{ error }}</div>
        <form @submit.prevent="register">
          <!-- Optional fields -->
          <div class="form-group mb-3">
            <input
              type="email"
              class="form-control"
              v-model="email"
              placeholder="Email"
            />
          </div>
          <div class="form-group mb-3">
            <input
              type="text"
              class="form-control"
              v-model="phone"
              placeholder="Phone"
            />
          </div>
          <!-- Required fields -->
          <div class="form-group mb-3">
            <input
              type="text"
              class="form-control"
              v-model="username"
              placeholder="Username"
              required
            />
          </div>
          <div class="form-group mb-3">
            <input
              type="password"
              class="form-control"
              v-model="password"
              placeholder="Password"
              required
            />
          </div>
          <div class="form-group mb-3">
            <input
              type="password"
              class="form-control"
              v-model="confirmPassword"
              placeholder="Confirm Password"
              required
            />
          </div>
          <BaseButton
            variant="success"
            block
            :loading="loading"
            type="submit"
          >
            Sign up
          </BaseButton>
        </form>
        <div class="mt-3 text-center">
          <p>Already have an account? <router-link to="/login" class="text-success">Log In</router-link></p>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

<script>
import { mapActions } from 'vuex';
import BaseButton from '@/components/common/BaseButton.vue';
import BaseCard from '@/components/common/BaseCard.vue';

export default {
  name: 'RegisterView',
  components: {
    BaseButton,
    BaseCard
  },
  data() {
    return {
      email: '',
      phone: '',
      username: '',
      password: '',
      confirmPassword: '',
      loading: false,
      error: null
    };
  },
  methods: {
    ...mapActions(['registerUser']),
    async register() {
      this.loading = true;
      this.error = null;
      
      if (this.password !== this.confirmPassword) {
        this.error = 'Passwords do not match';
        this.loading = false;
        return;
      }
      
      // Create a registration payload with only required fields
      const registrationData = {
        username: this.username,
        password: this.password
      };
      
      // Add optional fields only if they have values
      if (this.email) registrationData.email = this.email;
      if (this.phone) registrationData.phone = this.phone;
      
      try {
        await this.registerUser(registrationData);
        this.$router.push('/');
      } catch (error) {
        console.error('Registration error:', error);
        // Defensive: handle all possible error shapes
        let errorMsg = 'Registration failed. Please try again.';
        if (error && error.response && error.response.data) {
          const errorData = error.response.data;
          if (errorData.errors) {
            // Backend returned { success: false, errors: {...} }
            const errorMessages = [];
            for (const field in errorData.errors) {
              const messages = Array.isArray(errorData.errors[field]) ? errorData.errors[field].join(', ') : errorData.errors[field];
              errorMessages.push(`${field}: ${messages}`);
            }
            errorMsg = errorMessages.join('\n');
          } else if (typeof errorData === 'string') {
            errorMsg = errorData;
          } else if (typeof errorData === 'object') {
            // Fallback: show all fields as error messages
            const errorMessages = [];
            for (const field in errorData) {
              const messages = Array.isArray(errorData[field]) ? errorData[field].join(', ') : errorData[field];
              errorMessages.push(`${field}: ${messages}`);
            }
            errorMsg = errorMessages.join('\n');
          }
        }
        this.error = errorMsg;
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100vw;
  margin: 0;
  padding: 0;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url('@/assets/images/GreenHouse.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.register-card {
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: 10px;
}

.brand-name {
  font-size: 2rem;
  font-weight: bold;
}
</style>
