import os, sys
os.makedirs('knowledge', exist_ok=True)
def save(name, content):
    with open(os.path.join('knowledge', name), 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')
    print('Saved', name)
