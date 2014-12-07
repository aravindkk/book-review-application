var express=require('express');
var expressSession = require('express-session');
var cookieParser = require('cookie-parser'); // the session is stored in a cookie, so we use this to parse it
var app=express();

var mongo = require('mongodb');
var Server = mongo.Server;
var ObjectID = mongo.ObjectID;
var Db = mongo.Db;

var server = new Server('localhost',27017, {auto_reconnect:true});
var db = new Db('abcd',server);


db.open(function(err,db)
{
 if(err)
 {
   console.log('Problem with mongodb');
 }
 else
 {
   console.log('Connected to db');
 }
});

var MongoStore = require('connect-mongo')(expressSession);

// must use cookieParser before expressSession
app.use(cookieParser());

app.use(expressSession({
  store: new MongoStore({
    db: 'myapp',
    host: '127.0.0.1',
    port: 27017 
  }),
  secret:'somesecrettokenhere'}));

var bodyParser=require('body-parser');
var http=require('http');
var server=http.createServer(app);
var fs=require('fs');

var application_root=__dirname,
    path=require('path');

app.use(express.static(application_root));
app.use(bodyParser());



app.get('/',function(req,res)
{
 console.log('hello');
 if (req.session.username) {
 	console.log('here');
    res.end('<br>Your username from your session is: ' + req.session.username);
  }
 else
 {
 	 console.log('oops');
     res.sendfile('home.html');
 }
});

app.post('/new', function(req,res){
  /*var imageFile=req.files.photo;
  console.log(imageFile);*/
  console.log(req.body.title);
  res.sendfile('home.html');
});

app.get('/login',function(req,res)
{
	res.sendfile('login.html');
});

app.get('/signup',function(req,res)
{
	res.sendfile('signup.html');
});

app.get('/forgot',function(req,res)
{
	res.sendfile('forgot.html');
});

app.post('/login',function(req,res)
{
	//check if the user name is unique, mail id is unique and password is ok.
	//right now, no validations, will just see if sessions works
	console.log(req.body.username);
	console.log(req.body.password);
	//check db
	req.session.username = req.body.username;
   res.redirect('/'); 
});


var port=process.env.PORT || 5000;
server.listen(port);
console.log("Listening on "+port);
