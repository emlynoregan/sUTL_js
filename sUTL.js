'use strict';

(function(root, factory) {
    
    if (typeof exports === 'object' && exports) {
        factory(exports); // CommonJS
    } else {
        var sUTL = {};
        factory(sUTL);
        if (typeof define === 'function' && define.amd)
            define(sUTL); // AMD
        else
            root.sUTL = sUTL; // <script>
    }

}(this, function(sUTL) {
    
    //exports
    sUTL.name = 'sUTL.js';
    sUTL.version = '0.0.0';
    sUTL.transform = transform;

    function get(scope, key, adefault)
    {
        if (key in scope)
            return scope[key]
        else
            return adefault
    }

    function builtins()
    {
        return {
            "path": function(parentscope, scope, source, tt)
            {
                var fullpath = scope["path"]
                var unwrap = scope["unwrap"]

                var prefix = fullpath.slice(0, 1)
                var path = fullpath.slice(1)
                var childscope = null;

                if (prefix == '@')
                {
                    childscope = parentscope
                }
                if (prefix == '^')
                {
                    childscope = scope
                }
                else if (prefix == '$')
                {
                    childscope = source
                }
                else if (prefix == '~')
                {
                    childscope = tt
                }

                var retval = jsonPath(childscope, "$" + path)

                if (unwrap)
                {
                    if (retval.length > 0)
                        retval = retval[0]
                    else
                        retval = null
                }

                return retval
            },
//             "cons": function(parentscope, scope, source, tt)
//             {
//                 var head = scope["head"]
//                 var tail = scope["tail"]

//                 var retval = [head]

//                 if (tail)
//                     retval = retval.concat(tail)

//                 return retval
//             },
//             "last": function(parentscope, scope, source, tt)
//             {
//                 var lin = scope["in"]

//                 var retval = lin[lin.length-1]

//                 return retval
//             },
            "+": function(parentscope, scope, source, tt)
            {
                return get(scope, "a", 0) + get(scope, "b", 0)
            },
            "-": function(parentscope, scope, source, tt)
            {
                return get(scope, "a", 0) - get(scope, "b", 0)
            },
            "*": function(parentscope, scope, source, tt)
            {
                return get(scope, "a", 1) * get(scope, "b", 1)
            },
            "/": function(parentscope, scope, source, tt)
            {
                return get(scope, "a", 1) / get(scope, "b", 1)
            },
            "==": function(parentscope, scope, source, tt)
            {
                return get(scope, "a", 0) == get(scope, "b", 0)
            },
            ">=": function(parentscope, scope, source, tt)
            {
                return get(scope, "a", 0) >= get(scope, "b", 0)
            },
            "<=": function(parentscope, scope, source, tt)
            {
                return get(scope, "a", 0) <= get(scope, "b", 0)
            },
            ">": function(parentscope, scope, source, tt)
            {
                return get(scope, "a", 0) > get(scope, "b", 0)
            },
            "<": function(parentscope, scope, source, tt)
            {
                return get(scope, "a", 0) < get(scope, "b", 0)
            },
            "if": function(parentscope, scope, source, tt)
            {
                var retval = null;
                var condvalue = false;

                if ("cond" in scope)
                    condvalue = Evaluate(parentscope, scope["cond"], source, tt)
                    if (isArray(condvalue) && condvalue.length == 0)
                        condvalue = false

                if (condvalue)
                {
                    if ("true" in scope)
                        retval = Evaluate(parentscope, scope["true"], source, tt)
                }
                else
                {
                    if ("false" in scope)
                        retval = Evaluate(parentscope, scope["false"], source, tt)
                }

                return retval
            }
        }
    }

    function transform(source, t) 
    {
        return Evaluate(source, t, source, t)
    }

    function Evaluate(scope, t, source, tt)
    {
        var retval = null;
        
        if (isBuiltinEval(t)) 
        {
            var builtinf = builtins()[t["&"]]
            if (!builtinf)
            {
                throw {"message": "builtin '" + t["&"] + "' not found"}
            }
            else
            {
                var transformedt = {}
                for (key in t)
                {
                    if (key != "&")
                    {
                        transformedt[key] = Evaluate(scope, t[key], source, tt)
                    }
                }

                retval = builtinf(scope, transformedt, source, tt)
            }
        }
        else if (isSimpleEval(t))
        {
            var transform = Evaluate(scope, t["!"], source, tt)

            var transformscope = {}
            for (key in t)
            {
                if (key != "!")
                {
                    transformscope[key] = Evaluate(scope, t[key], source, tt)
                }
            }

            retval = Evaluate(transformscope, transform, source, tt)
        }
        else if (isQuoteEval(t))
        {
            retval = t["'"]
        }
        else if (isObject(t)) 
        {
            retval = {}
            for (var key in t)
            {
                retval[key] = Evaluate(scope, t[key], source, tt)
            }
        }
        else if (isArray(t)) 
        {
            retval = []
            var unwrap = false
            for (var ix in t)
            {
                if (ix == 0 && t[ix] == "&&")
                {
                    unwrap = true
                    continue;
                }
                var itemresult = Evaluate(scope, t[ix], source, tt)
                if (unwrap && isArray(itemresult))
                    retval = retval.concat(itemresult)
                else 
                    retval.push(itemresult)
            }
        } 
        else if (isPath(t)) 
        {
            retval = Evaluate(scope, {"&": "path", "unwrap": false, "path": t.slice(2)}, source, tt)
        } 
        else if (isUnwrapPath(t)) 
        {
            retval = Evaluate(scope, {"&": "path", "unwrap": true, "path": t.slice(1)}, source, tt)
        } 
        else 
        {
            retval = t;
        }
        
        return retval;
    }
    
    function isBuiltinEval(obj) {
        return isObject(obj) && "&" in obj;
    }

    function isSimpleEval(obj) {
        return isObject(obj) && "!" in obj;
    }

    function isQuoteEval(obj) {
        return isObject(obj) && "'" in obj;
    }

    function isObject(obj) {
        return !isArray(obj) && obj === Object(obj);
    }
    
    function isArray(obj) {
        return Array.isArray(obj)
    }
    
    function isString(obj) {
        return (typeof obj === 'string' || obj instanceof String);
    }

    function isPath(obj) {
        return isString(obj) && obj.slice(0, 2) == "##";
    }

    function isUnwrapPath(obj) {
        return isString(obj) && obj.slice(0, 1) == "#";
    }

    /* JSONPath 0.8.5 - XPath for JSON
 *
 * Copyright (c) 2007 Stefan Goessner (goessner.net)
 * Licensed under the MIT (MIT-LICENSE.txt) licence.
 *
 * Proposal of Chris Zyp goes into version 0.9.x
 * Issue 7 resolved
 */
    function jsonPath(obj, expr, arg) {
        var P = {
            resultType: arg && arg.resultType || "VALUE",
            result: [],
            normalize: function(expr) {
                var subx = [];
                return expr.replace(/[\['](\??\(.*?\))[\]']|\['(.*?)'\]/g, function($0, $1, $2) {
                    return "[#" + (subx.push($1 || $2) - 1) + "]";
                }) /* http://code.google.com/p/jsonpath/issues/detail?id=4 */
                .replace(/'?\.'?|\['?/g, ";")
                .replace(/;;;|;;/g, ";..;")
                .replace(/;$|'?\]|'$/g, "")
                .replace(/#([0-9]+)/g, function($0, $1) {
                    return subx[$1];
                });
            },
            asPath: function(path) {
                var x = path.split(";"), p = "$";
                for (var i = 1, n = x.length; i < n; i++)
                    p += /^[0-9*]+$/.test(x[i]) ? ("[" + x[i] + "]") : ("['" + x[i] + "']");
                return p;
            },
            store: function(p, v) {
                if (p)
                    P.result[P.result.length] = P.resultType == "PATH" ? P.asPath(p) : v;
                return !!p;
            },
            trace: function(expr, val, path) {
                if (expr !== "") {
                    var x = expr.split(";"), loc = x.shift();
                    x = x.join(";");
                    if (val && val.hasOwnProperty(loc))
                        P.trace(x, val[loc], path + ";" + loc);
                    else if (loc === "*")
                        P.walk(loc, x, val, path, function(m, l, x, v, p) {
                            P.trace(m + ";" + x, v, p);
                        });
                    else if (loc === "..") {
                        P.trace(x, val, path);
                        P.walk(loc, x, val, path, function(m, l, x, v, p) {
                            typeof v[m] === "object" && P.trace("..;" + x, v[m], p + ";" + m);
                        });
                    } 
                    else if (/^\(.*?\)$/.test(loc)) // [(expr)]
                        P.trace(P.eval(loc, val, path.substr(path.lastIndexOf(";") + 1)) + ";" + x, val, path);
                    else if (/^\?\(.*?\)$/.test(loc)) // [?(expr)]
                        P.walk(loc, x, val, path, function(m, l, x, v, p) {
                            if (P.eval(l.replace(/^\?\((.*?)\)$/, "$1"), v instanceof Array ? v[m] : v, m))
                                P.trace(m + ";" + x, v, p);
                        }); // issue 5 resolved
                    else if (/^(-?[0-9]*):(-?[0-9]*):?([0-9]*)$/.test(loc)) // [start:end:step]  phyton slice syntax
                        P.slice(loc, x, val, path);
                    else if (/,/.test(loc)) { // [name1,name2,...]
                        for (var s = loc.split(/'?,'?/), i = 0, n = s.length; i < n; i++)
                            P.trace(s[i] + ";" + x, val, path);
                    }
                } 
                else
                    P.store(path, val);
            },
            walk: function(loc, expr, val, path, f) {
                if (val instanceof Array) {
                    for (var i = 0, n = val.length; i < n; i++)
                        if (i in val)
                            f(i, loc, expr, val, path);
                } 
                else if (typeof val === "object") {
                    for (var m in val)
                        if (val.hasOwnProperty(m))
                            f(m, loc, expr, val, path);
                }
            },
            slice: function(loc, expr, val, path) {
                if (val instanceof Array) {
                    var len = val.length, start = 0, end = len, step = 1;
                    loc.replace(/^(-?[0-9]*):(-?[0-9]*):?(-?[0-9]*)$/g, function($0, $1, $2, $3) {
                        start = parseInt($1 || start);
                        end = parseInt($2 || end);
                        step = parseInt($3 || step);
                    });
                    start = (start < 0) ? Math.max(0, start + len) : Math.min(len, start);
                    end = (end < 0) ? Math.max(0, end + len) : Math.min(len, end);
                    for (var i = start; i < end; i += step)
                        P.trace(i + ";" + expr, val, path);
                }
            },
            eval: function(x, _v, _vname) {
                try {
                    return $ && _v && eval(x.replace(/(^|[^\\])@/g, "$1_v").replace(/\\@/g, "@"));
                }  // issue 7 : resolved ..
                catch (e) {
                    throw new SyntaxError("jsonPath: " + e.message + ": " + x.replace(/(^|[^\\])@/g, "$1_v").replace(/\\@/g, "@"));
                } // issue 7 : resolved ..
            }
        };
        
        var $ = obj;
        if (expr && obj && (P.resultType == "VALUE" || P.resultType == "PATH")) {
            P.trace(P.normalize(expr).replace(/^\$;?/, ""), obj, "$"); // issue 6 resolved
            return P.result.length ? P.result : false;
        }
    }

}));
