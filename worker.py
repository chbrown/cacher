#!/usr/bin/env python
import re
import redis
import justext
import requests

protocol_re = re.compile(r'^https?://')
nonword_re = re.compile(r'[^-_.a-zA-Z0-9]+')
redis_client = redis.StrictRedis()
stopwords = justext.get_stoplist('English')

def fetch(url):
    try:
        if not redis_client.sismember('htmlcache:fetched', url):
            naked_url = protocol_re.sub('', url)
            long_filename = nonword_re.sub('-', naked_url)
            filename = long_filename[:255]
            html = requests.get(url).text
            text = u'\n'.join(p['text'] for p in justext.justext(html, stopwords) if p['class'] == 'good')
            with open('/usr/local/data/cacher/%s' % filename, 'w') as fp:
                fp.write(text.encode('utf8'))
            redis_client.sadd('htmlcache:fetched', url)
        else:
            print 'Already fetched:', url
    except Exception, exc:
        print 'Error fetching url', exc
        # redis_client.set(cache_key, 'Error: %s' % exc)

while True:
    try:
        queue_url = redis_client.blpop('htmlcache:queue', 3600)
        if queue_url:
            fetch(queue_url[-1])
    except Exception, exc:
        raise
