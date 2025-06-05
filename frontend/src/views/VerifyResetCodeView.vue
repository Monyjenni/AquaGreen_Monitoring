<template>
  <div class="verify-reset-code-container">
    <div class="card login-card">
      <div class="card-body">
        <h2 class="text-center mb-4">
          <span class="brand-name">Aqua<span class="text-success">Green</span></span>
        </h2>
        <h3 class="text-center mb-4">Verify Reset Code</h3>
        
        <div v-if="step === 'verify-code'" class="form-container">
          <p class="instruction">Enter the verification code sent to your email.</p>
          
          <div class="form-group">
            <label for="code">Verification Code</label>
            <input 
              type="text" 
              id="code" 
              v-model="code" 
              class="form-control" 
              placeholder="Enter 6-digit code"
              :class="{ 'is-invalid': codeError }"
              @input="codeError = ''"
              maxlength="6"
              inputmode="numeric"
              pattern="[0-9]*"
            >
            <div v-if="codeError" class="invalid-feedback">{{ codeError }}</div>
          </div>
          
          <div class="form-actions d-flex flex-column">
            <button 
              @click="goBack" 
              class="btn btn-outline-secondary w-100 mb-3"
            >
              <i class="fas fa-arrow-left"></i> Back
            </button>
            <button 
              @click="verifyCode" 
              class="btn btn-success w-100" 
              :disabled="isLoading"
            >
              <span v-if="isLoading">
                <i class="fas fa-spinner fa-spin"></i> Verifying...
              </span>
              <span v-else>Verify Code</span>
            </button>
          </div>
          
          <div class="resend-code mt-4 text-center">
            <p>Didn't receive the code?</p>
            <button 
              @click="resendCode" 
              class="btn btn-link p-0"
              :disabled="resendLoading || resendCountdown > 0"
            >
              <span v-if="resendLoading">
                <i class="fas fa-spinner fa-spin"></i> Sending...
              </span>
              <span v-else-if="resendCountdown > 0">
                Resend code in {{ resendCountdown }} seconds
              </span>
              <span v-else>Resend Code</span>
            </button>
          </div>
        </div>
        
        <div v-else-if="step === 'set-password'" class="form-container">
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
          
          <div class="form-actions d-flex flex-column">
            <button 
              @click="goBackToCodeVerification" 
              class="btn btn-outline-secondary w-100 mb-3"
            >
              <i class="fas fa-arrow-left"></i> Back
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
        
        <div v-else-if="step === 'success'" class="success-message">
          <i class="fas fa-check-circle success-icon"></i>
          <h3>Password Reset Complete!</h3>
          <p>Your password has been successfully reset.</p>
          <p>You can now log in with your new password.</p>
          <button @click="goToLogin" class="btn btn-success w-100 mt-3">
            Go to Login
          </button>
        </div>
        
        <div v-else-if="step === 'error'" class="error-message">
          <i class="fas fa-exclamation-circle error-icon"></i>
          <h3>Password Reset Failed</h3>
          <p>{{ errorMessage }}</p>
          <p class="note">Please try again or request a new verification code.</p>
          <div class="form-actions mt-3 d-flex flex-column">
            <button @click="goToForgotPassword" class="btn btn-outline-secondary w-100 mb-3">
              Request New Code
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
  name: 'VerifyResetCodeView',
  data() {
    return {
      email: '',
      code: '',
      password: '',
      confirmPassword: '',
      codeError: '',
      passwordError: '',
      confirmPasswordError: '',
      isLoading: false,
      resendLoading: false,
      resendCountdown: 0,
      countdownInterval: null,
      step: 'verify-code',
      errorMessage: ''
    };
  },
  created() {
    // Get email from route params or query
    this.email = this.$route.params.email || this.$route.query.email;
    
    if (!this.email) {
      // If no email is provided, redirect to forgot password page
      this.$router.push('/forgot-password');
    }
  },
  beforeUnmount() {
    this.stopResendCountdown();
  },
  methods: {
    goBack() {
      this.$router.push('/forgot-password');
    },
    goToLogin() {
      this.$router.push('/login');
    },
    goToForgotPassword() {
      this.$router.push('/forgot-password');
    },
    goBackToCodeVerification() {
      this.step = 'verify-code';
    },
    startResendCountdown() {
      this.resendCountdown = 60;
      this.stopResendCountdown(); // Clear any existing interval
      
      this.countdownInterval = setInterval(() => {
        if (this.resendCountdown > 0) {
          this.resendCountdown--;
        } else {
          this.stopResendCountdown();
        }
      }, 1000);
    },
    stopResendCountdown() {
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
    },
    async resendCode() {
      if (this.resendLoading || this.resendCountdown > 0) {
        return;
      }
      
      this.resendLoading = true;
      
      try {
        await axios.post('/api/auth/password-reset-otp/request-code/', {
          email: this.email
        });
        
        // Start countdown for resend button
        this.startResendCountdown();
      } catch (error) {
        console.error('Failed to resend verification code:', error);
        // Don't show error for security reasons
      } finally {
        this.resendLoading = false;
      }
    },
    async verifyCode() {
      if (!this.code) {
        this.codeError = 'Verification code is required';
        return;
      }
      
      if (!/^\d{6}$/.test(this.code)) {
        this.codeError = 'Please enter a valid 6-digit code';
        return;
      }
      
      this.isLoading = true;
      
      try {
        await axios.post('/api/auth/password-reset-otp/verify-code/', {
          email: this.email,
          code: this.code
        });
        
        // Move to password reset step
        this.step = 'set-password';
      } catch (error) {
        console.error('Code verification failed:', error);
        this.codeError = 'Invalid or expired verification code';
      } finally {
        this.isLoading = false;
      }
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
        await axios.post('/api/auth/password-reset-otp/reset-with-code/', {
          email: this.email,
          code: this.code,
          new_password: this.password
        });
        
        this.step = 'success';
      } catch (error) {
        console.error('Password reset failed:', error);
        this.step = 'error';
        
        if (error.response && error.response.data && error.response.data.error) {
          this.errorMessage = error.response.data.error;
        } else {
          this.errorMessage = 'An error occurred while resetting your password. Please try again.';
        }
      } finally {
        this.isLoading = false;
      }
    }
  }
});
</script>

<style scoped>
.verify-reset-code-container {
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
}

.btn-outline-secondary {
  color: #6c757d;
  border: 1px solid #6c757d;
  transition: all 0.3s ease;
}

.btn-outline-secondary:hover, .btn-outline-secondary:focus {
  color: #fff;
  background-color: #6c757d;
}

.success-message, .error-message {
  text-align: center;
  padding: 20px 0;
}

.success-icon, .error-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.success-icon {
  color: #198754;
}

.error-icon {
  color: #dc3545;
}

.note {
  color: #6c757d;
  font-style: italic;
  margin-top: 15px;
}

.password-requirements {
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 15px;
  margin-top: 20px;
  font-size: 0.9rem;
}

.password-requirements h4 {
  font-size: 1rem;
  margin-top: 0;
  margin-bottom: 10px;
}

.password-requirements ul {
  margin-bottom: 0;
  padding-left: 20px;
}

.password-requirements li {
  margin-bottom: 5px;
}

.btn-link {
  color: #198754;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.3s ease;
}

.btn-link:hover {
  color: #157347;
  text-decoration: underline;
}

.resend-code p {
  margin-bottom: 5px;
  color: #6c757d;
}
</style>
