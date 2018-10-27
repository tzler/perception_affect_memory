import numpy as np
from scipy.io.wavfile import write

# typical sampling rate
sps = 44100 
# stimulus duration
duration_s = 0.20
# to speed up iterations
each_sample  = np.arange(duration_s * sps)
# director to save
dir_name = 'sound'
# min and max frequency in range
min_freq, max_freq = 100, 1000
interval = 1

for i_freq_hz in np.arange(min_freq, max_freq+interval, interval):  

    # generate the wave form
    waveform = np.sin(2 * np.pi * each_sample * i_freq_hz / sps)
    # reduce the amplitude so it's quieter
    waveform_quiet = waveform * 0.5
    # convert to 16 bit
    waveform_16 = np.int16(waveform_quiet * 32767)
    # write the .wav file
    write('%s'%(int(i_freq_hz)), sps, waveform_16)

# a nice description of the logic: https://www.youtube.com/watch?v=lbV2SoeAggU
