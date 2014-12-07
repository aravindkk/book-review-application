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



/*New Code*/
var mongoose = require('mongoose');
var dbm = mongoose.connection;
var mongoUri = process.env.MONGOHQ_URL||'mongodb://localhost:27017';
mongoose.connect(mongoUri);
dbm.on('error',console.error);



var Login_Schema = new mongoose.Schema({
 username: String,
 password: String,
 mailid: String,
 userid: Number
 });
 var Login_Model = mongoose.model('Login_Model' , Login_Schema);

var Book_Schema = new mongoose.Schema({
 name: String,
 cover_url: String,
 authors: String,
 start_date: Date,
 end_date: Date,
 about: String,
 one_thing: String, 
 easy: String,
 nice: String,
 improvement: String,
 recommend: String,
 point: String,
 userid: Number,
 entry_author: String
 });
 var Book_Model = mongoose.model('Book_Model' , Book_Schema);
 
/*End of new code*/



app.get('/',function(req,res)
{
 console.log('hello');
 if (req.session.username) {
 	console.log('here');
    //res.end('<br>Your username from your session is: ' + req.session.username);
    res.sendfile('home.html');
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
	res.sendfile('forgot_password.html');
});

app.post('/login',function(req,res)
{
	//check if the user name is unique, mail id is unique and password is ok.
	//right now, no validations, will just see if sessions works
	console.log(req.body.username);
	console.log(req.body.password);
	//check db
	Login_Model.find({username:req.body.username},function(err,data)
	{
       if(err)console.error(err);
       console.log(data);
       if(data[0].password===req.body.password)
       {
       	 //correct password
       	 req.session.username = data[0].username;
       	 req.session.userid = data[0].userid;
       	 res.redirect('/');
       }
       else
       {
       	 //wrong password
       	 var html='<h1>Sorry,wrong combo!</h1>'+'<a href="/login">Try again</a>'+'<a href="/forgot">Forgot password?</a>';
       	 res.end(html);
       }
	});
});

app.post('/signup',function(req,res)
{
	//check if this user exists already, then throw error
	//else store in db, and redirect to /

    
    //First let's validate the details and check if there exists a user with same mail id
    Login_Model.count({mailid:req.body.mailid},function(err,count){
      if(err)console.error(err);
      console.log(count);
      if(count>0)
      {
      	//return error and ask user to select different mail id
      	res.end('Ooops, this mail id exists! Go back and try again.');
      }
      else
      {
      //means this mail id is not in DB, let's create this user
      //Next, let's get the number of users already on our DataBase
	  var user_current_num;
	  Login_Model.count({},function(err,count){
       user_current_num=count;
       if(err)console.error(err);
       console.log(count);
       user_current_num++;

      console.log('Your user id is: '+user_current_num);
 
      var New_User = new Login_Model({
                       username: req.body.username,
                       password: req.body.password,
                         mailid: req.body.mailid,
                         userid: user_current_num 
                   });
      New_User.save(function(err, New_User) {
        if(err) return console.error(err);
        console.dir(New_User);
        //We saved this user successfully to DB, let's set session variables
        console.log('amma amma');
        req.session.username = req.body.username;
        req.session.userid = req.body.userid;
        console.log('set the session variables');
        console.log('here here '+req.session.username);
        res.redirect('/'); 
      });
      });
	  }
    });
});

app.post('/forgot',function(req,res)
{
	//check if this user+email exists, if yes, store new password in db
	//else report error
});

app.get('/logged_status',function(req,res)
{
	 if(req.session.username)
	 {
	 	console.log('came here buddy');  
	 	res.send(req.session);
	 }
	 else
	 {
	 	console.log('thanks, aaron');
	 	res.send('');
	 }
});

app.get('/add',function(req,res)
{
	res.sendfile('add_content.html');
});

var port=process.env.PORT || 5000;
server.listen(port);
console.log("Listening on "+port);
