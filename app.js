const express = require('express')
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

app.get('/', (req, res) => {
  res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
})

app.get('/profile', requiresAuth(), (req, res) => {
  let jsonProfile = req.oidc.user
  res.send(JSON.stringify(jsonProfile))
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
