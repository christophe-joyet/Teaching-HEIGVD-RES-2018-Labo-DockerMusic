var protocol = require('./protocol');

var dgram = require('dgram');

var net = require('net');

var moment = require('moment');

var socket = dgram.createSocket('udp4');

var musicians = [];

//listen to multicast
socket.bind(protocol.PORT, function () {
    console.log("Now listen to multicast : " + protocol.MULTICAST_ADDRESS + ":" + protocol.PORT);
    socket.addMembership(protocol.MULTICAST_ADDRESS);
});

//event when recieve a message !
socket.on('message', function(msg, src) {
    console.log('Received a new message : ' + msg);
    
    var json = JSON.parse(msg);

    //update de la date du musicien
    for (var i = 0; i < musicians.length; i++) {
        if (json.uuid == musicians[i].uuid) {
            musicians[i].activeSince = json.activeSince;
            return; //si le musicien est déjà dans le tableau on ne le rajoute pas
        }
    }

    //ajout du musicien dans le tableau
    musicians.push(json);
});

//TCP server
var tcpServer = net.createServer(); // créer le server
tcpServer.listen(protocol.PORT); //ecoute sur le port PORT
console.log("TCP Server now running on port : " + protocol.PORT);

tcpServer.on('connection', function (socket) { //Dès qu'il y a une connexion
    checkInstruments();
    socket.write(JSON.stringify(musicians));    //sérialiser en JSON le tableau de musicien
    socket.destroy();
});

//delete musician if he doesn't play until some seconds (MAX_DELAY)
function checkInstruments() {
    for (var i = 0; i < musicians.length; i++) {
        //si la date - la date enregistrée > que le délai max que l'on laisse -> supprime du tableau
        if (moment().diff(musicians[i].activeSince) > protocol.MAX_DELAY) {
            console.log('Mucisian removed : ' + JSON.stringify(musicians[i]));
            musicians.splice(i, 1);
        }
    }
}
