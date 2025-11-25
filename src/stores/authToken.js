import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthTokenStore = defineStore('authToken', () => {
    const token = ref(null)
    const TOKEN_KEY = 'zzz-auth-token'

    // Load token from localStorage
    const loadToken = () => {
        const savedToken = localStorage.getItem(TOKEN_KEY)
        if (savedToken) {
            token.value = savedToken
        }
        return token.value
    }

    // Save token to localStorage
    const saveToken = (newToken) => {
        if (!newToken || newToken.trim() === '') {
            throw new Error('Token cannot be empty')
        }
        token.value = newToken.trim()
        localStorage.setItem(TOKEN_KEY, token.value)
    }

    // Clear token
    const clearToken = () => {
        token.value = null
        localStorage.removeItem(TOKEN_KEY)
    }

    // Check if token exists
    const hasToken = computed(() => token.value !== null && token.value !== '')

    // Initialize on store creation
    loadToken()

    return {
        token,
        hasToken,
        loadToken,
        saveToken,
        clearToken
    }
})

