## Disincluded Packages

# git+https://github.com/chbrown/remoting.git
# BeautifulSoup4
# lxml

Nginx config:

	server {
	  listen 80;
	  server_name test.blogginin1999.com;
	  index index.html;
	  location / {
	    root /www/blog-dropyll/_test;
	  }
	}

Redis:

    Redis keys:
    htmlcache:queue (LIST)
    htmlcache:pages:<url> (STRING)
