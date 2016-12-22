var express = require('express');
var router = express.Router();
var passport = require('passport');
var pg = require('pg'); // var pg = require)'pg') for Local database users:
var bcrypt = require('bcryptjs');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('Cover');
});

router.get('/userpage', loggedIn, function(req, res){
    res.render('userpage', {username: req.user.username});
});

router.get('/login', function(req, res){
    res.render('login',{user: req.user});
});

router.post('/login',
  // depends on the fiels "isAdmin", redirect to the different path: admin or notAdmin
  passport.authenticate('local', { failureRedirect: '/vodsystem/login', failureFlash:true }),
  function(req, res,next) {
    // res.json(req.user);
    // res.redirect('/users/profile')
    // cheking for admin
    console.log(req.user);
    //added so it checks for admin the redirects acordingly.
    //could expand on this to include CP,AP and stuff like that.
    if(req.user.usertype == 'admin'){
      res.render('admin', {user: req.user, username: req.user.username});
    }
    else{
      res.render('userpage', {user: req.user, username: req.user.username});
    }
});

//////////////////////////////////////////////////////////


function loggedIn(req, res, next) {
  if (req.user) {
    next(); // req.user exisit so go to the next function (right after loggedIn)
  } else {
    res.redirect('login'); // user doesn't exisit redirect to localhost:3000/users/login
  }
}

///////////////////////////////////////////////////////////
router.get('/editUserInfo', function(req, res) {
   res.render('editUserInfo', {user: req.user}); 
});

function connectDB_editUserInfo(req, res, next) {
  return function(err, client, done) {
    if (err){ // connection failed
      console.log("Unable to connect to database");
      return next(err);
    }
    client.query('UPDATE userinfo set birthdate = $1, gender = $2, location = $3, bio = $4 where username=$5', [req.body.inputDate, req.body.inputGender, req.body.inputLocation, req.body.inputBio, req.user.username], function(err, result) {
      done(); // done all queries
      if (err) {
        console.log("unable to query UPDATE");
        return next(err); // throw error to error.hbs. only for test purpose
      }
      console.log("Password change is successful");
      res.render('userpage', {username: req.user.username , successinfoedit: "true" });
    });
    
  };
}
router.post('/editUserInfo', function(req, res,next){
  pg.connect(process.env.DATABASE_URL, connectDB_editUserInfo(req,res,next));

});

///////////////////////////////////////////////////////////

router.get('/userProfile', function(req, res){
  res.render('userprofile', {user: req.user});
});

///////////////////////////////////////////////////////////

router.get('/changePassword', function(req, res){
    res.render('changePassword',{user: req.user});
});

function connectDB_changePWD(req, res, next) {
  return function(err, client, done) {
    if (err){ // connection failed
      console.log("Unable to connect to database");
      return next(err);
    }
    //var currentPwd = encryptPWD(req.body.current);
    var pwd = encryptPWD(req.body.new1);
    //var pwd2= encryptPWD(req.body.new2);
    //if(currentPwd!=encryptPWD(req.user.password)){
      //console.log("Current password is not correct");
      //res.render('changePassword', {user: req.user, exist: "true"});
    //}
    if(req.body.new1!=req.body.new2){
      console.log("Passwords do not match");
      res.render('changePassword', {user: req.user, invalid: "true"});
    }
    else{
      client.query('UPDATE vodusers set password = $1 where username=$2', [pwd, req.user.username], function(err, result) {
        done(); // done all queries
        if (err) {
          console.log("unable to query INSERT");
          return next(err); // throw error to error.hbs. only for test purpose
        }
        console.log("Password change is successful");
        res.render('changePassword', {user: req.user , success: "true" });
      });
    }
  };
}
router.post('/changePassword', function(req, res,next){
  pg.connect(process.env.DATABASE_URL, connectDB_changePWD(req,res,next));

});

router.get('/SignUp', function(req, res){
    res.render('SignUp',{user: req.user});
});

///////////////////////////////////////////////////////////
/*
Upload videos code
*/
router.get('/upload', function(req, res) {
    res.render('upload', {user: req.user}); 
});



router.post('/upload', function(req, res, next) {
   var file = req.body.inputVideo;
});


///////////////////////////////////////////////////////////

router.get('/allVideos', function(req, res) {
  res.render('allVideos', {username: req.user.username})
});

router.get('/viewBombBurrito', function(req, res) {
  res.render('viewBombBurrito', {username: req.user.username})
});

///////////////////////////////////////////////////////////

function encryptPWD(password){
    var salt = bcrypt.genSaltSync(10);
    //console.log("hash passwords");
    return bcrypt.hashSync(password, salt);
}

router.get('/logout', function(req, res){
    req.logout();
    res.redirect('/vodsystem'); // Successful. redirect to localhost:3000/exam
});

///////////////////////////////////////////////////////////

