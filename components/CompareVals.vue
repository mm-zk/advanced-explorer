<template>
  <div class="compare-values">
    <!-- Display raw values on one line -->
    <div class="raw-values">
      <span>{{ formattedVal1 }}</span>
      <span>{{ formattedVal2 }}</span>
      <span>{{ formattedVal3 }}</span>
    </div>
    <!-- Display percentage differences below the raw values -->
    <div class="percent-differences">
      <span v-if="percentDiff1 !== null" :class="getClass(percentDiff1)">
        {{ percentDiff1 }}%
      </span>
      <span v-if="percentDiff2 !== null" :class="getClass(percentDiff2)">
        {{ percentDiff2 }}%
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  val1: { type: [String, Number], default: null },
  val2: { type: [String, Number], default: null },
  val3: { type: [String, Number], default: null }
});

// Helper function to format numbers (similar to your BlockHistory helper)
const formatNumber = (num) => {
  return num !== null && num !== undefined ? Number(num).toLocaleString('en-US') : 'N/A';
};

const formattedVal1 = computed(() => formatNumber(props.val1));
const formattedVal2 = computed(() => formatNumber(props.val2));
const formattedVal3 = computed(() => formatNumber(props.val3));

// Compute percentage difference between two values
const computePercentDiff = (a, b) => {
  if (a == null || b == null) return null;
  const numA = Number(a);
  const numB = Number(b);
  if (numA === 0) return null;
  return Math.round(((numB - numA) / numA) * 100);
};

const percentDiff1 = computed(() => computePercentDiff(props.val1, props.val2));
const percentDiff2 = computed(() => computePercentDiff(props.val2, props.val3));

const getClass = (value) => {
  if (value === null) return '';
  return value >= 0 ? 'positive' : 'negative';
};
</script>

<style scoped>
.compare-values {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.raw-values {
  display: flex;
  justify-content: space-around;
  width: 100%;
  /* Adjust spacing as needed */
}
.percent-differences {
  display: flex;
  justify-content: space-around;
  width: 100%;
  font-size: 0.75rem;
  margin-top: 2px;
}
.positive {
  color: green;
}
.negative {
  color: red;
}
</style>