/// mongo details

var mongo_database_name = 'sleep_affect_memory'
var mongo_collection_name = 'replication'
var iteration_name = 'pilot_3' 
var supported_browsers = ['Chrome']
var context = 'acquisition'

//////////////////////////////// POPULATE HTML //////////////////////////////////////////

//document.getElementById("worker_input").value = ''

//////////////////////////////////////////// EXPERIMENT CLOCK ////////////////////////////////////////
function exit_protocol() {
  
  $(body).show() 
  console.log('total time of experiment, in minutes: ', trial_data['experiment_duration_seconds'] / 60)
  save_experiment_to_database(trial_data)
  // mturk save
  //document.getElementById("submit_all_data").value = JSON.stringify(trial_data)
  
}

function save_trial_to_database(trial_data, data_type){
	
  current_data = {
    
    // data from this trial
    trial_data:trial_data, 
    data_type: data_type, 
    // mongo markers
    dbname: mongo_database_name,
    colname: mongo_collection_name,
    iteration_name: iteration_name,
    context: context,

    // mturk info
    worker_id: GetWorkerId(),
    assignment_id: GetAssignmentId(),
    hit_id: turkGetParam( 'hitId', "NOPE" ),
    browser: get_browser_type(), 
  }
  
  // send data to server to write to database
  socket.emit('current_data', current_data);
  console.log(current_data)
}

function save_experiment_to_database(trial_data){
    
  current_data = {
      data_type: 'experimental_summary',  
      experimental_data: trial_data,
      percent_correct: trial_data['percent_correct'],
      bonus_earned: bonus_earned,  
      n_trials: i_trial,
      n_blocks: i_block, 
      hit_id: turkGetParam( 'hitId', "NOPE" ),
      data_type: 'experiment_summary',
      total_experiment_time: (new Date() - experiment_start_time)/1000,
	    // mongo markers
      dbname: mongo_database_name,
      colname: mongo_collection_name,
      iteration_name: iteration_name,

      // mturk info
      context: submission_type,
      worker_id: GetWorkerId(),
      assignment_id: GetAssignmentId(),
      hit_id: turkGetParam( 'hitId', "NOPE" ),
      browser: browser_type,
  	};
    
    // send data to server to write to database
    socket.emit('current_data', current_data);
    console.log('experiment saved to database')
    console.log(current_data)
}

///////////////////////////////////// NODE ////////////////////////

paper.install(window);
socket = io.connect();

////////////////////////////////////////////// MTURK //////////////////////////////////////////////
	
	// this actually doesn't work ... it's always going to mturk ... 
  // set submission type
  if (window.location.href.indexOf('sandbox')>0)
    {submission_type = 'sandbox'}
  else
    {submission_type = 'mturk'}
    // make a third option here
  
  // toggle submission url depending on submission_type
  if (submission_type === 'sandbox')
    { submission_url = 'https://workersandbox.mturk.com/mturk/externalSubmit'}
  else
    { submission_url = "https://www.mturk.com/mturk/externalSubmit"}
  // functions to extract mturk info to store
  function GetWorkerId()
    { workerId = turkGetParam( 'workerId', 'NONE' );
      return workerId;}
  function GetAssignmentId()
    { assignmentId = turkGetParam( 'assignmentId', 'NONE' );
      return assignmentId;}
  function turkGetParam( name, defaultValue )
    { var regexS = "[\?&]"+name+"=([^&#]*)";
      var regex = new RegExp( regexS );
      var tmpURL = window.location.href;
      results = regex.exec( tmpURL );
      if( results == null ) {
        return defaultValue;}
      else {
        return results[1];}}
  function get_HIT_id()
    {   var regexS = '(?<=tasks/).*?(?=assignment)';
        var regex = new RegExp( regexS )
        var tmpURL = window.location.href
        var results = regex.exec( tmpURL )
        if( results == null ) {
          return 'NONE';}
        else {
          tmp = results[0]
          return tmp.substring(0, tmp.length - 1);}}

  // set mturk details from the values we've extracted/will extract
  document.getElementById('hitForm').setAttribute('action', submission_url)
  $('#assignmentId').val(GetAssignmentId());


////////////////////////////////////////////// MANAGE ZOOM SETTINGS /////////////////////////////////////

function get_browser_type(){
  var N= navigator.appName, ua= navigator.userAgent, tem;
  var M= ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
  if(M && (tem= ua.match(/version\/([\.\d]+)/i))!= null) M[2]= tem[1];
  M= M? [M[1], M[2]]: [N, navigator.appVersion,'-?'];
  ////// includes version: ////////  return M.join(' '),
  return  M[0]
 };
