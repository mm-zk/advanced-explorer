<template>
    <div v-if="blockId" class="block-history-container">
      <h3>Block History (Last 3 Batches)</h3>
      <table class="block-history-table">
        <thead>
          <tr>
            <th>Attribute</th>
            <th v-if="prepreviousBatchBlock">
              Prev Batch: {{ prepreviousBatchBlock.l1BatchNumber }}
            </th>
            <th v-if="previousBatchBlock">
              Prev Batch: {{ previousBatchBlock.l1BatchNumber }}
            </th>
            <th v-if="currentBlock">
              This Tx:<br>
              Block: {{ parseInt(blockId, 16) }}<br>
              Batch: {{ currentBlock.l1BatchNumber }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>L1 Gas Price</td>
            <td>
              {{ prepreviousBatchBlock?.l1GasPrice ? formatNumber(parseInt(prepreviousBatchBlock.l1GasPrice)) : 'N/A' }}
            </td>
            <td>
              {{ previousBatchBlock?.l1GasPrice ? formatNumber(parseInt(previousBatchBlock.l1GasPrice)) : 'N/A' }}
            </td>
            <td>
              {{ currentBlock?.l1GasPrice ? formatNumber(parseInt(currentBlock.l1GasPrice)) : 'N/A' }}
            </td>
          </tr>
          <tr>
            <td>Pubdata Price (wei)</td>
            <td>
              {{ prepreviousBatchBlock?.fairPubdataPrice ? formatNumber(parseInt(prepreviousBatchBlock.fairPubdataPrice)) : 'N/A' }}
            </td>
            <td>
              {{ previousBatchBlock?.fairPubdataPrice ? formatNumber(parseInt(previousBatchBlock.fairPubdataPrice)) : 'N/A' }}
            </td>
            <td>
              {{ currentBlock?.fairPubdataPrice ? formatNumber(parseInt(currentBlock.fairPubdataPrice)) : 'N/A' }}
            </td>
          </tr>
          <tr>
            <td>L2 Gas Price</td>
            <td>
              {{ prepreviousEthBatchBlock ? formatNumber(parseInt(prepreviousEthBatchBlock.baseFeePerGas)) : 'N/A' }}
            </td>
            <td>
              {{ previousEthBatchBlock ? formatNumber(parseInt(previousEthBatchBlock.baseFeePerGas)) : 'N/A' }}
            </td>
            <td>
              {{ currentEthBlock ? formatNumber(parseInt(currentEthBlock.baseFeePerGas)) : 'N/A' }}
            </td>
          </tr>
          <tr>
            <td>Pubdata Gas Cost</td>
            <td>
              {{ computePubdataCost(prepreviousBatchBlock, prepreviousEthBatchBlock) !== null 
                  ? formatNumber(computePubdataCost(prepreviousBatchBlock, prepreviousEthBatchBlock))
                  : 'N/A' }}
            </td>
            <td>
              {{ computePubdataCost(previousBatchBlock, previousEthBatchBlock) !== null 
                  ? formatNumber(computePubdataCost(previousBatchBlock, previousEthBatchBlock))
                  : 'N/A' }}
            </td>
            <td>
              {{ computePubdataCost(currentBlock, currentEthBlock) !== null 
                  ? formatNumber(computePubdataCost(currentBlock, currentEthBlock))
                  : 'N/A' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  const props = defineProps({
    blockId: { type: String, required: true },
    rpcUrl: { type: String, required: true },
  });
  
  // Helper to format numbers
  const formatNumber = (num) => {
    return num !== undefined ? num.toLocaleString('en-US') : 'N/A';
  };
  
  // Original pubdata cost calculation: fairPubdataPrice is assumed to be returned as a hex string,
  // so we use parseInt with base 16 for consistency.
  const computePubdataCost = (block, ethBlock) => {
    if (!block || !ethBlock) return null;
    return Math.round(block.fairPubdataPrice / ethBlock.baseFeePerGas);
  };
  
  // References for blocks and batch data
  const currentBlock = ref(null);
  const currentEthBlock = ref(null);
  const currentBatch = ref(null);
  const previousBatch = ref(null);
  const previousBatchBlock = ref(null);
  const previousEthBatchBlock = ref(null);
  const prepreviousBatch = ref(null);
  const prepreviousBatchBlock = ref(null);
  const prepreviousEthBatchBlock = ref(null);
  
  const fetchBlockDetails = async (blockNumber) => {
    try {
      let blockNum = parseInt(blockNumber, 16);
      console.log("Fetching block " + blockNum);
      const response = await fetch(props.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'zks_getBlockDetails',
          params: [blockNum],
          id: 1,
        }),
      });
      const result = await response.json();
      return result.result;
    } catch (error) {
      console.error('Error fetching block details:', error);
    }
  };
  
  const fetchEthBlockDetails = async (blockNumber) => {
    try {
      // Notice we pass blockNumber as-is because the RPC expects a hex string.
      const response = await fetch(props.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBlockByNumber',
          params: [blockNumber, false],
          id: 1,
        }),
      });
      const result = await response.json();
      return result.result;
    } catch (error) {
      console.error('Error fetching eth block details:', error);
    }
  };
  
  const fetchFirstBlockFromBatch = async (batchId) => {
    try {
      const response = await fetch(props.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'zks_getL1BatchBlockRange',
          params: [batchId],
          id: 1,
        }),
      });
      const result = await response.json();
      return result.result;
    } catch (error) {
      console.error('Error fetching batch range:', error);
    }
  };
  
  await fetchBlockDetails(props.blockId).then(response => {
    currentBlock.value = response;
    fetchEthBlockDetails(props.blockId).then(response => {
      currentEthBlock.value = response;
    });
    currentBatch.value = response.l1BatchNumber;
    // Calculate previous batch numbers.
    previousBatch.value = response.l1BatchNumber - 1;
    prepreviousBatch.value = response.l1BatchNumber - 2;
    
    fetchFirstBlockFromBatch(previousBatch.value).then(response => {
      fetchBlockDetails(response[0]).then(response => {
        previousBatchBlock.value = response;
      });
      fetchEthBlockDetails(response[0]).then(response => {
        previousEthBatchBlock.value = response;
      });
    });
    
    fetchFirstBlockFromBatch(prepreviousBatch.value).then(response => {
      fetchBlockDetails(response[0]).then(response => {
        prepreviousBatchBlock.value = response;
      });
      fetchEthBlockDetails(response[0]).then(response => {
        prepreviousEthBatchBlock.value = response;
      });
    });
  });
  </script>
  
  <style scoped>
.block-history-container {
  width: 100%;
  max-width: 600px;
  margin: 20px auto;
  padding: 10px;
}

.block-history-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  table-layout: fixed;
}

.block-history-table th,
.block-history-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
  font-size: 0.8rem; /* Smaller font to help large numbers fit */
  word-break: break-all;
}

.block-history-table th {
  background-color: #f2f2f2;
  font-weight: bold;
}

/* Dark mode styles */
@media (prefers-color-scheme: dark) {
  .block-history-table th,
  .block-history-table td {
    border-color: #444;
    color: #ddd;
  }
  .block-history-table th {
    background-color: #333;
  }
  .block-history-table td {
    background-color: #222;
  }
  .block-history-container {
    background-color: #121212;
  }
}
</style>