---
title: "URL Rewrite problem with POST request"
template: "post"
permalink: "/2013/07/url-rewrite-problem-with-post-request.html"
uuid: "636113397133309582"
guid: "tag:blogger.com,1999:blog-8010146885187116176.post-636113397133309582"
date: "2013-07-31 18:15:00"
updated: "2013-08-01 00:07:37"
description:
blogger:
    siteid: "8010146885187116176"
    postid: "636113397133309582"
    comments: "0"
tags: [URL Rewrite, asp.net, Glimpse]
author:
    name: "Piotr Mionskowski"
    url: "https://plus.google.com/117451536189361867209?rel=author"
    image: "//lh3.googleusercontent.com/-6M7kaKrVJcU/AAAAAAAAAAI/AAAAAAAAAGE/QI7pFI1vNEA/s512-c/photo.jpg"
---
<h4>Greetings</h4>
<p>Hello Everyone! In this blog I would like to share my thoughts and findings on programming, software and a like. I will post here so that I can improve my writing skills and find stuff I was working on previously easier.</p>
<h2>URL Rewrite</h2>
<p>IIS users had waited a bit for Apache equivalent of <a href="http://httpd.apache.org/docs/current/mod/mod_rewrite.html" target="_blank">mod_rewrite</a>. Finally we've got a decent module from Microsoft -&nbsp;<a href="http://www.iis.net/downloads/microsoft/url-rewrite"
  target="_blank">Url Rewrite</a>. Among basic features as <a href="http://www.hanselman.com/blog/RedirectingASPNETLegacyURLsToExtensionlessWithTheIISRewriteModule.aspx" target="_blank">rewriting all URLs to extension-less equivalents</a>, <a href="http://www.iis.net/learn/extensions/url-rewrite-module/request-blocking-rule-template"
  target="_blank">blocking unwanted URLs</a>&nbsp;or even more common <a href="http://www.iis.net/learn/extensions/url-rewrite-module/user-friendly-url-rule-template" target="_blank">providing friendly URLs</a>&nbsp;the module provides a nice GUI inside
  IIS Manager so you can quickly test you ideas without referring to documentation. More importantly rewrite rules of your web site can be configured through Web.config configuration section.
  <br />
  <br />The feature I like the most is the ability to create a <a href="http://en.wikipedia.org/wiki/Reverse_proxy" target="_blank">reversed proxy</a>&nbsp;inside an IIS web site with a little help of another IIS module - <a href="http://www.iis.net/downloads/microsoft/application-request-routing"
  target="_blank">Application Request Routing</a>. I have used it couple of times, mostly to be able to make "cross domain" POSTs. One important thing is to remember to enable proxy in ARR settings inside IIS Manager. Following command line will do it
  for you:
  <br /><pre class="brush: bash">%windir%\system32\inetsrv\appcmd.exe set config -section:system.webServer/proxy /enabled:"True" /commit:apphost<br /></pre>
  <h2>Interfering with ASP.NET modules</h2>
</p>
<p>URL Rewrite is a native IIS module and from my understanding it deals with HTTP on a pretty low level. Most of custom IIS modules that I've used or built were written in managed code. This means that they use ASP.NET stack that provides some higher level
  API to deal with requests and responses. However some of those APIs have important side effects one can easily overlook. Why is that important? Because combining several modules into one request/response pipeline can cause hard to debug bugs.
  <br />I've came a cross the same problem twice - as it turned out - it was caused exactly by this interference. Specifically after some happy months of rewriting http POSTs using URL Rewrite suddenly features using it stopped working. In both cases the problem
  was caused by seemingly not intrusive call:
  <br /><pre class="brush: csharp">var request = HttpContext.Current.Request;<br />var parameter = request["formOrQueryOrServerVariableKey"];<br /></pre>As you may already know this code looks for a value inside&nbsp;<a class="CRefLink" href="http://www.blogger.com/blogger.g?blogID=8010146885187116176#"
  title="QueryString in HttpRequest">QueryString</a>, <a class="CRefLink" href="http://www.blogger.com/blogger.g?blogID=8010146885187116176#" title="Form in HttpRequest"><b>Form</b></a>, <a class="CRefLink" href="http://www.blogger.com/blogger.g?blogID=8010146885187116176#"
  title="Cookies in HttpRequest">Cookies</a>, or <a class="CRefLink" href="http://www.blogger.com/blogger.g?blogID=8010146885187116176#" title="ServerVariables in HttpRequest">ServerVariables</a> collection member specified in the <var>key</var> parameter.
  The important part is a Form which is an abstraction over html form that typically translates to http POST body. ASP.NET reads the body of a http request and decodes form url encoded values into NameValueCollection. This is done by reading input stream
  of the request which internally is buffered on disk. However since this actually is <b>a network stream it can only be read once</b>. This of course means that depending on the order of modules and at which stage of request pipeline one module decides
  to read it the other ones may not be able to access it. Exactly this scenario caused URL Rewrited POST request to <b>hang until timeout</b>.
  <br />
  <h4>Glimpse</h4>
  <p>One of the modules affected by this problem is part of a great tool called <a href="http://getglimpse.com/" target="_blank">Glimpse</a>. After an hour of looking through code base of this diagnostic tool I've found what I was looking for inside <a href="https://github.com/Glimpse/Glimpse/blob/62ed7717a31591d94aba982914a924ffc88d64d6/source/Glimpse.AspNet/RequestMetadata.cs"
    target="_blank">RequestMetadata </a>class. Specifically&nbsp;RequestIsAjax method that in turn is called by <a href="https://github.com/Glimpse/Glimpse/blob/62ed7717a31591d94aba982914a924ffc88d64d6/source/Glimpse.Core/Policy/AjaxPolicy.cs" target="_blank">AjaxPolicy</a>&nbsp;during
    <a href="http://msdn.microsoft.com/en-us/library/system.web.httpapplication.beginrequest.aspx" target="_blank">BeginRequest</a>event. I've created a <a href="https://github.com/Glimpse/Glimpse/pull/498" target="_blank">pull request</a> that hopefully
    will fix the issue.</p>
  <br />
</p>
<p>One thing that I definitely will remember from this investigation is to always be very careful while writing ASP.NET http module.</p>
