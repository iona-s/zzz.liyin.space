<template>
    <el-dialog
        v-model="dialogVisible"
        title="输入访问令牌"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        :show-close="false"
        width="400px"
    >
        <el-form @submit.prevent="handleSubmit">
            <el-form-item label="访问令牌" required>
                <el-input
                    v-model="inputToken"
                    placeholder="请输入访问令牌"
                    clearable
                    autofocus
                />
            </el-form-item>
            <el-form-item>
                <el-text type="info" size="small">
                    访问令牌用于保护您的数据，请妥善保管。
                </el-text>
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button type="primary" @click="handleSubmit" :disabled="!inputToken">
                确认
            </el-button>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthTokenStore } from '@/stores/authToken'
import { ElMessage } from 'element-plus'

const authTokenStore = useAuthTokenStore()
const dialogVisible = ref(false)
const inputToken = ref('')

const handleSubmit = () => {
    if (!inputToken.value || inputToken.value.trim() === '') {
        ElMessage.error('访问令牌不能为空')
        return
    }

    try {
        authTokenStore.saveToken(inputToken.value)
        dialogVisible.value = false
        ElMessage.success('访问令牌已保存')

        // Reload the page to apply the token
        window.location.reload()
    } catch (error) {
        ElMessage.error(error.message)
    }
}

onMounted(() => {
    // Show dialog if no token exists
    if (!authTokenStore.hasToken) {
        dialogVisible.value = true
    }
})
</script>

<style scoped>
:deep(.el-dialog__header) {
    text-align: center;
    font-weight: 600;
}

:deep(.el-dialog__footer) {
    text-align: center;
}

:deep(.el-form-item__label) {
    font-weight: 500;
}
</style>

