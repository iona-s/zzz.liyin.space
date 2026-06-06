<script setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Download, Refresh, SwitchButton, Upload } from '@element-plus/icons-vue'
import { useCloudSyncStore } from '@/stores/cloudSync'

const cloudSyncStore = useCloudSyncStore()
const { cloudUpdatedAt, isLoggedIn, loading, syncing, user } = storeToRefs(cloudSyncStore)

const username = ref('')
const password = ref('')
const error = ref('')

const cloudUpdatedAtText = computed(() => {
    if (!cloudUpdatedAt.value) return '暂无云端进度'

    return new Date(cloudUpdatedAt.value).toLocaleString()
})

const currentUserName = computed(() => {
    return user.value?.displayName || user.value?.username || ''
})

const login = async () => {
    error.value = ''

    if (!username.value || !password.value) {
        error.value = '请输入用户名和密码'
        return
    }

    try {
        await cloudSyncStore.login(username.value, password.value)
        password.value = ''
    } catch (err) {
        error.value = err.message
    }
}

const upload = async () => {
    try {
        await cloudSyncStore.uploadCurrentProgress()
    } catch {
        // Store already shows the user-facing error.
    }
}

const refresh = async () => {
    try {
        await cloudSyncStore.refreshCloudUpdatedAt()
        ElMessage({
            showClose: true,
            message: '云端状态已刷新',
            type: 'success',
        })
    } catch (err) {
        ElMessage({
            showClose: true,
            message: err.message,
            type: 'error',
        })
    }
}

const download = () => {
    ElMessageBox.confirm(
        '下载云端进度会覆盖本地成就、账号档案、自定义暂不可得和 TEXTJOIN 数据。确认继续吗？',
        '下载云端进度',
        {
            confirmButtonText: '确认下载',
            cancelButtonText: '取消',
            type: 'warning',
        }
    )
    .then(() => cloudSyncStore.downloadCloudProgress())
    .catch(() => {})
}
</script>

<template>
    <div class="setting-title">云端同步：</div>
    <div class="cloud-sync-view">
        <template v-if="!isLoggedIn">
            <el-form class="cloud-sync-form" label-width="auto" @submit.prevent>
                <el-form-item label="用户名">
                    <el-input v-model="username" autocomplete="username" placeholder="请输入用户名" />
                </el-form-item>
                <el-form-item label="密码">
                    <el-input
                        v-model="password"
                        autocomplete="current-password"
                        placeholder="请输入密码"
                        show-password
                        type="password"
                        @keyup.enter="login"
                    />
                </el-form-item>
            </el-form>
            <div class="cloud-sync-footer">
                <div class="cloud-sync-error">{{ error }}</div>
                <el-button type="primary" :loading="loading" @click="login">登录</el-button>
            </div>
        </template>

        <template v-else>
            <div class="cloud-sync-row">
                <div>
                    <div class="cloud-sync-name">{{ currentUserName }}</div>
                    <div class="cloud-sync-meta">云端更新时间：{{ cloudUpdatedAtText }}</div>
                </div>
                <el-button :icon="SwitchButton" plain @click="cloudSyncStore.logout">退出</el-button>
            </div>
            <div class="cloud-sync-actions">
                <el-button :icon="Upload" type="primary" plain :loading="syncing" @click="upload">
                    上传当前进度
                </el-button>
                <el-button :icon="Download" plain :loading="loading" @click="download">
                    下载云端进度
                </el-button>
                <el-button :icon="Refresh" plain :loading="loading" @click="refresh">
                    刷新状态
                </el-button>
            </div>
        </template>
    </div>
</template>

<style scoped>
.setting-title {
    color: var(--liyin-text-color);
    font-size: 16px;
    margin: 10px 10px;
}
.cloud-sync-view {
    margin: 0 10px;
    padding: 15px;
    border: 1px solid var(--liyin-main-border-color);
    border-radius: 5px;
    color: var(--liyin-text-color);
}
.cloud-sync-form {
    max-width: 420px;
}
.cloud-sync-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}
.cloud-sync-error {
    color: red;
    font-size: 14px;
}
.cloud-sync-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
}
.cloud-sync-name {
    color: var(--liyin-text-main-color);
    font-size: 16px;
    font-weight: 700;
}
.cloud-sync-meta {
    color: var(--liyin-text-color);
    font-size: 13px;
    margin-top: 5px;
}
.cloud-sync-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 15px;
}
@media (max-width: 768px){
    .cloud-sync-view {
        padding: 12px;
    }
    .cloud-sync-row {
        align-items: flex-start;
        flex-direction: column;
    }
    .cloud-sync-actions {
        flex-direction: column;
    }
    .cloud-sync-actions .el-button {
        margin-left: 0;
        width: 100%;
    }
}
</style>
