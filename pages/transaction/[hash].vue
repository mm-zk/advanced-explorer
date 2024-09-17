<template>
    <UCard class="query-card">
        <h2 class="title">Ethereum Transaction Lookup</h2>
        <UInput v-model="hash" placeholder="Enter transaction hash" class="query-input" />
        <UButton @click="updateURL" size="lg" class="fetch-button">Fetch Transaction</UButton>
    </UCard>
    <Transaction :hash="hash" :rpcUrl="'https://mainnet.era.zksync.io'" :networkName="'ERA Mainnet'" />
    <Transaction :hash="hash" :rpcUrl="'https://sepolia.era.zksync.dev'" :networkName="'Sepolia Testnet'" />

</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'nuxt/app'

const route = useRoute()
const router = useRouter()

const hash = ref(route.params.hash || '')



// Watch the URL parameter and automatically fetch transaction details
watch(() => route.params.hash, (newHash) => {
    if (newHash) {
        hash.value = newHash
    }
})



// Update the URL when the user enters a new transaction hash
const updateURL = () => {
    if (hash.value) {
        router.push({ path: `/transaction/${hash.value}` })
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

span {
    color: #e2e2e2;
}
</style>
