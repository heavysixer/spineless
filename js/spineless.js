(function() {
  var Application, PubSub, Request, Router, Spineless;

  Application = (function() {

    function Application() {
      ({
        controllers: {},
        helpers: {
          _default: function(locals) {
            return $.extend(true, {}, locals);
          }
        }
      });
    }

    return Application;

  })();

  Request = (function() {

    function Request(controller, actions, params) {
      var p;
      p = params != null ? params : {};
      ({
        controller: $(".controller[data-controller=" + controller + "]"),
        view: $(".controller[data-controller=" + controller + "] .view[data-action=" + action + "]"),
        params: $.extend(true, p, {
          controller: controller,
          action: action
        })
      });
    }

    return Request;

  })();

  Router = (function() {

    function Router() {
      ({
        parseRoute: function(route) {
          var hsh, str;
          str = route + "";
          hsh = $.extend(true, {}, {
            controller: 'application',
            action: 'index'
          });
          while (str.charAt(0) === '/') {
            str = str.substr(1);
          }
          if (str.length > 0) {
            $.each(str.split('/'), function(i, e) {
              if (i === 0) {
                hsh.controller = e;
              }
              if (i === 1) {
                return hsh.action = e;
              }
            });
          }
          return hsh;
        },
        route: function(element) {
          var route, url;
          url = element.attr('href') || $(element).attr('data-href');
          route = this.parseRoute(url);
          return this.get(route.controller, route.action, route.params);
        }
      });
    }

    return Router;

  })();

  PubSub = (function() {

    function PubSub() {
      var o;
      o = $({});
      ({
        subscribe: function() {
          return o.on.apply(o, arguments);
        },
        unsubscribe: function() {
          return o.off.apply(o, arguments);
        },
        publish: function() {
          return o.trigger.apply(o, arguments);
        }
      });
    }

    return PubSub;

  })();

  Spineless = (function() {

    function Spineless(options) {
      var controllerActionAvailable, get, itemsToRender, parseLocals, postRender, prepareRender, render, root, templates;
      root = this;
      templates = function(method, locals) {
        if (root.app.helpers.hasOwnProperty(method)) {
          return root.app.helpers[method].apply(root.app, [locals]);
        } else {
          return root.app.helpers._default(locals);
        }
      };
      parseLocals = function(view) {
        var locals;
        locals = $(view).attr('data-locals');
        if (locals != null) {
          return $.parseJSON(locals);
        } else {
          return {};
        }
      };
      prepareRender = function() {
        if (root.request.controller && root.request.view) {
          $('.view.active').removeClass('active');
          $('.controller.active').removeClass('active');
          root.request.view.addClass('active');
          root.request.controller.addClass("active");
          return root.request.view.find("*[data-template]");
        }
        return [];
      };
      render = function(elements) {
        return $.each(element, function(i, e) {
          return renderTemplate($(e));
        });
      };
      controllerActionAvailable = function() {
        return root.app.controllers.hasOwnProperty(root.request.params.controller) && root.app.controllers[root.request.params.controller].hasOwnProperty(root.request.params.action);
      };
      postRender = function() {
        $('body').attr('data-controller', root.request.params.controller);
        $('body').attr('data-action', root.request.params.action);
        $('body').addClass('rendered');
        return root.app.publish("afterRender", root.app);
      };
      get = function(controller, action, params) {
        root.request = new Request(controller, action, params);
        root.app.request = root.request;
        $('body').removeClass('rendered');
        return $('html,body').animate({
          scrollTop: 0
        }, 1);
      };
      itemsToRender = prepareRender();
      if (controllerActionAvailable()) {
        root.app.controllers[root.request.params.controller][root.request.params.action].apply(root.app, [itemsToRender, root.request]);
      } else {
        render(itemsToRender);
      }
      postRender();
      init(options)(function() {
        $(document).on('click', '.route', function(event) {
          event.preventDefault();
          return root.app.route($(this));
        });
        return $.extend(true, root.app, options);
      });
      this.app = new Application;
      $.extend(true, this.app, new Router);
      $.extend(true, this.app, new PubSub);
      this.app.get = get;
      this.app.render = render;
      init(options);
      return this.app;
    }

    return Spineless;

  })();

  $.spineless = function(options) {
    return new Spineless(options);
  };

}).call(this);
