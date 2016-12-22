var express = require('express');
var router = express.Router();
var passport = require('passport');
var pg = require('pg'); // var pg = require)'pg') for Local database users:
var bcrypt = require('bcryptjs');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('examLogin', {error: req.flash('error')});
});

router.post('/',
  // depends on the fiels "isAdmin", redirect to the different path: admin or notAdmin
  passport.authenticate('local', { failureRedirect: '/exam', failureFlash:true }),
  function(req, res,next) {
    // res.json(req.user);
    // res.redirect('/users/profile')
    console.log(req.user);
    if (req.user.isadmin == 'admin'){
      res.redirect('/exam/admin');
    }
    else {
      res.redirect('/exam/notAdmin');
    }
});

router.get('/logout', function(req, res){
    req.logout();
    res.redirect('/exam'); // Successful. redirect to localhost:3000/exam
});


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
      client.query('UPDATE examUsers set password = $1 where username=$2', [pwd, req.user.username], function(err, result) {
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

function loggedIn(req, res, next) {
  if (req.user) {
    next(); // req.user exist so go to the next function (right after loggedIn)
  } else {
    res.redirect('/exam'); // user doesn't exisit
  }
}

///////////////////////////////////////////////////////////

function runQuery_notAdmin(req, res, client, done, next) {
  return function(err, result){
    if (err) {
      console.log("unable to query SELECT ");
      next(err); // throw error to error.hbs. only for test purpose
    }
    else {
      console.log(result);
      res.render('notAdmin', {rows: result.rows, user: req.user} );
    }
  };
} // client.query

function connectDB_notAdmin(req, res, next) {
  return function(err, client, done) {
    if (err){ // connection failed
      console.log("Unable to connect to database");
      return next(err);
    }
    client.query('SELECT * FROM assignment WHERE username=$1',[req.user.username], runQuery_notAdmin(req, res, client, done, next));
  };
}

router.get('/notAdmin',loggedIn,function(req, res, next){
      // connect DB and read table assignments
      pg.connect(process.env.DATABASE_URL, connectDB_notAdmin(req,res,next));


});

///////////////////////////////////////////////////////////

router.get('/admin',loggedIn,function(req, res){
      // connect DB and read table assignments
      res.render('admin', { user: req.user }); //
});


function connectDB_addAssignment(req, res, next) {
  return function(err, client, done) {
    if (err){ // connection failed
      console.log("Unable to connect to database");
      return next(err);
    }
    client.query('INSERT INTO assignment (username, description, due) VALUES($1, $2, $3)', [req.body.username, req.body.description,req.body.due], function(err, result) {
      done(); // done all queries
      if (err) {
        console.log("unable to query INSERT");
        return next(err); // throw error to error.hbs. only for test purpose
      }
      console.log("Assignment creation is successful");
      res.render('addAssignment', {user: req.user , success: "true" });
    });
  };
}

router.get('/addAssignment',function(req, res, next) {
  res.render('addAssignment', {user: req.user});
});

router.post('/addAssignment',function(req, res, next) {
  pg.connect(process.env.DATABASE_URL, connectDB_addAssignment(req,res,next));
});

///////////////////////////////////////////////////////////

router.get('/signup',function(req, res) {
    res.render('examSignup', { user: req.user }); // signup.hbs
});
router.get('/signupAdmin',function(req, res) {
    res.render('examSignupAdmin', { user: req.user }); // signup.hbs
});
// check if username has spaces, DB will whine about that
function validUsername(username) {
  var login = username.trim(); // remove spaces
  return login !== '' && login.search(/ /) < 0;
}
// check if username has spaces, DB will whine about that
function validUsernameAdmin(username1) {
  var login = username1.trim(); // remove spaces
  return login !== '' && login.search(/ /) < 0;
}
function encryptPWD(password){
    var salt = bcrypt.genSaltSync(10);
    //console.log("hash passwords");
    return bcrypt.hashSync(password, salt);
}

///////////////////////////////////////////////////////////
function createUser(req, res, client, done, next){
  console.log("create account");
  var pwd = encryptPWD(req.body.password);
//  var chosen;
  //if(req.body.typeUser.checked){
    //chosen=req.body.typeUser.value;
  //}
    client.query('INSERT INTO examusers (username, password,isadmin) VALUES($1, $2, $3)', [req.body.username, pwd, 'student'], function(err, result) {
      done(); // done all queries
      if (err) {
        console.log("unable to query INSERT");
        return next(err); // throw error to error.hbs. only for test purpose
      }
      else{
        console.log("User creation is successful");
        res.render('examSignup', { success: "true" });
      }
    });
}
function createUserAdmin(req, res, client, done, next){
  console.log("create account");
  var pwd = encryptPWD(req.body.password1);
//  var chosen;
  //if(req.body.typeUser.checked){
    //chosen=req.body.typeUser.value;
  //}
    client.query('INSERT INTO examusers (username, password,isadmin) VALUES($1, $2, $3)', [req.body.username1, pwd, 'admin'], function(err, result) {
      done(); // done all queries
      if (err) {
        console.log("unable to query INSERT");
        return next(err); // throw error to error.hbs. only for test purpose
      }
      else{
        console.log("User creation is successful");
        res.render('examSignupAdmin', { success: "true" });
      }
    });
}

function runQuery(req, res, client, done, next) {
  return function(err, result){
    if (err) {
      console.log("unable to query SELECT ");
      next(err); // throw error to error.hbs. only for test purpose
    }
    else if (result.rows.length > 0) {
      console.log("user exists");
      res.render('examSignup', { exist: "true" });
    }
    else {
      console.log("no user with that name");
      createUser(req, res, client, done, next);
    }
  };
} // client.query

function runQueryAdmin(req, res, client, done, next) {
  return function(err, result){
    if (err) {
      console.log("unable to query SELECT ");
      next(err); // throw error to error.hbs. only for test purpose
    }
    else if (result.rows.length > 0) {
      console.log("user exists");
      res.render('examSignupAdmin', { exist: "true" });
    }
    else {
      console.log("no user with that name");
      createUserAdmin(req, res, client, done, next);
    }
  };
} // client.query


function connectDB(req, res, next) {
  return function(err, client, done) {
    if (err){ // connection failed
      console.log("Unable to connect to database");
      return next(err);
    }
    client.query('SELECT * FROM examusers WHERE username=$1',[req.body.username], runQuery(req, res, client, done, next));
  };
}

router.post('/signup', function(req, res, next) {
    if (!validUsername(req.body.username)) {
      return res.render('examSignup', { invalid: "true" });
    }
    // Local database users:
    // pg.connect(process.env.DATABASE_URL, connectDB(req,res,next));
    pg.connect(process.env.DATABASE_URL, connectDB(req,res,next));
  });


  function connectDBAdmin(req, res, next) {
    return function(err, client, done) {
      if (err){ // connection failed
        console.log("Unable to connect to database");
        return next(err);
      }
      client.query('SELECT * FROM examusers WHERE username=$1',[req.body.username1], runQueryAdmin(req, res, client, done, next));
    };
  }

  router.post('/signupAdmin', function(req, res, next) {
      if (!validUsernameAdmin(req.body.username1)) {
        return res.render('examSignupAdmin', { invalid: "true" });
      }
      // Local database users:
      // pg.connect(process.env.DATABASE_URL, connectDB(req,res,next));
      pg.connect(process.env.DATABASE_URL, connectDBAdmin(req,res,next));
    });

module.exports = router;
