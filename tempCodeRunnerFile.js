const fs = require('fs')
function createThread(threadName) {
  const threadPath = 'database/threads/'+threadName+'.json'
  let json = JSON.stringify({name: threadName, path: threadPath});
  fs.writeFile('database/threads.json', json, function(err, result) {
    if(err) console.log('error', err);
  })

  json = ''

  fs.writeFile(threadPath, json, function(err, result) {
    if(err) console.log('error', err);
  })
}

function addMessage(messageContent, author, date, threadName) {
  const threadPath = 'database/threads/'+threadName+'.json'

  const json = JSON.stringify({author: author, date: date, messageContent: messageContent})

  fs.writeFile(threadPath, json, function(err, result) {
    if(err) console.log('error', err);
  })
}
//createThread("test2")
addMessage("This is a test mesage", 'jules', '04/27/2022', 'test2')