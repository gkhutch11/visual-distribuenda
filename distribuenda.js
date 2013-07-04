 var DEBUG_MODE = true;
 var DEFAULT_CHART_COLOR = "steelblue";
 var g_chartColor = DEFAULT_CHART_COLOR;
 var g_chartWidth = 800;

 var g_showSortedDistribution = false;

 // which benchmark to use?
 var g_equality = false;
 var g_isAdequacy = false; // display the adequacy threshold iff this flag is true

 var g_adequacyThreshold = 0;
 var g_isNoOneInadequate = true;

 var g_variability = 20;

 // sorted chart for equality benchmark
 var g_sortOrder = true;
 var g_isSorted = false; // show chart sorted

 var g_maxHeight = 200;
 var populationSize = 12;
 var agent = 1;
 var v = 0; //Math.random() * g_maxHeight;
 var g_baseDistribution = [];
 var g_distribution = []; //d3.range(populationSize).map(next); // starting dataset


 // Returns the version of Internet Explorer or a -1
 // (indicating the use of another browser).
 function getInternetExplorerVersion()
 {
    var rv = -1; // Return value assumes failure.
    if (navigator.appName == 'Microsoft Internet Explorer')
    {
       var ua = navigator.userAgent;
       var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
       if (re.exec(ua) != null)
       {
          rv = parseFloat( RegExp.$1 );
       }
    }
    return rv;
 }

 // See if we support the user's browser
 // and, if we don't, give the user the bad news
 function isSupportedBrowser()
 {
    var ieVer = getInternetExplorerVersion();     
    var isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
    var isChrome = window.chrome;
    if (!isChrome && !isSafari && !(ieVer >= 10.0))
    {
        //
        // Unsupported browser :(
        // Give the user the bad news
        // 
        document.getElementById("everything").setAttribute("style", "visibility: hidden");
        if (ieVer > -1 && ieVer < 10.0)
        { 
            document.getElementById("heading").innerHTML = "Sorry, I don't think our stuff works in your browser.  Would you mind upgrading or downloading Chrome?";
        } else {
            document.getElementById("heading").innerHTML = "Sorry, I don't think our stuff works in your browser.  Would you mind trying another brower?";
        }
        return false;
    }   else {
        return true;
    }              
 }

 // a standard assert function to help avoid (preempt!) spending hours debugging
 function assert( condition, message )
 {
   if ( DEBUG_MODE && ! condition )
   {
     alert( "Assertion failed: " + message );
   }
 }

 function init()
 {
    // default the adequacy threshold to 20% of max possible amount of good
    g_adequacyThreshold = g_maxHeight * .20;

    setHeading( getSelectedText("distribuendum"));

 }

 function toggleSorted()
 {
    g_isSorted = (! g_isSorted);
    if (g_isSorted)
    {
        document.getElementById("sorted").innerHTML = "Show unsorted original";
        sortBars();
    }
    else
    {
        g_distribution.sort( compareAgents );
        document.getElementById("sorted").innerHTML = "Sort it!";
        sortBars();
        drawChart();
    }
 }

 function sortBars()
 {
    g_chart.selectAll("rect")
        .sort(compareValues)
        .transition()
        .delay(function (d, i) {
        return i * 50;
    })
        .duration(500)
        .attr("x", function (d, i) {
        return xScale(i);
    });

    g_chart.selectAll('text')
        .sort(compareValues)
        .transition()
        .delay(function (d, i) {
        return i * 50;
    })
        .duration(1000)
        .text(function (d) {
        return d.value;
    })
        .attr("text-anchor", "middle")
        .attr("x", function (d, i) {
        return xScale(i) + xScale.rangeBand() / 2;
    })
        .attr("y", function (d) {
        return h - yScale(d.value) + 14;
    });
};


 function toTitleCase(e){var t=/^(a|an|and|as|at|but|by|en|for|if|in|of|on|or|the|to|vs?\.?|via)$/i;return e.replace(/([^\W_]+[^\s-]*) */g,function(e,n,r,i){return r>0&&r+n.length!==i.length&&n.search(t)>-1&&i.charAt(r-2)!==":"&&i.charAt(r-1).search(/[^\s-]/)<0?e.toLowerCase():n.substr(1).search(/[A-Z]|\../)>-1?e:e.charAt(0).toUpperCase()+e.substr(1)})};

 function setHeading( text )
 {
    document.getElementById("heading").innerHTML = "Visual Distribuenda: Allocation of " + toTitleCase(text);
 }

 function getSelectedText(elementId)
 {
    var elt = document.getElementById(elementId);
    if (-1 == elt.selectedIndex) { return null; }
    return elt.options[elt.selectedIndex].text;
 }

 function getColor( value, lowerBound, upperBound, isUpperBoundIdeal )
 {
//    assert( value >= lowerBound  &&  value <= upperBound, "value = " + value); //"Assertion failure in getColor() in distribuenda.js" );
     
    var interpolator = d3.interpolateHsl('rgb(0,255,0)', 'rgb(255,0,0)');
    if (isUpperBoundIdeal)
    {
       interpolator = d3.interpolateHsl('rgb(255,0,0)', 'rgb(0,255,0)');
    }
    var scale = d3.scale.linear()
        .domain([0, upperBound])
        .range([0, 1])

    return interpolator(scale(value)); // this will return a color in between red and green
 }


 function exportToCSV()
 {
    //
    // Get the distribution as text in CSV format
    //
    var csvContent = "";
    for (var i = 0;  i < g_distribution.length;  i++)
    {          
      csvContent += /* g_distribution[i].agent + ", " + */ g_distribution[i].value + ', \n';
    }

    //window.open('data:text/csv;charset=utf-8,' + escape(text)); 
    var uri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    var downloadLink = document.createElement("a");
    downloadLink.href = uri;
    downloadLink.download = "data.csv";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
 }



 // random walk, which starts at the initial value v above
 function next() 
 {
    return {
       agent: ++agent,
//       value: v = (populationSize < 30 ? (Math.random() * g_maxHeight) : ~~Math.max(10, Math.min(g_maxHeight, v + 20 * (Math.random() - .5))))
       value: v = (populationSize < 30 ? (Math.random() * g_maxHeight) : ~~Math.max(0, Math.min(g_maxHeight, v + 20 * (Math.random() - .5))))
    };
 }

