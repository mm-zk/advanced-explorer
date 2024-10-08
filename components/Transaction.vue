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
                            <span v-if="receipt">{{ formatNumber(parseInt(receipt.gasUsed, 16)) }} ({{
                                Math.round(100 *
                                    parseInt(receipt.gasUsed, 16) /
                                    parseInt(transaction.gas, 16)) }}%)</span>
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
                                <span class="label">Gas Used:</span>
                                <span v-if="receipt">{{ formatNumber(parseInt(receipt.gasUsed, 16)) }}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Pubdata:</span>
                                <span>{{ executionInfo.pubdata_published }} * {{ computePubdataCost(block, ethBlock) }}
                                    = {{
                                        formatNumber(executionInfo.pubdata_published * computePubdataCost(block, ethBlock))
                                    }}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Compute:</span>
                                <span>{{ formatNumber(executionInfo.computational_gas_used) }}</span>
                            </div>
                        </div>
                    </UCard>
                </div>


                <div class="block-details">
                    <UCard class="result-card">
                        <h3>Execution analysis</h3>
                        <div v-if="executionInfo && receipt && block && zkTransaction && ethBlock"
                            class="transaction-details">
                            <div class="detail-item">
                                <span class="label">Gas per pubdata:</span>
                                <span>{{ formatNumber(parseInt(zkTransaction.gasPerPubdata, 16)) }}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Max gas usage:</span>
                                <span>{{ formatNumber(computeMaxGasUsage) }}</span>
                            </div>

                            <UAlert v-if="computeMaxGasUsage > parseInt(transaction.gas, 16)"
                                icon="i-heroicons-command-line" color="orange" variant="solid" title="Heads up!"
                                description="You might run out of gas, when pubdata price spikes." />
                            <div class=" detail-item">
                                <span class="label">Storage logs:</span>
                                <span>{{ executionInfo.storage_logs }}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">L2 to L1 logs / msg:</span>
                                <span>{{ executionInfo.l2_to_l1_logs }} / {{ executionInfo.l2_l1_long_messages
                                    }}</span>
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
import { ref, onMounted, watch } from 'vue'
import BlockDetails from '~/components/BlockDetails.vue'


const props = defineProps({
    hash: {
        type: String,
        required: true
    },
    rpcUrl: {
        type: String,
        required: true
    },
    networkName: {
        type: String,
        required: true
    },
})

console.log("inside tx ", props.hash);


const transaction = ref(null)
const block = ref(null)
const ethBlock = ref(null)
const executionInfo = ref(null)
const receipt = ref(null)
const zkTransaction = ref(null)

const blockId = ref(null);


const computeMaxGasUsage = computed(() => {

    return parseInt(zkTransaction.value.gasPerPubdata, 16) *
        executionInfo.value.pubdata_published + executionInfo.value.computational_gas_used;
});

const fetchTransaction = async (hashValue) => {
    try {
        const response = await fetch(props.rpcUrl, {
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
            await fetchEthBlockDetails(transaction.value.blockNumber)
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
        const response = await fetch(props.rpcUrl, {
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

const fetchEthBlockDetails = async (blockNumber) => {
    try {
        const response = await fetch(props.rpcUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_getBlockByNumber',
                params: [blockNumber, false],
                id: 1,
            }),
        })

        const result = await response.json()
        ethBlock.value = result.result

    } catch (error) {
        console.error('Error fetching block details:', error)
    }
}
const computePubdataCost = (block, ethBlock) => {

    return Math.round(block?.fairPubdataPrice / ethBlock?.baseFeePerGas)
}

// Function to format large numbers with thousand separators, or show "N/A" for undefined values
const formatNumber = (num) => {
    return num !== undefined ? num.toLocaleString('en-US') : 'N/A'
}

const fetchExecutionInfo = async (hashValue) => {
    try {
        const response = await fetch(props.rpcUrl, {
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
        const response = await fetch(props.rpcUrl, {
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
        const response = await fetch(props.rpcUrl, {
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


// If the page is loaded with a transaction hash in the URL, fetch the transaction immediately
onMounted(() => {
    if (props.hash) {
        fetchTransaction(props.hash)
    }
})


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
}
</style>