function createUser(req, res, client, done, next){
  console.log("create account");
  var pwd = encryptPWD(req.body.inputPassword1);
  client.query('INSERT INTO vodusers (username, password, usertype) VALUES($1, $2, $3)', [req.body.inputName, pwd, "regular"], function(err, result) {
    done(); // done all queries
    if (err) {
      console.log("unable to query INSERT");
      return next(err); // throw error to error.hbs. only for test purpose
    }});
  client.query('INSERT INTO userinfo (username) VALUES($1)', [req.body.inputName], function(err, result) {
  done(); // done all queries
  if (err) {
    console.log("unable to query INSERT into userinfo");
    return next(err); // throw error to error.hbs. only for test purpose
  }});
  console.log("User creation is successful");
  res.render('SignUp', {success: "true"});
}

function runQuery(req, res, client, done, next) {
  return function(err, result){
    if (err) {
      console.log("unable to query SELECT ");
      next(err); // throw error to error.hbs. only for test purpose
    }
    else if (result.rows.length > 0) {
      console.log("user exists");
      res.render('signup', { exist: "true" });
    }
    else {
      console.log("no user with that name");
      createUser(req, res, client, done, next);
    }
  };
} // client.query

function connectDB(req, res, next) {
  return function(err, client, done) {
    if (err){ // connection failed
      console.log("Unable to connect to database");
      return next(err);
    }
    client.query('SELECT * FROM vodusers WHERE username= $1',[req.body.inputName], runQuery(req, res, client, done, next));
  };
}

router.post('/signup', function(req, res, next) {
    // Local database users:
    // pg.connect(process.env.DATABASE_URL, connectDB(req,res,next));
    pg.connect(process.env.DATABASE_URL, connectDB(req,res,next));
});

///////////////////////////////////////////////
//ADMIN STUFF

router.get('/admin',loggedIn,function(req, res){
  res.render('admin',{username: req.user.username });
});

function runQuery_userUpgradeRequest(req, res, client, done, next) {
  return function(err, result){
    if (err) {
      console.log("unable to query SELECT ");
      next(err); // throw error to error.hbs. only for test purpose
    }
    else {
      console.log(result);
      res.render('updateUsers', {rows: result.rows, user: req.user} );
    }
  };
} // client.query

//function to display user upgrade request
function connectDB_showUpgradeRequest(req,res,next){
  return function(err, client, done){
    if(err){
      console.log("Unable to connect to database");
    }
    client.query('SELECT * FROM usersUpgradeRequest', runQuery_userUpgradeRequest(req, res, client, done, next));
  };
}
router.get('/updateUsers',loggedIn,function(req, res, next){
  //connect to display the table.
  pg.connect(process.env.DATABASE_URL, connectDB_showUpgradeRequest(req, res, next));
});

//function to aprove user upgrades.
function connectDB_approveUpgrade(req, res, next) {
  return function(err, client, done) {
    if(err){
      console.log("unable to connect to database");
      return next(err);
    }
    client.query('UPDATE vodusers set usertype = $1 where username = $2', [req.body.inputType, req.body.inputName], function(err, result){
      done();
      if(err){
        console.log("unable to query UPDATE");
        return next(err);
      }
      else{
        console.log("User Upgrade complete");
        client.query('DELETE FROM usersUpgradeRequest WHERE username = $1', [req.body.inputName], function(err, result){
          done();
          if(err){
            console.log("unable to query DELETE");
            return next(err);
          }
          else{
            console.log("User Upgrade complete");
            res.render('updateUsers', {user: req.user, success: "true"});
          }
        });    
      }
    });
  };
}
//for submiting the change to a user updateUsers.hbs
router.post('/updateUsers', function(req, res, next){
  //connect DB and get upgrade request.
  pg.connect(process.env.DATABASE_URL, connectDB_approveUpgrade(req,res,next));
});
//end of updateUser admin stuff.

//for the user to submit thier request
function connectDB_submitRequest(req, res, next) {
  return function(err, client, done) {
    if(err){
      console.log("Unable to connec to database");
      return next(err);
    }
    //adds request to the database.
    client.query('INSERT INTO usersUpgradeRequest (username, type) VALUES($1,$2)', [req.user.username, req.body.inputType], function(err, result) {
      done();
      if(err) {
        console.log("unable to quert INSERT");
        return next(err);
      }
      console.log("request has been submited");
      //redisplays the user upgrade request page with a message saying the request was submited.
      res.render('submitUpgrade', {user: req.user, success: "true" });
    });
  };
}
router.get('/submitUpgrade',function(req, res, next) {
  res.render('submitUpgrade', {user: req.user});
});

router.post('/submitUpgrade',function(req, res, next) {
  pg.connect(process.env.DATABASE_URL, connectDB_submitRequest(req, res, next));
});
//end of user request stuff,

module.exports = router;
