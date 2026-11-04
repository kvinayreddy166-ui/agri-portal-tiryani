import os, json

transcript_path = r'C:\Users\kvina\.gemini\antigravity\brain\ff3a2d22-8b6c-4d24-84bf-78fd6d8e574d\.system_generated\logs\transcript.jsonl'
print('Transcript exists:', os.path.exists(transcript_path))
if os.path.exists(transcript_path):
    with open(transcript_path, 'r', encoding='utf-8') as f:
        for line in f:
            data = json.loads(line)
            if data.get('type') == 'USER_INPUT':
                content = data.get('content', '')
                print('Found USER_INPUT, length:', len(content))
                if 'Approved uses of registered insecticides' in content:
                    print('Found "Approved uses of registered insecticides" in USER_INPUT!')
