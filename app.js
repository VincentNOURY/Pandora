const fs = require('fs')
const util = require('util')
const promisify = util.promisify
const readFile = promisify(fs.readFile)
const express = require('express')
const path = require('path')
const app = express()
const port = process.env.PORT || 3000
const { auth, requiresAuth } = require('express-openid-connect')

require('dotenv').config()

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.SECRET,
  baseURL: process.env.BASE_URL,
  clientID: process.env.CLIENT_ID,
  issuerBaseURL: process.env.ISSUER_BASE_URL
}

app.use(auth(config))
app.use(express.static(__dirname + "/public"))

app.get('/', async (req, res) => {
  await res.sendFile(req.oidc.isAuthenticated() ? path.join(__dirname, 'static/index.html') : path.join(__dirname, 'static/index not logged.html'));
})

app.get('/profile', requiresAuth(), (req, res) => {
  let jsonProfile = req.oidc.user
  res.send(JSON.stringify(jsonProfile))
})

app.get('/login', (req, res) => {
  res.send('login page')
})

app.get('/thread/:id', async (req, res) => {
  let id = req.params.id
  await res.sendFile(path.join(__dirname, 'static/thread/' + id + '.html'))
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
