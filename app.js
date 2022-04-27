const util = require('util')
const promisify = util.promisify
const readFile = promisify(fs.readFile)
const express = require('express')
const path = require('path')
const app = express()
const port = process.env.PORT || 3000
const { auth, requiresAuth } = require('express-openid-connect')
const res = require('express/lib/response')

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
app.set('view engine', 'ejs')

app.get('/', async (req, res) => {
  await res.render('pages/index', {authenticated: req.oidc.isAuthenticated()})
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

app.get('/threads', async (req, res) => {
  await res.send('All threads')
})

app.post('/search', async (req, res) => {
  let results = [
    {value1 : "Name of the thread", value2: "Author", value3: "Description"},
    {value1 : "Fake thread 1", value2: "John Doe", value3: "testing"},
    {value1 : "Name of the thread", value2: "Author", value3: "Description"},
    {value1 : "Name of the thread", value2: "Author", value3: "Description"},
    {value1 : "Name of the thread", value2: "Author", value3: "Description"}
  ]
  await res.render('pages/search', {results: results})
})

app.get('/new', async (req, res) => {
  await res.send('To create')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


const fs = require('fs')
function createThread(threadName) {
  const threadPath = `database/threads/${threadName}.json`
  let json = ''
  fs.readFile('database/threads.json', function readFileCallback(err, data){
    if(err){
      console.log(err)
    }else{
      let obj = JSON.parse(data)
      obj.push({name: threadName, path: threadPath})
      json = JSON.stringify(obj)
      fs.writeFile('database/threads.json', json, function(err, result) {
        if(err) console.log('error', err);
      })
    }
  })

  json = ''
  fs.writeFile(threadPath, json, function(err, result) {
    if(err) console.log('error', err)
  })
}

function addMessage(messageContent, author, date, threadName) {
  const threadPath = `database/threads/${threadName}.json`
  const json = JSON.stringify({author: author, date: date, messageContent: messageContent})

  fs.writeFile(threadPath, json, function(err, result) {
    if(err) console.log('error', err)
  })
}
createThread("test2")
addMessage("This is a test mesage", 'jules', '04/27/2022', 'test2')

