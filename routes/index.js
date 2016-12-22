var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;

//HELLO
router.get('/hello', function(req, res){
  res.render('hello', { title: 'Hello World'});
});

//SESSION
var moment= require('moment');
router.get('/session', function(req, res){
  //HTTP request has a session object
  var sess= req.session;
  //create a javascript variable views
  if(sess.views){
    sess.views++;
  } else {
    //initialize the new variable to 1
    sess.views=1;
  }
  var d = moment().format('MMMM Do YYYY, h:mm:ss a');
  res.render('session', {
    title: 'Counting session',
    views: sess.views,
    dates: d
  });
});

//form
router.get('/formHandler', function(req, res){
  res.render('form');
});

router.post('/formHandler', function(req, res){
  /*
  //alternative
  console.log(req);
  res.render('form', {
    title: req.body.title,
    paragraph: req.body.paragraph
  });
  */

  console.log(req.body);
  res.render('form', req.body);
});


//db
var pg = require('pg');

router.get('/db', function(request, response){
  pg.connect(process.env.DATABASE_URL, function(err, client, done){
    client.query('SELECT * FROM test_table', function(err, result){
      done();
      if(err)
        { console.error(err); response.send("Error "+err); }
      else {
        { respone.render('pages/db', {results: result.rows}); }
      }
    });
  });
});
