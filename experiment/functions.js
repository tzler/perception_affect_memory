/// mongo details
var mongo_database_name = 'sleep_affect_memory'
var mongo_collection_name = 'replication'
var iteration_name = 'pilot0_251' 

var supported_browsers = ['Chrome']

//////////////////////////////// POPULATE HTML //////////////////////////////////////////

//document.getElementById("worker_input").value = ''

//////////////////////////////////////////// EXPERIMENT CLOCK ////////////////////////////////////////

$('#submitButton').click(function(){
  
  current_data = {   	
    data_type: 'worker_feedback', 
    worker_input: document.getElementById("worker_input").value,   
    dbname: mongo_database_name,
    colname: mongo_collection_name,
    iteration_name: iteration_name,
		n_block: i_block, 
    n_trials: i_trial, 
    experiment_cluster_order: trial_data['experiment_cluster_order'],
    total_bonus_earned: bonus_earned, 
    n_trials_performance_cutoff: 100, 
    experiment_duration: current_experiment_duration/60, 
    final_accuracies: trial_data['assesment_window_accuracy'][i_trial-1], 
    worker_id: GetWorkerId(),
    assignment_id: GetAssignmentId(),
    hit_id: turkGetParam( 'hitId', "NOPE" ),
  } 
  console.log('worker feedback:', current_data)  
  socket.emit('current_data', current_data); 
})


function exit_protocol() {
  
  $('#submitButton').show()
  console.log('total time of experiment, in minutes: ', trial_data['experiment_duration_seconds'] / 60)
  save_experiment_to_database(trial_data)
  // mturk save
  document.getElementById("submit_all_data").value = JSON.stringify(trial_data)
  
}

function save_trial_to_database(trial_data){
	
  current_data = {
    
    // data from this trial
    trial_data:trial_data, 
    
    // mongo markers
    dbname: mongo_database_name,
    colname: mongo_collection_name,
    iteration_name: iteration_name,

    // mturk info
    context: 'piloting', // submission_type,
    worker_id: GetWorkerId(),
    assignment_id: GetAssignmentId(),
    hit_id: turkGetParam( 'hitId', "NOPE" ),
    browser: get_browser_type(), 
  
  }
  
  // send data to server to write to database
  //console.log('single trial data that is saved to database:')
  //socket.emit('current_data', current_data);
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
    //console.log('experiment saved to database')
    //console.log(current_data)
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
  //console.log('submission_url ', submission_url )//'assignment_id', GetAssignmentId()) 
  $('#assignmentId').val(GetAssignmentId());
  $('#workerId').val(GetWorkerId());


////////////////////////////////////////////// MANAGE ZOOM SETTINGS /////////////////////////////////////

function get_browser_type(){
  var N= navigator.appName, ua= navigator.userAgent, tem;
  var M= ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
  if(M && (tem= ua.match(/version\/([\.\d]+)/i))!= null) M[2]= tem[1];
  M= M? [M[1], M[2]]: [N, navigator.appVersion,'-?'];
  ////// includes version: ////////  return M.join(' '),
  return  M[0]
 };
