
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
  let newestInfos = getNewestThread()
  let randomInfos = getRandomThread()
  let tendancyInfos = getTendancyThread()

  let results = {newestLink: '/thread/' + newestInfos, newestName: newestInfos, 
                 randomLink: '/thread/' + randomInfos, randomName: randomInfos, 
                 tendancyLink: '/thread/' + tendancyInfos, tendancyName: tendancyInfos}
  results['authenticated'] = req.oidc.isAuthenticated()
  await res.render('pages/index', results)
})

app.get('/profile', requiresAuth(), (req, res) => {
  let jsonProfile = req.oidc.user
  let infos = {username : jsonProfile.nickname, email: jsonProfile.email, image: jsonProfile.picture, authenticated: req.oidc.isAuthenticated()}
  res.render('pages/profile', infos)
})

app.get('/newthread', (req, res) =>{
  if (req.oidc.isAuthenticated()){
    console.log(req.oidc.user)
    if (Object.keys(req.query).length > 0){
      let threadId = req.query.threadid
      if (threadExists(threadId)){
        res.render('pages/newThread.ejs', {exists: true, authenticated: req.oidc.isAuthenticated()})
      }
      else{
        let message = req.query.message
        createThread(threadId, req.oidc.user.nickname, message)
        res.redirect('/thread/' + threadId)}
    }
    else{
      res.render('pages/newThread.ejs', {exists: false, authenticated: req.oidc.isAuthenticated()})
    }
    
  }
  else{
    res.redirect('/login')
  }
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

function createThread(threadName, authorName, message) {
  const threadPath = `database/threads/${threadName}.json`
  const newThread = {name: threadName, path:threadPath}

  fs.readFile('database/threads.json', function (err, data) {
      let json = JSON.parse(data)
      json.push(newThread)

      fs.writeFile("database/threads.json", JSON.stringify(json), function(err, result) {
        if(err) console.log('error', err)})
  })

  let json2 = []
  json2.push({author: authorName, date: new Date() ,messageContent: message})
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

function getRandomThread(){
  let threads = readThreads()
  let num = Math.floor(Math.random() * (threads.length))
  return threads[num].name
}

function getThreadLength(thread){
  return readThread(thread.name).length
}

function getTendancyThread(){
  let threads = readThreads()
  let max = getThreadLength(threads[0])
  let threadId = threads[0]
  for (i = 1; i < threads.length; i++){
    let len = getThreadLength(threads[i])
    if (len > max){
      max = len
      threadId = threads[i]
    }
  }
  return threadId.name
}

function getNewestThread(){
  let threads = readThreads()
  return threads[threads.length - 1].name
}

function threadExists(threadId){
  let threads = readThreads()
  for (i = 0; i < threads.length; i++){
    if (threadId == threads[i].name){
      return true
    } 
  }
  return false
}