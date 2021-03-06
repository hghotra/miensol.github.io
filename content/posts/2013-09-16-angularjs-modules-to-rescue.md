---
title: "AngularJs modules to the rescue"
template: "post"
permalink: "/2013/09/angularjs-modules-to-rescue.html"
uuid: "668976193078579036"
guid: "tag:blogger.com,1999:blog-8010146885187116176.post-668976193078579036"
date: "2013-09-16 17:44:00"
updated: "2013-09-16 17:44:00"
description:
blogger:
    siteid: "8010146885187116176"
    postid: "668976193078579036"
    comments: "0"
tags: [javascript, angularjs]
author:
    name: "Piotr Mionskowski"
    url: "https://plus.google.com/117451536189361867209?rel=author"
    image: "//lh3.googleusercontent.com/-6M7kaKrVJcU/AAAAAAAAAAI/AAAAAAAAAGE/QI7pFI1vNEA/s512-c/photo.jpg"
---
<div class="css-full-post-content js-full-post-content">
  Building large scale JavaScript application is a tough problem. The language nature is malleable and it does not have proper modules mechanism built in. Some argue that <a href="http://lostechies.com/derickbailey/2012/06/04/anders-hejlsberg-is-right-you-cannot-maintain-large-programs-in-javascript/"
  target="_blank">you can’t really built and maintain</a> big applications built with JavaScript.&nbsp; Others say that the key in succeeding is to <a href="http://addyosmani.com/largescalejavascript/" target="_blank">never built big applications</a> but
  to approach things in a more clever way – by applying <a href="http://en.wikipedia.org/wiki/Divide_and_conquer_algorithm" target="_blank">divide and conquer</a> rule.


  <h2>Dividing code base</h2>Due to lack of modules mechanism in <a href="http://en.wikipedia.org/wiki/ECMAScript" target="_blank">ECMAScript</a> 5th edition, which is the version most commonly available in browsers, there were couple of implementations created. <a href="http://requirejs.org/"
  target="_blank">RequireJs</a> and <a href="https://github.com/amdjs/amdjs-api/wiki/AMD" target="_blank">AMD</a> are just 2 most popular ones. Angular team decided to provide it’s own implementation of modules and left the asynchronous loading of them to
  existing tools. I suspect that it was because they didn’t want to create a dependency on 3rd party library and because of their use of dependency injection. The framework relies on modules heavily making it possible to use just the parts that you actually
  need saving precious network and loading time. Here is how to define a module:


```
var myApp = angular.module('myApp', ['ngResource']);

myApp.factory('itemsStorage', function ($resource) {
  var itemsStorage = ...;
  // items storage implementation
  return itemsStorage;
});
```
We’ve
  declared a new module called <em>myApp </em>and stated that it depends on another module called <em>ngResource</em>. In line 3 we are declaring a factory for <em>itemsStorage</em> that requires <em>$resource</em> service. Angular will automatically resolve <em>$resource</em> service
  and inject it as a value of parameter. As you may suspect under the hood the dependency injection mechanism inspects parameter names of our function and thus it is able to know how to satisfy them with proper values. Be careful when using JavaScript
  minimizing tools because most of them will by default shorten parameter names and that will break the DI. The only work around for it is to disable an option responsible for parameters in minimizer. Most of the times I find it useful to split one module
  definition across couple of files. It is a supported scenario but there are some quirks to it.


```
var myApp = angular.module('myApp');

myApp.directive('timeAgo', function(){
  return function($scope, $element, $attrs){
    // timeAgo directive link implmentation
  };
});
```
The
  first line says that we would like to retrieve <em>myApp</em> module so that we can extend or use it. This API may be confusing, it was for me, as it may look like we’re actually declaring a module that has no dependencies. The distinction between extending
  and declaring a module has an important ramification. You’re now responsible of loading file with module declaration before files that extend module functionality. In order to declare module with no dependencies you have to pass an empty array as a
  second argument:


