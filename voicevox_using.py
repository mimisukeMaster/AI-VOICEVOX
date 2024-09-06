import requests
import json

url = 'http://127.0.0.1:50021/'
text = 'こんにちは'
speaker_id = 1
params = (
    ('text', text),
    ('speaker', speaker_id)
)

query = requests.post(url+'audio_query',params=params)

synthesis = requests.post(url+'synthesis',params=params, data= json.dumps(query.json()))
print(synthesis.content)