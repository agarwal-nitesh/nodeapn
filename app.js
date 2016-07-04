var express = require('express'),
  bodyParser = require('body-parser'),
  path = require('path'),
  fs = require('fs'),
  busboy = require('connect-busboy'),
  apn = require('apn');

// setup middleware
var app = express();
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(busboy({limits: {
        files: 1,
        fileSize: 4000000
    }}));

var http = require('http').Server(app);

var host = 'localhost';
var port = 8000;


app.get('/', function(req, res){
  res.render('index', {title:'Home'});
});


app.post('/upload', function(req, res){

  req.pipe(req.busboy);

  req.busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
    // console.log("fieldname  "+fieldname);
    // console.log("filename  "+filename);
    // console.log("mimetype  "+mimetype);
    var saveTo = "./upload/"+filename;

    if(mimetype != "application/x-x509-ca-cert"){
      file.resume();
      return res.json({success:false, type:'Invalid mimetype'});
    }

    if(filename != "cert.pem" && filename != "key.pem"){
      file.resume();
      return res.json({success:false, filename:"file name should be cert.pem or key.pem"});
    }

    // application/x-x509-ca-cert
    file.on('limit', function(){
      file.resume();
      return res.json({success:false, limit:'File size > 4 mb'});
    });

    var fstream = fs.createWriteStream(saveTo);
    file.pipe(fstream);
    fstream.on('close', function () {
        return res.json({
            success: true
        });
    });

  });
});


app.post('/sendPush', function(req, res){
  var deviceToken = req.body.deviceToken;
  pushNotif(deviceToken, "Heloo");
  res.json({success:true, push:"successful"});
});

var pushNotif = function(deviceToken, message){
  var options = { cert: './upload/cert.pem', key:  './upload/key.pem'};
  var apnConnection = new apn.Connection(options);
  var myDevice = new apn.Device(deviceToken);
  var note = new apn.Notification();

  note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
  note.badge = 3;
  note.sound = "ping.aiff";
  note.alert = "\uD83D\uDCE7 \u2709 You have a new message";
  note.payload = {'messageFrom': 'Nitesh'};

  apnConnection.pushNotification(note, myDevice);
}

http.listen(port, function(){
  console.log('listening on *:'+port);
});
