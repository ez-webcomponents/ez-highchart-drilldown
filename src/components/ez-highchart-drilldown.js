/**
@license
Copyright (c) 2018 Martin Israelsen
This program is available under MIT license, available at 
  https://github.com/ez-webcomponents/ez-highchart-drilldown
*/

import {LitElement, html} from '@polymer/lit-element';
import '@polymer/paper-card/paper-card.js';
import 'highcharts';
import 'highcharts/modules/exporting';
import 'jquery/dist/jquery.min.js';
import {EzGroupbyTreeMixin} from '@ez-webcomponents/ez-groupby-tree-mixin/src/components/ez-groupby-tree-mixin.js'; 

/**
 * @file ez-highchart-drilldown.js
 * @author Martin Isaelsen <martin.israelsen@gmail.com>
 * @description
 * A drilldown charting component that drills down into the data based on the 'groupby' attribute.  
 * Uses highcharts for the base charting.
 */
class EzHighchartDrilldown extends EzGroupbyTreeMixin(LitElement) {

/**
   * @function constructor()
   * @author Martin Israelsen <martin.israelsen@gmail.com>
   *    Sets default values for attributes and initializes highcharts.  Sends off 
   *    the ajax request to get the data calls groupBy() to group the data and brings up 
   *    the inital top-level chart.   Listens to back button clicks to go up the drilldown chart stack. 
   */
  constructor() {
    super();
    var me = this;
    me.data = [];

    this.addEventListener('rendered', async (e) => {
        try {
            console.log("GROUP BY=",me.groupby);
            me.fullGroupBy = JSON.parse(me.groupby);
        } catch (e) {
            alert("Sorry could not parse 'groupby' attribute -- Please check your JSON formatting.");
            return;
        }

        if (typeof me.maxcharts === 'undefined') {
            me.maxcharts = 1;
        }

        if (typeof me.height === 'undefined') {
            me.height= "100%";
        }

        if (typeof me.title == 'undefined') {
            me.title = "Please Add a Title";
        }

        if (typeof me.cardelevation == 'undefined') {
            me.cardelevation = "1";
        }

      var chartDiv = this.shadowRoot.querySelector('#chart-div1');
      var chartDiv2 = this.shadowRoot.querySelector('#chart-div2');
      //var chartDiv = document.createElement("div");
      me.chartDiv = chartDiv;
      me.chartDiv2 = chartDiv2;
      me.sendAjax();

      this.initHighcharts(this);

      me.mainChartConfig = me.getMainChartConfig(me.title, "100%");
      //me.mainChartConfig = me.getMainChartConfig(me.title, "100%");

      me.globalDrilldownStack = [];
      var titleDiv = me.shadowRoot.querySelector("#title-div");

      if (me.maxcharts == 1) {
        var backButton = me.shadowRoot.querySelector("#back-button1");
      } else {
        var backButton = me.shadowRoot.querySelector("#back-button2");
      }

      backButton.addEventListener('click', function(e){
        var options1 = me.globalDrilldownStack.pop();
        var options = me.globalDrilldownStack.pop();
        if (typeof options === 'undefined') {
            backButton.hidden = true;
            me.chartDiv2.hidden = true;
            titleDiv.hidden = true;
            me.chartData(me.fullGroupBy,me.chartDiv,0);
        } else {
            backButton.hidden = false;
            me.chartDiv2.hidden = false;
            titleDiv.hidden = false;
            me.createDrillDownGraph(options);
        }
      });

    });
  }

