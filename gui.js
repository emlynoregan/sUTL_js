var setupEditor = function(aId)
{
    var editor = ace.edit(aId);
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/json");
    editor.getSession().setTabSize(2);
    editor.getSession().setUseSoftTabs(true);
    editor.setFontSize(20);
    return editor;
}

var edSource = setupEditor("edSource");
var edTransform = setupEditor("edTransform");
var edResult = setupEditor("edResult");

var EditorIsInvalid = function(aEditor)
{
    var retval = null;

    var ljsonString = aEditor.getValue();
    try
    {
        JSON.parse(ljsonString);
    }
    catch (err)
    {
        retval = err.message;
    }

    return retval;
}

var ValidateJson = function(aEditor, aMessageSelector)
{
    $(aMessageSelector).text(EditorIsInvalid(aEditor));
}

var UpdateActions = function()
{

}

var distribution = [
  {
    "name": "fred_l_emlynoregan_com",
    "language": "sUTL0",
    "transform-t": "fred!!!"
  },
  {
    "name": "fredlist_l_emlynoregan_com",
    "language": "sUTL0",
    "transform-t": [ "#*.fred_l", "#*.fred_l" ],
    "requires": ["fred_l"]
  },
  {
    "name": "map_l_emlynoregan_com",
    "language": "sUTL0",
    "transform-t": 
    {
      "&": "if",
      "cond": "#@.list",
      "true": {
        "'": [
          "&&",
          {
            "!": "#@.t",
            "item": {
              "!": "#$.head",
              "in": "#@.list"
            }
          },
          {
            "!": "#*.map_l_emlynoregan_com",
            "list": {
              "!": "#$.tail",
              "in": "#@.list"
            },
            "t": "#@.t"
          }
        ]
      },
      "false": {
        "'": []
      }
    },
    "requires": ["map_l_emlynoregan_com"]
  }
]

var UpdateResult = function()
{
    if (!(EditorIsInvalid(edSource) || EditorIsInvalid(edTransform)))
    {
        lsourceJson = JSON.parse(edSource.getValue());
        ltransformJson = JSON.parse(edTransform.getValue());

        try
        {
            var lresult = null;

            var ltransform = "transform-t" in ltransformJson ? ltransformJson["transform-t"] : null;

            var clresult = sUTL.compilelib([ltransformJson], [distribution], true)

            if ("fail" in clresult)
            {
              lresult = clresult["fail"]
            }
            else
            {
              lresult = sUTL.evaluate(lsourceJson, ltransform, clresult["lib"] || {})
            }

            edResult.setValue(JSON.stringify(lresult, null, space=2))
            edResult.gotoLine(0);
        }
        catch (e)
        {
            edResult.setValue("Exception: " + e.message)
            edResult.gotoLine(0);
        }
    }
}

edSource.getSession().on('change', function(e) {
    ValidateJson(edSource, "#sourcemsg");
    setStoredText("sourceTextsUTL2", edSource.getValue())
    UpdateActions();
    UpdateResult();
});

edTransform.getSession().on('change', function(e) {
    ValidateJson(edTransform, "#transformmsg");
    setStoredText("transformTextsUTL2", edTransform.getValue())
    UpdateActions();
    UpdateResult();
});

var getStoredText = function(aKey, aDefault)
{
    var retval;

    if(typeof(Storage) !== "undefined") {
        retval = localStorage[aKey]
    }

    retval = retval || aDefault;

    return retval;
}

var setStoredText = function(aKey, aValue)
{
    if(typeof(Storage) !== "undefined") {
        localStorage[aKey] = aValue
    }
}

var _defaultSource = {
  "head": "#@.in[0]" ,
  "tail": "##@.in[1:]",
  "back": "##@.in[-1:]",
  "front": "##@.in[:-1]",
  "append": [
    "&&", 
    "#@.head",
    "#@.tail"
  ],
  "reverse": 
  {
    "&": "if",
    "cond": "#@.in",
    "true": 
    {"'": 
      [
        "&&",
        {
          "!": "#$.reverse",
          "in": 
          {
            "!": "#$.tail",
            "in": "#@.in"
          }
        },
        {
          "!": "#$.head",
          "in": "#@.in"
        }
      ]
    },
    "false": {"'": []}
  },
  "add3": {
    "&": "+",
    "a": "#@.item",
    "b": 3
  },
  "map":   {
    "&": "if",
    "cond": "#@.list",
    "true": 
    {"'": 
      [
        "&&",
        {
          "!": "#@.t",
          "item": {
            "!": "#$.head",
            "in": "#@.list"
          }
        },
        {
          "!": "#$.map",
          "list": 
          {
            "!": "#$.tail",
            "in": "#@.list"
          },
          "t": "#@.t"
        }
      ]
    },
    "false": {"'": []}
  }
}

var _defaultTransform = 
{
  "language": "sUTL0",
  "transform-t": 
  {
    "div": {
      "&": "=", 
      "a": {
        "&": "+",
        "a": 3, 
        "b": 4
      }, 
      "b": -2
    },
    "mapper1": {
      "!": "#$.map",
      "list": [1,2, 3],
      "t": "#$.add3"
    },
    "mapper2": {
      "!": "#$.map",
      "list": [1,2, 3],
      "t": {"'": {
        "&": "+",
        "a": "#@.item",
        "b": 3
      }}
    },
    "backer": {
      "!": "#$.back",
      "in": [1, 2, 4, 6, 7, 3, 9]
    },
    "fronter": {
      "!": "#$.front",
      "in": [1, 2, 4, 6, 7, 3, 9]
    }
  }
}

edSource.setValue(getStoredText("sourceTextsUTL2",  JSON.stringify(_defaultSource, null, 2)))
edSource.gotoLine(0);
edTransform.setValue(getStoredText("transformTextsUTL2", JSON.stringify(_defaultTransform, null, 2)))
edTransform.gotoLine(0);

