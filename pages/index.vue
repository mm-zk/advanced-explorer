<template>
  <div class="index-container">
    <UCard class="query-card">
      <h2 class="title">Ethereum Transaction Lookup</h2>
      <UInput v-model="hash" placeholder="Enter transaction hash" class="query-input" />
      <UButton @click="redirectToTransaction" size="large" class="fetch-button">Go to Transaction</UButton>
    </UCard>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'nuxt/app'

const router = useRouter()
const hash = ref('')

// Redirect to the dynamic transaction page when a transaction hash is entered
const redirectToTransaction = () => {
  if (hash.value) {
    router.push({ path: `/transaction/${hash.value}` })
  }
}
</script>

<style scoped>
.index-container {
  display: flex;
  flex-direction: column;
  align-items: center;
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
