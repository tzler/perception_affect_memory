# /usr/bin/python
from boto.mturk.connection import MTurkConnection
from boto.mturk.question import ExternalQuestion
import boto.mturk.qualification as mtqu
from dateutil.parser import *
import numpy as np
import sys, os, datetime, json 

credential_location = '../credentials/'
rootkey = 'auth.json'
directory_location = '..'
n_hours_to_complete_hit = 1
n_hours_to_accept_hit = 3

# send info about inputs if they're aren't enough
if len(sys.argv) < 3:

    sys.exit("""
    usage for either sandbox or live:\n
        $ python submit_experiment_to_mturk.py sandbox <n_hits_per_task> <amount> 
        $ python submit_experiment_to_mturk.py live <n_hits_per_task> <amount>\n""")

else: # make sure data are formated correctely, and we're in the right context

    # format user input
    context =  sys.argv[1]
    n_hits = int(sys.argv[2])
    compensation_amount = sys.argv[3]
    
    if (context == 'live') or (context == 'sandbox'):

        print('\nCreate %s %s HITs  for %s?'%(str(n_hits), str(context), str(compensation_amount)))
        print('\n(yes/no)')
        try: user_response = input()
        except: user_response = input()
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
# key_info = np.load(credential_location + lab_rootkey).item() # for tyler's account
with open(credential_location + rootkey) as f: 
    key_info = json.load(f)

access_id = key_info['access_id']
secret_key = key_info['secret_key']

print(access_id, secret_key)
def generate_hit_info(context, compensation_amount, i_hits_per_subsubmission): 
    
    hit_info = {} 
    # mongo info 
    hit_info['database'] = 'sleep_affect_memory'
    hit_info['collection'] = 'replication'
    hit_info['iteration_name'] = 'replication_pilot'
    hit_info['time_of_submission'] = datetime.datetime.now().strftime("%H:%M_%m_%d_%Y")
    hit_info['platform'] = context
    # mturk description info 
    hit_info['external_url'] = "https://rxdhawkins.me:8881/index.html"
    #hit_info['external_url'] = "167.99.111.118:8881/%s/index.html"%(task_name)
    hit_info['keywords'] = ['sounds', 'psychology', 'neuroscience', 'experiment', 'research']
    hit_info['title'] = 'Learning to respond to different sounds' 
    hit_info['description'] = "A simple experiment where you learn through trial and error; earn over $3 in less than 15 minutes"
    # payment and bonus info
    hit_info['payment_for_experiment'] = compensation_amount 
    # mturk interface and worker details 
    hit_info['max_assignments'] = i_hits_per_subsubmission
    hit_info['frame_height'] = 900
    hit_info['approval_rating_cutoff'] = 90
    # experimental timing details -- time is in seconds, e.g: 60 * 60 = 1 hour
    hit_info['lifetime_of_experiment'] = 60 * 60 * n_hours_to_accept_hit
    hit_info['duration_of_experiment'] = 60 * 60 * n_hours_to_complete_hit
    hit_info['approval_delay'] = 1 * 30
    hit_info['experiment_name'] = 'auditory_experiment'
    return hit_info 

def post_hits(hit_info, n_sub_hits):

    mtc = MTurkConnection(aws_access_key_id=access_id, aws_secret_access_key=secret_key, host=host)
    q = ExternalQuestion(external_url = hit_info['external_url'], frame_height=hit_info['frame_height'])
    qualifications = mtqu.Qualifications()
    qualifications.add(mtqu.PercentAssignmentsApprovedRequirement('GreaterThanOrEqualTo', hit_info['approval_rating_cutoff']))
    qualifications.add(mtqu.LocaleRequirement("EqualTo", "US"))
    
    print('url:', hit_info['external_url'], n_sub_hits)

    the_HIT = mtc.create_hit(question=q,
                          lifetime = hit_info['lifetime_of_experiment'], 
                          max_assignments = n_sub_hits, 
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


    record_name = 'HIT_submission_records_%s.npy'%(context)

    if record_name not in os.listdir(os.getcwd()):
      turk_info = {}
    else: 
      turk_info = np.load(record_name).item()

    key_name = 'submission_%d'%len(turk_info.keys())
    turk_info[key_name] = hit_info
    np.save(record_name, turk_info)

    print('HIT_ID:', the_HIT[0].HITId,'key_name',key_name, "\nwhich you can see here:", hit_url)
    

### make the magic happen
max_hits = 9
full_cycles = int(n_hits/max_hits)
partial_cycle = n_hits%max_hits
submissions = list(np.repeat(max_hits, full_cycles))
if partial_cycle: submissions.append(partial_cycle)
   
for n_hits_per_submission in submissions: 
        
    print('n_hits:', n_hits_per_submission)
        
    hit_info = generate_hit_info(context, compensation_amount, n_hits_per_submission)
    post_hits(hit_info, n_hits_per_submission)
