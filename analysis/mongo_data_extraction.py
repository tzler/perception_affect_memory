import json, pymongo, pandas
import numpy as np
import matplotlib.pyplot as plt 
import warnings; warnings.simplefilter('ignore')
  
auth_path = "/Users/biota/memory/sleep_affect_memory/experiment/.credentials/auth.json"
  
def connect_to_database(): 

    # load credentials to access the database, connect, identify collection
    data = json.load(open(auth_path))
    mongo_tunnel = 'mongodb://' + data['user'] + ':' + data['password'] + '@127.0.0.1'
    connection = pymongo.MongoClient(mongo_tunnel)
    data_base = connection['sleep_affect_memory']
    collection = data_base['replication']
    
    return collection
    
def identify_workers(collection):

    # the second is my worker id
    exclude = ['NONE', 'A33F2FVAMGJDGG']
    all_workers = [i for i in collection.distinct('worker_id') if i not in exclude]
    # extract workers who've completed entire experiment -- not returned HIT early
    complete = [] 
    for i_worker in all_workers: 
        tmp_data = collection.find({'worker_id':i_worker})
        if 'worker_feedback' in tmp_data[tmp_data.count()-1]['trial_data']: 
            complete.append(i_worker)
            
    return complete
    
def extract_data(): 
    
    # connect with mongo
    collection = connect_to_database() 
    # identify workers who completed experiment
    worker_ids = identify_workers(collection)
    # pret to remove worker identifiers 
    subject_ids = {worker_ids[i]:i for i in range(len(worker_ids))}
    # initialize data frame
    subject_trial_data = pandas.DataFrame()
    # iterate over workers 
    for i_worker in worker_ids: 

        # extract worker's data from mongo database
        i_data = collection.find({'worker_id':i_worker})
        # extract trial data
        for one_trial in i_data: 
            # only extract data we want 
            if 'worker_feedback' not in one_trial['trial_data'].keys(): 
                q = {i:one_trial['trial_data'][i] for i in list(one_trial['trial_data'].keys())}
                # use anonymized worker identifier
                q['subject'] = subject_ids[i_worker]
                subject_trial_data = subject_trial_data.append(q, ignore_index=True)
                
    return subject_trial_data
  
# extract and format data from database
data = extract_data()
  
# save for later analysis
data.to_csv('subject_data.csv')
