var express = require('express')
var app = express()
var http = require('http').createServer(app);
var request = require('request');

http.listen(process.env.PORT || 6996, function () {
    var host = http.address().address
    var port = http.address().port
    console.log(`App listening at http://${host}:${port}`)
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/index.html")
})

const io = require("socket.io")(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    }
});

var clientList = []

function setUserStatus(userData, status) {
    if (userData.userId == "anonim") return
    var options = {
        method: 'POST',
        url: `${userData?.origin}/api/setuser/status`,
        formData: {
            token: userData?.token,
            userId: userData?.userId,
            status: status
        }
    };
    request(options, function (error, response) {
        if (error) throw new Error(error);
        console.log(response.body);
    });
}

io.on("connection", socket => {

    socket.on('connected', userData => {
        console.log(`User Connected`)
        if (userData.userId != '') socket.broadcast.emit('tryLogoutUser', userData.userId)
        clientList[socket.id] = {userData: userData, room:socket.rooms}
        setUserStatus(userData, 1)
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
        socket.join(room)
        console.log('Join Room', clientList[socket.id]);
    })

    socket.on('leaveRoom', room => {
        socket.leave(room)
        console.log('Leave Room', clientList[socket.id]);
    })

    socket.on("disconnect", (reason) => {
        console.log("user leave", reason, clientList[socket.id])
        setUserStatus(clientList[socket.id]?.userData, 0)
        delete(clientList[socket.id])
    })

    socket.on('teamChanged', () => {
        console.log("Team Changed", clientList[socket.id]);
        socket.broadcast.emit('reloadTeams')
    })

    socket.on('productChanged', () => {
        console.log("Product Changed", clientList[socket.id]);
        socket.broadcast.emit('reloadProduct')
    })

    socket.on('changeArticle', idArticle => {
        console.log("Article Changed", clientList[socket.id]);
        socket.broadcast.emit('articleChanged', idArticle)
    })

    socket.on('sliderChange', value => {
        socket.broadcast.emit('setSliderValue', value)
    })

})