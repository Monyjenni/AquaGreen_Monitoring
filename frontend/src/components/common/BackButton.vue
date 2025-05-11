<template>
  <button @click="goBack" class="btn btn-outline-secondary back-button">
    <i class="bi bi-arrow-left me-1"></i> Back
  </button>
</template>

<script>
export default {
  name: 'BackButton',
  methods: {
    goBack() {
      // First check if there's previous history to go back to
      if (window.history.length > 1) {
        this.$router.go(-1);
      } else {
        // If no history, navigate to home
        this.$router.push('/');
      }
    }
  }
}
</script>

<style scoped>
.back-button {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
