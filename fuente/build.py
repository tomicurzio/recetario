import json,re
d=json.load(open('../icons_min.json'))
src=open('src.html').read()
need=set(re.findall(r'ic\("([a-z0-9-]+)"',src))
need|=set(re.findall(r'optRow\("([a-z0-9-]+)"',src))
need|=set(re.findall(r'ibtn\("[A-Za-z]+","([a-z0-9-]+)"',src))
need|=set(re.findall(r'\?"([a-z0-9-]+)":"([a-z0-9-]+)"',src) and [x for t in re.findall(r'\?"([a-z0-9-]+)":"([a-z0-9-]+)"',src) for x in t])
need|={'star','star-fill','heart','heart-fill'}
missing=[n for n in need if n not in d]
print('missing',missing)
icons={k:d[k] for k in need if k in d}
draws=json.load(open('draws.json'))
src=src.replace('/*ICONS*/',json.dumps(icons)).replace('/*DRAWINGS*/',json.dumps(draws))
open('../public/index.html','w').write(src)
print(len(src))
