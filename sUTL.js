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
    sUTL.evaluate = evaluate;
    sUTL.compilelib = compilelib;

    function get(obj, key, def)
    {
        if (key in obj)
            return obj[key]
        else
            return def
    }

    function gettype(item)
    {
        if (isObject(item))
            return "map"
        else if (isArray(item))
            return "list"
        else if (isString(item))
            return "string"
        else if (isNumber(item))
            return "number"
        else if (isBool(item))
            return "boolean"
        else if (item = null)
            return "null"
        else
            return "unknown"
    }

    function builtins()
    {
        var retval = {
            "path": function(parentscope, scope, l, src, tt, b)
            {
                var fullpath = get(scope, "path", "")

                if (!fullpath)
                {
                    console.log("here")
                }
                var prefix = fullpath.slice(0, 1)
                var path = fullpath.slice(1)
                var childscope = null;

                if (prefix == '@')
                {
                    childscope = parentscope
                }
                else if (prefix == '^')
                {
                    childscope = scope // is this even a thing?
                }
                else if (prefix == '*')
                {
                    childscope = l
                }
                else if (prefix == '$')
                {
                    childscope = src
                }
                else if (prefix == '~')
                {
                    childscope = tt
                }

                if (childscope)
                {
                    return jsonPath(childscope, "$" + path) || []
                }
                else
                {
                    return [];
                }
            },
            "+": function(parentscope, scope, l, src, tt, b)
            {
                var a = get(scope, "a", 0)
                var b = get(scope, "b", 0)
                if (gettype(a) == gettype(b))
                    return a + b
                else
                    return null
            },
            "-": function(parentscope, scope, l, src, tt, b)
            {
                return get(scope, "a", 0) - get(scope, "b", 0)
            },
            "*": function(parentscope, scope, l, src, tt, b)
            {
                return get(scope, "a", 1) * get(scope, "b", 1)
            },
            "/": function(parentscope, scope, l, src, tt, b)
            {
                return get(scope, "a", 1) / get(scope, "b", 1)
            },
            "=": function(parentscope, scope, l, src, tt, b)
            {
                return get(scope, "a", 0) === get(scope, "b", 0)
            },
            "!=": function(parentscope, scope, l, src, tt, b)
            {
                return get(scope, "a", 0) !== get(scope, "b", 0)
            },
            ">=": function(parentscope, scope, l, src, tt, b)
            {
                return get(scope, "a", 0) >= get(scope, "b", 0)
            },
            "<=": function(parentscope, scope, l, src, tt, b)
            {
                return get(scope, "a", 0) <= get(scope, "b", 0)
            },
            ">": function(parentscope, scope, l, src, tt, b)
            {
                return get(scope, "a", 0) > get(scope, "b", 0)
            },
            "<": function(parentscope, scope, l, src, tt, b)
            {
                return get(scope, "a", 0) < get(scope, "b", 0)
            },
            "&&": function(parentscope, scope, l, src, tt, b)
            {
                return get(scope, "a", false) && get(scope, "b", false)
            },
            "||": function(parentscope, scope, l, src, tt, b)
            {
                return get(scope, "a", false) || get(scope, "b", false)
            },
            "!": function(parentscope, scope, l, src, tt, b)
            {
                return ! get(scope, "a", false)
            },
            "if": function(parentscope, scope, l, src, tt, b)
            {
                var retval = null;
                var condvalue = false;

                if ("cond" in scope)
                    condvalue = _evaluate(parentscope, scope["cond"], l, src, tt, b)
                    if (isArray(condvalue) && condvalue.length == 0)
                        condvalue = false

                if (condvalue)
                {
                    if ("true" in scope)
                        retval = _evaluate(parentscope, scope["true"], l, src, tt, b)
                }
                else
                {
                    if ("false" in scope)
                        retval = _evaluate(parentscope, scope["false"], l, src, tt, b)
                }

                return retval
            },
            "keys": function(parentscope, scope, l, src, tt, b)
            {
                var obj = get(scope, "map", null)
                if (isObject(obj))
                    return Object.keys(obj)
                else
                    return null
            },
            "values": function(parentscope, scope, l, src, tt, b)
            {
                var obj = get(scope, "map", null)
                if (isObject(obj))
                {
                    var vals = Object.keys(obj).map(function (key) {
                        return obj[key];
                    });
                    return vals;
                }
                else
                    return null
            },
            "len": function(parentscope, scope, l, src, tt, b)
            {
                var item = get(scope, "list", null)
                if (gettype(item) == "list")
                    return item.length
                else
                    return 0
            },
            "type": function(parentscope, scope, l, src, tt, b)
            {
                var item = get(scope, "value", null)
                return gettype(item)
            },
            "makemap":function(parentscope, scope, l, src, tt, b)
            {
                retval = {}
                var item = get(scope, "value", null)
                if (isArray(item))
                {
                    for (var ix in item)
                    {
                        var entry = item[ix];
                        if (isArray(entry) && entry.length >= 2 && isString(entry[0]))
                        {
                            retval[entry[0]] = entry[1]
                        }
                    } 

                }
                return retval
            }
        }

        for (var key in retval)
        {
            retval["has" + key] = function(parentscope, scope, l, src, tt, b)
            {
                return true
            }
        }

        return retval
    }

    function evaluate(src, tt, l) 
    {
        return _evaluate(src, tt, l, src, tt, builtins())
    }

    function _evaluate(s, t, l, src, tt, b)
    {
        if (isEval(t))
        {
            return _evaluateEval(s, t, l, src, tt, b)
        }
        else if (isBuiltinEval(t))
        {
            return _evaluateBuiltin(s, t, l, src, tt, b)
        }
        else if (isQuoteEval(t))
        {
            return _quoteEvaluate(s, t["'"], l, src, tt, b)
        }
        else if (isColonEval(t))
        {
            return t[":"]
        }
        else if (isDictTransform(t))
        {
            return _evaluateDict(s, t, l, src, tt, b)
        }
        else if (isListTransform(t))
        {
            if (t.length > 0 && t[0] == "&&")
                return _flatten(_evaluateList(s, t.slice(1), l, src, tt, b))
            else
                return _evaluateList(s, t, l, src, tt, b)
        }
        else if (isPathTransform(t))
        {
            return _evaluatePath(s, t.slice(2), l, src, tt, b)
        }
        else if (isPathHeadTransform(t))
        {
            return _evaluatePathHead(s, t.slice(1), l, src, tt, b)
        }
        else
        {
            return t; // simple transform
        }
    }

    function _quoteEvaluate(s, t, l, src, tt, b)
    {
        if (isDoubleQuoteEval(t))
        {
            return _evaluate(s, t["''"], l, src, tt, b)
        }
        else if (isDictTransform(t))
        {
            return _quoteEvaluateDict(s, t, l, src, tt, b)
        }
        else if (isListTransform(t))
        {
            return _quoteEvaluateList(s, t, l, src, tt, b)
        }
        else
        {
            return t; // simple transform
        }
    }
    
    function _evaluateBuiltin(s, t, l, src, tt, b)
    {
        var retval = null;

        var builtinf = get(b, t["&"], null);

        if (builtinf)
        {
            var s2 = _evaluateDict(s, t, l, src, tt, b)

            var l2 = l;
            if ("*" in t)
            {
                l2 = _evaluateDict(s, t["*"], l, src, tt, b)
            }

            retval = builtinf(s, s2, l2, src, tt, b)
        }

        return retval
    }

    function _evaluateEval(s, t, l, src, tt, b)
    {
        var t2 = _evaluate(s, t["!"], l, src, tt, b)

        var s2 = _evaluateDict(s, t, l, src, tt, b)

        var l2 = l;
        if ("*" in t)
        {
            l2 = _evaluateDict(s, t["*"], l, src, tt, b)
        }

        return _evaluate(s2, t2, l2, src, tt, b)
    }

    function _evaluateDict(s, t, l, src, tt, b)
    {
        var retval = {}
        for (var key in t)
        {
            if ((key != "!") && (key != "&"))
                retval[key] = _evaluate(s, t[key], l, src, tt, b);
        }
        return retval
    }

    function _quoteEvaluateDict(s, t, l, src, tt, b)
    {
        var retval = {}
        for (var key in t)
        {
            retval[key] = _quoteEvaluate(s, t[key], l, src, tt, b);
        }
        return retval
    }

    function _evaluateList(s, t, l, src, tt, b)
    {
        var retval = []
        for (var ix in t)
        {
            retval.push(_evaluate(s, t[ix], l, src, tt, b))
        }
        return retval
    }

    function _quoteEvaluateList(s, t, l, src, tt, b)
    {
        var retval = []
        for (var ix in t)
        {
            retval.push(_quoteEvaluate(s, t[ix], l, src, tt, b))
        }
        return retval
    }

    function _evaluatePathHead(s, t, l, src, tt, b)
    {
        var resultlist = _evaluatePath(s, t, l, src, tt, b)

        if (resultlist.length)
            return resultlist[0]
        else
            return null;
    }

    function _evaluatePath(s, t, l, src, tt, b)
    {
        var path_t = {
            "&": "path",
            "path": t
        }

        return _evaluate(s, path_t, l, src, tt, b)
    }

    function _flatten(lst)
    {
        var retval = []
        for (var ix in lst)
        {
            if (isArray(lst[ix]))
            {
                retval = retval.concat(lst[ix])
            }
            else
            {
                retval.push(lst[ix])
            }
        }
        return retval;
    }

    function isBuiltinEval(obj) {
        return isObject(obj) && "&" in obj;
    }

    function isEval(obj) {
        return isObject(obj) && "!" in obj;
    }

    function isQuoteEval(obj) {
        return isObject(obj) && "'" in obj;
    }

    function isDoubleQuoteEval(obj) {
        return isObject(obj) && "''" in obj;
    }

    function isColonEval(obj) {
        return isObject(obj) && ":" in obj;
    }

    function isDictTransform(obj) {
        return !isArray(obj) && obj === Object(obj);
    }
    
    function isListTransform(obj) {
        return Array.isArray(obj)
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

    function isNumber(obj) {
        return typeof obj === 'number';
    }

    function isBool(obj) {
        return typeof obj === 'boolean';
    }

    function isPathHeadTransform(obj) {
        return isString(obj) && obj.slice(0, 1) == "#";
    }

    function isPathTransform(obj) {
        return isString(obj) && obj.slice(0, 2) == "##";
    }

    function compilelib(decls, dists, test)
    {
        return _compilelib(decls, dists, {}, test, builtins())
    }

    function _compilelib(decls, dists, l, test, b)
    {
        var resultlib = {};
        var resultliblib = {};

        for (var key in l)
        {
            resultlib[key] = l[key]
        }

        // construct list of names of all required decls not already in the library
        var all_candidate_decls = {}

        for (var dkey in decls)
        {
            var decl = decls[dkey]
            var declname = get(decl, "name", "")
            if ("requires" in decl)
            {
                for (var nix in decl["requires"])
                {
                    var reqname = decl["requires"][nix]
                    if (! (reqname in l))
                    {
                        if (isPrefix(reqname, declname))
                        {
                            resultlib[reqname] = get(decl, "transform-t", null)
                        }
                        else
                        {
                            all_candidate_decls[reqname] = [];
                        }
                    }
                }
            }
        }

//         for (var declix in decls)
//         {
//             var decl = decls[declix]
//             var declname = get(decl, "name", null)

//             if (declname in all_candidate_decls)
//             {
//                 resultlib[declname] = decl
//                 delete all_candidate_decls[declname]
//             } 
//         }

        // get list of candidate decls for each reqname
        for (var reqname in all_candidate_decls)
        {
            for (var distkey in dists)
            {
                var dist = dists[distkey]
                for (var dkey in dist)
                {
                    var decl = dist[dkey]
                    var declname = decl["name"] || ""
                    if (isPrefix(reqname, declname))
                    {
                        all_candidate_decls[reqname].push(decl)
                    }
                }
            }
        }

        // here all_candidate_decls is a dict of candidate_decls by name in decl requires

        var fails = []

        for (var reqname in all_candidate_decls)
        {
            var candidate_decls = all_candidate_decls[reqname]

            if (candidate_decls)
            {
                var fails2total = []
                for (var cdix in candidate_decls)
                {
                    var candidate_decl = candidate_decls[cdix]

                    var clresult = _compilelib([candidate_decl], dists, resultlib, test, b)

                    if ("fail" in clresult)
                    {
                        fails2total = fails2total.concat(clresult["fail"])
                    }
                    else if ("lib" in clresult)
                    {
                        fails2total = [] // not a fail

                        for (var libkey in clresult["lib"])
                        {
                            resultlib[libkey] = clresult["lib"][libkey]
                        }
                        resultliblib[reqname] = clresult["lib"]

                        resultlib[reqname] = get(candidate_decl, "transform-t", null)

                        break;
                    }
                }

                if (fails2total.length)
                {
                    fails = fails.concat(fails2total)
                }
            }
        }

        // here resultlib contains everything we could find for reqnames

        if (test)
        {
            for (var dkey in decls)
            {
                var decl = decls[dkey]
                var declreq = {}
                var declrequires = get(decl, "requires", [])
                for (var declreqix in declrequires)
                {
                    declreq[declrequires[declreqix]] = null;
                } 
                
                // decllib is resultlib filtered by names in decl.requires
                var decllib = {}
                for (var lname in resultlib)
                {
                    if (lname in declreq)
                    {
                        decllib[lname] = resultlib[lname]
                        for (var llname in resultliblib[lname])
                        {
                            decllib[llname] = resultliblib[lname][llname]
                        }
                    }
                } 
                
                // evaluate the test. If truthy, the test fails
                var fail = evaluate(get(decl, "transform-t", null), get(decl, "test-t", null), decllib)
                if (fail)
                    fails = fails.concat(fail)
            }
        } 

        if (fails.length)
            return {"fail": fails}
        else
            return {"lib": resultlib}
    }


    function isPrefix(str1, str2)
    {
        return str2.indexOf(str1) === 0
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
