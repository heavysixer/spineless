/**
Version 0.1.0

A simple MVC stack without the need of a backbone.
[https://github.com/heavysixer/spineless](https://github.com/heavysixer/spineless)

The goal of Spineless is to provide "just enough framework" to succeed. If we have done 
our job you should be able to write your first Spineless app in less than 10 minutes.

Spineless is meant to run with virtually no dependencies. In fact in an age of frameworks with 
massive dependency chains here is a list of things you DO NOT need to run spineless.

1. A persistance layer (e.g. database)
2. A backend server (e.g. node.js)
3. An internet connection! (srsly)

Spineless has only two dependencies, JQuery and Mustache.js, both whch come bundled
with the project inside the /lib directory.

Like any good MVC framework Spineless uses the concept of models, controllers and views.

- Spineless models are essentially Javascript objects and completely optional.
- Controllers are used to marshall commands from the views to the models where needed
- Views are the visual interface that the user sees.

In addition to the normal MVC stack, Spineless also uses the concept of helpers and templates.

- Templates are HTML snippets, which are used by views to get better use of reusable code.
- Helpers are functions that enhance a template's local variables with business logic. 

Going Spineless in less than 10 minutes
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

Helpers
-------------------------
*TODO*

Templates & Partials
-------------------------
*TODO*

Custom Controller Actions
-------------------------
*TODO*
```
    $(document).ready(function() {
        var sp = $.spineless({
          controllers : {
            application : {
              bing : function(elements, request){
                this.render(elements);
              }
            }
          }
        });
        sp.get('application', 'index');
    });
```

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

    var Spineless = function(options) {
        var that = this;
        var templates = function(method, locals) {
            return (that.app.helpers.hasOwnProperty(method)) ? that.app.helpers[method].apply(that.app,[locals]) : that.app.helpers._default(locals);
        };

        var parseRoute = function(str) {
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
        };

        var parseLocals = function(view) {
            var locals = $(view).attr('data-locals');
            if (locals !== undefined) {
                locals = $.parseJSON(locals);
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
            if (that.request.controller && that.request.view) {
                $('.view.active').removeClass('active');
                $('.controller.active').removeClass('active');
                that.request.view.addClass('active');
                that.request.controller.addClass("active");
                return that.request.view.find("*[data-template]");
            }
            return [];
        };

        var render = function(elements) {
            $.each(elements,
            function(i, e) {
                renderTemplate($(e));
            });
        };

        var route = function(element) {
            var url;
            url = element.attr('href') || $(element).attr('data-href');
            var route = parseRoute(url);
            get(route.controller, route.action, route.params);
        };

        var controllerActionAvailable = function() {
            return that.app.controllers.hasOwnProperty(that.request.controller) &&
            that.app.controllers[that.request.controller].hasOwnProperty(that.request.action);
        };

        var postRender = function() {
            $('body').attr('data-controller', that.request.params.controller);
            $('body').attr('data-action', that.request.params.action);
            $('body').addClass('rendered');
        };

        var get = function(controller, action, params) {
            that.request = new Request(controller, action, params);
            that.app.request = that.request;
            $('body').removeClass('rendered');
            $('html,body').animate({
                scrollTop: 0
            },
            1);

            var itemsToRender = prepareRender();
            if (controllerActionAvailable()) {
                that.app.controllers[that.request.controller][that.request.action].apply(that.app, [itemsToRender, that.request]);
            } else {
                render(itemsToRender);
            }

            postRender();
        };

        function init(options) {
            $(document).on('click', '.route',
            function(event) {
                event.preventDefault();
                route($(this));
            });
            $.extend(true, that.app, options);
        }

        this.app = new Application();
        this.app.get = get;
        this.app.render = render;

        init(options);
        return this.app;
    };
    $.spineless = function(options) {
        return new Spineless(options);
    };
})(jQuery);