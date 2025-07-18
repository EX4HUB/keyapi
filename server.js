// ----- เริ่ม: โค้ด Server -----
const express = require('express');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(express.json());

function loadKeys() {
  return JSON.parse(fs.readFileSync('keys.json')).keys;
}

function saveKeys(keys) {
  fs.writeFileSync('keys.json', JSON.stringify({ keys }, null, 2));
}

app.get('/check/:key/:userId', (req, res) => {
  const { key, userId } = req.params;
  const keys = loadKeys();
  const foundKey = keys.find(k => k.key === key);

  if (!foundKey) {
    return res.json({ valid: false, message: 'Key not found.' });
  }

  if (foundKey.owner === userId) {
    return res.json({ valid: true, message: 'Key valid for you.' });
  } else {
    return res.json({ valid: false, message: 'Key owned by someone else.' });
  }
});

app.post('/addkey', (req, res) => {
  const { key, userId } = req.body;
  const keys = loadKeys();

  if (keys.find(k => k.key === key)) {
    return res.json({ success: false, message: 'Key already exists.' });
  }

  keys.push({ key, owner: userId });
  saveKeys(keys);
  res.json({ success: true, message: 'Key added.' });
});

app.delete('/removekey/:key/:userId', (req, res) => {
  const { key, userId } = req.params;
  let keys = loadKeys();
  const foundKey = keys.find(k => k.key === key);

  if (!foundKey) {
    return res.json({ success: false, message: 'Key not found.' });
  }

  if (foundKey.owner !== userId) {
    return res.json({ success: false, message: 'You do not own this key.' });
  }

  keys = keys.filter(k => k.key !== key);
  saveKeys(keys);
  res.json({ success: true, message: 'Key removed.' });
});

// เพิ่ม endpoint นี้ไว้ใช้กับ listkeys
app.get('/keys', (req, res) => {
  const keys = loadKeys();
  res.json({ keys });
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
// ----- จบ: โค้ด Server -----
