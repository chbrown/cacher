#!/usr/bin/env python
import redis
import justext
import requests

redis_client = redis.StrictRedis()
stopwords = justext.get_stoplist('English')

def fetch(url):
    cache_key = 'htmlcache:pages:%s' % url
    print 'Fetching', url
    try:
        if True or not redis_client.get(cache_key):
            html = requests.get(url).text
            text = u'\n'.join(p['text'] for p in justext.justext(html, stopwords) if p['class'] == 'good')
            redis_client.set(cache_key, text)
    except Exception, exc:
        redis_client.set(cache_key, 'Error: %s' % exc)
        raise

while True:
    try:
        queue_url = redis_client.blpop('htmlcache:queue', 3600)
        if queue_url:
            fetch(queue_url[-1])
    except Exception, exc:
        raise
