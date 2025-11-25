<template>
    <div class="token-setting">
        <div class="setting-title">访问令牌管理</div>
        <div class="token-info">
            <div class="info-item">
                <span class="label">当前令牌:</span>
                <span class="value">{{ maskedToken }}</span>
            </div>
        </div>

        <div class="token-actions">
            <el-button type="primary" @click="showChangeTokenDialog">
                更改令牌
            </el-button>
            <el-button type="danger" @click="handleClearToken">
                清除令牌
            </el-button>
        </div>

        <div class="token-description">
            <el-alert
                title="提示"
                type="warning"
                :closable="false"
                show-icon
            >
                <p>访问令牌用于保护您的数据，请妥善保管。</p>
                <p>更改或清除令牌后，页面将自动刷新。</p>
            </el-alert>
        </div>

        <!-- Change Token Dialog -->
        <el-dialog
            v-model="changeTokenVisible"
            title="更改访问令牌"
            width="400px"
        >
            <el-form @submit.prevent="handleChangeToken">
                <el-form-item label="新令牌" required>
                    <el-input
                        v-model="newToken"
                        placeholder="请输入新的访问令牌"
                        clearable
                        autofocus
                    />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="changeTokenVisible = false">取消</el-button>
                <el-button type="primary" @click="handleChangeToken" :disabled="!newToken">
                    确认
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthTokenStore } from '@/stores/authToken'
import { ElMessage, ElMessageBox } from 'element-plus'

const authTokenStore = useAuthTokenStore()
const changeTokenVisible = ref(false)
const newToken = ref('')

const maskedToken = computed(() => {
    if (!authTokenStore.token) return '未设置'
    const token = authTokenStore.token
    if (token.length <= 8) return '*'.repeat(token.length)
    return token.substring(0, 4) + '*'.repeat(token.length - 8) + token.substring(token.length - 4)
})

const showChangeTokenDialog = () => {
    newToken.value = ''
    changeTokenVisible.value = true
}

const handleChangeToken = () => {
    if (!newToken.value || newToken.value.trim() === '') {
        ElMessage.error('访问令牌不能为空')
        return
    }

    try {
        authTokenStore.saveToken(newToken.value)
        changeTokenVisible.value = false
        ElMessage.success('访问令牌已更改，页面即将刷新')

        setTimeout(() => {
            window.location.reload()
        }, 1000)
    } catch (error) {
        ElMessage.error(error.message)
    }
}

const handleClearToken = async () => {
    try {
        await ElMessageBox.confirm(
            '清除令牌后，您将无法访问服务器数据，页面将刷新。确定要继续吗？',
            '警告',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )

        authTokenStore.clearToken()
        ElMessage.success('访问令牌已清除，页面即将刷新')

        setTimeout(() => {
            window.location.reload()
        }, 1000)
    } catch {
        // User cancelled
    }
}
</script>

<style scoped>
.token-setting {
    margin: 20px 0;
}

.setting-title {
    color: var(--liyin-text-color);
    font-size: 18px;
    font-weight: 600;
    margin: 10px;
}

.token-info {
    background-color: var(--el-fill-color-light);
    padding: 15px;
    border-radius: 8px;
    margin: 10px;
}

.info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.info-item .label {
    font-weight: 500;
    color: var(--el-text-color-regular);
}

.info-item .value {
    color: var(--el-text-color-primary);
    font-family: monospace;
}

.token-actions {
    margin: 10px;
    display: flex;
    gap: 10px;
}

.token-description {
    margin: 10px;
}

:deep(.el-alert__description p) {
    margin: 5px 0;
}
</style>

