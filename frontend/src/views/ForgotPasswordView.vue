<template>
  <div class="forgot-password-container">
    <div class="card login-card">
      <div class="card-body">
        <h2 class="text-center mb-4">
          <span class="brand-name">Aqua<span class="text-success">Green</span></span>
        </h2>
        <h3 class="text-center mb-4">Forgot Password</h3>
        <div v-if="!emailSent" class="form-container">
          <p class="instruction">Enter your email address below and we'll send you a link to reset your password.</p>
          
          <div class="form-group">
            <label for="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              v-model="email" 
              class="form-control" 
              placeholder="Enter your email"
              :class="{ 'is-invalid': emailError }"
              @input="emailError = ''"
            >
            <div v-if="emailError" class="invalid-feedback">{{ emailError }}</div>
          </div>
          
          <div class="form-actions d-flex flex-column">
            <button 
              @click="goBack" 
              class="btn btn-outline-secondary w-100 mb-3"
            >
              <i class="fas fa-arrow-left"></i> Back to Login
            </button>
            <button 
              @click="requestPasswordReset" 
              class="btn btn-success w-100" 
              :disabled="isLoading"
            >
              <span v-if="isLoading">
                <i class="fas fa-spinner fa-spin"></i> Sending...
              </span>
              <span v-else>Reset Password</span>
            </button>
          </div>
        </div>
        
        <div v-else class="success-message">
          <i class="fas fa-check-circle success-icon"></i>
          <h3>Email Sent!</h3>
          <p>If your email address exists in our database, you will receive a password recovery link at your email address shortly.</p>
          <p class="note">If you don't receive an email, please check your spam folder or verify you entered the correct email address.</p>
          <button @click="goBack" class="btn btn-success w-100 mt-3">
            Return to Login
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import axios from 'axios';

export default defineComponent({
  name: 'ForgotPasswordView',
  data() {
    return {
      email: '',
      emailError: '',
      isLoading: false,
      emailSent: false
    };
  },
  methods: {
    goBack() {
      this.$router.push('/login');
    },
    async requestPasswordReset() {
      // Validate email
      if (!this.email) {
        this.emailError = 'Email address is required';
        return;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.email)) {
        this.emailError = 'Please enter a valid email address';
        return;
      }
      
      this.isLoading = true;
      
      try {
        await axios.post('/api/auth/password-reset/request/', {
          email: this.email
        });
        
        // We don't reveal if the email exists for security reasons
        this.emailSent = true;
      } catch (error) {
        console.error('Password reset request failed:', error);
        
        // Don't reveal if the email doesn't exist
        this.emailSent = true;
      } finally {
        this.isLoading = false;
      }
    }
  }
});
</script>

<style scoped>
.forgot-password-container {
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

.login-card {
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: 10px;
  background-color: white;
}

.brand-name {
  font-size: 1.8rem;
  font-weight: bold;
}

.card-body {
  padding: 30px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 16px;
}

.form-control.is-invalid {
  border-color: #dc3545;
}

.invalid-feedback {
  color: #dc3545;
  font-size: 14px;
  margin-top: 5px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
}

.btn {
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  border: none;
  font-weight: 500;
}

.btn-success {
  background-color: #198754;
  color: white;
  transition: background-color 0.3s ease;
}

.btn-success:hover, .btn-success:focus {
  background-color: #157347 !important;
  color: white;
}

.btn-outline-secondary {
  color: #6c757d;
  border-color: #6c757d;
  transition: all 0.3s ease;
}

.btn-outline-secondary:hover, .btn-outline-secondary:focus {
  background-color: #f8f9fa;
  color: #495057;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.instruction {
  margin-bottom: 20px;
  color: #495057;
}

.success-message {
  text-align: center;
  color: #495057;
}

.success-icon {
  font-size: 64px;
  color: #4CAF50;
  margin-bottom: 20px;
}

.text-success {
  color: #4CAF50 !important;
}

.note {
  font-size: 14px;
  color: #6c757d;
  margin-top: 15px;
}
</style>
