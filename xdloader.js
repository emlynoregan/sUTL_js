'use strict';

(function(root, factory) {
    
    if (typeof exports === 'object' && exports) {
        factory(exports); // CommonJS
    } else {
        var lib = {};
        factory(lib);
        if (typeof define === 'function' && define.amd)
            define(lib); // AMD
        else
            root[lib.name] = lib; // <script>
    }

}(this, function(lib) {
    
    lib.name = 'xdloader';
    lib.version = '0.0.0';
    
    lib.create = create;
    
    var remotes = {};
    var pending = {};
    
    var body = document.getElementsByTagName('body')[0];
    
    window.addEventListener('message', function(e) {
        var remote = remotes[e.origin];
        if (!remote)
            return;
        var response = JSON.parse(e.data);
        if (response.name === 'remoteready') {
            if (remote.deferred) {
                remote.source = e.source;
                remote.deferred.resolve(remote);
                remote.deferred = null;
            }
        } 
        else if (response.name == 'ajax.response') {
            var req = pending[response.id];
            pending[response.id] = null;
            if (req) {
                if (response.status == 200) {
                    
                    if (req.props.json)
                        response.data = JSON.parse(response.responseText);
                    
                    req.def.resolve(response);
                } 
                else {
                    req.def.reject(response);
                }
            }
        }
    }, false);
    
    function create(loaderurl) {
        var parser = document.createElement('a');
        parser.href = loaderurl;
        var origin = parser.protocol + '//' + parser.hostname;
        var path = parser.pathname;
        if (path[0] != '/')
            path = '/' + path;

        console.log("origin: " + origin)        
        console.log("path: " + path)   
             
        var remote = remotes[origin];
        if (remote)
            return remote;
        remote = new Remote(origin, path);
        remotes[origin] = remote;
        return remote.deferred.promise;
    }
    
    function Remote(origin, path, timeout) {
        
        if (!timeout)
            timeout = 10000;
        
        this.deferred = deferred();
        
        var element = document.createElement('iframe');
        element.src = origin + path;
        element.width = '1';
        element.height = '1';
        element.seamless = 'seamless';
        element.frameBorder = '0';
        element.scrolling = 'no';
        
        body.appendChild(element);
        
        var remote = this;
        setTimeout(function() {
            if (remote.deferred) {
                remote.deferred.reject('Could not create remote');
                remote.deferred = null;
            }
        }, timeout);
        
        this.get = function(path, json) {
            return this.ajax('GET', path, null, json)
        }

        this.post = function(path, data, json) {
            return this.ajax('POST', path, data, json)
        }

        this.ajax = function(method, path, data, json) {
            if (!this.source)
                return;
            
            var id = String(Math.random());
            if (pending[id]) return;
            
            var def = deferred();
            var props = {
                command: 'ajax',
                id: id,
                method: method,
                path: path,
                data: data,
                json: json !== false,
            }
            pending[id] = {
                def: def,
                props: props,
            };
            
            this.source.postMessage(JSON.stringify(props), origin);
            return def.promise;
        }
        
        this.destroy = function() {
            body.removeElement(remote.element);
            remotes[origin] = null;
        }
    }

//     var d = deferred();
//     d.promise.then(function(value){
//         console.log('success!', value);
//     }).catch(function(error){
//         console.log('failure', error);
//     })
//     d.reject(100);

    function deferred() {
        var dict = {};
        dict.promise = new Promise(function(resolve, reject){
            dict.resolve = resolve;
            dict.reject = reject;
        })
        return dict;
    }

}));
