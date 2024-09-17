<template>
  <div v-if="blockId" class="block-details">
    <UCard class="block-card">
      <h3>Block History</h3>
      <div class="detail-item">
        <span class="label">Block Number:</span>
        <span>{{ parseInt(blockId, 16) }}</span>
      </div>

      <div class="detail-item">
        <span class="label">Batch number:</span>
        <span>{{ currentBatch }}</span>
      </div>

      <div class="detail-item">
        <span class="label">L1 gas prices:</span>
        <CompareVals :val1="prepreviousBatchBlock?.l1GasPrice" :val2="previousBatchBlock?.l1GasPrice" :val3="currentBlock?.l1GasPrice"/> 
      </div>

      <div class="detail-item">
        <span class="label">Pubdata prices:</span>
        <CompareVals :val1="prepreviousBatchBlock?.fairPubdataPrice" :val2="previousBatchBlock?.fairPubdataPrice" :val3="currentBlock?.fairPubdataPrice"/> 
      </div>

      <div class="detail-item">
        <span class="label">L2 gas price:</span>
        <CompareVals :val1="prepreviousBatchBlock?.l2FairGasPrice" :val2="previousBatchBlock?.l2FairGasPrice" :val3="currentBlock?.l2FairGasPrice"/> 
      </div>

      <div class="detail-item">
        <span class="label">Pubdata cost:</span>
        <CompareVals :val1="computePubdataCost(prepreviousBatchBlock)"  :val2="computePubdataCost(previousBatchBlock)" :val3="computePubdataCost(currentBlock)"/> 
      </div>
      
    </UCard>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Props to receive block data
const props = defineProps({
  blockId: {
    type: String,
    required: true
  },
  rpcUrl: {
    type: String,
    required: true
  },
})

// Function to format the timestamp into a readable date
const formatTimestamp = (timestamp) => {
  const date = new Date(parseInt(timestamp, 16) * 1000)
  return date.toLocaleString()
}

const currentBlock = ref(null)
const currentBatch = ref(null);
const previousBatch = ref(null);
const previousBatchBlock = ref(null);
const prepreviousBatch = ref(null);
const prepreviousBatchBlock = ref(null);


const computePubdataCost = (block) => {
    
    return Math.round(block?.fairPubdataPrice / block?.l2FairGasPrice)
}


const fetchBlockDetails = async (blockNumber) => {
  try {
    let blockNum = parseInt(blockNumber,16);
    console.log("Fetching " + blockNum);
    const response = await fetch(props.rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'zks_getBlockDetails',
        params: [blockNum],
        id: 1,
      }),
    })

    const result = await response.json()
    return result.result;
  } catch (error) {
    console.error('Error fetching block details:', error)
  }
}

const fetchFirstBlockFromBatch = async (batchId) => {
  try {
    
    const response = await fetch(props.rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'zks_getL1BatchBlockRange',
        params: [batchId],
        id: 1,
      }),
    })

    const result = await response.json()
    return result.result;
  } catch (error) {
    console.error('Error fetching batch range:', error)
  }
}

await fetchBlockDetails(props.blockId).then(response => {
    currentBlock.value = response;
    currentBatch.value = response.l1BatchNumber;
    previousBatch.value = response.l1BatchNumber - 1;
    prepreviousBatch.value = response.l1BatchNumber - 2;
    fetchFirstBlockFromBatch(previousBatch.value).then(response => {
        fetchBlockDetails(response[0]).then(response => {
            console.log("Setting response to ",response); 
            previousBatchBlock.value = response;
            
        })
    });
    fetchFirstBlockFromBatch(prepreviousBatch.value).then(response => {
        fetchBlockDetails(response[0]).then(response => {
            prepreviousBatchBlock.value = response;
        })
    });
});


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

