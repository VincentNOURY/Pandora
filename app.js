
const fs = require('fs')
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
  let verif = false
  let name = ""
  let threads = readThreads()
  Object.keys(threads).forEach(element => {
    if (threads[element].name.match(id)){
      verif = true
      name = threads[element].name
    }
  })
  if (verif){
    let results = readThread(id)
    await res.render('pages/threadTemplate', {authenticated: req.oidc.isAuthenticated(), title: name, results: results})
  }
  else{
    await res.render('pages/404', {authenticated: req.oidc.isAuthenticated()})
  }
})

app.get('/threads', async (req, res) => {
  await res.redirect('/search?search=')
})

app.get('/search', async (req, res) => {
  let threads = readThreads()
  let results = []
  Object.keys(threads).forEach(element => {
    if (threads[element].name.match(req.query.search)){
      let threadName = threads[element].name
      results.push({name: threadName, description: readThread(threadName)[0].messageContent, link: "/thread/" + threadName})
    }
  }); 
  
  await res.render('pages/search', {results: results, authenticated: req.oidc.isAuthenticated()})
})

app.get('/new', async (req, res) => {
  if (req.oidc.isAuthenticated()){
    let message = req.query.message
    let threadId = req.query.threadid
    addMessage(message, req.oidc.user.nickname, threadId)
    //console.log(Object.keys(req))
    await res.redirect('thread/' + threadId)
  }
  else{
    await res.redirect('/login')
  }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

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
    return JSON.parse(fs.readFileSync(threadPath, 'utf8'))
  } catch (err) {
    console.error(err)
  }
}


function readThreads(){
  const threadPath = `database/threads.json`
  try {
    return JSON.parse(fs.readFileSync(threadPath, 'utf8'))
  } catch (err) {
    console.error(err)
  }
}