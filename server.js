const express = require('express')
const fs = require('fs')
const app = express()
const port = 3000

app.use(express.json())

// อ่านไฟล์คีย์
function loadKeys() {
    return JSON.parse(fs.readFileSync('keys.json')).keys
}

// เขียนไฟล์คีย์
function saveKeys(keys) {
    fs.writeFileSync('keys.json', JSON.stringify({ keys }, null, 2))
}

// ตรวจสอบคีย์
app.get('/check/:key', (req, res) => {
    const key = req.params.key
    const keys = loadKeys()
    res.json({ valid: keys.includes(key) })
})

// เพิ่มคีย์
app.post('/addkey', (req, res) => {
    const key = req.body.key
    const keys = loadKeys()
    if (!keys.includes(key)) {
        keys.push(key)
        saveKeys(keys)
        return res.json({ success: true, message: 'Key added.' })
    }
    res.json({ success: false, message: 'Key already exists.' })
})

// ลบคีย์
app.delete('/removekey/:key', (req, res) => {
    const key = req.params.key
    let keys = loadKeys()
    if (keys.includes(key)) {
        keys = keys.filter(k => k !== key)
        saveKeys(keys)
        return res.json({ success: true, message: 'Key removed.' })
    }
    res.json({ success: false, message: 'Key not found.' })
})

app.listen(port, () => {
    console.log(`✅ Server running at http://localhost:${port}`)
})
