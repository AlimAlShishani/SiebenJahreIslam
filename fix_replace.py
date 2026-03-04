# -*- coding: utf-8 -*-
with open('src/pages/Quran.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove duplicate German text - we already have the translation
old = "} {isGroupOwner && 'Nutze „Gruppe verwalten“, um andere einzuladen.'}</p>"
new = "}</p>"
if old in content:
    content = content.replace(old, new)
    with open('src/pages/Quran.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Replaced successfully')
else:
    print('Old string not found')
    # Debug
    idx = content.find("quran.useManageGroup")
    if idx >= 0:
        snippet = content[idx:idx+120]
        print(snippet)
