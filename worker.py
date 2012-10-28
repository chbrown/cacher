#!/usr/bin/env python
import re
import redis
import justext
import requests
import argparse

protocol_re = re.compile(r'^https?://')
nonword_re = re.compile(r'[^-_.a-zA-Z0-9]+')
redis_client = redis.StrictRedis()
stopwords = justext.get_stoplist('English')

parser = argparse.ArgumentParser(description='Download and parse pages.')
parser.add_argument('--directory', '-d', default='/usr/local/data/cacher')
opts = parser.parse_args()

def fetch(url):
    print 'Fetching: %s' % url
    if not redis_client.sismember('htmlcache:fetched', url):
        naked_url = protocol_re.sub('', url)
        long_filename = nonword_re.sub('-', naked_url)
        filename = long_filename[:255]
        html = requests.get(url).text
        text = u'\n'.join(p['text'] for p in justext.justext(html, stopwords) if p['class'] == 'good')
        with open('%s/%s' % (opts.directory, filename), 'w') as fp:
            fp.write(text.encode('utf8'))
        redis_client.sadd('htmlcache:fetched', url)
        percent = (100.0 * len(text)) / (len(html) + 1)
        print '  Size reduced: %d -> %d (%0.2f%%)' % (len(html), len(text), percent)
    else:
        print '  Already fetched'

print 'Beginning loop of %d entries in "htmlcache:queue".' % redis_client.llen('htmlcache:queue')
while True:
    try:
        queue_url = redis_client.blpop('htmlcache:queue', 3600)
        fetch(queue_url[-1])
    except TypeError:
        pass # timed-out
    except KeyboardInterrupt:
        raise
    except Exception, exc:
        print 'Error fetching url, %s: %s' % (queue_url, exc)
