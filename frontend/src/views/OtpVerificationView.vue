<template>
  <div class="otp-verification-container">
    <div class="card login-card">
      <div class="card-body">
        <div class="d-flex align-items-center mb-4">
          <button @click="goBack" class="btn btn-icon me-3" aria-label="Back">
            <i class="bi bi-arrow-left-circle-fill text-success fs-4"></i>
          </button>
          <h2 class="m-0">
            <span class="brand-name">Aqua<span class="text-success">Green</span></span>
          </h2>
        </div>
        <h3 class="text-center mb-4">Verify Your Identity</h3>
        <div v-if="!verificationSuccess && !verificationError" class="form-container">
          <p class="instruction">We've sent a verification code to your email. Please enter the 6-digit code below to verify your identity.</p>
          
          <div class="form-group">
            <label for="otp">Verification Code</label>
            <div class="otp-input-container">
              <input 
                type="text" 
                id="otp" 
                v-model="otp" 
                class="form-control otp-input" 
                placeholder="Enter 6-digit code"
                :class="{ 'is-invalid': otpError }"
                @input="validateOtpInput"
                maxlength="6"
              >
            </div>
            <div v-if="otpError" class="invalid-feedback">{{ otpError }}</div>
          </div>
          
          <div class="timer-container" v-if="timeRemaining > 0">
            <span class="timer">Code expires in: {{ formatTime(timeRemaining) }}</span>
          </div>
          <div class="timer-container" v-else>
            <span class="expired">Code expired</span>
          </div>
          
          <div class="form-actions">
            <button 
              @click="resendOtp" 
              class="btn btn-outline-secondary w-100 mb-3"
              :disabled="isResending || timeRemaining > 0"
            >
              {{ isResending ? 'Sending...' : 'Resend Code' }}
            </button>
            <button 
              @click="verifyOtp" 
              class="btn btn-success w-100"
              :disabled="!isValidOtp || isVerifying"
            >
              {{ isVerifying ? 'Verifying...' : 'Verify' }}
            </button>
          </div>
        </div>
        
        <div v-else-if="verificationSuccess" class="success-message">
          <i class="fas fa-check-circle success-icon"></i>
          <h3>Verification Successful!</h3>
          <p>Your identity has been verified successfully.</p>
          <button @click="continueProcess" class="btn btn-success w-100 mt-3">
            Continue
          </button>
        </div>
        
        <div v-else class="error-message">
          <i class="fas fa-exclamation-circle error-icon"></i>
          <h3>Verification Failed</h3>
          <p>{{ verificationErrorMessage }}</p>
          <div class="form-actions mt-3">
            <button @click="resetVerification" class="btn btn-outline-secondary w-100 mb-3">
              Try Again
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
import axios from 'axios';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'OtpVerificationView',
  props: {
    email: {
      type: String,
      default: ''
    },
    returnPath: {
      type: String,
      default: '/'
    },
    isRegistration: {
      type: Boolean,
      default: false
    },
    onSuccess: {
      type: Function,
      default: null
    }
  },
  data() {
    return {
      otp: '',
      otpError: '',
      isVerifying: false,
      isResending: false,
      verificationSuccess: false,
      verificationError: false,
      verificationErrorMessage: '',
      timeRemaining: 600, // 10 minutes in seconds
      timer: null,
      emailValue: this.email || this.$route.query.email || '',
      returnPathValue: this.returnPath || this.$route.query.returnPath || '/',
      isRegistrationValue: this.$route.query.isRegistration === 'true',
    }
  },
  computed: {
    isValidOtp() {
      return this.otp.length === 6 && /^\d+$/.test(this.otp);
    }
  },
  created() {
    // Check for query parameters
    const query = this.$route.query;
    
    // If email is provided in query, use it
    if (query.email) {
      this.emailValue = query.email;
    }
    
    // Process isRegistration from query params if available
    if (query.isRegistration !== undefined) {
      this.isRegistrationValue = query.isRegistration === 'true';
    }
    
    // If returnPath is provided in query, use it
    if (query.returnPath) {
      this.returnPathValue = query.returnPath;
    }
    
    // Start the countdown timer
    this.startTimer();
  },
  beforeUnmount() {
    // Clear the timer when component is unmounted
    this.clearTimer();
  },
  methods: {
    startTimer() {
      this.clearTimer(); // Clear any existing timer
      this.timer = setInterval(() => {
        if (this.timeRemaining > 0) {
          this.timeRemaining--;
        } else {
          this.clearTimer();
        }
      }, 1000);
    },
    clearTimer() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    },
    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    },
    validateOtpInput() {
      // Remove non-digit characters
      this.otp = this.otp.replace(/\D/g, '');
      this.otpError = '';
    },
    goToLogin() {
      this.$router.push('/login');
    },
    goBack() {
      // Navigate back to the registration page or previous page
      this.$router.back();
    },
    resetVerification() {
      this.otp = '';
      this.otpError = '';
      this.verificationError = false;
      this.verificationErrorMessage = '';
    },
    async resendOtp() {
      this.isResending = true;
      
      try {
        await axios.post('auth/password-reset-otp/request-code/', {
          email: this.email
        });
        
        // Reset timer
        this.timeRemaining = 600; // 10 minutes
        this.startTimer();
        
        // Show success message
        this.$emit('otp-resent');
        this.$toast.success('Verification code resent successfully');
      } catch (error) {
        console.error('Failed to resend OTP:', error);
        this.$toast.error('Failed to resend verification code');
      } finally {
        this.isResending = false;
      }
    },
    async verifyOtp() {
      if (!this.isValidOtp) {
        this.otpError = 'Please enter a valid 6-digit code';
        return;
      }
      
      this.isVerifying = true;
      
      try {
        const response = await axios.post('auth/password-reset-otp/verify-code/', {
          email: this.emailValue,
          code: this.otp,
          registration: this.isRegistrationValue // Send registration flag to the backend
        });
        
        if (response.data.verified) {
          this.verificationSuccess = true;
          this.clearTimer();
          
          // If this was for registration and we got tokens, store them
          if (this.isRegistration && response.data.access && response.data.refresh && response.data.user) {
            // Store authentication data in localStorage
            localStorage.setItem('token', response.data.access);
            localStorage.setItem('refreshToken', response.data.refresh);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            // Update Axios default headers
            axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
          }
          
          // Call success callback if provided
          if (typeof this.onSuccess === 'function') {
            this.onSuccess();
          }
        } else {
          this.verificationError = true;
          this.verificationErrorMessage = 'Invalid verification code. Please try again.';
        }
      } catch (error) {
        console.error('OTP verification failed:', error);
        this.verificationError = true;
        
        if (error.response && error.response.data && error.response.data.error) {
          this.verificationErrorMessage = error.response.data.error;
        } else {
          this.verificationErrorMessage = 'Invalid or expired verification code. Please try again.';
        }
      } finally {
        this.isVerifying = false;
      }
    },
    continueProcess() {
      // If this was a registration verification, redirect to login page
      if (this.isRegistrationValue) {
        this.$router.push('/login');
      } 
      // Otherwise, check if we have a return path defined
      else if (this.returnPathValue) {
        this.$router.push(this.returnPathValue);
      } 
      // Default fallback
      else {
        this.$router.push('/login');
      }
    }
  }
});
</script>

<style scoped>
.otp-verification-container {
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
  max-width: 500px;
  border-radius: 8px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  background-color: white;
  margin: 20px;
}

.brand-name {
  font-size: 32px;
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

.otp-input {
  text-align: center;
  letter-spacing: 5px;
  font-size: 24px;
  font-weight: bold;
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
  background-color: #4CAF50;
  color: white;
  transition: all 0.3s;
  border: none;
  width: 100%;
}

.btn-success:hover:not(:disabled) {
  background-color: #3d8b40;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.btn-icon {
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-icon:hover {
  transform: scale(1.1);
}

.btn-outline-secondary {
  color: #6c757d;
  border-color: #6c757d;
  background-color: transparent;
  transition: all 0.3s;
}

.btn-outline-secondary:hover:not(:disabled) {
  background-color: #6c757d;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
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

.timer-container {
  text-align: center;
  margin: 15px 0;
}

.timer {
  font-size: 14px;
  color: #4CAF50;
  font-weight: 500;
}

.expired {
  font-size: 14px;
  color: #dc3545;
  font-weight: 500;
}

.mt-3 {
  margin-top: 15px;
}
</style>
