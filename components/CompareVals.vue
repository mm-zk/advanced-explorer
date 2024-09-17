<template>
    <UText>{{ val1 }}</UText>
    <UText>{{ val2 }}</UText>
    <UText>{{ val3 }}</UText>  
</template>

<script setup>
import { ref } from 'vue'

// Props to receive block data
const props = defineProps({
  val1: {
    type: Number,
    required: true
  },
  val2: {
    type: Number,
    required: true
  },
  val3: {
    type: Number,
    required: true
  },
  
})


</script>
