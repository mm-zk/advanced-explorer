<template>
    <div class="lookup-container">
      <UCard class="query-card">
        <h2 class="title">ZKSync Transaction Lookup</h2>
        <UInput v-model="hash" placeholder="Enter transaction hash" class="query-input" />
        <UButton @click="onSearchClick" size="lg" class="fetch-button">Search</UButton>
      </UCard>
      
      <!-- Show loading message while searching -->
      <div v-if="loading" class="transaction-container">
        <p>Loading transaction details...</p>
      </div>
      
      <!-- If a valid network is found, display its Transaction using activeHash -->
      <div v-else-if="selectedNetwork" class="transaction-container">
        <Transaction 
          :hash="activeHash" 
          :rpcUrl="selectedNetwork.rpcUrl" 
          :networkName="selectedNetwork.networkName" 
          :explorerUrl="selectedNetwork.explorerUrl" 
        />
      </div>
      
      <!-- Show message if no valid transaction is found -->
      <div v-else-if="hash && noTxFound" class="transaction-container">
        <p>No valid transaction found on any network for this hash.</p>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, watch } from 'vue'
  import { useRoute, useRouter } from 'nuxt/app'
  import networksConfig from '~/config.js'
  import Transaction from '~/components/Transaction.vue'
  
  const router = useRouter()
  const route = useRoute()
  
  // 'hash' is the value bound to the input.
  // 'activeHash' is the hash currently in the URL and used for fetching transaction details.
  const hash = ref(route.params.hash || '')
  const activeHash = ref(route.params.hash || '')
  
  const selectedNetwork = ref(null)
  const loading = ref(false)
  const noTxFound = ref(false)
  
  // Attempts to fetch a transaction on a given network.
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
      return result.result !== null
    } catch (error) {
      console.error(`Error checking network ${network.networkName}:`, error)
      return false
    }
  }
  
  // Helper that returns a promise which resolves with the network if the transaction exists, or rejects otherwise.
  const checkNetwork = (network) => {
    return new Promise((resolve, reject) => {
      fetchTxForNetwork(network)
        .then((exists) => {
          if (exists) {
            resolve(network)
          } else {
            reject(new Error(`Not found on ${network.networkName}`))
          }
        })
        .catch(reject)
    })
  }
  
  // Parallelized network check using Promise.any.
  const determineNetworkParallel = async () => {
    loading.value = true
    noTxFound.value = false
    selectedNetwork.value = null
  
    try {
      // Run checks concurrently.
      const foundNetwork = await Promise.any(networksConfig.map((network) => checkNetwork(network)))
      selectedNetwork.value = foundNetwork
    } catch (error) {
      // If all checks fail, mark no transaction found.
      noTxFound.value = true
    } finally {
      loading.value = false
    }
  }
  
  // When the component is mounted, if there's a hash in the URL, run the network check.
  onMounted(async () => {
    if (route.params.hash) {
      await determineNetworkParallel()
    }
  })
  
  // Watch the route's hash parameter; when it changes, update activeHash and run the check.
  watch(() => route.params.hash, async (newHash) => {
    if (newHash) {
      activeHash.value = newHash
      await determineNetworkParallel()
    }
  })
  
  // When the user clicks "Search", trigger the network check and update the URL.
  const onSearchClick = async () => {
    if (hash.value) {
      // Reset state.
      selectedNetwork.value = null
      noTxFound.value = false
      // Run parallel network check.
      await determineNetworkParallel()
      // Update URL to /transaction/<hash>
      router.push({ path: `/transaction/${hash.value}` })
      // Set activeHash so Transaction.vue uses the hash from the URL.
      activeHash.value = hash.value
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

  .fetch-button {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
  </style>