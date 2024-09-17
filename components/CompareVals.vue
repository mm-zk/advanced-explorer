<template>
  <div class="values-container">
    <!-- Value 1 is shown first without a label -->
    <span class="value">{{ formatNumber(val1) }}</span>

    <!-- Value 2 with % comparison to Value 1 -->
    <span class="value">
      {{ formatNumber(val2) }}
      <span v-if="val1 !== undefined && val2 !== undefined" :class="comparisonClass(val2, val1)">
        ({{ calculatePercentage(val2, val1) }}%)
      </span>
    </span>

    <!-- Value 3 with % comparison to Value 2 -->
    <span class="value">
      {{ formatNumber(val3) }}
      <span v-if="val2 !== undefined && val3 !== undefined" :class="comparisonClass(val3, val2)">
        ({{ calculatePercentage(val3, val2) }}%)
      </span>
    </span>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Props to accept the three values, which can be numbers or undefined
const props = defineProps({
  val1: {
    type: Number,
    required: false,
    default: undefined
  },
  val2: {
    type: Number,
    required: false,
    default: undefined
  },
  val3: {
    type: Number,
    required: false,
    default: undefined
  }
})

// Function to format large numbers with thousand separators, or show "N/A" for undefined values
const formatNumber = (num) => {
  return num !== undefined ? num.toLocaleString('en-US') : 'N/A'
}

// Function to calculate percentage change between two values
const calculatePercentage = (current, previous) => {
  if (previous === 0 || previous === undefined || current === undefined) return 'N/A'
  const percentageChange = ((current - previous) / previous) * 100
  return percentageChange.toFixed(2)
}

// Function to return the appropriate class based on the percentage change
const comparisonClass = (current, previous) => {
  if (current < previous) {
    return 'green-text'
  } else if (current > previous) {
    return 'red-text'
  } else {
    return ''
  }
}
</script>

<style scoped>
.values-container {
  display: flex;
  gap: 15px;
  align-items: center;
}

.value {
  font-size: 16px;
}

.green-text {
  color: green;
}

.red-text {
  color: red;
}
</style>
