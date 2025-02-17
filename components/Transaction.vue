<template>
    <div class="transaction-lookup-container">
      <div v-if="transaction">
        <UCard class="result-card network-card">
          <h3>Network</h3>
          <div class="detail-item">
            <span class="label">Network:</span>
            <span>{{ props.networkName }}</span>
          </div>
        </UCard>
        <div class="result-container">
          <UCard class="result-card">
            <h3>Transaction Details</h3>
            <div v-if="transaction.blockNumber" class="transaction-details">
              <!-- Transaction Hash -->
              <div class="detail-item">
                <span class="label">Hash:</span>
                <span>
                  <a :href="`${explorerUrl}/tx/${hash}`" target="_blank">
                    {{ hash.slice(0, 10) }}...
                  </a>
                </span>
              </div>
              <!-- Block Number -->
              <div class="detail-item">
                <span class="label">Block Number:</span>
                <span>
                  <a :href="`${explorerUrl}/block/${parseInt(transaction.blockNumber, 16)}`" target="_blank">
                    {{ parseInt(transaction.blockNumber, 16) }}
                  </a>
                </span>
              </div>
              <!-- Batch Number -->
              <div class="detail-item" v-if="block && block.l1BatchNumber">
                <span class="label">Batch Number:</span>
                <span>
                  <a :href="`${explorerUrl}/batch/${block.l1BatchNumber}`" target="_blank">
                    {{ block.l1BatchNumber }}
                  </a>
                </span>
              </div>
              <div class="detail-item">
                <span class="label">Status:</span>
                <span v-if="receipt">{{ receipt.status }} {{ statusToHuman(receipt.status) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Gas Price:</span>
                <span>{{ formatNumber(parseInt(transaction.gasPrice, 16)) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Gas Limit:</span>
                <span>{{ formatNumber(parseInt(transaction.gas, 16)) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Gas Used:</span>
                <span v-if="receipt">
                  {{ formatNumber(parseInt(receipt.gasUsed, 16)) }}
                  ({{ Math.round(100 * parseInt(receipt.gasUsed, 16) / parseInt(transaction.gas, 16)) }}%)
                </span>
              </div>
            </div>
            <div v-else>
              <UAlert variant="warning">Transaction not found or still pending.</UAlert>
            </div>
          </UCard>
    
          <div>
            <UCard class="result-card">
              <h3>Gas usage breakdown</h3>
              <div v-if="executionInfo && receipt && block && ethBlock" class="transaction-details">
                <div class="detail-item">
                  <span class="label">Pubdata Gas:</span>
                  <span>
                    {{ executionInfo.pubdata_published }} bytes * 
                    {{ computePubdataCost(block, ethBlock) }} gas/byte = 
                    {{ formatNumber(executionInfo.pubdata_published * computePubdataCost(block, ethBlock)) }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="label">
                    Compute Gas:
                    <span class="info-icon" title="Compute represents the gas used for executing the transaction logic.">
                      ℹ️
                    </span>
                  </span>
                  <span>{{ formatNumber(executionInfo.computational_gas_used) }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">
                    Additional Gas:
                    <span class="info-icon" title="This is the difference between total gas used and the sum of pubdata cost plus compute gas. It highlights additional gas costs not directly accounted for.">
                      ℹ️
                    </span>
                  </span>
                  <span>{{ formatNumber(differenceGas) }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Total Gas Used:
                    <span class="info-icon" title="Sum of pubdata costs, compute costs, and any additional gas costs.">
                      ℹ️
                    </span>
                  </span>
                  <span v-if="receipt">{{ formatNumber(parseInt(receipt.gasUsed, 16)) }}</span>
                </div>
              </div>
            </UCard>
          </div>
    
          <div class="block-details">
            <UCard class="result-card">
              <h3>Execution analysis</h3>
              <div v-if="executionInfo && receipt && block && zkTransaction && ethBlock" class="transaction-details">
                <div class="detail-item">
                  <span class="label">
                    Max gas per pubdata:
                    <span class="info-icon" title="This is the maximum gas cost per pubdata byte. It is used to project potential cost increases if pubdata prices spike.">
                      ℹ️
                    </span>
                  </span>
                  <span>{{ formatNumber(parseInt(zkTransaction.gasPerPubdata, 16)) }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">
                    Max gas usage:
                    <span class="info-icon" title="Calculated as: (number of pubdata bytes * max gas per pubdata) + compute gas. This projects the maximum potential gas usage if pubdata prices increase.">
                      ℹ️
                    </span>
                  </span>
                  <span>{{ formatNumber(computeMaxGasUsage) }}</span>
                </div>
                <UAlert
                  v-if="computeMaxGasUsage > parseInt(transaction.gas, 16)"
                  icon="i-heroicons-command-line"
                  color="orange"
                  variant="solid"
                  title="Heads up!"
                  description="Although your current gas usage is fine, the maximum projected gas usage (if pubdata prices spike) exceeds your gas limit. This means your transaction could fail if pubdata costs increase."
                />
                <div class="detail-item">
                  <span class="label">
                    Storage logs:
                    <span class="info-icon" title="Represents the number of storage slots accessed (either read or written). For pubdata, only write operations are counted; read operations (e.g. nonce, keys, etc.) are not included.">
                      ℹ️
                    </span>
                  </span>
                  <span>{{ executionInfo.storage_logs }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">L2 to L1 logs / msg:</span>
                  <span>{{ executionInfo.l2_to_l1_logs }} / {{ executionInfo.l2_l1_long_messages }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Contracts deployed:</span>
                  <span>{{ executionInfo.contracts_deployed }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Published bytecodes:</span>
                  <span>{{ executionInfo.published_bytecode_bytes }}</span>
                </div>
              </div>
            </UCard>
          </div>
    
          <BlockHistory v-if="blockId" :blockId="blockId" :rpcUrl="rpcUrl" />
        </div>
      </div>
      <div v-else>
        <UCard class="result-card network-card">
          <h3>Network</h3>
          <div class="detail-item">
            <span class="label">Network:</span>
            <span>{{ props.networkName }}</span>
          </div>
          <div class="detail-item">
            <span>Tx NOT FOUND</span>
          </div>
        </UCard>
      </div>
    </div>
  </template>
    
  <script setup>
  import { ref, computed, onMounted } from 'vue'
  import BlockDetails from '~/components/BlockDetails.vue'
  import BlockHistory from '~/components/BlockHistory.vue'
  import config from '~/config.js'
    
  const props = defineProps({
    hash: { type: String, required: true },
    rpcUrl: { type: String, required: true },
    networkName: { type: String, required: true }
  })
    
  console.log("inside tx ", props.hash);
    
  // Look up the network config based on networkName prop.
  const networkConfig = computed(() => {
    return config.find(net => net.networkName === props.networkName) || {}
  });
    
  // Compute the explorer URL from the network config.
  const explorerUrl = computed(() => networkConfig.value.explorerUrl || '');
    
  const transaction = ref(null)
  const block = ref(null)
  const ethBlock = ref(null)
  const executionInfo = ref(null)
  const receipt = ref(null)
  const zkTransaction = ref(null)
    
  const blockId = ref(null)
    
  // Computed property for max gas usage: (pubdata bytes * max gas per pubdata) + compute gas.
  const computeMaxGasUsage = computed(() => {
    return parseInt(zkTransaction.value.gasPerPubdata, 16) *
      executionInfo.value.pubdata_published + executionInfo.value.computational_gas_used;
  });
    
  // Computed property for the difference between total gas used and (pubdata cost + compute)
  const differenceGas = computed(() => {
    if (!receipt.value || !executionInfo.value || !block.value || !ethBlock.value) return 0;
    const gasUsedNum = parseInt(receipt.value.gasUsed, 16);
    const pubdataCostNum = executionInfo.value.pubdata_published * computePubdataCost(block.value, ethBlock.value);
    const computeGasNum = executionInfo.value.computational_gas_used;
    return gasUsedNum - (pubdataCostNum + computeGasNum);
  });
    
  const fetchTransaction = async (hashValue) => {
    try {
      const response = await fetch(props.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getTransactionByHash',
          params: [hashValue],
          id: 1,
        }),
      });
      const result = await response.json();
      transaction.value = result.result;
    
      if (transaction.value && transaction.value.blockNumber) {
        await fetchBlockDetails(transaction.value.blockNumber);
        await fetchExecutionInfo(hashValue);
        await fetchReceipt(hashValue);
        await fetchZksTransaction(hashValue);
        await fetchEthBlockDetails(transaction.value.blockNumber);
        console.log("Setting block id to: " + transaction.value.blockNumber);
        blockId.value = transaction.value.blockNumber;
      }
    } catch (error) {
      console.error('Error fetching transaction:', error);
    }
  };
    
  const fetchBlockDetails = async (blockNumber) => {
    try {
      let foo = parseInt(blockNumber, 16);
      const response = await fetch(props.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'zks_getBlockDetails',
          params: [foo],
          id: 1,
        }),
      });
      const result = await response.json();
      block.value = result.result;
    } catch (error) {
      console.error('Error fetching block details:', error);
    }
  };
    
  const fetchEthBlockDetails = async (blockNumber) => {
    try {
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
      ethBlock.value = result.result;
    } catch (error) {
      console.error('Error fetching block details:', error);
    }
  };
    
  const computePubdataCost = (block, ethBlock) => {
    return Math.round(block?.fairPubdataPrice / ethBlock?.baseFeePerGas);
  };
    
  const formatNumber = (num) => {
    return num !== undefined ? num.toLocaleString('en-US') : 'N/A';
  };
    
  const fetchExecutionInfo = async (hashValue) => {
    try {
      const response = await fetch(props.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'unstable_getTransactionExecutionInfo',
          params: [hashValue],
          id: 1,
        }),
      });
      const result = await response.json();
      executionInfo.value = result.result.executionInfo;
    } catch (error) {
      console.error('Error fetching execution info details:', error);
    }
  };
    
  const fetchReceipt = async (hashValue) => {
    try {
      const response = await fetch(props.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getTransactionReceipt',
          params: [hashValue],
          id: 1,
        }),
      });
      const result = await response.json();
      receipt.value = result.result;
    } catch (error) {
      console.error('Error fetching execution info details:', error);
    }
  };
    
  const fetchZksTransaction = async (hashValue) => {
    try {
      const response = await fetch(props.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'zks_getTransactionDetails',
          params: [hashValue],
          id: 1,
        }),
      });
      const result = await response.json();
      zkTransaction.value = result.result;
    } catch (error) {
      console.error('Error fetching ZK transaction:', error);
    }
  };
    
  const statusToHuman = (statusVal) => {
    let status = parseInt(statusVal, 16);
    return status === 1 ? "SUCCESS" : "FAILED";
  };
    
  onMounted(() => {
    if (props.hash) {
      fetchTransaction(props.hash);
    }
  });
  </script>
    
  <style scoped>
  .transaction-lookup-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
  }
    
  .query-card {
    padding: 20px;
    width: 100%;
    max-width: 600px;
    margin-bottom: 20px;
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
    
  .result-container {
    width: 100%;
    max-width: 600px;
  }
    
  .result-card {
    padding: 20px;
  }
    
  .transaction-details {
    margin-top: 15px;
  }
    
  .network-card {
    background-color: rgb(138, 138, 138);
  }
    
  .detail-item {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid #e0e0e0;
  }
    
  .label {
    font-weight: bold;
    display: flex;
    align-items: center;
  }
    
  .info-icon {
    margin-left: 5px;
    cursor: pointer;
    color: #888;
    font-size: 1em;
  }

  a {
  color: #1976d2;       /* A blue color that typically indicates a link */
  text-decoration: underline;
  font-weight: bold;
  cursor: pointer;
}

a:hover {
  color: #0d47a1;       /* A darker blue on hover */
  text-decoration: none;
}
  </style>