import sounddevice as sd

f = open('sound_device.txt', 'w', encoding='utf-8')
f.write(str(sd.query_devices()))
f.close()