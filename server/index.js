const express = require('express')
const path = require('node:path')
const { loadEnv } = require('./env')
const {
    DEFAULT_TOKEN_TTL_SECONDS,
    createAuthMiddleware,
    publicUser,
    signToken,
    verifyPassword,
} = require('./auth')
const { ensureJsonFile, readJson, updateJson } = require('./jsonStore')

loadEnv()

const app = express()

const isProduction = process.env.NODE_ENV === 'production'
const isDevServer = process.argv.includes('--dev') || process.env.SERVER_DEV === 'true'
const port = Number(process.env.PORT || process.env.API_PORT || (isDevServer ? 3001 : 3000))
const host = process.env.HOST || '0.0.0.0'
const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data')
const usersFile = process.env.USERS_FILE || path.join(dataDir, 'users.json')
const progressFile = process.env.PROGRESS_FILE || path.join(dataDir, 'progress.json')
const tokenTtlSeconds = Number(process.env.AUTH_TOKEN_TTL_SECONDS || DEFAULT_TOKEN_TTL_SECONDS)
const tokenSecret = getTokenSecret()

function getTokenSecret() {
    const secret = process.env.AUTH_TOKEN_SECRET
    const placeholderSecrets = new Set([
        'replace-with-a-long-random-secret',
        'development-only-token-secret',
    ])

    if (placeholderSecrets.has(secret)) {
        throw new Error('AUTH_TOKEN_SECRET is using a placeholder value. Replace it with a long random secret.')
    }

    if (secret) {
        return secret
    }

    if (!isDevServer || isProduction) {
        throw new Error('AUTH_TOKEN_SECRET is required outside the development API server')
    }

    console.warn('AUTH_TOKEN_SECRET is not set; using an insecure development secret.')
    return 'development-only-token-secret'
}

function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function validateUsersFile(usersJson) {
    if (!isPlainObject(usersJson) || !Array.isArray(usersJson.users)) {
        throw Object.assign(new Error('Invalid users file'), { statusCode: 500 })
    }

    return usersJson.users.filter(user => {
        return (
            isPlainObject(user) &&
            typeof user.id === 'string' &&
            typeof user.username === 'string' &&
            typeof user.passwordHash === 'string'
        )
    })
}

async function getUsers() {
    const usersJson = await readJson(usersFile, { users: [] })
    return validateUsersFile(usersJson)
}

function normalizeProgressBody(body) {
    const data = isPlainObject(body) && isPlainObject(body.data) ? body.data : body
    const requiredKeys = ['userInfo', 'userAchievement', 'userCustomNotAchieved', 'userTextjoin']

    if (!isPlainObject(data)) {
        throw Object.assign(new Error('Invalid progress payload'), { statusCode: 400 })
    }

    const keys = Object.keys(data)
    const hasUnknownKey = keys.some(key => !requiredKeys.includes(key))
    const missingKey = requiredKeys.some(key => !keys.includes(key))
    const hasInvalidValue = requiredKeys.some(key => !isPlainObject(data[key]))

    if (hasUnknownKey || missingKey || hasInvalidValue) {
        throw Object.assign(new Error('Invalid progress payload'), { statusCode: 400 })
    }

    return {
        userInfo: data.userInfo,
        userAchievement: data.userAchievement,
        userCustomNotAchieved: data.userCustomNotAchieved,
        userTextjoin: data.userTextjoin,
    }
}

async function getProgressStore() {
    const progressJson = await readJson(progressFile, { version: 1, users: {} })

    if (!isPlainObject(progressJson) || !isPlainObject(progressJson.users)) {
        throw Object.assign(new Error('Invalid progress file'), { statusCode: 500 })
    }

    return {
        version: 1,
        users: progressJson.users,
    }
}

async function ensureDataFiles() {
    await ensureJsonFile(usersFile, { users: [] })
    await ensureJsonFile(progressFile, { version: 1, users: {} })
}

const requireAuth = createAuthMiddleware({
    getUsers,
    secret: tokenSecret,
})

app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (req, res) => {
    res.json({ ok: true })
})

app.post('/api/auth/login', async (req, res, next) => {
    try {
        const { username, password } = req.body || {}

        if (typeof username !== 'string' || typeof password !== 'string') {
            res.status(401).json({ message: 'Invalid username or password' })
            return
        }

        const users = await getUsers()
        const user = users.find(item => item.username === username)
        const valid = user ? await verifyPassword(password, user.passwordHash) : false

        if (!valid) {
            res.status(401).json({ message: 'Invalid username or password' })
            return
        }

        res.json({
            accessToken: signToken(user, tokenSecret, tokenTtlSeconds),
            tokenType: 'Bearer',
            expiresIn: tokenTtlSeconds,
            user: publicUser(user),
        })
    } catch (error) {
        next(error)
    }
})

app.get('/api/auth/me', requireAuth, (req, res) => {
    res.json({ user: req.user })
})

app.get('/api/progress', requireAuth, async (req, res, next) => {
    try {
        const progressStore = await getProgressStore()
        const progress = progressStore.users[req.user.id]

        if (!progress) {
            res.json({ updatedAt: null, data: null })
            return
        }

        res.json({
            updatedAt: progress.updatedAt || null,
            data: progress.data || null,
        })
    } catch (error) {
        next(error)
    }
})

app.put('/api/progress', requireAuth, async (req, res, next) => {
    try {
        const data = normalizeProgressBody(req.body)
        const updatedAt = new Date().toISOString()

        await updateJson(progressFile, { version: 1, users: {} }, progressStore => {
            if (!isPlainObject(progressStore.users)) {
                progressStore.users = {}
            }
            progressStore.version = 1
            progressStore.users[req.user.id] = {
                updatedAt,
                data,
            }
            return progressStore
        })

        res.json({ updatedAt, data })
    } catch (error) {
        next(error)
    }
})

const distPath = path.resolve(__dirname, '..', 'dist')
const indexHtmlPath = path.join(distPath, 'index.html')
const staticOptions = {
    cacheControl: false,
    etag: false,
    lastModified: false,
}

if (!isDevServer && process.env.SERVE_STATIC !== 'false') {
    app.use('/src', express.static(path.join(distPath, 'src'), {
        ...staticOptions,
        fallthrough: false,
    }))
    app.use(express.static(distPath, staticOptions))
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/')) {
            next()
            return
        }
        res.sendFile(indexHtmlPath, error => {
            if (error) {
                next()
            }
        })
    })
}

app.use((req, res) => {
    res.status(404).json({ message: 'Not found' })
})

app.use((error, req, res, next) => {
    const statusCode = error.statusCode || error.status || 500
    const message = statusCode >= 500 ? 'Server error' : error.message

    if (statusCode >= 500) {
        console.error(error)
    }

    res.status(statusCode).json({ message })
})

ensureDataFiles()
    .then(() => {
        app.listen(port, host, () => {
            console.log(`Server listening on http://${host}:${port}`)
        })
    })
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
