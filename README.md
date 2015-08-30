# sUTL.js
sUTL Universal Transformation Language

This is a javascript implementation of sUTL

[Read the specification here](https://github.com/emlynoregan/sUTL-spec)

Usage:
Just grab the file sUTL.js and use it like this:

    <script type="text/javascript" src="sUTL.js"></script>

    <script>
      var source = {"name": "Freddo"}
      var transform = "#$.name"
      var result = transform(source, transform)

      // result: "Freddo" 
    </script>

sUTL.js includes [Stefan Goessner's JSONPath implementation](https://code.google.com/p/jsonpath/), released under an MIT license.
