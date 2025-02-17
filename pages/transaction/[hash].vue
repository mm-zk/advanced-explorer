<template>
    <div class="lookup-container">
      <UCard class="query-card">
        <h2 class="title">ZKSync Transaction Lookup</h2>
        <UInput v-model="hash" placeholder="Enter transaction hash" class="query-input" />
        <UButton @click="updateURL" size="lg" class="fetch-button">Fetch Transaction</UButton>
      </UCard>
      
      <!-- Show the transaction if a network was found -->
      <div v-if="selectedNetwork" class="transaction-container">
        <Transaction 
          :hash="hash" 
          :rpcUrl="selectedNetwork.rpcUrl" 
          :networkName="selectedNetwork.networkName" 
          :explorerUrl="selectedNetwork.explorerUrl" 
        />
      </div>
      
      <!-- Show a loading message while checking networks -->
      <div v-else-if="hash && loading" class="transaction-container">
        <p>Loading transaction details...</p>
      </div>
      
      <!-- Show "no valid transaction found" only after the delay -->
      <div v-else-if="hash && noTxFound" class="transaction-container">
        <p>No valid transaction found on any network for this hash.</p>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, watch, onMounted } from 'vue'
  import { useRoute, useRouter } from 'nuxt/app'
  import networksConfig from '~/config.js'
  import Transaction from '~/components/Transaction.vue'
  
  const route = useRoute()
  const router = useRouter()
  
  // Transaction hash from URL
  const hash = ref(route.params.hash || '')
  
  // Reactive flags for network selection
  const selectedNetwork = ref(null)
  const loading = ref(false)
  const noTxFound = ref(false)
  
  // Try to fetch a transaction from a given network
  const fetchTxForNetwork = async (network) => {
    try {
      const response = await fetch(network.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getTransactionByHash',
          params: [hash.value],
          id: 1,
        }),
      })
      const result = await response.json()
      // Return true if a valid transaction is found.
      return result.result !== null
    } catch (error) {
      console.error(`Error checking network ${network.networkName}:`, error)
      return false
    }
  }
  
  // Iterate over networks to determine which one has the valid transaction.
  const determineNetwork = async () => {
    loading.value = true
    noTxFound.value = false
    selectedNetwork.value = null
    
    for (const network of networksConfig) {
      const exists = await fetchTxForNetwork(network)
      if (exists) {
        selectedNetwork.value = network
        break
      }
    }
    
    // Delay the "no valid transaction" message by 2 seconds.
    setTimeout(() => {
      if (!selectedNetwork.value) {
        noTxFound.value = true
      }
      loading.value = false
    }, 2000)
  }
  
  onMounted(async () => {
    if (hash.value) {
      await determineNetwork()
    }
  })
  
  // Re-check networks if the hash changes.
  watch(hash, async (newHash) => {
    if (newHash) {
      await determineNetwork()
    }
  })
  
  const updateURL = () => {
    if (hash.value) {
      router.push({ path: `/transaction/${hash.value}` })
    }
  }
  </script>
  
  <style scoped>
  .lookup-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 100vh;
    padding: 20px;
  }
  
  .query-card {
    padding: 20px;
    width: 100%;
    max-width: 600px;
    margin-bottom: 20px;
    text-align: center;
  }
  
  .transaction-container {
    width: 100%;
    max-width: 600px;
    margin: 20px auto;
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
  </style>