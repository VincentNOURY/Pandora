
const util = require('util')
const promisify = util.promisify
const readFile = promisify(fs.readFile)
const express = require('express')
const favicon = require('serve-favicon')
const path = require('path')
const app = express()
const port = process.env.PORT || 3000
const { auth, requiresAuth } = require('express-openid-connect')
const res = require('express/lib/response')
const { json } = require('express/lib/response')

require('dotenv').config()

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))

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
app.set('views', __dirname + '/views')

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

app.get('/newThreadPage', async (req, res) => {
  await res.render('pages/newThreadPage', {authenticated: req.oidc.isAuthenticated()})
})

app.get('/randomThread', async (req, res) => {
  await res.render('pages/randomThread', {authenticated: req.oidc.isAuthenticated()})
})

app.get('/tendencyThread', async (req, res) => {
  await res.render('pages/tendencyThread', {authenticated: req.oidc.isAuthenticated()})
})


app.post('/search', async (req, res) => {
  let results = [
    {value1 : "Name of the thread", value2: "Author", value3: "Description"},
    {value1 : "Fake thread 1", value2: "John Doe", value3: "testing"},
    {value1 : "Name of the thread", value2: "Author", value3: "Description"},
    {value1 : "Name of the thread", value2: "Author", value3: "Description"},
    {value1 : "Name of the thread", value2: "Author", value3: "Description"}
  ]
  await res.render('pages/search', {results: results, authenticated: req.oidc.isAuthenticated()})
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
  const newThread = {name: threadName, path:threadPath}

  fs.readFile('database/threads.json', function (err, data) {
      let json = JSON.parse(data)
      json.push(newThread)

      fs.writeFile("database/threads.json", JSON.stringify(json), function(err, result) {
        if(err) console.log('error', err)})
  })

  let json2 = []
  json2.push({author:"author",date:"YYYY-MM-DD hh:mm:ss",messageContent:"message"})
  fs.writeFile(threadPath, JSON.stringify(json2), function(err, result) {
    if(err) console.log('error', err)
  })
}

function addMessage(messageContent, author, threadName) {
  const threadPath = `database/threads/${threadName}.json`
  let date = new Date();
  date.toString()
  const newMessage = {author: author, date: date, messageContent: messageContent}
  fs.readFile(threadPath, function (err, data) {
      let json = JSON.parse(data)
      json.push(newMessage)

      fs.writeFile(threadPath, JSON.stringify(json), function(err, result) {
        if(err) console.log('error', err)})
  })
}

function readThread(name){
  const threadPath = `database/threads/${name}.json`
  try {
    return fs.readFileSync(threadPath, 'utf8')
  } catch (err) {
    console.error(err)
  }
}



