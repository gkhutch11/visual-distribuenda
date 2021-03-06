 var DEBUG_MODE = true;
 var DEFAULT_CHART_COLOR = "steelblue";
 var g_chartColor = DEFAULT_CHART_COLOR;
 var g_chartWidth = 800;

 var g_showSortedDistribution = false;

 // which benchmark to use?
 var g_isEquality = false;
 var g_isAdequacy = false; // display the adequacy threshold iff this flag is true
 var g_isUtility  = false;

 var g_adequacyThreshold = 0;
 var g_isNoOneInadequate = true;

 var g_variability = 20;

 // sorted chart for equality benchmark
 var g_sortOrder = true;
 var g_isSorted = false; // show chart sorted

 var g_maxHeight = 200;
 var g_populationSize = 12;
 var agent = 1;
 var v = 0; //Math.random() * g_maxHeight;
 var g_baseDistribution = [];
 var g_distribution = []; //d3.range(g_populationSize).map(nextBase); // starting dataset


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
    if (!isChrome && !isSafari && !(ieVer > 10.0))
    {
        //
        // Unsupported browser :(
        // Give the user the bad news
        // 
        document.getElementById("everything").setAttribute("style", "visibility: hidden");
        //if (ieVer > -1 && ieVer <= 10.0)
        //{ 
            document.getElementById("heading").innerHTML = "Sorry, I don't think our stuff works in your browser.  Would you mind using Chrome instead?";
            document.getElementById("benchmarkDescription").innerHTML = "You can download Google Chrome here: <a hred='http://www.google.com/chrome/‎'>www.google.com/chrome/</a>";
        //} else {
        //    document.getElementById("heading").innerHTML = "Sorry, I don't think our stuff works in your browser.  Would you mind trying another browser?";
        //}
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

    createBaseDistribution();
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
    for (var i = 0;  i < g_baseDistribution.length;  i++)
    {          
      csvContent += g_baseDistribution[i].value + ', \n';
    }
     
//    for (var i = 0;  i < g_distribution.length;  i++)
//    {          
//      csvContent += /* g_distribution[i].agent + ", " + */ g_distribution[i].value + ', \n';
//    }

    //window.open('data:text/csv;charset=utf-8,' + escape(text)); 
    var uri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    var downloadLink = document.createElement("a");
    downloadLink.href = uri;
    downloadLink.download = "data.csv";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
 }



 function next() 
 {
    return {
       agent: ++agent,
       value: g_baseDistribution[agent].value
    };
 }

