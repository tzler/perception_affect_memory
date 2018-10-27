//////
//////
////// TO DO: 
////// -o-  more robust participation check ... it's brittle at this point
//////
//////

global.__base = __dirname + '/';

var 
    use_https     = true,
    argv          = require('minimist')(process.argv.slice(2)),
    https         = require('https'),
    fs            = require('fs'),
    app           = require('express')(),
    _             = require('lodash'),
    parser        = require('xmldom').DOMParser,
    XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest,
    sendPostRequest = require('request').post;    

var port_location;

if(argv.port) {
  port_location= argv.port;
  console.log('using port ' + port_location);
} else {
  port_location = 8880;
  console.log('no port specified: using 8880\nUse the --port flag to change');
}

try {
  var privateKey  = fs.readFileSync('/etc/apache2/ssl/rxdhawkins.me.key'),
      certificate = fs.readFileSync('/etc/apache2/ssl/rxdhawkins.me.crt'),
      intermed    = fs.readFileSync('/etc/apache2/ssl/intermediate.crt'),
      options     = {key: privateKey, cert: certificate, ca: intermed},
      server      = require('https').createServer(options,app).listen(port_location),
      io          = require('socket.io')(server);
} catch (err) {
  console.log("cannot find SSL certificates; falling back to http");
  var server      = app.listen(port_location),
      io          = require('socket.io')(server);
}


var utils = require('./utils/sharedUtils.js');

/////////////////////////////////////////////// INITIAL PROTOCOL ///////////////////////////////////////////

app.get( '/*' , function( req, res ) {
  
  // extract from request to server (only returns worker_id for first ping) 
  var id = req.query.workerId;
  // specifics to this experiment
	var database_name ='task_stream';
  // dont exclude tylers 
  //var repeat_workers = [] 
  var repeat_workers = ['A33F2FVAMGJDGG']

  /// IF workers have accepted, this only returns true once, otherwise false (multiple documents, previewing)
  if (id != undefined){
		// set parameters for the particular experiment we're in
		if (req.originalUrl.indexOf('stimulus_response')>-1){
			utils.determine_set_size();
			collection_names = ['stimulus_response']
    } else {
			collection_names = ['match_to_sample']
		}
		
    // brings 'participation_count' into the global workspace
    utils.get_previous_participation(id, database_name, collection_names)   
    // override for sleep_affect_memory for the time being
    participation_count = 0
     
	  // check if subject has completed previous trials 
    //////////////// remove this timeout by ACTUALLY coding in javascript :) ///////////////////// 
    setTimeout(function() {
      if (participation_count) {
        // dont exclude anyone in 'repeat_workers' (e.g. tyler) 
        if ( repeat_workers.indexOf(id) > -1 ) {
          return utils.serveFile( req, res );
        // otherwise, redirect workers to "you can't do this experiment twice!" page
        } else {
          return utils.handleDuplicate( req, res); 
        }
      // but if they're new, just let them pass
      } else { 
        return utils.serveFile( req, res );  
      }
    }, 500)
  } else {
  // and let everyone see the instructions if worker_id is undefined -- before they've accepted the HIT
    return utils.serveFile(req, res); 
  }
})

io.on('connection', function (socket) {
  socket.on('current_data', function(data) {
      console.log('current_data received: ' + JSON.stringify(data));
      writeDataToMongo(data);
  });

  socket.on('stroke', function(data) {
      console.log('stroke data received: ' + JSON.stringify(data));
      var xmlDoc = new parser().parseFromString(data['svg']);
      var svgData = xmlDoc.documentElement.getAttribute('d');
      data['svg'] = svgData;
      writeDataToMongo(data);      
  })
});

var writeDataToMongo = function(data) {
      sendPostRequest(
        'http://localhost:4000/db/insert',
        { json: data },
        (error, res, body) => {
      if (!error && res.statusCode === 200) {
        console.log(`sent data to store`);
      } else {
        console.log(`error sending data to store: ${error} ${body}`);
      }
    }
  );
};
