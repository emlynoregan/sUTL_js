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

var UpdateResult = function()
{
    if (!(EditorIsInvalid(edSource) || EditorIsInvalid(edTransform)))
    {
        lsourceJson = JSON.parse(edSource.getValue());
        ltransformJson = JSON.parse(edTransform.getValue());

        try
        {
            lresult = sUTL.transform(lsourceJson, ltransformJson)

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
    setStoredText("sourceText", edSource.getValue())
    UpdateActions();
    UpdateResult();
});

edTransform.getSession().on('change', function(e) {
    ValidateJson(edTransform, "#transformmsg");
    setStoredText("transformText", edTransform.getValue())
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

edSource.setValue(getStoredText("sourceText", "{}"))
edSource.gotoLine(0);
edTransform.setValue(getStoredText("transformText", "{}"))
edTransform.gotoLine(0);

