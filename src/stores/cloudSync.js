import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

const AUTH_KEY = 'zzz-cloudAuth'
const AUTO_UPLOAD_DELAY = 800

const PROGRESS_STORAGE_KEYS = {
    userInfo: 'zzz-userInfo',
    userAchievement: 'zzz-userAchievement',
    userCustomNotAchieved: 'zzz-userCustomNotAchieved',
    userTextjoin: 'zzz-userTextjoin',
}

let autoUploadTimer = null

function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function readJsonStorage(key, fallbackValue = {}) {
    const value = localStorage.getItem(key)

    if (value === null) {
        return fallbackValue
    }

    try {
        const parsed = JSON.parse(value)
        return isPlainObject(parsed) ? parsed : fallbackValue
    } catch {
        return fallbackValue
    }
}

function readAuthStorage() {
    const auth = readJsonStorage(AUTH_KEY, null)

    if (!auth?.accessToken || !auth?.user) {
        return null
    }

    return auth
}

function writeAuthStorage(auth) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth))
}

function removeAuthStorage() {
    localStorage.removeItem(AUTH_KEY)
}

function collectLocalProgress() {
    return {
        userInfo: readJsonStorage(PROGRESS_STORAGE_KEYS.userInfo),
        userAchievement: readJsonStorage(PROGRESS_STORAGE_KEYS.userAchievement),
        userCustomNotAchieved: readJsonStorage(PROGRESS_STORAGE_KEYS.userCustomNotAchieved),
        userTextjoin: readJsonStorage(PROGRESS_STORAGE_KEYS.userTextjoin),
    }
}

function validateCloudProgress(data) {
    return (
        isPlainObject(data) &&
        isPlainObject(data.userInfo) &&
        isPlainObject(data.userAchievement) &&
        isPlainObject(data.userCustomNotAchieved) &&
        isPlainObject(data.userTextjoin)
    )
}

function applyCloudProgress(data) {
    if (!validateCloudProgress(data)) {
        throw new Error('云端进度格式不正确')
    }

    localStorage.setItem(PROGRESS_STORAGE_KEYS.userInfo, JSON.stringify(data.userInfo))
    localStorage.setItem(PROGRESS_STORAGE_KEYS.userAchievement, JSON.stringify(data.userAchievement))
    localStorage.setItem(PROGRESS_STORAGE_KEYS.userCustomNotAchieved, JSON.stringify(data.userCustomNotAchieved))
    localStorage.setItem(PROGRESS_STORAGE_KEYS.userTextjoin, JSON.stringify(data.userTextjoin))
}

