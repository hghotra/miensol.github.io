---
title: "Curl and a missing slash"
template: "post"
permalink: "/2014/02/curl-and-missing-slash.html"
uuid: "4878727859012127926"
guid: "tag:blogger.com,1999:blog-8010146885187116176.post-4878727859012127926"
date: "2014-02-24 21:55:00"
updated: "2014-02-24 21:55:11"
description:
blogger:
    siteid: "8010146885187116176"
    postid: "4878727859012127926"
    comments: "0"
tags: [http, node.js, https, proxy]
author:
    name: "Piotr Mionskowski"
    url: "https://plus.google.com/117451536189361867209?rel=author"
    image: "//lh3.googleusercontent.com/-6M7kaKrVJcU/AAAAAAAAAAI/AAAAAAAAAGE/QI7pFI1vNEA/s512-c/photo.jpg"
---
<div class="css-full-post-content js-full-post-content">
  While I was playing around with <a href="https://github.com/miensol/proxy-mirror" target="_blank">proxy-mirror</a> I noticed an interesting behaviour when testing the proxy with <a href="http://en.wikipedia.org/wiki/CURL" target="_blank">curl</a>. The
  following command:


```
curl http://wp.pl --proxy http://localhost:8888/
```
will result in following output when the proxy is Fiddler:

<pre style="font-size: 12px">[Fiddler] Response Header parsing failed.
Response Data:
&lt;plaintext&gt;
43 6F 6E 6E 65 63 74 69 6F 6E 3A 20 63 6C 6F 73 65 0D 0A 0D 0A 3C 48 54  Connection: close....&lt;HT
4D 4C 3E 3C 48 45 41 44 3E 3C 54 49 54 4C 45 3E 34 30 30 20 42 61 64 20  ML&gt;&lt;HEAD&gt;&lt;TITLE&gt;400 Bad
52 65 71 75 65 73 74 3C 2F 54 49 54 4C 45 3E 3C 2F 48 45 41 44 3E 0A 3C  Request&lt;/TITLE&gt;&lt;/HEAD&gt;.&lt;
42 4F 44 59 3E 3C 48 32 3E 34 30 30 20 42 61 64 20 52 65 71 75 65 73 74  BODY&gt;&lt;H2&gt;400 Bad Request
3C 2F 48 32 3E 0A 59 6F 75 72 20 72 65 71 75 65 73 74 20 68 61 73 20 62  &lt;/H2&gt;.Your request has b
61 64 20 73 79 6E 74 61 78 20 6F 72 20 69 73 20 69 6E 68 65 72 65 6E 74  ad syntax or is inherent
6C 79 20 69 6D 70 6F 73 73 69 62 6C 65 20 74 6F 20 73 61 74 69 73 66 79  ly impossible to satisfy
2E 0A 3C 48 52 3E 0A 3C 41 44 44 52 45 53 53 3E 3C 41 20 48 52 45 46 3D  ..&lt;HR&gt;.&lt;ADDRESS&gt;&lt;A HREF=
22 68 74 74 70 3A 2F 2F 77 77 77 2E 77 70 2E 70 6C 2F 22 3E 61 72 69 73  "http://www.wp.pl/"&gt;aris
3C 2F 41 3E 3C 2F 41 44 44 52 45 53 53 3E 0A 3C 2F 42 4F 44 59 3E 3C 2F  &lt;/A&gt;&lt;/ADDRESS&gt;.&lt;/BODY&gt;&lt;/
48 54 4D 4C 3E 0A                                                        HTML&gt;.
</pre>
while
  a simple implementation relaying on node.js core http module and http-proxy module outputs this:


```
An error has occurred: {"bytesParsed":0,"code":"HPE_INVALID_CONSTANT"}
```
Meanwhile without the proxy parameter the actual response is:


<pre>
HTTP/1.1 301 Moved Permanently
Server: aris
Location: http://www.wp.pl
Content-type: text/html
Content-Length: 0
Connection: close
</pre>
<h2>Curl forgiving behaviour</h2>As it turns out the actual outgoing HTTP request is different depending on the presence of <span style="font-family: Courier New;">–-proxy</span> parameter. Without it the target server receives and responds with:

<pre>
GET / HTTP/1.1
User-Agent: curl/7.26.0
Host: wp.pl
Accept: */*

HTTP/1.1 301 Moved Permanently
Server: aris
Location: http://www.wp.pl
Content-type: text/html
Content-Length: 0
Connection: close
</pre>
but
  when the proxy setting is present:
<pre>
GET http://wp.pl HTTP/1.1
User-Agent: curl/7.26.0
Host: wp.pl
Accept: */*
Proxy-Connection: Keep-Alive

UNKNOWN 400 Bad Request
Server: aris
Content-Type: text/html
Date: Sun, 23 Feb 2014 16:01:36 GMT
Last-Modified: Sun, 23 Feb 2014 16:01:36 GMT
Accept-Ranges: bytes
Connection: close

&lt;HTML&gt;&lt;HEAD&gt;&lt;TITLE&gt;400 Bad Request&lt;/TITLE&gt;&lt;/HEAD&gt;
&lt;BODY&gt;&lt;H2&gt;400 Bad Request&lt;/H2&gt;
Your request has bad syntax or is inherently impossible to satisfy.
&lt;HR&gt;
&lt;ADDRESS&gt;&lt;A HREF="http://www.wp.pl/"&gt;aris&lt;/A&gt;&lt;/ADDRESS&gt;
&lt;/BODY&gt;&lt;/HTML&gt;
</pre>
As
  you may have noticed the difference in requests (apart from additional header) is in first line – where in the first case curl assumed we want to <span style="font-family: Courier New;">GET /</span>. The former uses a relative URI while the later absolute.
  Now if we change the command line just a little bit so that the address looks like http://wp.pl/ the server will receive request with correct absolute URI and will respond with 301.


  <h2>UNKNOWN Status Line</h2>Careful readers may have already noticed the <a href="http://www.w3.org/Protocols/rfc2616/rfc2616-sec6.html#sec6.1" target="_blank">Status Line</a> of response returned by server is malformed. According to the spec it should have following form:

<pre>Status-Line = HTTP-Version SP Status-Code SP Reason-Phrase CRLF
</pre>
That's the reason why Fiddler warns users about protocol violation and the reason of error inside node.js proxy.


  <h2>A less intrusive proxy</h2>An example described above leads to other questions about behaviour of http proxy especially if we think about implementing HTTP debugging tool like <a href="https://github.com/miensol/proxy-mirror" target="_blank">proxy-mirror</a>. It’s only a guess
  but I suspect that there are other subtle differences between requests sent by client and those received by target server when the proxy is implemented using http-proxy module or core http module. I am aware of at least one such case where <a href="https://groups.google.com/forum/#!topic/nodejs/1aug0Jq8rYY"
  target="_blank">HTTP Headers are lowercased</a>. If I’m right a debugging tool relaying on them would make it really hard to spot certain problems – like protocol violations on both client and server side.

In my next blog post I’ll describe how to built even less intrusive proxy without building the http parser by hand.
</div>
