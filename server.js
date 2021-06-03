var express = require('express')
var app = express()
var http = require('http').createServer(app);

http.listen(process.env.PORT || 6996, function () {
    var host = http.address().address
    var port = http.address().port
    console.log(`App listening at http://${host}:${port}`)
});

app.get('/', (req, res) => {
    res.send("")
})

const io = require("socket.io")(http, {
    cors: {
        origin: [
            "http://localhost",
            "http://192.168.1.25",
            "https://webdgt.xyrus10.com"
        ],
        methods: ["GET", "POST"],
    }
});

var clientList = []

io.on("connection", socket => {

    socket.on('connected', username => {
        console.log(`User Connected`)
        clientList[socket.id] = {username: username, room:socket.rooms}
        console.log(clientList[socket.id])
    })

    socket.on('logoutUser', param => {
        console.log('logout User', param)
        socket.broadcast.emit('doLogoutUser', param)
    })

    socket.on("affectDataTable", (room) => {
        console.log("Affected DataTable", clientList[socket.id])
        socket.to(room).emit("refreshDataTable")
    })

    socket.on('joinRoom', room => {
        console.log('Join Room', clientList[socket.id]);
        socket.join(room)
    })

    socket.on('leaveRoom', room => {
        console.log('Leave Room', clientList[socket.id]);
        socket.leave(room)
    })

    socket.on("disconnect", (reason) => {
        console.log("user leave", reason, clientList[socket.id])
        delete(clientList[socket.id])
    })
})