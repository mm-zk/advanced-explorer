<template>
  <div class="transaction-lookup-container">
    <UCard class="query-card">
      <h2 class="title">Ethereum Transaction Lookup</h2>
      <UInput v-model="hash" placeholder="Enter transaction hash" value="0x205ab9de18c5c476f5ffba172fd1eba2e47d11f857a2a81ad71726545c572304" class="query-input" />
      <UButton @click="fetchTransaction" size="large" class="fetch-button">Fetch Transaction</UButton>
    </UCard>

    <div v-if="transaction" class="result-container">
      <UCard class="result-card">
        <h3>Transaction Details</h3>
        <div v-if="transaction.blockNumber" class="transaction-details">
          <div class="detail-item">
            <span class="label">Block Number:</span>
            <UText>{{ parseInt(transaction.blockNumber, 16) }}</UText>
          </div>
          <div class="detail-item">
            <span class="label">Gas:</span>
            <UText>{{ parseInt(transaction.gas, 16) }}</UText>
          </div>
          <div class="detail-item">
            <span class="label">Gas Price:</span>
            <UText>{{ parseInt(transaction.gasPrice, 16) }}</UText>
          </div>
          <div class="detail-item">
            <span class="label">Nonce:</span>
            <UText>{{ parseInt(transaction.nonce, 16) }}</UText>
          </div>
          <div class="detail-item">
            <span class="label">Transaction Index:</span>
            <UText>{{ parseInt(transaction.transactionIndex, 16) }}</UText>
          </div>
        </div>
        <div v-else>
          <UAlert variant="warning">Transaction not found or still pending.</UAlert>
        </div>
      </UCard>

      <!-- Display Block Details Component -->
      <BlockDetails v-if="block" :block="block" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const hash = ref('')
const transaction = ref(null)
const block = ref(null)
const ethNodeUrl = 'https://mainnet.era.zksync.io' // Replace with your Ethereum node URL

const fetchTransaction = async () => {
  try {
    const response = await fetch(ethNodeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionByHash',
        params: [hash.value],
        id: 1,
      }),
    })

    const result = await response.json()
    transaction.value = result.result


    // If transaction is found, fetch block details
    if (transaction.value && transaction.value.blockNumber) {
      await fetchBlockDetails(transaction.value.blockNumber)
    }

  } catch (error) {
    console.error('Error fetching transaction:', error)
  }
}
const fetchBlockDetails = async (blockNumber) => {
  console.log("FEtching block");
  try {
    const response = await fetch(ethNodeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBlockByNumber',
        params: [blockNumber, true], // true to get the full transaction details within the block
        id: 1,
      }),
    })

    const result = await response.json()
    block.value = result.result
  } catch (error) {
    console.error('Error fetching block details:', error)
  }
}

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

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #e0e0e0;
}

.label {
  font-weight: bold;
}

UText {
  color: #e2e2e2;
}
</style>
