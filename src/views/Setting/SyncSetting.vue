<template>
    <div class="sync-setting">
        <div class="sync-header">
            <h3>数据同步</h3>
            <el-tag :type="serverAvailable ? 'success' : 'danger'" size="small">
                {{ serverAvailable ? '服务器在线' : '服务器离线' }}
            </el-tag>
        </div>

        <div class="sync-info">
            <div class="info-item">
                <span class="label">同步状态:</span>
                <span class="value">
                    <el-tag v-if="isSyncing" type="primary" size="small">同步中...</el-tag>
                    <el-tag v-else-if="syncError" type="danger" size="small">同步失败</el-tag>
                    <el-tag v-else type="success" size="small">正常</el-tag>
                </span>
            </div>

            <div class="info-item">
                <span class="label">最后同步:</span>
                <span class="value">{{ lastSyncTimeFormatted }}</span>
            </div>

            <div class="info-item" v-if="syncError">
                <span class="label">错误信息:</span>
                <span class="value error">{{ syncError }}</span>
            </div>
        </div>

        <div class="sync-controls">
            <div class="sync-buttons">
                <el-button
                    type="primary"
                    :loading="isSyncing"
                    :disabled="!serverAvailable"
                    @click="handleManualSync"
                >
                    <el-icon v-if="!isSyncing"><Refresh /></el-icon>
                    立即同步
                </el-button>

                <el-button
                    @click="handleCheckServer"
                    :loading="checkingServer"
                >
                    <el-icon><Connection /></el-icon>
                    检查服务器
                </el-button>
            </div>
        </div>

        <div class="sync-description">
            <el-alert
                title="提示"
                type="info"
                :closable="false"
                show-icon
            >
                <p>数据同步功能会自动将您的成就数据、角色设置等信息同步到服务器。</p>
                <p>数据将在以下情况自动同步：</p>
                <ul>
                    <li>页面加载时</li>
                    <li>成就状态改变时（勾选/取消勾选）</li>
                </ul>
                <p>您也可以随时点击"立即同步"按钮手动同步数据。</p>
            </el-alert>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSyncStore } from '@/stores/sync'
import { useUserInfoStore } from '@/stores/userInfo'
import { useAchievementStore } from '@/stores/achievement'
import { useTextjoinStore } from '@/stores/textjoin'
import { useAchievementCustomNotAchievedStore } from '@/stores/achievementCustomNotAchieved'
import { ElMessage } from 'element-plus'
import { Refresh, Connection } from '@element-plus/icons-vue'

const syncStore = useSyncStore()
const userInfoStore = useUserInfoStore()
const achievementStore = useAchievementStore()
const textjoinStore = useTextjoinStore()
const customNotAchievedStore = useAchievementCustomNotAchievedStore()

const {
    isSyncing,
    lastSyncTimeFormatted,
    serverAvailable,
    syncError
} = storeToRefs(syncStore)

const checkingServer = ref(false)

const stores = {
    userInfo: userInfoStore,
    achievement: achievementStore,
    textjoin: textjoinStore,
    customNotAchieved: customNotAchievedStore
}

const handleManualSync = async () => {
    try {
        await syncStore.syncData(stores)
        ElMessage.success('数据同步成功')
    } catch (error) {
        ElMessage.error('数据同步失败: ' + error.message)
    }
}

const handleCheckServer = async () => {
    checkingServer.value = true
    try {
        await syncStore.checkServerStatus()
        if (serverAvailable.value) {
            ElMessage.success('服务器连接正常')
        } else {
            ElMessage.warning('无法连接到服务器')
        }
    } catch (error) {
        ElMessage.error('检查服务器状态失败')
    } finally {
        checkingServer.value = false
    }
}

onMounted(async () => {
    // Check server status on mount
    await syncStore.checkServerStatus()

    // Sync data on page load if server is available
    if (serverAvailable.value) {
        try {
            await syncStore.syncData(stores)
            console.log('Initial sync completed')
        } catch (error) {
            console.warn('Initial sync failed:', error)
        }
    }
})

</script>

<style scoped>
.sync-setting {
    padding: 20px;
}

.sync-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.sync-header h3 {
    margin: 0;
    font-size: 18px;
}

.sync-info {
    background-color: var(--el-fill-color-light);
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 20px;
}

.info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.info-item:last-child {
    margin-bottom: 0;
}

.info-item .label {
    font-weight: 500;
    color: var(--el-text-color-regular);
}

.info-item .value {
    color: var(--el-text-color-primary);
}

.info-item .value.error {
    color: var(--el-color-danger);
    font-size: 12px;
}

.sync-controls {
    margin-bottom: 20px;
}

.sync-buttons {
    display: flex;
    gap: 10px;
    margin-top: 15px;
}

.sync-description {
    margin-top: 20px;
}

.sync-description p {
    margin: 5px 0;
    font-size: 14px;
    line-height: 1.6;
}
</style>

