<script setup>
defineProps({
  title: {
    type: String,
    default: "No Active Attendance Session",
  },

  message: {
    type: String,
    default:
      "Please wait for the next attendance session.",
  },

  error: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <div
    class="display-status"
    :class="{ 'display-error': error }"
  >
    <h1>
      GARMORA
    </h1>

    <h2>
      {{ title }}
    </h2>

    <p>
      {{ message }}
    </p>
  </div>
</template>

<style scoped>
.display-status {
  min-height: 100vh;

  display: flex;
  flex-direction: column;

  align-items: center;
  justify-content: center;

  text-align: center;
}

.display-status h1 {
  font-size: 48px;
  font-weight: 800;
}

.display-status h2 {
  font-size: 32px;
  margin-top: 20px;
}

.display-status p {
  font-size: 20px;
  margin-top: 10px;
}

.display-error {
  color: #b91c1c;
}
</style>