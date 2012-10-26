## Scripts

`node cacher.js` listens for POST /app and POST /get HTTP requests at 127.0.0.1:8009

`python worker.py` works through the redis queue of urls to get from the web.

## Supervisord config:

    cp cacher.conf /etc/supervisor.d/

Or something like that.

## Redis keys:

    htmlcache:queue (LIST of urls)
    htmlcache:fetched (SET of urls)

## Files

Files go in:

    /usr/local/data/cacher

The file names are just the url, but `s/\W//g` (delete all non-word characters)

That directory should be made writeable by whatever user `worker.py` is running under,
and at least readable by the user `cacher.js` runs as.
