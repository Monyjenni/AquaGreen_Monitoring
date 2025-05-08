<template>
  <div class="base-card">
    <div v-if="title || $slots.header" class="card-header">
      <slot name="header">
        <h5 class="mb-0">{{ title }}</h5>
      </slot>
    </div>
    <div class="card-body">
      <slot></slot>
    </div>
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BaseCard',
  props: {
    title: {
      type: String,
      default: ''
    }
  }
};
</script>

<style scoped>
.base-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
  border: 1px solid rgba(0, 0, 0, 0.125);
  overflow: hidden;
}

.card-header {
  background-color: rgba(0, 0, 0, 0.03);
  border-bottom: 1px solid rgba(0, 0, 0, 0.125);
  padding: 1rem 1.25rem;
}

.card-body {
  padding: 1.25rem;
}

.card-footer {
  background-color: rgba(0, 0, 0, 0.03);
  border-top: 1px solid rgba(0, 0, 0, 0.125);
  padding: 0.75rem 1.25rem;
}
</style>
