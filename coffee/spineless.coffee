class Application
  constructor:() ->
    { controllers : {}, helpers : {
      _default : (locals) ->
        $.extend(true, {}, locals)
    } }

class Request
  constructor:(controller, actions, params) ->
    p = if params? then params else {}
    { controller: $(".controller[data-controller=" + controller + "]"),
    view : $(".controller[data-controller=" + controller + "] .view[data-action=" + action + "]"),
    params : $.extend(true, p, {
      controller : controller,
      action : action
      })
    }

class Router
  constructor:() ->
    {
      parseRoute: (route) ->
        str = route + "";
        hsh = $.extend(true, {}, { controller : 'application', action : 'index'})
        while(str.charAt(0) == '/')
          str = str.substr(1)

        if(str.length >0)
          $.each(str.split('/'),
          (i,e) ->
            if i == 0
              hsh.controller = e
            if i == 1
              hsh.action = e
            )
        hsh

      route: (element) ->
        url = element.attr('href') || $(element).attr('data-href')
        route = this.parseRoute(url);
        this.get(route.controller, route.action, route.params)
    }

class PubSub
  constructor:() ->
    o = $({})
    {
      subscribe: ->
        o.on.apply(o, arguments)
      unsubscribe: ->
        o.off.apply(o, arguments)
      publish: ->
        o.trigger.apply(o, arguments)
    }

class Spineless
  constructor:(options) ->
    root = this

    templates = (method, locals) ->
      if root.app.helpers.hasOwnProperty(method)
        root.app.helpers[method].apply(root.app, [locals])
      else
        root.app.helpers._default(locals)

    parseLocals = (view) ->
      locals = $(view).attr('data-locals')
      if locals?
        $.parseJSON(locals)
      else
        {}

    prepareRender = () ->
      if root.request.controller and root.request.view
        $('.view.active').removeClass('active');
        $('.controller.active').removeClass('active');
        root.request.view.addClass('active');
        root.request.controller.addClass("active");
        return root.request.view.find("*[data-template]");
      []

    render = (elements) ->
      $.each(element, (i,e) ->
        renderTemplate($(e))
      )

    controllerActionAvailable = () ->
      root.app.controllers.hasOwnProperty(root.request.params.controller) and
      root.app.controllers[root.request.params.controller].hasOwnProperty(root.request.params.action);

    postRender = () ->
      $('body').attr('data-controller', root.request.params.controller);
      $('body').attr('data-action', root.request.params.action);
      $('body').addClass('rendered');
      root.app.publish("afterRender", root.app);

    get = (controller, action, params) ->
      root.request = new Request controller, action, params
      root.app.request = root.request
      $('body').removeClass('rendered');
      $('html,body').animate({ scrollTop: 0 },1);
    
    itemsToRender = prepareRender()
    if controllerActionAvailable()
      root.app.controllers[root.request.params.controller][root.request.params.action].apply(root.app, [itemsToRender, root.request]);
    else
      render(itemsToRender);
    postRender()
    
    init(options) ->
      $(document).on('click', '.route',(event) ->
          event.preventDefault();
          root.app.route($(this));
      );
      $.extend(true, root.app, options);

    this.app = new Application
    $.extend(true, this.app, new Router);
    $.extend(true, this.app, new PubSub);
    this.app.get = get;
    this.app.render = render;

    init(options);
    return this.app;

$.spineless = (options) ->
  new Spineless(options)    