```
var secondModule = angular.module('secondModule', []);
```

  <h2>A praise of dependency injection</h2>
  <p>Dependency injection is a very useful concept especially in statically typed languages as C# or Java. It really helps you decouple your code as your classes no longer require to know about the implementation details of their dependencies. There are
    several ways to implement this pattern however must commonly used is a constructor injection. A lot of IoC containers exists both in .NET and Java world: Castle.Windsor, StructureMap, Guice or Ninject are just a few. However I have never seen a viable
    implementation of DI in JavaScript until AngularJs.</p>
  <p>At first it seemed like a magic, so much that I actually had to dig into the framework code base to see how it’s done. As it turned out the idea behind the implementation is really simple. I did however encounter problems while trying to figure out
    why a particular service cannot be resolved or a directive isn’t working. Usually it was because of typos in parameter names or a missing dependency in module declaration. I know that the Angular team has put effort to make it easier to figure out
    those kind of problems in a recent release.</p>
  <p>I’ve heard opinions that in a dynamic language as JavaScript the DI provides little to know gain instead adding an accidental complexity. I do agree that it is possible to live without however it requires much more discipline to keep a code clean. Whenever
    you create a service (a piece of code) that will be used in several places you have to make sure not to leak implementation details to clients (the ones that use the service). Without DI it means you have to make it easy to create a service by hand,
    typically by providing a factory method or a parameter less constructor. If you won’t take care of it upfront it will be harder to refactor the service implementation later on because of the number of clients that create it. When using DI at least
    this one task is forced upon you upfront.</p>
  <p>Now what makes an actual implementation of DI practical is its ease of use. If you remember a time when most of C# and Java IoC containers required declaring actual object graph in an XML files you’ll understand what I mean. I think Angular team made
    using dependency injection feel easy and very natural and that’s what makes it so useful.</p>
  <h2>Dependency resolution and conflicts</h2>There is an important limitation in Angular modules implementation around conflict resolution. Basically the framework uses last wins approach so you really have to be careful while naming things. It may seem not important at first but let’s consider
  following code sample.


```
var A = angular.module('A', []);

A.factory('serviceA', function(){
 return function(){
  console.log('using serviceA defined in module A');
 };
});

var B = angular.module('B', ['A']);

B.factory('serviceB', function(serviceA){
 return function(){
  console.group('using serviceB defined in module A');
  serviceA();
  console.groupEnd();
 };
});

var C = angular.module('C', ['A']);

C.factory('serviceA', function(){
 return function(){
  console.log('using serviceA defined in module C');
 };
});

C.factory('serviceC', function(serviceA){
 return function(){
  console.group('using serviceC defined in module C');
  serviceA();
  console.groupEnd();
 };
});
```

  <p>As you can see we have 3 modules here <em>A, B </em>and<em> C</em>. But in line <em>21</em> inside <em>C</em> module definition we’re declaring <em>serviceA</em>. Since module <em>C</em> depends on <em>A</em> that already defined <em>serviceA</em> we’re actually
    overriding the implementation. It’s quite useful to be able to override and stuff our custom implementation of particular service provided by other module. Except that we have no control over the scope of our modification. In the above example the <em>serviceA</em> defined
    in module <em>C</em> will be the one used everywhere at runtime. Even though module <em>B</em> knows nothing bout <em>C.</em> Calling declared services like this:
```
serviceA();
serviceB();
serviceC();
```
Will
    produce following output:
    <div>
      <a href="http://lh3.ggpht.com/-1Kk4GFZY1Ac/UjdAULJnNPI/AAAAAAAAA-0/Ysrp9fPRtO4/s1600-h/image%25255B13%25255D.png">
        <img alt="image" border="0" height="140" src="http://lh4.ggpht.com/-jfB6FQ9O_RI/UjdAUlHuWHI/AAAAAAAAA-8/w1-wyY2sB70/image_thumb%25255B5%25255D.png?imgmax=800" style="background-image: none; border-bottom: 0px; border-left: 0px; border-right: 0px; border-top: 0px; display: inline; padding-left: 0px; padding-right: 0px; padding-top: 0px;"
        title="image" width="379" />
      </a>
    </div>You can play around with this <a href="http://jsfiddle.net/miensol/z5TVc/" target="_blank">sample on jsfiddle</a>.</p>
  <p>What can we do about it? The only advice I’ve seen is to use prefix on <em>service</em> names. Now this is a working and simple approach however the code will not look great. I wonder how hard it would be to modify angular injector part to gain the ability
    to gain more control over overriding things…</p>
</div>
