let http = require('http')
let fs = require('fs')
let url = require('url')
let port = process.argv[2]

if(!port){
    console.log('请指定端口号好不啦？\nnode server.js 8888 这样不会吗？')
    process.exit(1)
}

let server = http.createServer(function(request, response){
    let parsedUrl = url.parse(request.url, true)
    let pathWithQuery = request.url
    let queryString = ''
    if(pathWithQuery.indexOf('?') >= 0){ queryString = pathWithQuery.substring(pathWithQuery.indexOf('?')) }
    let path = parsedUrl.pathname
    let query = parsedUrl.query
    let method = request.method

    /******** 从这里开始看，上面不要看 ************/
    console.log('有个傻子发请求过来啦！路径（带查询参数）为：' + pathWithQuery)
    const session = JSON.parse(fs.readFileSync('./session.json').toString())
    const userArray = JSON.parse(fs.readFileSync('./db/user.json'))
    if(path === '/register' && method === 'POST'){
        response.setHeader('Content-Type', 'text/html;charset=UTF-8')
        const array = []
        request.on('data', (chunk)=>{
            array.push(chunk)
        })
        request.on('end', ()=>{
            const string = Buffer.concat(array).toString()
            const obj = JSON.parse(string)
            console.log(obj)
            const lastUser = userArray[userArray.length-1]
            const newUser = {
                id: lastUser ? lastUser.id + 1 : 1,
                name: obj.name,
                password: obj.password
            }
            userArray.push(newUser)
            fs.writeFileSync('./db/user.json', JSON.stringify(userArray))
            response.end()
        })
    }else if(path === '/sign_in' && method === 'POST'){
        response.setHeader('Content-Type', 'text/html;charset=UTF-8')
        const userArray = JSON.parse(fs.readFileSync('./db/user.json'))
        const array = []
        request.on('data', (chunk)=>{
            array.push(chunk)
        })
        request.on('end', ()=>{
            const string = Buffer.concat(array).toString()
            const obj = JSON.parse(string)
            const user = userArray.find((userr)=>(userr.name===obj.name && userr.password === obj.password))

            if(user === undefined){
                response.statusCode = 400
                response.setHeader('Content-Type', 'text/json;charset=utf-8')
                response.end(`{'errorCode': 4001}`)
            }else{
                response.statusCode = 200
                const random = Math.random()
                session[random] = {user_id: user.id}
                fs.writeFileSync('./session.json', JSON.stringify(session))
                response.setHeader('Set-Cookie', `session_id=${random}; HttpOnly`)
                response.end()
            }
        })
    }else if(path === '/home.html'){
        const cookies = request.headers['cookie']
        let sessionId
        try{
            if(cookies.indexOf(';') !== -1){
                cookies.split(';').forEach(c => c.indexOf('session_id') ? sessionId=c.split('=')[1] : cookie=null)
            }else{
                cookies.indexOf('session_id') === 0 ? sessionId=cookies.split('=')[1] : cookie=null
            }
        }catch(error){}
        const homeHtml = fs.readFileSync('./public/home.html').toString()
        let string = ''
        if(sessionId && session[sessionId]){
            const userId = session[sessionId].user_id
            const user = userArray.find(user => user.id === userId)
            if(user) {
                string = homeHtml.replace('{{username}}', user.name).replace('{{loginStatus}}', '已登录')
            }
            response.write(string)
            response.end()
        }else{
            string = homeHtml.replace('{{username}}','').replace('{{loginStatus}}', '未登录')
            response.write(string)
            response.end()
        }

    }else{
        response.statusCode = 200
        const filePath = path === '/' ? '/index.html' : path
        const suffix = filePath.split('.')[1]
        const fileType = {
            'html': 'text/html',
            'css': 'text/css',
            'js': 'text/javascript',
            'png': 'image/png',
            'jpg': 'image/jpeg'
        }
        response.setHeader('Content-Type',`${fileType[suffix] || 'text/html'};charset=utf-8`)
        let content
        try{
            content = fs.readFileSync(`public${filePath}`)
        }catch(error){
            content = '文件不存在'
            response.statusCode = 404
        }
        response.write(content)
        response.end()
    }
    /******** 代码结束，下面不要看 ************/
})

server.listen(port)
console.log('监听 ' + port + ' 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:' + port)
