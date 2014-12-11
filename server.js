var express=require('express');
var expressSession = require('express-session');
var cookieParser = require('cookie-parser'); // the session is stored in a cookie, so we use this to parse it
var app=express();

var mongo = require('mongodb');
var Server = mongo.Server;
var ObjectID = mongo.ObjectID;
var Db = mongo.Db;

/*
 We use one mongodb instance at port 27027.
 Note that we use this for two things
  1.) Saving sessions for Express
  2.) Saving actual data(about books) to db.
*/
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



/*
Points to note here:
 Do we have to use Mongoose?
 Mongoose is for data with a said structure; sure, our data about books has a fixed structure, but do we have to use mongoose?
 Let's use it for now.
*/
var mongoose = require('mongoose');
var dbm = mongoose.connection;
var mongoUri = process.env.MONGOHQ_URL||'mongodb://localhost:27017';
mongoose.connect(mongoUri);
dbm.on('error',console.error);


/*
 In our Database, we will use two models:
 1.) login model for user authentication 
 2.) book model for storing reviews about books
*/

var Login_Schema = new mongoose.Schema({
 username: String,
 password: String,
 mailid: String,
 userid: Number
 });
 var Login_Model = mongoose.model('Login_Model' , Login_Schema);

var Book_Schema = new mongoose.Schema({
 name: String,
 ISBN: String,
 title: String,
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
 
/*
 The following section has the GET and POST handlers for all the URL paths.
 Each get method for a path, will be followed by a post method for the same path.
 If a post does not follow, then the path has no post method.
*/


app.get('/',function(req,res)
{
 if (req.session.username) {
 	console.log('This user has logged in.');
  res.sendfile('home.html');
 }
 else
 {
 	 console.log('This user has not logged in.');
   res.sendfile('home.html');
 }
});

app.get('/login',function(req,res)
{
	res.sendfile('login.html');
});

app.post('/login',function(req,res)
{
  console.log('Username: ' + req.body.username);
  console.log('Password: ' + req.body.password);
  //Let's check if this password is right
  Login_Model.find({username:req.body.username},function(err,data)
  {
       if(err)console.error(err);
       console.log(data);
       if(data[0].password===req.body.password)
       {
         //correct password
         console.log('Correct password!');
         req.session.username = data[0].username;
         req.session.userid = data[0].userid;
         res.redirect('/');
       }
       else
       {
         //wrong password
         console.log('Wrong password!');
         var html='<h1>Sorry,wrong combo!</h1>'+'<a href="/login">Try again</a>'+'<a href="/forgot">Forgot password?</a>';
         res.end(html);
       }
  });
});

app.get('/signup',function(req,res)
{
	res.sendfile('signup.html');
});

app.post('/signup',function(req,res)
{
  //We will check if this user exists already(using Email Id as the unique attribute), then throw error
  //else store the new user details in db, and redirect user to /    
  Login_Model.count({mailid:req.body.mailid},function(err,count){
    if(err)console.error(err);
    console.log(count);
    if(count>0)
    {
      //This Email Id exists already: return error and ask user to select different mail id
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
       console.log('Number of users in database currently: ' + count);
       user_current_num++;
       console.log('Your user id is: ' + user_current_num);
       var New_User = new Login_Model({
                       username: req.body.username,
                       password: req.body.password,
                         mailid: req.body.mailid,
                         userid: user_current_num 
                   });
       New_User.save(function(err, New_User) {
        if(err) return console.error(err);
        console.dir(New_User);
        //We saved this user successfully to DB, let's set session variables for this user and redirect to home page
        console.log('Setting the session variables');
        req.session.username = req.body.username;
        req.session.userid = req.body.userid;
        res.redirect('/'); 
       });
     });
    }
  });
});


app.get('/forgot',function(req,res)
{
	res.sendfile('forgot_password.html');
});


app.post('/forgot',function(req,res)
{
	//check if this user+email exists, if yes, store new password in db
	//else report error
});

/*
The following API endpoint is used internally to check if the user is logged in or not. 
This API is called from the home.html
We display the home page differently if the user is logged in.
*/

app.get('/logged_status',function(req,res)
{
	 if(req.session.username)
	 {
	 	console.log('Logged in user');  
	 	res.send(req.session);
	 }
	 else
	 {
	 	console.log('Not logged in');
	 	res.send('');
	 }
});

app.get('/add',function(req,res)
{
	res.sendfile('add_content.html');
});

var port=process.env.PORT || 5000;
server.listen(port);
console.log("Listening on " + port);