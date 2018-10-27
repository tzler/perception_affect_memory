var _ = require('underscore');
var fs = require('fs');
var path = require('path');
//var converter = require("color-convert");
//var DeltaE = require('../node_modules/delta-e');
var mkdirp = require('mkdirp');
var sendPostRequest = require('request').post;

var serveFile = function(req, res) {
  var fileName = req.params[0];
  console.log('\t :: Express :: file requested: ' + fileName);
  return res.sendFile(fileName, {root: __base});
};

var handleDuplicate = function(req, res) {
  console.log("duplicate id: blocking request");
  return res.sendFile( __base + 'utils/duplicate.html');
//  return res.serve('utils/

};

var handleInvalidID = function(req, res) {
  console.log("invalid id: blocking request");
  return res.redirect('/utils/invalid.html');
};

var checkPreviousParticipant = function(workerId, callback) {
  var p = {'worker_id': workerId};
  var postData = {
    dbname: 'task_stream',
    query: p,
    projection: {'_id': 1}
  };
  
	sendPostRequest(
    
		'http://localhost:6000/db/exists',
    
		{json: postData},  (error, res, body) => {

      try {
          if (!error && res.statusCode === 200) {
            console.log("success! Received data " + JSON.stringify(body));
            callback(body);
          } else {
            throw `${error}`;
           }
      }
      catch (err) {
          console.log(err);
          console.log('no database; allowing participant to continue');
          return callback(false);
      }
    }
  );
};

// ugly but works--throws 'participation_count' into global workspace :( 
function get_previous_participation(worker_id, database_name, collection_names){

  // CONNECT TO DATABASE
  const mongo_creds = require('../auth.json');
  const mongo_url = `mongodb://${mongo_creds.user}:${mongo_creds.password}@localhost:27017/`;
  var mongo_client = require('mongodb').MongoClient;
  const assert = require('assert');

  // connect to the server
  mongo_client.connect(mongo_url, function(err, client) {
    // make sure we didn't throw an error
    assert.equal(null, err);
    // connect to database
    const db = client.db(database_name);
    // log success
    console.log("... linking up with mongo database to check for previous participation ");
    // extract documents into global workspace -- 'participant_count'
    count_participation(db, collection_names)
    client.close()
  });

  // GET PARTICIPATION COUNT
  function count_participation(db, collection_names) {
    // get collection
    participation_count = 0
    // iterate here ...
    collection_names.forEach(function(i_collection) {
      console.log('... searching through collection: ', i_collection)
      const collection = db.collection(i_collection);
      // search for worker id in previous hits
      results = collection.find({'worker_id': worker_id}).count(function(err, results) {
        if (err) {
          console.log('error!')
        } else {
        // returns results with
        participation_count = results + participation_count
        }
      });
    })
		setTimeout(function(){console.log( '...', worker_id, 'has completed', participation_count, 'trials in the collections above')}, 100)
  }
}

var fs = require("fs");
// load data files


set_size_location = 'support/'  
function determine_set_size(){

  // loads previous history of set sizes, determines current set size, updates history file

  // load possible and history of set sizes
  var data = JSON.parse(fs.readFileSync( set_size_location + 'numbers.txt'))
  // determine position within possible based on history
  index_possible = data['actual'].length % data['possible'].length
  // determine next experiment interval
  experiment_set_size = data['possible'][index_possible]
  // update history of set sizes
  data['actual'][data['actual'].length] = experiment_set_size
  // save updated histor
  console.log(data) 
  fs.writeFileSync( set_size_location + 'numbers.txt',  JSON.stringify(data));
  console.log('setting experimental set size to', experiment_set_size, 'classes')
  
    
  return experiment_set_size
}

function clear_history(){

  // load possible and history of set sizes
  var data = JSON.parse(fs.readFileSync('../support/numbers.txt'))
  console.log('previous history:', data['actual'])
  // update history of set sizes
  data['actual'] = []
  // save updated history
  fs.writeFileSync('../support/numbers.txt',  JSON.stringify(data));
  var updated_data = JSON.parse(fs.readFileSync('numbers.txt'))
  console.log('current history:', updated_data['actual'])
}


/// this is the coolest thing ever ... it'll only run once for each node instance 
/// it returns a function which overrides the previous one, 
checked_experiment = 0
var something = (function() {
    var executed = false;
    return function() {
        if (!executed) {
            executed = true;
            // do somethingi
            utils.determine_set_size();
        }
    };
})();



module.exports = {
  checkPreviousParticipant,
  serveFile,
  handleDuplicate,
  get_previous_participation, 
  determine_set_size, 
};
