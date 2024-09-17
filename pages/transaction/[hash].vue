<template>
    <div class="transaction-lookup-container">
        <UCard class="query-card">
            <h2 class="title">Ethereum Transaction Lookup</h2>
            <UInput v-model="hash" placeholder="Enter transaction hash" class="query-input" />
            <UButton @click="updateURL" size="lg" class="fetch-button">Fetch Transaction</UButton>
        </UCard>

        <div v-if="transaction" class="result-container">

            <BlockHistory v-if="blockId" :blockId="blockId" :rpcUrl="rpcUrl" />


            <UCard class="result-card">
                <h3>Transaction Details</h3>
                <div v-if="transaction.blockNumber" class="transaction-details">
                    <div class="detail-item">
                        <span class="label">Hash:</span>
                        <span>{{ hash.slice(0, 10) }}...</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Block Number:</span>
                        <span>{{ parseInt(transaction.blockNumber, 16) }}</span>
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
                        <span v-if="receipt">{{ formatNumber(parseInt(receipt.gasUsed, 16)) }} ({{ Math.round(100 *
                            parseInt(receipt.gasUsed, 16) /
                            parseInt(transaction.gas, 16)) }}%)</span>
                    </div>

                </div>
                <div v-else>
                    <UAlert variant="warning">Transaction not found or still pending.</UAlert>
                </div>
            </UCard>

            <UCard class="result-card">
                <h3>Gas usage breakdown</h3>
                <div v-if="executionInfo && receipt && block" class="transaction-details">
                    <div class="detail-item">
                        <span class="label">Gas Used:</span>
                        <span v-if="receipt">{{ formatNumber(parseInt(receipt.gasUsed, 16)) }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Pubdata:</span>
                        <span>{{ executionInfo.pubdata_published }} * {{ computePubdataCost(block) }} = {{
                            formatNumber(executionInfo.pubdata_published * computePubdataCost(block)) }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Compute:</span>
                        <span>{{ formatNumber(executionInfo.computational_gas_used) }}</span>
                    </div>
                </div>
            </UCard>


            <UCard class="result-card">
                <h3>Execution analysis</h3>
                <div v-if="executionInfo && receipt && block && zkTransaction" class="transaction-details">
                    <div class="detail-item">
                        <span class="label">Gas per pubdata:</span>
                        <span>{{ formatNumber(parseInt(zkTransaction.gasPerPubdata, 16)) }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Max gas usage:</span>
                        <span>{{ formatNumber(computeMaxGasUsage) }}</span>
                    </div>

                    <UAlert v-if="computeMaxGasUsage > parseInt(transaction.gas, 16)" icon="i-heroicons-command-line"
                        color="orange" variant="solid" title="Heads up!"
                        description="You might run out of gas, when pubdata price spikes." />
                    <div class=" detail-item">
                        <span class="label">Storage logs:</span>
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
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'nuxt/app'
import BlockDetails from '~/components/BlockDetails.vue'

const route = useRoute()
const router = useRouter()

const hash = ref(route.params.hash || '')
const transaction = ref(null)
const block = ref(null)
const executionInfo = ref(null)
const receipt = ref(null)
const zkTransaction = ref(null)

const ethNodeUrl = 'https://mainnet.era.zksync.io' // Replace with your Ethereum node URL

const rpcUrl = ethNodeUrl;
const blockId = ref(null);


const computeMaxGasUsage = computed(() => {

    return parseInt(zkTransaction.value.gasPerPubdata, 16) *
        executionInfo.value.pubdata_published + executionInfo.value.computational_gas_used;
});

const fetchTransaction = async (hashValue) => {
    try {
        const response = await fetch(ethNodeUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_getTransactionByHash',
                params: [hashValue],
                id: 1,
            }),
        })

        const result = await response.json()
        transaction.value = result.result

        if (transaction.value && transaction.value.blockNumber) {
            await fetchBlockDetails(transaction.value.blockNumber)
            await fetchExecutionInfo(hashValue)
            await fetchReceipt(hashValue)
            await fetchZksTransaction(hashValue)
            console.log("Setting block id to: " + transaction.value.blockNumber)
            blockId.value = transaction.value.blockNumber
        }
    } catch (error) {
        console.error('Error fetching transaction:', error)
    }
}

const fetchBlockDetails = async (blockNumber) => {
    try {
        let foo = parseInt(blockNumber, 16);
        const response = await fetch(ethNodeUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'zks_getBlockDetails',
                params: [foo],
                id: 1,
            }),
        })

        const result = await response.json()
        block.value = result.result
    } catch (error) {
        console.error('Error fetching block details:', error)
    }
}
const computePubdataCost = (block) => {

    return Math.round(block?.fairPubdataPrice / block?.l2FairGasPrice)
}

// Function to format large numbers with thousand separators, or show "N/A" for undefined values
const formatNumber = (num) => {
    return num !== undefined ? num.toLocaleString('en-US') : 'N/A'
}

const fetchExecutionInfo = async (hashValue) => {
    try {
        const response = await fetch(ethNodeUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'unstable_getTransactionExecutionInfo',
                params: [hashValue],
                id: 1,
            }),
        })

        const result = await response.json()
        executionInfo.value = result.result.executionInfo
    } catch (error) {
        console.error('Error fetching execution info details:', error)
    }
}

const fetchReceipt = async (hashValue) => {
    try {
        const response = await fetch(ethNodeUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_getTransactionReceipt',
                params: [hashValue],
                id: 1,
            }),
        })

        const result = await response.json()
        receipt.value = result.result
    } catch (error) {
        console.error('Error fetching execution info details:', error)
    }
}

const fetchZksTransaction = async (hashValue) => {
    try {
        const response = await fetch(ethNodeUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'zks_getTransactionDetails',
                params: [hashValue],
                id: 1,
            }),
        })

        const result = await response.json()
        zkTransaction.value = result.result


    } catch (error) {
        console.error('Error fetching ZK transaction:', error)
    }
}


const statusToHuman = (statusVal) => {
    let status = parseInt(statusVal, 16);
    if (status == 1) {
        return "SUCCESS"
    } else {
        return "FAILED"
    }
}


// Watch the URL parameter and automatically fetch transaction details
watch(() => route.params.hash, (newHash) => {
    if (newHash) {
        hash.value = newHash
        fetchTransaction(newHash)
    }
})

// If the page is loaded with a transaction hash in the URL, fetch the transaction immediately
onMounted(() => {
    if (hash.value) {
        fetchTransaction(hash.value)
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
