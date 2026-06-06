const fs = require('node:fs/promises')
const crypto = require('node:crypto')
const path = require('node:path')

const writeQueues = new Map()

async function ensureDir(dirPath) {
    await fs.mkdir(dirPath, { recursive: true })
}

async function readJson(filePath, fallbackValue) {
    try {
        const content = await fs.readFile(filePath, 'utf8')
        return JSON.parse(content)
    } catch (error) {
        if (error.code === 'ENOENT') {
            return fallbackValue
        }
        throw error
    }
}

async function writeJson(filePath, data) {
    await ensureDir(path.dirname(filePath))

    const tempPath = `${filePath}.${process.pid}.${Date.now()}.${crypto.randomUUID()}.tmp`
    const content = `${JSON.stringify(data, null, 2)}\n`

    await fs.writeFile(tempPath, content, 'utf8')
    await fs.rename(tempPath, filePath)
}

async function updateJson(filePath, fallbackValue, updater) {
    const previousQueue = writeQueues.get(filePath) || Promise.resolve()

    const nextQueue = previousQueue.then(async () => {
        const current = await readJson(filePath, fallbackValue)
        const next = await updater(current)
        await writeJson(filePath, next)
        return next
    })

    writeQueues.set(filePath, nextQueue.catch(() => {}))

    return nextQueue
}

async function ensureJsonFile(filePath, defaultValue) {
    await ensureDir(path.dirname(filePath))

    try {
        await fs.access(filePath)
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error
        }
        await writeJson(filePath, defaultValue)
    }
}

module.exports = {
    ensureDir,
    ensureJsonFile,
    readJson,
    updateJson,
    writeJson,
}
