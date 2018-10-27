# /usr/bin/python
from boto.mturk.connection import MTurkConnection
from boto.mturk.question import ExternalQuestion
import boto.mturk.qualification as mtqu
from dateutil.parser import *
import numpy as np
import sys, os, datetime 

credential_location = '../credentials/'
task_name = 'sleep_affect_memory'
trial_bonus = .02
trial_penalty = .02

# send info about inputs if they're aren't enough
if len(sys.argv) < 3:

    sys.exit("""
    usage for either sandbox or live:\n
        $ python submit_experiment_to_mturk.py <n_hits> sandbox <amount> 
        $ python submit_experiment_to_mturk.py <n_hits> live <amount>\n""")

else: # make sure data are formated correctely, and we're in the right context

    # format user input
    n_hits = sys.argv[1]
    context = sys.argv[2]
    compensation_amount = sys.argv[3]
    
    if (context == 'live') or (context == 'sandbox'):

        print('\nCreate %s %s HITs  for %s each? (yes/no)\n'%(str(n_hits), str(context), str(compensation_amount)))
        try: user_response = raw_input()
        except: user_response = raw_input()
        if user_response[0].lower() != 'y':
            sys.exit('\ncareful :)\n')
    else:
        sys.exit("\ncontext needs to be either 'live' or 'sandbox'\n")

# set mturk dependencies
if context == 'sandbox':

    host = 'mechanicalturk.sandbox.amazonaws.com'
    base_url = 'https://workersandbox.mturk.com/mturk/preview?groupId='
    external_submit = 'https://workersandbox.mturk.com/mturk/externalSubmit'

elif context == 'live':

    print('okay... this one is for real!\n')
    host = 'mechanicalturk.amazonaws.com'
    base_url = 'https://www.mturk.com/mturk/preview?groupId='
    external_submit = "https://www.mturk.com/mturk/externalSubmit"

# load acces key information
# key_info = np.load('snail_rootkey_may6.npy').item() 
key_info = np.load(credential_location + 'snail_rootkey.npy').item() # for tyler's account
access_id = key_info['AWSAccessKeyId']
secret_key = key_info['AWSSecretKey']

hit_info = {} 

# mongo info 
hit_info['task'] = task_name
hit_info['database'] = 'sleep_affect_memory'
hit_info['collection'] = 'pilot'
hit_info['iteration_name'] = 'pilot0_251'
hit_info['time_of_submission'] = datetime.datetime.now().strftime("%H:%M_%m_%d_%Y")
hit_info['platform'] = context
# mturk description info 
hit_info['external_url'] = "https://rxdhawkins.me:8881/index.html"
# 167.99.111.118
#hit_info['external_url'] = "167.99.111.118:8881/%s/index.html"%(task_name)
hit_info['keywords'] = ['images', 'psychology', 'neuroscience', 'game', 'fun', 'experiment', 'research']
hit_info['title'] = 'learning with sounds!' 
hit_info['experiment_name'] = 'task_stream_SR'
hit_info['description'] = "Learning with sounds!"
# payment and bonus info
hit_info['payment_for_experiment'] = compensation_amount 
hit_info['trial_bonus'] = trial_bonus
hit_info['trial_penalty'] = trial_penalty
# mturk interface and worker details 
hit_info['max_assignments'] = n_hits
hit_info['frame_height'] = 600
hit_info['approval_rating_cutoff'] = 90
# experimental timing details -- time is in seconds, e.g: 60 * 60 = 1 hour
hit_info['lifetime_of_experiment'] = 5 * 60 * 60
hit_info['duration_of_experiment'] = 60 * 60 * 1 
hit_info['approval_delay'] = 1 * 60

def post_hits(hit_info):

  mtc = MTurkConnection(aws_access_key_id=access_id, aws_secret_access_key=secret_key, host=host)
  
  q = ExternalQuestion(external_url = hit_info['external_url'], frame_height=hit_info['frame_height'])

  qualifications = mtqu.Qualifications()
  qualifications.add(mtqu.PercentAssignmentsApprovedRequirement('GreaterThanOrEqualTo', hit_info['approval_rating_cutoff']))
  qualifications.add(mtqu.LocaleRequirement("EqualTo", "US"))

  the_HIT = mtc.create_hit(question=q,
                          lifetime = hit_info['lifetime_of_experiment'], 
                          max_assignments = hit_info['max_assignments'], 
                          title = hit_info['title'],
                          description = hit_info['description'],
                          keywords = hit_info['keywords'],
                          qualifications = qualifications,
                          reward = hit_info['payment_for_experiment'], 
                          duration = hit_info['duration_of_experiment'], 
                          approval_delay = hit_info['approval_delay'],  
                          annotation = hit_info['experiment_name'])

  assert(the_HIT.status == True)

  hit_info['hit_id'] = the_HIT[0].HITId
  hit_url = "{}{}".format(base_url, the_HIT[0].HITTypeId)
  hit_info['hit_url'] = hit_url
  
  
  record_name = 'submission_records_%s.npy'%(context)

  if record_name not in os.listdir(os.getcwd()):
      turk_info = {}
  else: 
      turk_info = np.load(record_name).item()

  key_name = 'submission_%d'%len(turk_info.keys())
  turk_info[key_name] = hit_info
  np.save(record_name, turk_info)

  print 'HIT_ID:', the_HIT[0].HITId,'key_name',key_name, "\nwhich you can see here:", hit_url
       
post_hits(hit_info)