  firstUpdated(properties) {
    this.dispatchEvent(new CustomEvent('rendered'));  
  }


/**
   * @function getMainChartConfig()
   * @author Martin Israelsen <martin.israelsen@gmail.com>
   *    This function defines the default highchart configuration.
   *           
   * @param title        The title of the chart  
   * @param height       The height of the chart
   * 
   * @return returns the default highchart configuration object
   */
  getMainChartConfig(title, height) {
    var me = this;
    // This method is ment to be overridden.
    //
    // You must set this.mainChartConfig
    var mainChartConfig = {
        chart: {
            type: "pie",
            height: me.height
        },
        credits: {
            enabled: false
        },
        pane: {
            center: ['50%', '85%'],
            size: '140%',
            startAngle: -90,
            endAngle: 90,
            background: {
                backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || '#EEE',
                innerRadius: '60%',
                outerRadius: '100%',
                shape: 'arc'
            }
        },
        legend: {
            enabled: true
        },
        title: {
            text: title
        },
        yAxis: {
            title: {
                text: ''
            }
        },
        exporting: {
            buttons: {
                contextButton: {
                    menuItems: [{
                        text: 'Download CSV File (All Data)',
                        onclick: function (e) {
                            me.downloadData(this.options.series[0], this.options.series[0].downloadObj, this.options.series[0].allData)
                        }
                    }, {
                        text: 'Export to PNG',
                        onclick: function () {
                            this.exportChart();
                        }
                    }, {
                        separator: true
                    }
                    // TODO: add file upload feature.
                    // , {
                    //     text: 'Upload CSV File',
                    //     onclick: function () {
                    //         me.uploadData();
                    //     }
                    // }
                ]
                }
            },
            chartOptions: { // specific options for the exported image
                plotOptions: {
                    series: {
                        dataLabels: {
                            enabled: true
                        }
                    },
                    solidgauge: {
                        dataLabels: {
                            y: 5,
                            borderWidth: 0,
                            useHTML: true
                        }
                    }
                }
            },
            scale: 3,
            fallbackToExportServer: false
        },
        plotOptions: {
            pie: {
                shadow: false,
                center: ['50%', '50%']
                //,showInLegend: true
            }
            ,
            series: {
                point: {
                    events: {
                        click: function (e) {
                            if (typeof this.options.drilldown !== 'undefined') {
                                var titleDiv = me.shadowRoot.querySelector("#title-div");
                                if (me.maxcharts == 1) {
                                    var backButton = me.shadowRoot.querySelector("#back-button1");
                                    titleDiv.hidden = false;
                                } else {
                                    var backButton = me.shadowRoot.querySelector("#back-button2");
                                    titleDiv.hidden = true;
                                }
                                backButton.hidden = false;
                                //me.globalDrilldownStack.length = 0;
                                me.createDrillDownGraph(this.options);
                            }
                        },
                        contextmenu: function (e) {
                            //console.log("CONTEXT",$(e.currentTarget), e.currentTarget.series);
                        }
                    }
                }
            }
        },
        xAxis: {
            categories: [],
             labels: {
                formatter: function() {
                    return this.value;
                }
            }
        },
        tooltip: {
            enabled: true,
            pointFormat: "{point.y:,.0f}"
            // formatter: function() {
            //     return '<b>' + this.point.name + {point.y:,.0f}':  ( ' + this.y + ' )</b>';
            // }
        },
        series: [{
            showInLegend: false,
            name: '',
            data: [],
            size: '80%',
            //innerSize: '15%',
            dataLabels: {
                enabled: true,
                align: 'center',
                pointFormat: "{point.y:,.0f}",
                // formatter: function () {
                //     return this.y;
                // },
                color: '#000000',
                distance: -50
            }
        }]
    };

    return mainChartConfig;
}

/**
   * @function initHighcharts()
   * @author Martin Israelsen <martin.israelsen@gmail.com>
   *    Initialize highcharts global configurations.  
   *    Sets up right-click functionality for downloading data to csv file.
   *    
   * @param me        reference to self 
   */        
initHighcharts(me) {
  Highcharts.setOptions({
      lang: {
          drillUpText: '◁ Back',
          thousandsSep: ','
      }
  });

  Highcharts.wrap(Highcharts.Chart.prototype, 'firstRender', function (proceed) {

      proceed.call(this);

      var chart = this,
          container = this.container,
          plotLeft = this.plotLeft,
          plotTop = this.plotTop,
          plotWidth = this.plotWidth,
          plotHeight = this.plotHeight,
          inverted = this.inverted,
          pointer = this.pointer;

      // Note:
      // - Safari 5, IE8: mousedown, contextmenu, click
      // - Firefox 5: mousedown contextmenu
      container.oncontextmenu = function(e) {

          var hoverPoint = chart.hoverPoint,
              chartPosition = pointer.chartPosition;

          this.rightClick = true;

          e = pointer.normalize(e);

          e.cancelBubble = true; // IE specific
          e.returnValue = false; // IE 8 specific
          if (e.stopPropagation) {
              e.stopPropagation();
          }
          if (e.preventDefault) {
              e.preventDefault();
          }

          if (!pointer.hasDragged) {
               if (hoverPoint && pointer.inClass(e.target, 'highcharts-tracker')) {
                   var plotX = hoverPoint.plotX,
                       plotY = hoverPoint.plotY;

                   // add page position info
                   Highcharts.extend(hoverPoint, {
                       pageX: chartPosition.left + plotLeft +
                           (inverted ? plotWidth - plotY : plotX),
                       pageY: chartPosition.top + plotTop +
                           (inverted ? plotHeight - plotX : plotY)
                   });
                  // Download the data associated with the point you clicked on.
                  me.downloadData(hoverPoint, hoverPoint.downloadObj, hoverPoint.data);
               }
         }
      }
  });
}

uploadData() {
    alert("Upload Data")
}

/**
   * @function downloadData()
   * @author Martin Israelsen <martin.israelsen@gmail.com>
   *    Dumps out the data for this particular 'data' object into csv format.
   *           
   * @param series       The series object which holds the path information for this data object
   * @param downloadObj  Holds which fields to download.
   * @param data         The data object to download.
   * 
   * @return a csv file of the data
   */        
downloadData(series, downloadObj, data) {
    var me = this;
    var exportStr = "";

    exportStr += me.title;
    exportStr += "\n\n";

    if (typeof series.path != 'undefined') {
        exportStr += "Local Filter:\n";
        series.path = series.path.replace(/,/g, " ");
        if (parseInt(series.path) > 0) {
            exportStr += '="'+series.path+'"'+",";
        } else {
            exportStr += '"'+series.path+'"'+",";
        }
        exportStr += "\n\n\n";
    }

    // Dump out header
    for (var item in downloadObj) {
        exportStr += '"'+downloadObj[item]+'"'+",";
    }
    exportStr += "\n";

    // Now dump out data.
    for (var k= 0; k < data.length; k++) {
        for (var i=0; i< downloadObj.length; i++) {
             exportStr += '"'+data[k][downloadObj[i]]+'"'+",";           
        }

        exportStr += "\n";
    }

    me.export(exportStr, "chart_download.csv", 'text/csv;charset=utf-8;');
}

/**
   * @function export()
   *    Downloads the formatted string to the client computer in csv format.
   *           
   * @param exportStr       The data string to download 
   * @param filename        The name of the file to download to client computer
   * @param fileType        The format of the file -- in this case text/csv
   * 
   * @return a csv file of the data
   */         
export(exportStr, filename, fileType) {
    var blob = new Blob([exportStr], { type: fileType });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

/**
   * @function addPlotOptionsToConfig()
   * @author Martin Israelsen <martin.israelsen@gmail.com>
   *    For future use:  This function defines and returns plotOptions that we 
   *    always want on every config.
   * 
   * @return The plotOptions 
   */  
addPlotOptionsToConfig() {
    var me = this;
    var plotOptions = {
        pie: {
            shadow: false,
            center: ['50%', '50%']
            //,showInLegend: true
        }
        ,
        series: {
            point: {
                events: {
                    click: function (e) {
                        if (typeof this.options.drilldown !== 'undefined') {
                            var titleDiv = me.shadowRoot.querySelector("#title-div");
                            if (me.maxcharts == 1) {
                                var backButton = me.shadowRoot.querySelector("#back-button1");
                                titleDiv.hidden = false;
                            } else {
                                var backButton = me.shadowRoot.querySelector("#back-button2");
                                titleDiv.hidden = true;
                            }
                            backButton.hidden = false;
                            me.createDrillDownGraph(this.options);
                        }
                    },
                    contextmenu: function (e) {
                        //console.log("CONTEXT",$(e.currentTarget), e.currentTarget.series);
                    }
                }
            }
        }
    };

    return plotOptions;
}

/**
   * @function createDrillDownGraph()
   * @author Martin Israelsen <martin.israelsen@gmail.com>
   *   Fills in the series and categories for the drilldown graph from the options.drilldown.  
   *   Then creates the drilldown graph. 
   *           
   * @param options       Options holds all of the information for this level of the drilldown
   */
createDrillDownGraph(options) {
    var me = this;
    var titleDiv = me.shadowRoot.querySelector("#title-div");
    if (me.maxcharts == 1) {
        var backButton = me.shadowRoot.querySelector("#back-button1");
        titleDiv.hidden = false;
    } else {
        var backButton = me.shadowRoot.querySelector("#back-button2");
        titleDiv.hidden = true;
    }
    backButton.hidden = false;

    options.group.chartConfig = {};
    options.group.chartConfig = Object.assign(options.group.chartConfig,me.mainChartConfig);
    options.group.chartConfig.chart.type = options.drilldown[0].chart;

    if (typeof options.group.chartConfig.series !== 'undefined') {
        for (var i=0; i<options.group.chartConfig.series.length; i++) {
            options.group.chartConfig.series[i].data.length = 0;
            options.group.chartConfig.xAxis.categories.length = 0;
        }
    }

    for (var k in options.drilldown) {
        if (typeof options.group.chartConfig.series[0] !== 'undefined') {
            options.group.chartConfig.series[0].data.push(options.drilldown[k]);
            options.group.chartConfig.xAxis.categories.push(options.drilldown[k].name);
        }
    }

    if (options.group != options.groups[options.groups.length-1]) {
        // Fill in chart type from 'groupby' attribute that was passed in.
        options.group.chartConfig.title.text = "("+options.path+")";

        if (me.maxcharts == 1) {
            me.highchart = Highcharts.chart(me.chartDiv, options.group.chartConfig);
        } else {
            backButton.hidden = false;
            me.chartDiv2.hidden = false;
            me.highchart = Highcharts.chart(me.chartDiv2, options.group.chartConfig);
        }
        
        var lastOptions = me.globalDrilldownStack[me.globalDrilldownStack.length-1];

        // Don't push on the stack if it is the exact same thing.
        if (lastOptions != options) {
            me.globalDrilldownStack.push(options);
        }
        
    
        if (me.globalDrilldownStack.length > 0) {
            backButton.hidden = false;
        } else {
            backButton.hidden = true;
        }
    }
}

/**
   * @function populateChartData()
   * @author Martin Israelsen <martin.israelsen@gmail.com>
   *   Fills in the series and categories for the graph groupings. 
   *   Also calculates the color for each grouping.
   *           
   * @param me          A refrence to self
   * @param series      The level of the tree we want to fill
   * @param obj         The tree object that holds all of the groupings
   * @param color       The color to start with.
   */
populateChartData(me, series, obj, color) {
    for (var k in obj) {
        if (typeof obj[k].drilldown !== 'undefined') {
            if (obj[k].drilldown.length > 0) {
                var brightness = 0.1 - (k) / 5;
                obj[k].color = Highcharts.Color(me.colors[color]).brighten(brightness).get();
                obj[k].group.chartConfig = {};
                obj[k].group.chartConfig = Object.assign(obj[k].group.chartConfig,me.mainChartConfig);
                obj[k].group.chartConfig.chart.type = obj[k].group.chart;
                if (typeof obj[k].group.chartConfig.series[series] !== 'undefined') {
                    obj[k].group.chartConfig.series[series].data.push(obj[k]);
                    obj[k].group.chartConfig.series[0].allData = me.data;
                    obj[k].group.chartConfig.series[0].downloadObj = me.downloadFields;
                    obj[k].group.chartConfig.xAxis.categories.push(obj[k].name);
                } 
                color++;                
                me.populateChartData(me,series+1,obj[k].drilldown, color);

            } else {
                var brightness = 0.1 - (k) / 5;
                obj[k].color = Highcharts.Color(me.colors[color]).brighten(brightness).get();
                obj[k].group.chartConfig = {};
                obj[k].group.chartConfig = Object.assign(obj[k].group.chartConfig,me.mainChartConfig);
                obj[k].group.chartConfig.chart.type = obj[k].group.chart;
                if (typeof obj[k].group.chartConfig.series[series] !== 'undefined') {
                    obj[k].group.chartConfig.series[series].data.push(obj[k]);
                    obj[k].group.chartConfig.xAxis.categories.push(obj[k].name);
                } 
            }
        }
    }
}

/**
   * @function chartData()
   * @author Martin Israelsen <martin.israelsen@gmail.com>
   *   Entry Point for creating a drilldown graph.  Initializes the series and calls "groupBy"
   *    on "this.data" to group up the data based on the "groups" array definition.  Also, calls "populateChartData"
   *    to populate the initial chart and calculate the color for each group.
   */
chartData(groups,div,regroup) { 
    this.colors = Highcharts.getOptions().colors;

    groups[0].chartConfig = {};
    groups[0].chartConfig = Object.assign(groups[0].chartConfig,this.mainChartConfig);
 
    // zero out the series and categories
    if (typeof groups[0].chartConfig.series !== 'undefined') {
        for (var i=0; i < groups[0].chartConfig.series.length; i++) {
            groups[0].chartConfig.series[i].data.length = 0;
            groups[0].chartConfig.xAxis.categories.length = 0;
        }
    }

    // Group up the data using the group array into a tree object - (recursive)
    if (regroup) {
        this.treeObj = this.groupBy(this.data, groups, groups);
    }

    // fill in the category/series data using the treeObj we just built - (recursive)
    this.populateChartData(this, 0, this.treeObj, 0);

    // Now create the first (top level) chart using the mainChartConfig.
    if (typeof groups[0].chart != 'undefined') {
        groups[0].chartConfig.chart.type = groups[0].chart;
        groups[0].chartConfig.title.text = this.title;
    } 
    this.highchart = Highcharts.chart(div, Object.assign({},groups[0].chartConfig));
}

/**
   * @function sendAjax()
   * @author Martin Israelsen <martin.israelsen@gmail.com>
   *   Send off ajax for "this.url" to get the data for this object.  Once we have received it back initialize 
   *   "this.data" and the "downloadFields" and finally call "chartData()"
   */
  sendAjax() {
    var me = this;

    $.ajax({
       type: "GET",
       url: me.url,
       success: function(response){
 
        if (typeof response.payload == 'undefined') {
          var resp = JSON.parse(response);
        } else {
          var resp = response;
        }
        me.data = resp.payload;
        me.downloadFields = Object.keys(me.data[0]);

        me.chartData(me.fullGroupBy,me.chartDiv,1);
     }
    });
 }


 /**
   * @function properties
   * @author Martin Israelsen <martin.israelsen@gmail.com>
   *   Define attributes that can be passed into the <ez-highcharts-drilldown> 
   */
  static get properties() { 
    return { 
      url: {
        type: String
      },
      data: {
        type: Object
      },
      groupby: {
        type: String
      },
      maxcharts: {
        type: Number
      },
      type: {
          type: String
      },
      height: {
          type: String
      },
      width: {
        type: String
      },
      title: {
          type: String
      },
      cardelevation: {
          type: String
      }
    }
  }

   /**
   * @function render()
   * @author Martin Israelsen <martin.israelsen@gmail.com>
   *   Define the html tagged temple literal that will be put on the DOM.
   */
  render() {

    if (this.maxcharts === 1) {
        var cssClass1 = "col-sm-12";
        var cssClass2 = "col-sm-0";
    } else {
        var cssClass1 = "col-sm-6";
        var cssClass2 = "col-sm-6";
    }

    return html`
        <style>
        .row {
            margin-right: -15px;
            margin-left: -15px;
        }

        @media (min-width: 768px) {
            .col-sm-6, .col-sm-12 {
                float: left;
            }
            .col-sm-12 {width: 100%;}
            .col-sm-6 {width: 50%;}
            .col-sm-0 {width: 0%;}
            }

        </style>
        <div>
        <paper-card elevation=${this.cardelevation} style="width: ${this.width}; height: ${this.height}" class="row">
            <div class=${cssClass1}>
                <div style="position:relative">
                    <button hidden style="position: absolute; right: 50px; top: 42px; z-index: 999" id="back-button1">Back</button>
                </div>
                <div hidden id="title-div" style="font-size: 18px; font-family: : 'Lucida Grande', 'Lucida Sans Unicode', Arial, Helvetica, sans-serif;"><center>${this.title}<center></div>
                <div id="chart-div1"></div>
            </div>
            <div class=${cssClass2}>
                <div style="position:relative">
                    <button hidden style="position: absolute; right: 50px; top: 40px; z-index: 999" id="back-button2">Back</button>
                </div>
                <div id="chart-div2"></div>
            </div>
        </paper-card>
        </div>
        `;
    }

}

window.customElements.define('ez-highchart-drilldown', EzHighchartDrilldown);