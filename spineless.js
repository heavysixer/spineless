/**
Version 0.3.1

A simple MVC stack without the need of a backbone.
[https://github.com/heavysixer/spineless](https://github.com/heavysixer/spineless)

The goal of Spineless is to provide "just enough framework" to succeed. If we have done 
our job you should be able to write your first Spineless app in less than 10 minutes.

Spineless is meant to run with virtually no dependencies. In fact in an age of frameworks with 
massive dependency chains here is a list of things you DO NOT need to run spineless.

1. A persistance layer (e.g. database)
2. A backend server (e.g. node.js)
3. An internet connection! (srsly)

Spineless has only two dependencies, JQuery and Mustache.js, both which come bundled
with the project inside the /lib directory.

Like any good MVC framework Spineless uses the concept of models, controllers and views.

- Spineless models are essentially Javascript objects and completely optional.
- Controllers are used to marshall commands from the views to the models where needed
- Views are the visual interface that the user sees.

In addition to the normal MVC stack, Spineless also uses the concept of helpers and templates.

- Templates are HTML snippets, which are used by views to get better use of reusable code.
- Helpers are functions that enhance a template's local variables with business logic. 

Going Spineless in 10 minutes or less
---------------------------------------

The entire Spineless application resides inside the ".application" div. An application consists
of a collection of controllers which in turn contain a collection of views. 
Consider the following example:

```<div class="application">
      <div class="controller" data-controller='application'>
        <div class="view" data-action='index'>
          Hello World!
        </div>
      </div>
    </div>
```

In this example you'll see that we have defined an application with a single controller. The name
of the controller is defined by the `data-controller` attribute. This attribute is required by
Spineless to route requests to the proper location. Views are much like controllers, but instead
of using the `data-controller` attribute they use the `data-action`.

Routing Requests
----------------
Routing requests through Spineless is incredibly painless to make any link a spineless request
just add the "route" class. For example:

`<a class="route" href="/application/hello">Hello</a>`

When the user clicks on this link they will now be routed to the application controller where
the `#hello` method will be called. If you are not using an element that support the `href` attribute
you can also place your url inside a `data-href` attribute:

`<div class="route" data-href="/application/hello">Hello</div>`

If you want to manually trigger a route request from within Javascript you can call the `get` function:

`spineless.get('application', 'index');`

*/

