var express = require('express');
var router = express.Router();
var pg = require('pg');

/* GET home page */
router.get('/', function(req, response, next){
  //pg.connect : connection to database
  //First parameter: database url + ssl = true
  //second parameter: callback function (on connect event handler)
  //connect event handler takes three parameters: err, client, done
  //err object exisit when there are errors on connection
  //clinet object allows to issue SQL queries
  //call done function when you finish issuing queries to let db server knows
  //(it doesnt close the connection though)

  pg.connect(process.env.DATABASE_URL, function(err, client, done){
    client.query('SELECT * FROM book', function(err, result){
      done();
      if(err){
        //response.json(err); // query failed
        // next function is used when something is wrong
        next(err); //throw error to error.hbs only for test purpose
      } else {
        // response is HTTP response
        //json displays results object to string
        //result object have query result
        //rows is a list (from result object). rows[0] is the first row and so on
        //response.json(result.rows);
        response.render('books', result);
      }
    });//client query
    if(err){ //connection failed
      //response.json(err);
      next(err);
    }
  }); //pg.connect
}); //router.get
module.exports = router;
