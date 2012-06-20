(function($) {

    /*!
   * spineless.js - A simple MVC stack without the need of a backbone.
   * https://github.com/heavysixer/spineless
   */
    var Application = function() {
        return {
            helpers: {
                _default: function(locals) {
                    return $.extend(true, {},
                    locals);
                }
            }
        };
    };

    var Spineless = function(options) {
        this.app = new Application();
        this.app.render = render;
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

        var renderView = function(controller, action, params) {
            var view,
            kontroller;
            kontroller = $(".controller[data-controller=" + controller + "]");
            view = $(".controller[data-controller=" + controller + "] .view[data-action=" + action + "]");
            $('.view.active').removeClass('active');
            $('.controller.active').removeClass('active');
            if ($(".container[data-controller=" + controller + "]") && $(".view[data-action=" + action + "]")) {
                $.each(view.find("*[data-template]"),
                function(i, e) {
                    renderTemplate($(e));
                });
                view.addClass('active');
                kontroller.addClass("active");
            }
        };

        var route = function(element) {
            var url;
            url = element.attr('href') || $(element).attr('data-href');
            var route = parseRoute(url);
            render(route.controller, route.action);
        };

        function render(controller, action, params) {
            $('body').removeClass('rendered');
            $('html,body').animate({
                scrollTop: 0
            },
            1);
            renderView(controller, action, params);
            $('body').attr('data-controller', controller);
            $('body').attr('data-action', action);
            $('body').addClass('rendered');
        }

        function init(options) {
            $(document).on('click', '.route',
            function(event) {
                event.preventDefault();
                route($(this));
            });
            $.extend(true, that.app, options);
        }
        init(options);
        return this.app;
    };
    $.spineless = function(options) {
        return new Spineless(options);
    };
})(jQuery);