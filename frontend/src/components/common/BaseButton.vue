<template>
  <button 
    :class="buttonClasses" 
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
    :type="type"
  >
    <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
    <slot>Button</slot>
  </button>
</template>

<script>
export default {
  name: 'BaseButton',
  props: {
    variant: {
      type: String,
      default: 'primary',
      validator: (value) => [
        'primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark',
        'outline-primary', 'outline-secondary', 'outline-success', 'outline-danger', 
        'outline-warning', 'outline-info', 'outline-light', 'outline-dark'
      ].includes(value)
    },
    size: {
      type: String,
      default: '',
      validator: (value) => ['', 'sm', 'lg'].includes(value)
    },
    block: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      default: 'button',
      validator: (value) => ['button', 'submit', 'reset'].includes(value)
    }
  },
  computed: {
    buttonClasses() {
      return [
        'btn',
        `btn-${this.variant}`,
        this.size ? `btn-${this.size}` : '',
        this.block ? 'd-block w-100' : ''
      ];
    }
  }
}
</script>

<style scoped>
.btn {
  transition: all 0.2s ease;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn:active {
  transform: translateY(1px);
  box-shadow: none;
}
</style>
