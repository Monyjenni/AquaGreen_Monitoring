<template>
  <div class="reset-password-container">
    <div class="card login-card">
      <div class="card-body">
        <h2 class="text-center mb-4">
          <span class="brand-name">Aqua<span class="text-success">Green</span></span>
        </h2>
        <h3 class="text-center mb-4">Reset Password</h3>
        <div v-if="!resetSuccess && !resetError" class="form-container">
          <p class="instruction">Enter your new password below to reset your account password.</p>
          
          <div class="form-group">
            <label for="password">New Password</label>
            <input 
              type="password" 
              id="password" 
              v-model="password" 
              class="form-control" 
              placeholder="Enter your new password"
              :class="{ 'is-invalid': passwordError }"
              @input="passwordError = ''"
            >
            <div v-if="passwordError" class="invalid-feedback">{{ passwordError }}</div>
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input 
              type="password" 
              id="confirmPassword" 
              v-model="confirmPassword" 
              class="form-control" 
              placeholder="Confirm your new password"
              :class="{ 'is-invalid': confirmPasswordError }"
              @input="confirmPasswordError = ''"
            >
            <div v-if="confirmPasswordError" class="invalid-feedback">{{ confirmPasswordError }}</div>
          </div>
          
          <div class="password-requirements">
            <h4>Password Requirements:</h4>
            <ul>
              <li>At least 8 characters long</li>
              <li>Contains at least one uppercase letter</li>
              <li>Contains at least one lowercase letter</li>
              <li>Contains at least one number</li>
              <li>Cannot be too similar to your username or email</li>
            </ul>
          </div>
          
          <div class="form-actions">
            <button 
              @click="goToLogin" 
              class="btn btn-outline-secondary w-100 mb-3"
            >
              <i class="fas fa-arrow-left"></i> Back to Login
            </button>
            <button 
              @click="resetPassword" 
              class="btn btn-success w-100" 
              :disabled="isLoading"
            >
              <span v-if="isLoading">
                <i class="fas fa-spinner fa-spin"></i> Resetting...
              </span>
              <span v-else>Reset Password</span>
            </button>
          </div>
        </div>
        
        <div v-else-if="resetSuccess" class="success-message">
          <i class="fas fa-check-circle success-icon"></i>
          <h3>Password Reset Complete!</h3>
          <p>Your password has been successfully reset.</p>
          <p>You can now log in with your new password.</p>
          <button @click="goToLogin" class="btn btn-success w-100 mt-3">
            Go to Login
          </button>
        </div>
        
        <div v-else class="error-message">
          <i class="fas fa-exclamation-circle error-icon"></i>
          <h3>Password Reset Failed</h3>
          <p>{{ resetErrorMessage }}</p>
          <p class="note">Please try again or request a new password reset link.</p>
          <div class="form-actions mt-3 d-flex flex-column">
            <button @click="goToForgotPassword" class="btn btn-outline-secondary w-100 mb-3">
              Request New Link
            </button>
            <button @click="goToLogin" class="btn btn-success w-100">
              Return to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import axios from 'axios';

export default defineComponent({
  name: 'ResetPasswordView',
  data() {
    return {
      password: '',
      confirmPassword: '',
      passwordError: '',
      confirmPasswordError: '',
      isLoading: false,
      resetSuccess: false,
      resetError: false,
      resetErrorMessage: '',
      uid: '',
      token: ''
    };
  },
  created() {
    // Extract uid and token from URL parameters
    this.uid = this.$route.params.uid;
    this.token = this.$route.params.token;
    
    if (!this.uid || !this.token) {
      this.resetError = true;
      this.resetErrorMessage = 'Invalid password reset link. Please request a new link.';
    }
  },
  methods: {
    goToLogin() {
      this.$router.push('/login');
    },
    goToForgotPassword() {
      this.$router.push('/forgot-password');
    },
    validatePassword() {
      let isValid = true;
      
      if (!this.password) {
        this.passwordError = 'Password is required';
        isValid = false;
      } else if (this.password.length < 8) {
        this.passwordError = 'Password must be at least 8 characters long';
        isValid = false;
      } else if (!/[A-Z]/.test(this.password)) {
        this.passwordError = 'Password must contain at least one uppercase letter';
        isValid = false;
      } else if (!/[a-z]/.test(this.password)) {
        this.passwordError = 'Password must contain at least one lowercase letter';
        isValid = false;
      } else if (!/\d/.test(this.password)) {
        this.passwordError = 'Password must contain at least one number';
        isValid = false;
      }
      
      if (this.password !== this.confirmPassword) {
        this.confirmPasswordError = 'Passwords do not match';
        isValid = false;
      }
      
      return isValid;
    },
    async resetPassword() {
      if (!this.validatePassword()) {
        return;
      }
      
      this.isLoading = true;
      
      try {
        await axios.post('auth/password-reset-otp/reset-with-code/', {
          email: this.uid,
          code: this.token,
          new_password: this.password
        });
        
        this.resetSuccess = true;
        this.$toast.success('Password reset successful!');
      } catch (error) {
        console.error('Password reset failed:', error);
        this.resetError = true;
        
        if (error.response && error.response.data && error.response.data.error) {
          this.resetErrorMessage = error.response.data.error;
        } else {
          this.resetErrorMessage = 'An error occurred while resetting your password. Please try again.';
        }
      } finally {
        this.isLoading = false;
      }
    }
  }
});
</script>

<style scoped>
.reset-password-container {
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
  flex-direction: column;
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
  background-color: #4CAF50;
  color: white;
  transition: background-color 0.3s ease;
}

.btn-success:hover, .btn-success:focus {
  background-color: #3c8c40 !important;
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

.success-message, .error-message {
  text-align: center;
  color: #495057;
}

.success-icon {
  font-size: 64px;
  color: #4CAF50;
  margin-bottom: 20px;
}

.error-icon {
  font-size: 64px;
  color: #dc3545;
  margin-bottom: 20px;
}

.note {
  font-size: 14px;
  color: #6c757d;
  margin-top: 15px;
}

.password-requirements {
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
}

.password-requirements h4 {
  font-size: 16px;
  margin-bottom: 10px;
  color: #495057;
}

.password-requirements ul {
  padding-left: 20px;
  margin-bottom: 0;
}

.password-requirements li {
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 5px;
}

.mt-3 {
  margin-top: 15px;
}
</style>
