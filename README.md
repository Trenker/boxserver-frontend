# Boxserver Frontend

This is a simple HTML that uses XMLHTTPRequest to offer a GUI for a [boxserver](https://github.com/trenker/boxserver).

## Installation

Clone the repository, build it with the environment variable `BASEURL` set to the URL of your boxserver and place the HTML file `index.html` into the document root of your webserver

You will need gulp and bower to build it

```bash
git clone https://github.com/trenker/boxserver-frontend.git
cd boxserver-frontend

bower install
npm install

BASEURL="http://domain.tld:8001" gulp release
mv build/index.html /var/www/html/index.html
```

The GUI itself should be self explanatory

## License

The MIT License (MIT)

Copyright (c) 2014 Georg Großberger

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