/**
Helper functions
Helpers are developer-created functions that execute during the rendering of specific templates. Just like in Rails, helpers are available globally across all views. To demonstrate, imagine we have two DIV tags with locals supplied as urlencoded JSON object:

`&lt;div data-locals="{&quot;name&quot;:&quot;Mark&quot;}" data-template='hi-my-name-is'></div>
&lt;div data-locals="{&quot;name&quot;:&quot;Slim Shady&quot;}" data-template='hi-my-name-is'></div>
`

As you can see these objects have a property called “name”, each with unique values. These locals are linked to the “hi-my-name-is” template. To create a helper we’ll bind a function to execute whenever the “hi-my-name-is” template is rendered. Doing this will allows us intercept the template instance's data-locals object and modify it anyway we choose before passing it along to Mustache to render. Here is the full example of the helper function:

`
 var sp = $.spineless({
              helpers: {
                  'hi-my-name-is': function(obj) {
                      if (obj.name === 'Slim Shady') {
                          obj.name = "*wikka wikka* " + obj.name;
                      }
                      return (obj);
                  }
              }
          });
`
*/
 (function($) {
    var Application = function() {
        return {
            controllers: {},
            helpers: {
                _default: function(locals) {
                    return $.extend(true, {},
                    locals);
                }
            }
        };
    };

    var Request = function(controller, action, params) {
        var p = (typeof(params) === 'undefined') ? {}: params;
        return {
            controller: $(".controller[data-controller=" + controller + "]"),
            view: $(".controller[data-controller=" + controller + "] .view[data-action=" + action + "]"),
            params: $.extend(true, p, {
                controller: controller,
                action: action
            })
        };
    };

    // Router expects a `get` function to be defined by the object it is mixed into.
    var Router = function() {
        return {
            parseRoute: function(str) {
                var hsh = $.extend(true, {},
                {
                    controller: 'application',
                    action: 'index'
                });
                while (str.charAt(0) == '/') {
                    str = str.substr(1);
                }

                if (str.length > 0) {
                    $.each(str.split('/'),
                    function(i, e) {
                        if (i === 0) {
                            hsh.controller = e;
                        }
                        if (i === 1) {
                            hsh.action = e;
                        }
                    });
                }
                return hsh;
            },

            route: function(element) {
                var url;
                url = element.attr('href') || $(element).attr('data-href');
                var route = this.parseRoute(url);
                this.get(route.controller, route.action, route.params);
            }
        };
    };

    /**
PubSub for Spineless events
---------------------------

Spineless now has a very minimal publisher subscriber (PubSub) events framework. 
The goal of this is to allow other code executing outside of Spineless to receive 
updates when internal Spineless events execute, without having to know anything about
how Spineless is implemented. Here is a trivial example of creating an observer 
that is triggered every time a view is done rendering.

`
$(document).ready(function() {
          var sp = $.spineless();
          sp.subscribe('afterRender', function(publisher, app){
            app.request.view.append("<h1>Yes it has!</h1>")
          })
          sp.get('application', 'index');
      });
`

When the publisher executes a subscriber’s function it passes a reference to itself 
and the Spineless app instance as arguments. This allows the receiver to manage it’s 
subscriptions and gives the function access to the the Spineless current request, 
params hash among other things.

*/
    var PubSub = function() {
        var o = $({});
        return {
            subscribe: function() {
                o.on.apply(o, arguments);
            },

            unsubscribe: function() {
                o.off.apply(o, arguments);
            },

            publish: function() {
                o.trigger.apply(o, arguments);
            }
        };
    };

    var Spineless = function(options) {
        var root = this;
        var templates = function(method, locals) {
            return (root.app.helpers.hasOwnProperty(method)) ? root.app.helpers[method].apply(root.app, [locals]) : root.app.helpers._default(locals);
        };

        /**
Passing local variables to templates
------------------------------------

When rendering templates, Spineless substitutes predefined template variables with 
those you supply using JSON. The JSON can be provided in at least two ways:

1. By url encoded a json object into the “data-locals” attribute.
2. Creating of modifying the JSON object using a helper function.

I will explain the helper function method next, but here is a simple example of what the data-locals method looks like:

  <div data-locals="{&quot;name&quot;:&quot;Mark&quot;}" data-template='hi-my-name-is'></div>

*/
        var parseLocals = function(view) {
            var locals = $(view).attr('data-locals');
            if (locals !== undefined) {
                locals = $.parseJSON(locals);
            } else {
                locals = {};
            }
            return locals;
        };

        var renderTemplate = function(view) {
            var name,
            locals,
            template;
            name = $(view).attr('data-template');
            if (name !== undefined) {
                locals = parseLocals($(view));
                template = $('.templates *[data-template-name=' + name + ']').html();
                view.html($.mustache(template, templates(name, locals)));
            }
        };

        var prepareRender = function() {
            if (root.request.controller && root.request.view) {
                $('.view.active').removeClass('active');
                $('.controller.active').removeClass('active');
                root.request.view.addClass('active');
                root.request.controller.addClass("active");
                return root.request.view.find("*[data-template]");
            }
            return [];
        };

        var render = function(elements) {
            $.each(elements,
            function(i, e) {
                renderTemplate($(e));
            });
        };

        /**
Controller functions
---------------------

Controller functions are optional code that developers can write to augment the 
rendering of the view. Controller functions work much like helper functions do, 
in that they are executed before the view is returned to the screen. Unlike helper 
functions which are linked to an arbitrary number of templates; controller functions 
are scoped to just one controller action. Consider this example which executes when 
someone visits “/users/update”:

`
var sp = $.spineless({
  controllers : {
    users : {
      update : function(elements, request){
        if($.currentUser.isAdmin()){
           this.render(elements);
        } else {
            alert(“Access Denied”);
        }
      }
    }
  }
});
sp.get('application', 'index');
`
*/
        var controllerActionAvailable = function() {
            return root.app.controllers.hasOwnProperty(root.request.params.controller) &&
            root.app.controllers[root.request.params.controller].hasOwnProperty(root.request.params.action);
        };

        var postRender = function() {
            $('body').attr('data-controller', root.request.params.controller);
            $('body').attr('data-action', root.request.params.action);
            $('body').addClass('rendered');
            root.app.publish("afterRender", root.app);
        };

        var get = function(controller, action, params) {
            root.request = new Request(controller, action, params);
            root.app.request = root.request;
            $('body').removeClass('rendered');
            $('html,body').animate({
                scrollTop: 0
            },
            1);

            var itemsToRender = prepareRender();
            if (controllerActionAvailable()) {
                root.app.controllers[root.request.params.controller][root.request.params.action].apply(root.app, [itemsToRender, root.request]);
            } else {
                render(itemsToRender);
            }

            postRender();
        };

        function init(options) {
            $(document).on('click', '.route',
            function(event) {
                event.preventDefault();
                root.app.route($(this));
            });
            $.extend(true, root.app, options);
        }

        this.app = new Application();
        $.extend(true, this.app, new Router());
        $.extend(true, this.app, new PubSub());
        this.app.get = get;
        this.app.render = render;

        init(options);
        return this.app;
    };
    $.spineless = function(options) {
        return new Spineless(options);
    };
})(jQuery);