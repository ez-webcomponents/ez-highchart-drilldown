# ez-highchart-drilldown
A drilldown charting widget that drills down into the data based on the 'groupby' attribute.  Uses highcharts for the base charting.

Copyright (c) 2018 Martin Israelsen
@author Martin Israelsen <martin.israelsen@gmail.com>

## Download from npm using yarn into your node_modules directory.  STRONG WARNING:  the --flat option is very important!  Do not leave out the --flat option to yarn! :) 
```
$ yarn upgrade --flat
$ yarn add @ez-webcomponents/ez-highchart-drilldown --flat
```

##  Run the es6 version of the Demo (Assuming you installed at SERVER_ROOT using npm)
```
{SERVER_ROOT}/node_modules/@ez-webcomponents/ez-highchart-drilldown/build-demo/es6-bundled/demo/index.html
```

##  Include ez-highchart-drilldown-loader.js to use as stand-alone bundled component 
or 
##  Include ez-highchart-drilldown.js directly if including in a polymer project. 
```
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, minimum-scale=1, initial-scale=1, user-scalable=yes">

    <title>ez-highchart-drilldown demo</title>
    <!-- If using as a stand-alone-component:  use ez-highchart-drilldown-loader.js
    <script src="./node_modules/@ez-webcomponents/ez-highchart-drilldown/build-component/ez-highchart-drilldown-loader.js"></script> -->

    <!-- If using in an existing build project:  use ez-highchart-drilldown.js directly-->
    <!-- <script type="import" src="@ez-webcomponets/ez-highchart-drilldown/src/components/ez-highchart-drilldown.js"></script>  -->

    <!-- Now add ez-highchart-drilldown to html section -->

    <ez-highchart-drilldown
        url='./data/srch-data.txt'
        title="Revenue By Company"
        cardelevation="0"
        height="400px"
        width="500px"
        maxcharts=1
        groupby='[{"field": "company", "aggregate": "sum(revenue)", "chart": "pie"},
                  {"field": "date_trunc(month,startdate)", "aggregate": "sum(revenue)", "chart": "line"},
                  {"field": "division", "aggregate": "sum(revenue)", "chart": "bar"},
                  {"field": "gender", "aggregate": "sum(revenue)", "chart": "pie"},
                  {"field": "eyeColor", "aggregate": "sum(revenue)", "chart": "bar"},
                  {"field": "age", "aggregate": "sum(revenue)", "chart": "pie"}]'>
    </ez-highchart-drilldown>
  </body>
</html>

```