// random walk, which starts at the initial value v above
 function nextBase()
 {
    return {
       agent: ++agent,
       value: v = ~~Math.max(0, Math.min(g_maxHeight, v + 20 * (Math.random() - .5)))
       //value: v = (g_populationSize < 30 ? (Math.random() * g_maxHeight) : ~~Math.max(0, Math.min(g_maxHeight, v + 20 * (Math.random() - .5))))
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
  if (! g_isEquality)
  {
     g_isSorted = false;
     document.getElementById("sorted").innerHTML = "Sort it!";
  }
}

// returns a cloned version of d1
function cloneDistribution( d1 )
{
   // shallow copy
   var d2 = Object.create( d1 );

   // deep copy
   for (var i = 0;  i < d1.length;  i++)
   {
     d2[i].agent = d1[i].agent;
     d2[i].value = d1[i].value;
   }

   return d2;
}

function createBaseDistribution()
{
    var maxPopulationSize = 200;
    g_baseDistribution = [];

    agent = 0;
    v = Math.random() * g_maxHeight;
    g_baseDistribution = d3.range(maxPopulationSize).map(nextBase); // starting dataset
}


 //
 // Creates and graphs a new distribution.
 // sets g_distribution and g_chart;
 //
 function createDistribution()
 {
   // init relevant variables
   resetSorted();
   //g_distribution = []; // nuke the array

   g_populationSize = parseInt( document.getElementById("totalAgents").value );

   //if (g_populationSize != 100)
   {
      g_distribution = cloneDistribution( g_baseDistribution );
      g_distribution.splice( g_populationSize, g_baseDistribution.length - g_populationSize );
   }
   /*
   else
   {
      g_distribution = Object.create( g_baseDistribution ).slice( 0, 100);
      var j = 0;
      for (var i = 0;  i < g_populationSize;  i++)
      {
        g_distribution[i].agent = g_baseDistribution[j].agent;
        g_distribution[i].value = parseInt( (g_baseDistribution[j].value + g_baseDistribution[j+1].value) / 2 );

        j += 2;
      }
   }
   */
   
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
   var leftMargin=0;
//   if (g_variability < 50) blah
//   {
      v = Math.random() * g_maxHeight;
//   }
//   else
//   {
//      v = (Math.random() < 0.5 ? 0 : 1);
//   }
   
   w = g_chartWidth / g_populationSize, // 620 pixels is the width of chart

   //
   // Redo the bar mapping to bar location mapping
   //
   xScale = d3.scale.linear() // xScale is not a variable; it's a function!  (it's a "d3js scale")
     .domain([0, 1])
     .range([leftMargin, w + leftMargin]);

   //
   // Nuke the old chart and a brand new one in its stead
   //
   d3.select("#chart1").remove();
   g_chart = d3.select("#chartParagraph").append("svg")
     .attr("class", "chart")
     .attr("width",  w * g_populationSize + leftMargin - 1)
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
       .attr("x1", leftMargin)
       .attr("x2", leftMargin + w * g_populationSize)
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
         .attr("x1", leftMargin)
         .attr("x2", leftMargin + w * g_populationSize)
         .attr("y1", h - .5 - g_adequacyThreshold)
         .attr("y2", h - .5 - g_adequacyThreshold)
         .attr("stroke", adequacyLineColor)
         .attr("stroke-width", "1");
   }

   //
   // Draw the y-axis
   //
   //g_chart.append("line")
   //    .attr("x1", leftMargin)
   //    .attr("x2", leftMargin)
   //    .attr("y1", 4)
   //    .attr("y2", h - .5)
   //    .style("stroke", "#000");

    return g_chart;
 }

 function benchmarkChanged()
 {
    benchmarkIt();
    updateLegend();
    drawChart();
 }

 function updateLegend()
 {
    var legendImageSrc  = "";
    var versionImageSrc = "";

    if (g_isAdequacy)
    {
      versionImageSrc = "img/versionGray.png"
      legendImageSrc = "img/legendAdequacy.png";
    }
    else if (g_isEquality)
    {
      versionImageSrc = "img/versionGray.png"
      legendImageSrc = "img/legendEquality.png";
    }
    else if (g_isUtility)
    {
      versionImageSrc = "img/versionGray.png"
      legendImageSrc = "img/legendUtility.png"
    }
    else
    {
      //versionImageSrc = "img/version.png"
      legendImageSrc = "img/legendBlank.png";
    }
    document.getElementById("legendImage").src  = legendImageSrc;
    document.getElementById("versionImage").src = versionImageSrc;
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
    g_isEquality = false;

    document.getElementById("benchmarkDescription").innerHTML = getBenchmarkDescription(); // Tell the user a little something about the benchmark she picked

    document.getElementById("benchmarkOptionsContainer").setAttribute("style", "visibility:hidden"); // hide it by default; (re)show it below if appropriate

    document.getElementById("exportCSVlink").innerHTML = "Save as CSV";
     
    if (1 == whichBenchmarkToUse)
    {
      g_isUtility = true;

      //
      // efficiency -- for now assume "overall efficiency" (as in, aggregate efficiency)
      //
      actualEfficiency = 0;
  
      // calculate the aggregate efficiency in in this distribution
//      assert(g_populationSize == g_populationSize, "benchmarkIt() in distribuenda.js");
      for (var i = 0;  i < g_populationSize;  i++)
      {
          actualEfficiency += g_distribution[i].value;
      }

      // Let's make some assumptions:
      //   the point on pareto frontier with the greatest aggregate efficiency is ...
      idealEfficiency = g_populationSize * g_maxHeight; // everyone gets the most they can
 
      //
      // How far does actualEfficiency diverge from idealEfficiency?
      //

      // The value of actualEfficiency can range from 0 to idealEfficiency: [0, idealEfficiency]
      // So create a mapping from that range to RGB values in this range: [red, green]
      // red is (255,0,0)
      // green is (0,255,0)
      g_chartColor = getColor( actualEfficiency,  0, idealEfficiency, true );
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
      for (var i = 0;  i < g_populationSize;  i++)
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
      for (var i = 0;  g_isNoOneInadequate && i < g_populationSize;  i++)
      {
          if (g_distribution[i].value < g_adequacyThreshold)
          {
              g_isNoOneInadequate = false;
          }
      } 
      */

      if (g_isNoOneInadequate)
      {
          g_chartColor = "green"; // (R,G,B) = (0, 128, 0)
      }
      else if (g_isEveryoneInadequate)
      {
          g_chartColor = "red"; // (R,G,B) = (255, 0,)
      }
      else // some are inadequate but not all
      {
          g_chartColor = "#C40000"; // (R,G,B) = (196, 0, 0)
      }

      // Let the user override the default adequacy threshold
      document.getElementById("benchmarkOptionsContainer").setAttribute("style", "visibility:");

     // benchmarkDescription = "What's important is that no one fall below the adequacy threshold.  The line of poverty is an example of an adequacy treshold."

    }
    else if (3 == whichBenchmarkToUse)
    {
      //
      // equality
      //
      g_isEquality = true;

      // Gini coefficient for now
      //
      // Using the formula for an "empirical distribution" from here:
      // http://www.had2know.com/academics/gini-coefficient-calculator.html
      
      var G = 0;
      var n = g_populationSize; //g_distribution.length;
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

     // benchmarkDescription = "It is bad if some people have a lot less than others. Using the Gini coefficient to see how unequal the distribution is.";
    }
    else
    {
      g_isUtility  = false;
      g_isEquality = false;
      g_isUtility  = false;
    }
 }

  function getBenchmarkDescription()
 {
   whichBenchmarkToUse = document.getElementById("benchmark").selectedIndex;
    // 0 means 'none' (do not benchmark it)
    // 1 means overall efficiency
    // 2 means adequacy
    // 3 means equality

    whichDistribuendumIsSelected = document.getElementById("distribuendum").selectedIndex;
    // 0 means money
    // 1 means health
    // 2 means social capital
    // 3 means friends and family
    // 4 means happiness
    // 5 means wellbeing
    // 6 means eudaimonia

    var benchmarkDescription = "Benchmark the distribution of some morally relevant good using a number of different conceptions of justice."; // default message
  
  switch (whichDistribuendumIsSelected)
      {
        case (0):    
          if (0 == whichBenchmarkToUse) // money and no benchmark
          {
            benchmarkDescription = "Studying distributions of wealth was the predominant measure of the health of a society throughout the 20th century. Rightly or wrongly, we tend to think of countries with a high Gross Domestic Product as wealthy. How the GDP is distributed though, is another question."
          }
           else if (1 == whichBenchmarkToUse) // money and overall efficiency
          { 
            benchmarkDescription = "The greater the overall effieciency, the better. This utilitarian benchmark focuses on the total wealth of all individuals rather than on the 'shape' of the distribution."
          }
           else if (2 == whichBenchmarkToUse) // money and adequacy
          {
            benchmarkDescription = "This benchmark focuses on whether everyone in the distribution reaches the adequacy threshold. In the case of money, the poverty line is an example of an adequacy threshold."
          }
           else if (3 == whichBenchmarkToUse) // money and equality
          {
            benchmarkDescription = "More money is great, but not if it creates large divides in the population. This benchmark uses the Gini coefficient to measure the amount of inequality in the distribution."
          }
        break;

        case (1):
          if (0 == whichBenchmarkToUse) // health and no benchmark
          {
            benchmarkDescription = "Factors that determine the physical health of a society include things like life expectancy, obesity percentage, and infant mortality rate."          
          }
           else if (1 == whichBenchmarkToUse) // health and overall efficiency
          {
            benchmarkDescription = "The greater the overall effieciency, the better. This utilitarian benchmark focuses on the total health of all individuals rather than on the 'shape' of the distribution."
          }
           else if (2 == whichBenchmarkToUse) // health and adequacy
          {
            benchmarkDescription = "This benchmark focuses on whether everyone in the distribution reaches the adequacy threshold. In the case of health, inadequacies can have especially severe consequences."
          }
           else if (3 == whichBenchmarkToUse) // health and equality
          {
            benchmarkDescription = "Inequalities in health distributions can be the result of personal choice, or it can indicate flaws in the heatlh care system as a whole. &nbsp;&nbsp;&nbsp;&nbsp;"
          }                                                                                 
        break;

        case (2):
          if (0 == whichBenchmarkToUse) // social capital and no benchmark
          {
            benchmarkDescription = "Social capital is a way to quantify the value of your phone's contacts list. Social media sites like LinkedIn are centered around rising this number."
          }
           else if (1 == whichBenchmarkToUse) // social capital and overall efficiency
          {
            benchmarkDescription = "Research has shown that people accomplish more collectively than they would on their own. It should follow that social distributions with strong social network ties should be capable of more than one consisting of loners."
          }
           else if (2 == whichBenchmarkToUse) // social capital and adequacy
          {
            benchmarkDescription = "This benchmark focuses on whether everyone in the distribution reaches the adequacy threshold. In the case of social capital, reaching the adequacy threshold means you have someone who will bail you out of jail."
          }
           else if (3 == whichBenchmarkToUse) // social capital and equality
          {
            benchmarkDescription = "Some people are social butterflies and can call on any number of people if they find themselves in a jam. However, people with little social capital are often forced to pave thier own path without any help."
          }                                                                                 
        break;

        case (3):
          if (0 == whichBenchmarkToUse) // friends and family and no benchmark
          {
            benchmarkDescription = "Material wealth alone is not enough to satisfy our deepest needs as human beings. Having a strong base of friends and family is important for when the going gets rough."
          }
           else if (1 == whichBenchmarkToUse) // friends and family and overall efficiency
          {
            benchmarkDescription = "Material wealth alone is not enough to satisfy our deepest needs as human beings. Having a strong base of friends and family is important for when the going gets rough."
          }
           else if (2 == whichBenchmarkToUse) // friends and family and adequacy
          {
            benchmarkDescription = "This benchmark focuses on whether everyone in the distribution reaches the adequacy threshold. When it comes to friends and family, sometimes a tight knit group is stronger than a large group with loose ties."
          }
           else if (3 == whichBenchmarkToUse) // friends and family and equality
          {
            benchmarkDescription = "An unequal distribution of friends and family can could mean that some people are just more social than others. As a reference point, the average Facebook user has 141.5 friends, as of June 2013."
          }                                                                                 
        break;

        case (4):
          if (0 == whichBenchmarkToUse) // happiness and no benchmark
          {
            benchmarkDescription = "Happiness distributions help us evaluate the emotional health of a society. However, this data can be misleading because it is often based on self-reported levels of happiness."
          }
           else if (1 == whichBenchmarkToUse) // happiness and overall efficiency
          {
          benchmarkDescription = "Any leader who promised to maximize total happiness would certainly have my support. It just so happens that the king of Bhutan famously decided to prioritize “Gross National Happiness” over the more typical “Gross National Product.”"
          }
           else if (2 == whichBenchmarkToUse) // happiness and adequacy
          {
          benchmarkDescription = "This benchmark focuses on whether everyone in the distribution reaches the adequacy threshold. For our purposes, someone who is clinically depressed has an inadequate amount of happiness."
          }
           else if (3 == whichBenchmarkToUse) // happiness and equality
          {
          benchmarkDescription = "Happiness distributions are generally based on self-reported levels of happiness. Therefore, inequality can either indicate actual differences in satisfaction, or merely a difference in the definintion of happiness. "
          }                                                                                 
        break;

        case (5):
          if (0 == whichBenchmarkToUse) // wellbeing and no benchmark
          {
            benchmarkDescription = "Measures of wellbeing include factors such as health and happiness. They are used to supplement traditional measures that only incorporate economic factors."
          }
           else if (1 == whichBenchmarkToUse) // wellbeing and overall efficiency
          {
            benchmarkDescription = "The greater the overall effieciency, the better. This utilitarian benchmark focuses on the total wellbeing of all individuals rather than on the 'shape' of the distribution."
          }
           else if (2 == whichBenchmarkToUse) // wellbeing and adequacy
          {
          benchmarkDescription = "This benchmark focuses on whether everyone in the distribution reaches the adequacy threshold. In the case of wellbeing, reaching this threshold means having an adequate amount of health, wealth, and overall satisfaction with life."
          }
           else if (3 == whichBenchmarkToUse) // wellbeing and equality
          {
          benchmarkDescription = "This benchmark focuses on how evenly wellbeing is distributed across society. We use the Gini coefficient to quanitify how well-off individual agents are."
          }                                                                                 
        break;

        case (6):
          if (0 == whichBenchmarkToUse) // eudaimonia and no benchmark
          {
          benchmarkDescription = "'Eudaimonia' is a term coined by Aristotle that can be taken to mean 'living well.' It is seen by many as the ultimate measure of human flourishing."
          }
           else if (1 == whichBenchmarkToUse) // eudaimonia and overall efficiency
          {
          benchmarkDescription = "'Eudaimonia' is a term coined by Aristotle that can be taken to mean 'living well.' It is seen by many as the ultimate measure of human flourishing, and this benchmark focuses on the total amount of eudaimonia across the distribution."
          }
           else if (2 == whichBenchmarkToUse) // eudaimonia and adequacy
          {
          benchmarkDescription = "This benchmark focuses on whether everyone in the distribution reaches the adequacy threshold. If someone feels as through they are notflourishing in their current role then they may have inadequate eudaimonia."
          }
           else if (3 == whichBenchmarkToUse) // eudaimonia and equality
          {
          benchmarkDescription = "'Eudaimonia' is a term coined by Aristotle that can be taken to mean 'living well.' It is seen by many as the ultimate measure of human flourishing, and this benchmark focuses on how evenly distributed eudaimonia is throughout a society."
          }                                                                                 
        break;
      }
    return benchmarkDescription;
 }


