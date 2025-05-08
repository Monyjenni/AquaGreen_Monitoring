<template>
  <button @click="goBack" class="btn btn-outline-secondary">
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
