let fs = require('fs')
const userString = fs.readFileSync('./db/user.json').toString()
const userArray = JSON.parse(userString)
console.log(userArray)

const newUser = {number:1, name:'倩倩', password:'222'}
userArray.push(newUser)
const newUserString = JSON.stringify(userArray)
fs.writeFileSync('./db/user.json', newUserString)