// useful helper function if you want to sort the distribution by what the value of what the agent's are getting
function compareValues(a, b) {
  return a.value - b.value;
}

// useful helper function if you want to sort the distribution back to its original order -- unsort it, so to speak;
// unsorting the distribution here means sorting it by the indices ("social security numbers") of the agents.
function compareAgents(a, b) {
  return a.agent - b.agent;
}

function resetSorted()
{
  // if not equality (benchmark), then reset to unsorted view
  if (! g_equality)
  {
     g_isSorted = false;
     document.getElementById("sorted").innerHTML = "Sort it!";
  }
}

 //
 // Creates and graphs a new distribution.
 // sets g_distribution and g_chart;
 //
 function createDistribution() 
 {
   // init relevant variables
   agent = 0;

   resetSorted();

   g_distribution = []; // nuke the array
   populationSize = parseInt( document.getElementById("totalAgents").value );
   g_distribution = d3.range(populationSize).map(next); // starting dataset

   // distribution has been created;
   // now benchmark it and draw it
   benchmarkIt();
   g_chart = drawChart();
 }

 //
 // Draws the chart's bars in g_chartColor
 //
 function drawChart()
 {
//   if (g_variability < 50) blah
//   {
      v = Math.random() * g_maxHeight;
//   }
//   else
//   {
//      v = (Math.random() < 0.5 ? 0 : 1);
//   }
   
   w = g_chartWidth / populationSize, // 620 pixels is the width of chart

   //
   // Redo the bar mapping to bar location mapping
   //
   xScale = d3.scale.linear() // xScale is not a variable; it's a function!  (it's a "d3js scale")
     .domain([0, 1])
     .range([30, w + 30]);

   //
   // Nuke the old chart and a brand new one in its stead
   //
   d3.select("#chart1").remove();
   g_chart = d3.select("#chartParagraph").append("svg")
     .attr("class", "chart")
     .attr("width",  w * populationSize + 30 - 1)
     .attr("height", h)
     .attr("id", "chart1");

   // I have no idea why I have to sort again.
   // But if I don't, it'll reset to the unsorted distribution for some reason.
   if (g_isSorted)
   {
     g_distribution.sort( compareValues ); 
   }
   
   //
   // Draw the bars: graph the distribution by populating the chart with values in array 'distribution'
   //
   g_chart.selectAll("rect")
       .data(g_distribution)
     .enter().append("rect")
       .attr("fill", g_chartColor)
       .attr("x", function(d, i) { return xScale(i) - .5; })
       .attr("y", function(d) { return h - yScale(d.value) - .5; })
       .attr("width", w)
       .attr("height", function(d) { return yScale(d.value); })
       .attr("id", "rect") //function(d) { return d.id; })
       .on("mouseover", function(){d3.select(this).style("fill", "lightsteelblue");})
       .on("mouseout", function(){d3.select(this).style("fill", g_chartColor);})
     // Add a tooltip
     .append("svg:title")
       .text(function(d, i) { return "Agent " + g_distribution[i].agent + "\nhas " + g_distribution[i].value + " units\nof " + getSelectedText("distribuendum").toLowerCase()
   });


   //
   // Draw the x-axis
   //
   g_chart.append("line")
       .attr("x1", 30)
       .attr("x2", 30 + w * populationSize)
       .attr("y1", h - .5)
       .attr("y2", h - .5)
       .attr("stroke", "#000");


   //
   // Draw the adequacy threshold?
   //
   if (g_isAdequacy)
   {
     // assuming that this distribution has already been benchmarked -- i.e. benchmarkIt() has been run.
     // ...this assumption matters if we are to use the g_isNoOneInadequate flag.

     var adequacyLineColor = g_isNoOneInadequate ? "white" : "steelblue";

     g_chart.append("line")
         .attr("x1", 30)
         .attr("x2", 30 + w * populationSize)
         .attr("y1", h - .5 - g_adequacyThreshold)
         .attr("y2", h - .5 - g_adequacyThreshold)
         .attr("stroke", adequacyLineColor)
         .attr("stroke-width", "1");
   }

   //
   // Draw the y-axis
   //
   //g_chart.append("line")
   //    .attr("x1", 30)
   //    .attr("x2", 30)
   //    .attr("y1", 4)
   //    .attr("y2", h - .5)
   //    .style("stroke", "#000");

    return g_chart;
 }

 function benchmarkChanged()
 {
    benchmarkIt();
    drawChart();
 }

 function distribuendumChanged()
 {
   setHeading( getSelectedText("distribuendum"));
   createDistribution();
   drawChart();
 }


 function adequacyThresholdChanged()
 {
   var userRequestedAdequacyThreshold = document.getElementById("benchmarkValue").value;
   
   if (userRequestedAdequacyThreshold > 0 && userRequestedAdequacyThreshold < g_maxHeight)
   {
      // Aight, I know how to handle that kind of user input
      g_adequacyThreshold = userRequestedAdequacyThreshold;
      benchmarkIt();
      drawChart();
      document.getElementById("benchmarkOptionsContainer").setAttribute("class", ""); //"control-group success");
   }
   else 
   {
      // Don't know how to handle that kind of usre input (yet?)
      document.getElementById("benchmarkOptionsContainer").setAttribute("class", "control-group error");
      if (userRequestedAdequacyThreshold <= 0)
      {
         // TO DO: 
         //   Communicate to the user that the requested value is outside such-and-such range.
         //   I mean, we are about to reset the text field the user typed into, 
         //   so wouldn't be nice to explain to the user why we are ignoring his input?
         //   Write the message into the text field (to be added) to the right of the input field.
         //document.getElementById("benchmarkValue").value = ":("
      }
      if (userRequestedAdequacyThreshold <= 0)
      {
         // Same as above: communicate our inaptitute to the user so user can adjust input
      }
   }
 }


 //
 // Benchmarks the distribution using a given conception of justice.
 //
 // "Returns" the following by setting these global variables:
 //   g_chartColor
 //   g_isAdequacy
 //   g_adequacyThreshold
 //
 function benchmarkIt()
 {
    g_chartColor = DEFAULT_CHART_COLOR;
    g_isAdequacy = false;
    g_equality = false;

    whichBenchmarkToUse = document.getElementById("benchmark").selectedIndex;
    // 0 means 'none' (do not benchmark it)
    // 1 means overall efficiency
    // 2 means adequacy
    // 3 means equality

    document.getElementById("benchmarkOptionsContainer").setAttribute("style", "visibility:hidden"); // hide it by default; (re)show it below if appropriate

    document.getElementById("exportCSVlink").innerHTML = "Save as CSV";

    var benchmarkDescription = "Benchmark the distribution of some morally relevant good using a number of different conceptions of justice."; // default message
     
    if (1 == whichBenchmarkToUse)
    {
      //
      // efficiency -- for now assume "overall efficiency" (as in, aggregate efficiency)
      //
      actualEfficiency = 0;
  
      // calculate the aggregate efficiency in in this distribution
//      assert(populationSize == populationSize, "benchmarkIt() in distribuenda.js");
      for (var i = 0;  i < populationSize;  i++)
      {
          actualEfficiency += g_distribution[i].value;
      }

      // Let's make some assumptions:
      //   the point on pareto frontier with the greatest aggregate efficiency is ...
      idealEfficiency = populationSize * g_maxHeight; // everyone gets the most they can
 
      //
      // How far does actualEfficiency diverge from idealEfficiency?
      //

      // The value of actualEfficiency can range from 0 to idealEfficiency: [0, idealEfficiency]
      // So create a mapping from that range to RGB values in this range: [red, green]
      // red is (255,0,0)
      // green is (0,255,0)
      g_chartColor = getColor( actualEfficiency,  0, idealEfficiency, true );

      benchmarkDescription = "The greater overall efficiency, the better.  Some utilitarians (e.g. J.S. Mill) use this benchmark for distributions of happiness.";
    }
    else if (2 == whichBenchmarkToUse)
    {
      //
      // adequacy
      //

      g_isAdequacy = true;

      // the whole distribution "fails" if even one of its members (one of the agents) falls below the adequacy threshold
      g_isNoOneInadequate = true; // presumption of optimism since it only takes one agent being BELOW the adequacy threshold to prove us wrong
      g_isEveryoneInadequate = true; // presumption of pessimism since it only takes one agent being AT OR ABOVE the adequacy threshold to prove us wrong


      //
      // WILL MATTER FOR LARGE POPULATIONS:
      //
      //  Less efficient code but one that can tell between a state of affairs when
      //  SOME agent(s) don't have enough and the case when 
      //  ALL agents don't have enough.
      //
      for (var i = 0;  i < populationSize;  i++)
      {
          if (g_distribution[i].value < g_adequacyThreshold)
          {
              g_isNoOneInadequate = false;
          }

          if (g_distribution[i].value >= g_adequacyThreshold)
          {
              g_isEveryoneInadequate = false;
          }
      }

      /*
      //
      // WILL MATTER FOR LARGE POPULATIONS:
      //
      //  More efficient code but one that can't tell between a state of affairs when
      //  SOME agent(s) don't have enough and the case when
      //  ALL agents don't have enough.
      //
      for (var i = 0;  g_isNoOneInadequate && i < populationSize;  i++)
      {
          if (g_distribution[i].value < g_adequacyThreshold)
          {
              g_isNoOneInadequate = false;
          }
      } 
      */

      if (g_isNoOneInadequate)
      {
          g_chartColor = "green";
      }
      else if (g_isEveryoneInadequate)
      {
          g_chartColor = "red";
      }
      else // some are inadequate but not all
      {
          g_chartColor = "#C40000"
      }

      // Let the user override the default adequacy threshold
      document.getElementById("benchmarkOptionsContainer").setAttribute("style", "visibility:");

      benchmarkDescription = "What's important is that no one fall below the adequacy threshold.  The line of poverty is an example of an adequacy treshold."

    }
    else if (3 == whichBenchmarkToUse)
    {
      //
      // equality
      //
      g_equality = true;

      // Gini coefficient for now
      //
      // Using the formula for an "empirical distribution" from here:
      // http://www.had2know.com/academics/gini-coefficient-calculator.html
      
      var G = 0;
      var n = g_distribution.length;
      var sum1 = 0;
      var sum2 = 0;

      // Make sure the values are in ascending order;
      // this is a precondition for calculating the Gini coefficient
      g_distribution.sort( compareValues );
      
      // calculate the two sums
      for (var i = 1;  i <= n;  i++)
      {
          var xi = g_distribution[i-1].value;  // share per agent
          sum1 += ((n + 1 - i) * xi);
          sum2 += xi;
      }

      var a = (n + 1) / n;
      var b = (2 * sum1) / (n * sum2);
      G = Number(a - b).toFixed(2);  // precision to two decimal points
      var max = 1 - (1/n); // It's not true that the Gini coefficient is equal to 1 if one guy has everything; that's only true for an infinite number of players.
                           // This is important to us because we want the color red to represent the case of complete inequality given a finite population
                           // (i.e. an empirical distribution instead of a theoretical distribution).
      var G = Number(G * (1 / max)).toFixed(2); // The Drew Gini Coefficient -- good for small populations (e.g. n = 2) as it acknowledges that max != 1,
                                                      // where max is the maximum value the Gini coefficient can have given the size of the population.

      var howSensitiveAreWeToInequality = max/2; // the higher this number, the less sensitive; maximum value here should be 'max'
      //g_chartColor = getColor( G, 0, howSensitiveAreWeToInequality, false );
      g_chartColor = getColor( G, 0, 1, false );

      document.getElementById("exportCSVlink").innerHTML = "[G = " + G + "] &nbsp;Save as CSV";
        
      if (!g_isSorted)
      {
          g_distribution.sort( compareAgents );
      }

      benchmarkDescription = "It is bad if some people have a lot less than others. Using the Gini coefficient to see how unequal the distribution is.";
    }

    // Tell the user a little something about the benchmark she picked
    document.getElementById("benchmarkDescription").innerHTML = benchmarkDescription;
 }

