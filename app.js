const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
    res.send('homepage')
})

app.get('/login', (req, res) => {
    res.send('login page')
})

app.get('/thread/:id', (req, res) => {
    res.send("thread id : " + req.params.id)
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
