import os, json

transcript_path = r'C:\Users\kvina\.gemini\antigravity\brain\ff3a2d22-8b6c-4d24-84bf-78fd6d8e574d\.system_generated\logs\transcript.jsonl'
with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        if data.get('type') == 'USER_INPUT':
            print('keys:', data.keys())
            if 'media' in data:
                print('media:', data['media'])
