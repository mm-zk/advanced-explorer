<template>
  <div v-if="block" class="block-details">
    <UCard class="block-card">
      <h3>Block Details</h3>
      <div class="detail-item">
        <span class="label">Block Number:</span>
        <span>{{ block.number }}</span>
      </div>
      <div class="detail-item">
        <span class="label">Timestamp:</span>
        <span>{{ formatTimestamp(block.timestamp) }}</span>
      </div>
      
      <div class="detail-item">
        <span class="label">Batch:</span>
        <span>{{ block.l1BatchNumber }}</span>
      </div>
      <div class="detail-item">
        <span class="label">L1 gas:</span>
        <span>{{ block.l1GasPrice }}</span>
      </div>
      <div class="detail-item">
        <span class="label">L2 gas:</span>
        <span>{{ block.l2FairGasPrice }}</span>
      </div>
            <div class="detail-item">
        <span class="label">Fair pubdata:</span>
        <span>{{ block.fairPubdataPrice }}</span>
      </div>

            <div class="detail-item">
        <span class="label">Protocol Version</span>
        <span>{{ block.protocolVersion }}</span>
      </div>
    </UCard>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Props to receive block data
const props = defineProps({
  block: {
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
