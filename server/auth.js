const crypto = require('node:crypto')
const { promisify } = require('node:util')

const scrypt = promisify(crypto.scrypt)
const HASH_PREFIX = 'scrypt'
const HASH_KEY_LENGTH = 64
const TOKEN_ALGORITHM = 'sha256'
const DEFAULT_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60

function base64UrlEncode(input) {
    return Buffer.from(input).toString('base64url')
}

function base64UrlDecode(input) {
    return Buffer.from(input, 'base64url').toString('utf8')
}

async function hashPassword(password) {
    if (typeof password !== 'string' || password.length === 0) {
        throw new Error('Password is required')
    }

    const salt = crypto.randomBytes(16).toString('base64url')
    const derivedKey = await scrypt(password, salt, HASH_KEY_LENGTH)

    return `${HASH_PREFIX}:${salt}:${Buffer.from(derivedKey).toString('base64url')}`
}

async function verifyPassword(password, passwordHash) {
    if (typeof password !== 'string' || typeof passwordHash !== 'string') {
        return false
    }

    const [prefix, salt, storedHash] = passwordHash.split(':')
    if (prefix !== HASH_PREFIX || !salt || !storedHash) {
        return false
    }

    const storedBuffer = Buffer.from(storedHash, 'base64url')
    const derivedKey = await scrypt(password, salt, storedBuffer.length)

    if (storedBuffer.length !== derivedKey.length) {
        return false
    }

    return crypto.timingSafeEqual(storedBuffer, derivedKey)
}

function publicUser(user) {
    return {
        id: user.id,
        username: user.username,
        displayName: user.displayName || user.username,
    }
}

function signToken(user, secret, ttlSeconds = DEFAULT_TOKEN_TTL_SECONDS) {
    if (!secret) {
        throw new Error('AUTH_TOKEN_SECRET is required')
    }

    const now = Math.floor(Date.now() / 1000)
    const payload = {
        sub: user.id,
        username: user.username,
        displayName: user.displayName || user.username,
        iat: now,
        exp: now + ttlSeconds,
    }
    const encodedPayload = base64UrlEncode(JSON.stringify(payload))
    const signature = crypto
        .createHmac(TOKEN_ALGORITHM, secret)
        .update(encodedPayload)
        .digest('base64url')

    return `${encodedPayload}.${signature}`
}

function verifyToken(token, secret) {
    if (!secret || typeof token !== 'string') {
        return null
    }

    const [encodedPayload, signature] = token.split('.')
    if (!encodedPayload || !signature) {
        return null
    }

    const expectedSignature = crypto
        .createHmac(TOKEN_ALGORITHM, secret)
        .update(encodedPayload)
        .digest('base64url')

    const signatureBuffer = Buffer.from(signature)
    const expectedBuffer = Buffer.from(expectedSignature)

    if (
        signatureBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
        return null
    }

    try {
        const payload = JSON.parse(base64UrlDecode(encodedPayload))
        const now = Math.floor(Date.now() / 1000)

        if (!payload.sub || !payload.exp || payload.exp <= now) {
            return null
        }

        return payload
    } catch {
        return null
    }
}

function getBearerToken(req) {
    const header = req.get('authorization') || ''
    const [scheme, token] = header.split(' ')

    if (scheme !== 'Bearer' || !token) {
        return null
    }

    return token
}

function createAuthMiddleware({ getUsers, secret }) {
    return async function authenticate(req, res, next) {
        try {
            const token = getBearerToken(req)
            const payload = verifyToken(token, secret)

            if (!payload) {
                res.status(401).json({ message: 'Unauthorized' })
                return
            }

            const users = await getUsers()
            const user = users.find(item => item.id === payload.sub)

            if (!user) {
                res.status(401).json({ message: 'Unauthorized' })
                return
            }

            req.user = publicUser(user)
            next()
        } catch (error) {
            next(error)
        }
    }
}

module.exports = {
    DEFAULT_TOKEN_TTL_SECONDS,
    createAuthMiddleware,
    hashPassword,
    publicUser,
    signToken,
    verifyPassword,
    verifyToken,
}
