(function($) {

    /*!
   * spineless.js - A simple MVC stack without the need of a backbone.
   * https://github.com/heavysixer/spineless
   */
    var Application = function() {
        return {
            controllers : {},
            helpers: {
                _default: function(locals) {
                    return $.extend(true, {},
                    locals);
                }
            }
        };
    };

    var Request = function(route){
      return $.extend(true, {
        action : undefined,
        controller : undefined,
        params : undefined
      }, route);
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

        var render = function() {
            var view,
            kontroller;
            kontroller = $(".controller[data-controller=" + that.request.controller + "]");
            view = $(".controller[data-controller=" + that.request.controller + "] .view[data-action=" + that.request.action + "]");
            $('.view.active').removeClass('active');
            $('.controller.active').removeClass('active');
            if ($(".container[data-controller=" + that.request.controller + "]") && $(".view[data-action=" + that.request.action + "]")) {
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
            get(route.controller,route.action,route.params);
        };

        var controllerActionAvailable = function(){
          return that.app.controllers.hasOwnProperty(that.request.controller) &&
          that.app.controllers[that.request.controller].hasOwnProperty(that.request.action);
        };

        function get(controller,action,params) {
            that.request = new Request({ controller : controller, action : action, params : params });
            $('body').removeClass('rendered');
            $('html,body').animate({
                scrollTop: 0
            },
            1);
            if(controllerActionAvailable()){
              that.app.controllers[that.request.controller][that.request.action].apply(that.app,[that.request]);
            }else{
              render();
            }
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