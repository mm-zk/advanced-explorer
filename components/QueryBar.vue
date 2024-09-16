<template>
  <div>
    <UCard>
      <UInput v-model="hash" placeholder="Enter transaction hash" />
      <UButton @click="fetchTransaction">Fetch Transaction</UButton>
    </UCard>

    <div v-if="transaction">
      <div v-if="transaction.blockNumber">
        <p>Block Number: {{ parseInt(transaction.blockNumber, 16) }}</p>
        <p>Gas: {{ parseInt(transaction.gas, 16) }}</p>
        <p>Gas Price: {{ parseInt(transaction.gasPrice, 16) }}</p>
        <p>Nonce: {{ parseInt(transaction.nonce, 16) }}</p>
        <p>Transaction Index: {{ parseInt(transaction.transactionIndex, 16) }}</p>
      </div>
      <div v-else>
        <p style="color: orange;">Transaction not found or still pending.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const hash = ref('')
const transaction = ref(null)
const ethNodeUrl = 'https://mainnet.era.zksync.io' // Replace with your Infura or Alchemy URL

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
  } catch (error) {
    console.error('Error fetching transaction:', error)
  }
}
</script>
