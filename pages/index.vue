<template>
  <div class="lookup-container">
    <UCard class="query-card">
      <h2 class="title">ZKSync Transaction Lookup</h2>
      <UInput v-model="hash" placeholder="Enter transaction hash" class="query-input" />
      <UButton @click="updateURL" size="lg" class="fetch-button">Search</UButton>
    </UCard>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'nuxt/app'

const router = useRouter()
const hash = ref('')

// Redirect to the dynamic transaction page when a transaction hash is entered
const updateURL = () => {
  if (hash.value) {
    router.push({ path: `/transaction/${hash.value}` })
  }
}
</script>

<style scoped>
.lookup-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center; /* Centers vertically */
  width: 100%;
  min-height: 100vh; /* Ensures the container takes full viewport height */
  padding: 20px;
}

.query-card {
  padding: 20px;
  width: 100%;
  max-width: 600px;
  text-align: center;
}

.title {
  margin-bottom: 20px;
}

.query-input {
  margin-bottom: 15px;
  width: 100%;
}

.fetch-button {
  width: 100%;
}
</style>