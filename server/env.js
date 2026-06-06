const fs = require('node:fs')
const path = require('node:path')

function unquote(value) {
    const trimmed = value.trim()
    const first = trimmed[0]
    const last = trimmed[trimmed.length - 1]

    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
        return trimmed.slice(1, -1)
    }

    return trimmed
}

function loadEnv(filePath = path.resolve(__dirname, '..', '.env')) {
    if (!fs.existsSync(filePath)) {
        return
    }

    const content = fs.readFileSync(filePath, 'utf8')

    for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim()

        if (!trimmed || trimmed.startsWith('#')) {
            continue
        }

        const equalsIndex = trimmed.indexOf('=')

        if (equalsIndex === -1) {
            continue
        }

        const key = trimmed.slice(0, equalsIndex).trim()
        const value = unquote(trimmed.slice(equalsIndex + 1))

        if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) {
            continue
        }

        process.env[key] = value
    }
}

module.exports = {
    loadEnv,
}
