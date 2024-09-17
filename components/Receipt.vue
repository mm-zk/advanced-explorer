<template>
  <div v-if="receipt" class="receipt-details">
    <UCard class="block-card">
      <h3>Receipt details</h3>
      <div class="detail-item">
        <span class="label">Gas used</span>
        <span>{{ receipt.gasUsed }}</span>
      </div>
      <div class="detail-item">
        <span class="label">Status:</span>
        <span>{{ receipt.status }}</span>
      </div>
    </UCard>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Props to receive block data
const props = defineProps({
  receipt: {
    type: Object,
    required: true
  }
})

// Function to format the timestamp into a readable date
const formatTimestamp = (timestamp) => {
  const date = new Date(parseInt(timestamp, 16) * 1000)
  return date.toLocaleString()
}
</script>

<style scoped>
.block-card {
  padding: 20px;
  margin-top: 20px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #e0e0e0;
}

.label {
  font-weight: bold;
}
</style>
