import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import syncService from '@/services/syncService'

export const useSyncStore = defineStore('sync', () => {
    const isSyncing = ref(false)
    const lastSyncTime = ref(null)
    const syncEnabled = ref(true)
    const serverAvailable = ref(false)
    const syncError = ref(null)

    // Check if server is available
    const checkServerStatus = async () => {
        try {
            serverAvailable.value = await syncService.checkServerStatus()
            return serverAvailable.value
        } catch (error) {
            serverAvailable.value = false
            return false
        }
    }

    // Sync data with server
    const syncData = async (stores) => {
        if (!syncEnabled.value || isSyncing.value) {
            return
        }

        try {
            isSyncing.value = true
            syncError.value = null

            // Check server availability first
            const isAvailable = await checkServerStatus()
            if (!isAvailable) {
                throw new Error('Server is not available')
            }

            // Prepare local data
            const userAchievementKey = 'zzz-userAchievement'
            const userTextjoinKey = 'zzz-userTextjoin'
            const userCustomNotAchievedKey = 'zzz-userCustomNotAchieved'

            // Get achievement data for each user
            const tempAchievement = localStorage.getItem(userAchievementKey)
            const localData = {
                userInfo: stores.userInfo.userInfoList,
                achievements: {},
                textjoins: {},
                customNotAchieved: {}
            }

            if (tempAchievement) {
                localData.achievements = JSON.parse(tempAchievement)
            }

            const tempTextjoin = localStorage.getItem(userTextjoinKey)
            if (tempTextjoin) {
                localData.textjoins = JSON.parse(tempTextjoin)
            }

            const tempCustomNotAchieved = localStorage.getItem(userCustomNotAchievedKey)
            if (tempCustomNotAchieved) {
                localData.customNotAchieved = JSON.parse(tempCustomNotAchieved)
            }

            // Perform smart sync
            const mergedData = await syncService.smartSync(localData)

            // Update local storage with merged data
            localStorage.setItem('zzz-userInfo', JSON.stringify(mergedData.userInfo))
            localStorage.setItem(userAchievementKey, JSON.stringify(mergedData.achievements))
            localStorage.setItem(userTextjoinKey, JSON.stringify(mergedData.textjoins))
            localStorage.setItem(userCustomNotAchievedKey, JSON.stringify(mergedData.customNotAchieved))

            // Update stores
            stores.userInfo.getUserInfo()
            stores.achievement?.reloadUserAchievement()
            stores.textjoin?.getUserTextjoin()
            stores.customNotAchieved?.getUserCustomNotAchieved()

            lastSyncTime.value = new Date()

            console.log('Data synced successfully at', lastSyncTime.value)
        } catch (error) {
            console.error('Sync error:', error)
            syncError.value = error.message
        } finally {
            isSyncing.value = false
        }
    }

    const lastSyncTimeFormatted = computed(() => {
        if (!lastSyncTime.value) return '从未同步'

        const now = new Date()
        const diff = now - lastSyncTime.value
        const seconds = Math.floor(diff / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)

        if (hours > 0) return `${hours}小时前`
        if (minutes > 0) return `${minutes}分钟前`
        if (seconds > 0) return `${seconds}秒前`
        return '刚刚'
    })

    return {
        isSyncing,
        lastSyncTime,
        lastSyncTimeFormatted,
        syncEnabled,
        serverAvailable,
        syncError,
        checkServerStatus,
        syncData
    }
})

