(function($) {

    /*!
   * spineless.js - A simple MVC stack without the need of a backbone.
   * https://github.com/heavysixer/spineless
   */
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
            return (that.app.helpers.hasOwnProperty(method)) ? that.app.helpers[method](locals) : that.app.helpers._default(locals);
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