'use strict'

const fs = require('fs')
const mime = require('mime')
const etag = require('etag')
const http = require('http')
const url = require('url')
const path = require('path')
const decode = require('urldecode')
const formidable = require('formidable')

const root = path.join(__dirname,'store')
// 'F://'
const fontsize = 16
const PORT = 80

const util = require('./util')

const server = http.createServer((req, res) => {
  if (req.method.toLowerCase() == 'get'){//download
    res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' })
    const pathname = decode(url.parse(req.url).pathname)
    const filepath = path.join(root, pathname)
    fs.stat(filepath, (err, stats) => {
      if (!err) {
        console.log(`[200] ${req.method} ${req.url}`)
        if (stats.isFile()) {
          console.log(`Content-Type: ${mime.getType(filepath)}`)
          if (req.headers.range) {//断点续传
            const range = req.headers.range.split('bytes=')[1]
            let [start, end] = range.split('-')
            start = +start
            if (!end) {
              end = stats.size - 1
            } else {
              end = +end
            }
            res.writeHead(206, {
              'Content-Range': `bytes ${start}-${end}/${stats.size}`,
              'ETag': etag(stats),
              'Content-Type': mime.getType(filepath),
              'Entity-Length': end - start + 1,
              "Content-Disposition": "attachment" //http协议中声明下载文件，否则txt等文件会自动打开
            })
            fs.createReadStream(filepath, { start, end }).pipe(res)
          } else {
            res.writeHead(200, {
              'ETag': etag(stats),
              'Transfer-Encoding': 'chunked',
              'Content-Type': mime.getType(filepath),
              'Content-Length': stats.size,
              "Content-Disposition": "attachment" 
            })
            fs.createReadStream(filepath).pipe(res)
          }
        } else {
          let html = `<style>a{text-decoration: none;color: black} 
            h1 a{color: #423f37;} 
            input {margin-top:10px;
            background-color: #fff;
            border-radius: 4px;
            border: 1px solid #dcdfe6;
            color: #606266;
            font-size: inherit;
            line-height: 30px;
            margin-left:3%
          }
            </style>
            <h1>Index of <a href="/">root/</a>`
          pathname.split('/').filter(a => a.trim()).forEach((item, index, arr) => {
            html += '<a href="/' + arr.slice(0, index + 1).join('/') + '">' + item + '/</a>'
          })
          html += '</h1><br><hr>'
          html += `<div style="display: inline-block; float: left; width: 30%; font-size: ${fontsize}px; margin-left: 3%; margin-bottom:20px"><a style="text-decoration: underline;" href="..">..</a><br>`
          let files = fs.readdirSync(filepath).filter(file => util.filefilter(file)).map(file => {
            const filestat = fs.statSync(path.join(filepath, file))
            filestat.name = file
            filestat.isFile = filestat.isFile()
            return filestat
          })
          files = files.filter(file => !file.isFile).concat(files.filter(file => file.isFile))
          // filter(file => !file.isFile)
          for (const file of files) {
            html += `<a href="${path.join(pathname, file.name)}" title="${file.name}">${file.name.length > 30 ? file.name.slice(0, 35) + '...' : file.name}${file.isFile ? '' : '/'}</a><br>`
          }
          html += `</div><br><div style="display: inline-block; float: right; width: 50%; font-size: ${fontsize}px;margin-bottom:20px">`
          for (const file of files) {
            html += (file.isFile ? util.normallizeSize(file.size) : 'Directory') + '<br>'
          }
          html += `</div> <br>
            <form action="/upload" enctype="multipart/form-data" method="post">
            <input type="file" name="upload" multiple="multiple"><br>
            <input type="submit" value="提交" style="width:55px">
            </form>
          `       
          res.end(html)
        }
      } else {
        console.log(`[404] ${req.method} ${req.url}`)
        res.writeHead(404)
      }
    })
  } else if (req.url == '/upload' && req.method.toLowerCase() == 'post'){//upload
    console.log(`${req.method} ${req.url}`)
    // parse a file upload
    const form = new formidable.IncomingForm();
    form.uploadDir = "./store";
    form.keepExtensions = true;
    form.parse(req, function(err, fields, files) {
      if(!files.upload.name){
        res.end('err')
        return
      }
      var oldpath = path.normalize(files.upload.path);
      var newpath = path.join(oldpath.slice(0,oldpath.lastIndexOf('\\')+1)  + files.upload.name)
      // console.log(oldpath,newpath)

      res.writeHead(200, {'content-type': 'text/plain'});
      // res.write('received upload:\n\n');
      fs.rename(oldpath,newpath,(err)=>{
        if(err){
          console.log(err)
          res.end('fail')
        }
        else 
          res.end('success')
      })
    });
    return;
  }
})

server.listen(PORT)

console.log(`Server is running at http://localhost:${PORT}/`)