export const useCloudSyncStore = defineStore('cloudSync', () => {
    const auth = ref(readAuthStorage())
    const loading = ref(false)
    const syncing = ref(false)
    const initialized = ref(false)
    const cloudUpdatedAt = ref(null)
    const lastAutoUploadAt = ref(null)
    const pendingUpload = ref(false)

    const isLoggedIn = computed(() => Boolean(auth.value?.accessToken))
    const user = computed(() => auth.value?.user ?? null)

    const clearAuth = () => {
        auth.value = null
        cloudUpdatedAt.value = null
        removeAuthStorage()
    }

    const request = async (url, options = {}) => {
        const headers = {
            ...(options.headers ?? {}),
        }
        const withAuth = options.withAuth !== false
        const showUnauthorizedMessage = options.showUnauthorizedMessage !== false

        if (withAuth && auth.value?.accessToken) {
            headers.Authorization = `Bearer ${auth.value.accessToken}`
        }

        if (options.body && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json'
        }

        const response = await fetch(url, {
            ...options,
            headers,
        })

        const contentType = response.headers.get('content-type') || ''
        const payload = contentType.includes('application/json') ? await response.json() : null

        if (withAuth && response.status === 401) {
            clearAuth()
            if (showUnauthorizedMessage) {
                ElMessage({
                    showClose: true,
                    message: '云端登录已失效，请重新登录',
                    type: 'warning',
                })
            }
        }

        if (!response.ok) {
            const error = new Error(payload?.message || '云端请求失败')
            error.status = response.status
            throw error
        }

        return payload
    }

    const refreshCloudUpdatedAt = async () => {
        if (!isLoggedIn.value) {
            return null
        }

        const payload = await request('/api/progress')
        cloudUpdatedAt.value = payload?.updatedAt ?? null
        return payload
    }

    const restoreSession = async () => {
        if (!auth.value?.accessToken || initialized.value) {
            initialized.value = true
            return
        }

        loading.value = true
        try {
            const payload = await request('/api/auth/me')
            auth.value = {
                ...auth.value,
                user: payload.user,
            }
            writeAuthStorage(auth.value)
            await refreshCloudUpdatedAt()
        } catch (error) {
            if (error.status === 401) {
                clearAuth()
                return
            }

            console.error(error)
        } finally {
            initialized.value = true
            loading.value = false
        }
    }

    const login = async (username, password) => {
        loading.value = true
        try {
            const payload = await request('/api/auth/login', {
                method: 'POST',
                withAuth: false,
                body: JSON.stringify({ username, password }),
            })

            auth.value = {
                accessToken: payload.accessToken,
                tokenType: payload.tokenType,
                expiresIn: payload.expiresIn,
                user: payload.user,
                loginAt: Date.now(),
            }
            initialized.value = true
            writeAuthStorage(auth.value)
            await refreshCloudUpdatedAt()

            ElMessage({
                showClose: true,
                message: '云端登录成功',
                type: 'success',
            })
        } finally {
            loading.value = false
        }
    }

    const logout = () => {
        clearAuth()
        ElMessage({
            showClose: true,
            message: '已退出云端登录',
            type: 'success',
        })
    }

    const uploadCurrentProgress = async ({ silent = false } = {}) => {
        if (!isLoggedIn.value) {
            return null
        }

        if (syncing.value) {
            pendingUpload.value = true
            return null
        }

        syncing.value = true
        try {
            pendingUpload.value = false
            const payload = await request('/api/progress', {
                method: 'PUT',
                body: JSON.stringify({ data: collectLocalProgress() }),
            })

            cloudUpdatedAt.value = payload.updatedAt
            lastAutoUploadAt.value = new Date().toISOString()

            if (!silent) {
                ElMessage({
                    showClose: true,
                    message: '已上传当前进度',
                    type: 'success',
                })
            }

            return payload
        } catch (error) {
            if (!silent) {
                ElMessage({
                    showClose: true,
                    message: error.message,
                    type: 'error',
                })
            }
            throw error
        } finally {
            syncing.value = false
            if (pendingUpload.value && isLoggedIn.value) {
                scheduleAutoUpload()
            }
        }
    }

    const downloadCloudProgress = async () => {
        if (!isLoggedIn.value) {
            return
        }

        loading.value = true
        try {
            const payload = await request('/api/progress')

            if (!payload?.data) {
                ElMessage({
                    showClose: true,
                    message: '云端暂无可下载的进度',
                    type: 'warning',
                })
                return
            }

            applyCloudProgress(payload.data)
            cloudUpdatedAt.value = payload.updatedAt ?? null

            ElMessage({
                showClose: true,
                message: '已下载云端进度，页面即将刷新',
                type: 'success',
            })

            setTimeout(() => window.location.reload(), 300)
        } catch (error) {
            ElMessage({
                showClose: true,
                message: error.message,
                type: 'error',
            })
            throw error
        } finally {
            loading.value = false
        }
    }

    const scheduleAutoUpload = () => {
        if (!initialized.value || !isLoggedIn.value) {
            return
        }

        if (syncing.value) {
            pendingUpload.value = true
            return
        }

        window.clearTimeout(autoUploadTimer)
        autoUploadTimer = window.setTimeout(() => {
            uploadCurrentProgress({ silent: true }).catch(error => {
                console.error(error)
            })
        }, AUTO_UPLOAD_DELAY)
    }

    return {
        auth,
        cloudUpdatedAt,
        initialized,
        isLoggedIn,
        lastAutoUploadAt,
        loading,
        pendingUpload,
        syncing,
        user,
        downloadCloudProgress,
        login,
        logout,
        refreshCloudUpdatedAt,
        restoreSession,
        scheduleAutoUpload,
        uploadCurrentProgress,
    }
})

export function notifyCloudProgressChanged() {
    try {
        const cloudSyncStore = useCloudSyncStore()
        cloudSyncStore.scheduleAutoUpload()
    } catch {
        // Pinia may not be active during early boot; local storage still works.
    }
}
