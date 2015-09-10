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

var distributions = []

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

            var clresult = sUTL.compilelib([ltransformJson], distributions, true)

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
    UpdateResult();
});

edTransform.getSession().on('change', function(e) {
    ValidateJson(edTransform, "#transformmsg");
    setStoredText("transformTextsUTL2", edTransform.getValue())
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

var _defaultSource = [1, 2, 3, 4]

var _defaultTransform = 
{
  "language": "sUTL0",
  "transform-t": {
    "sum": {
      "!": "#*.sum_core",
      "list": "#$"
    }
  },
  "requires": [
    "sum_core"
  ]
}

$(document).ready(function(){
   xdloader.create('http://emlynoregan.github.io/sUTL-spec/xdremote.html')

  .then(function(remote) {

      //got remote    
      //use it to get a file, and parse it as a JSON file 

      remote.get('sUTL_core.json', true)
      .then(function(coreresponse) {
        try{
          remote.get('sUTL_coretests.json', true)
          .then(function(coretestsresponse) {
            console.log(coreresponse.data.message);
            console.log(coretestsresponse.data.message);

            distributions.push(coreresponse.data)
            distributions.push(coretestsresponse.data)

            edSource.setValue(getStoredText("sourceTextsUTL2",  JSON.stringify(_defaultSource, null, 2)))
            edSource.gotoLine(0);
            edTransform.setValue(getStoredText("transformTextsUTL2", JSON.stringify(_defaultTransform, null, 2)))
            edTransform.gotoLine(0);
          })
        }
        catch(error)
        {
          console.log('ERROR: ' + error);
        }
      })
      .catch(function(error){
        console.log('ERROR: ' + error);
      })
  })
  .catch(function(error){
    console.log('ERROR: ' + error);
  })
});

