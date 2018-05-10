/* VARIABLES GLOBALES PARA LAS GRÁFICAS */
		/* Creamos una variable que será la que gestione los datos del índice de las estaciones.
		En este caso es importante saber que el tipo de gráfico (gráfico de barras => rowChart)
		lo definimos con las funciones de dc, y el tag que le pasamos como parámetro debe coincidir
		con el nombre del <div> en el HTML que lo contendrá */
		var stationNameChart = dc.rowChart("#stationName");
		var dayOfWeekChart = dc.rowChart('#day-of-week-chart');
		var moveChart = dc.lineChart('#monthly-move-chart');
		var volumeChart = dc.barChart('#monthly-volume-chart');

		

		/* Función de D3 */

		d3.csv("Datos_1.csv", function(err, data){
			/* Si hay errores, los mostramos y terminamos la ejecución del programa*/
			if( err ) throw err;
			/* Si no hay errores, mostramos los datos por consola */
			//console.log(data);
			

			var dateFormatSpecifier = '%Y-%m-%d %H:%M:%S';
		    var dateFormat = d3.timeFormat(dateFormatSpecifier);
		    var dateFormatParser = d3.timeParse(dateFormatSpecifier);
		    var numberFormat = d3.format('.2f');

		    data.forEach(function (d) {
		        d.dd = dateFormatParser(d.fecha);
		        d.month = d3.timeMonth(d.dd); // pre-calculate month for better performance
		        d.close = +d.close; // coerce to number
		        d.open = +d.open;
		    });



			/* Creamos el objeto de CrossFilter y le pasamos como parámetro los datos CSV */
			var ndx = crossfilter(data);
			/* Agrupamos todos los datos en una variable */
			var all = ndx.groupAll();

			/* Creamos variables que contendrán atributos de los datos leídos. En este caso,
			vamos a trabajar con la estación (un número que la identifica) y con el título
			(el nombre de la estación) */
			var yearlyDimension = ndx.dimension(function (d) {
        		return d3.timeYear(d.dd).getFullYear();
    		});

    		var dateDimension = ndx.dimension(function (d) {
        		return d.dd;
    		});

		    var moveMonths = ndx.dimension(function (d) {
		        return d.month;
		    });
		 
		    var monthlyMoveGroup = moveMonths.group().reduceSum(function (d) {
		        return Math.abs(d.close - d.open);
		    });

		    var volumeByMonthGroup = moveMonths.group().reduceSum(function (d) {
		        return d.NO2 / 500000;
		    });

		    var indexAvgByMonthGroup = moveMonths.group().reduce(
		        function (p, v) {
		            ++p.days;
		            p.total += (v.open + v.close) / 2;
		            p.avg = Math.round(p.total / p.days);
		            return p;
		        },
		        function (p, v) {
		            --p.days;
		            p.total -= (v.open + v.close) / 2;
		            p.avg = p.days ? Math.round(p.total / p.days) : 0;
		            return p;
		        },
		        function () {
		            return {days: 0, total: 0, avg: 0};
		        }
		    );

		    var dayOfWeek = ndx.dimension(function (d) {
		        var day = d.dd.getDay();
		        var name = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		        return day + '.' + name[day];
		    });
		    var dayOfWeekGroup = dayOfWeek.group();








			var stationNameDim = ndx.dimension( function(d){ return d.Titulo; } ),
				stationNO2Dim = ndx.dimension( function(d){ return d.NO2; } );




			/* Agrupamos los datos de cada categoría de tal forma que podamos trabajar con ellos */
			var stationNameGroup = stationNameDim.group();
			var stationNO2Group = stationNO2Dim.group().reduceCount();









			/* Asignamos los valores a representar a la variable que contiene la gráfica */
			stationNameChart
				.width(500)
				.dimension(stationNameDim)
				.group(stationNameGroup);




			dayOfWeekChart /* dc.rowChart('#day-of-week-chart', 'chartGroup') */
			    .width(180)
			    .height(180)
			    .margins({top: 20, left: 10, right: 10, bottom: 20})
			    .group(dayOfWeekGroup)
			    .dimension(dayOfWeek)

			//Assign colors to each value in the x scale domain			 
			    .ordinalColors(['#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#dadaeb'])
			    .label(function (d) {
			        return d.key.split('.')[1];
			    })

			//Title sets the row text			 
			    .title(function (d) {
			        return d.value;
			    })
			    .elasticX(true)
			    .xAxis().ticks(4);





		moveChart /* dc.lineChart('#monthly-move-chart', 'chartGroup') */
			    .renderArea(true)
		        .width(990)
		        .height(200)
		        .transitionDuration(1000)
		        .margins({top: 30, right: 50, bottom: 25, left: 40})
		        .dimension(moveMonths)
		        .mouseZoomable(true)

		//Specify a “range chart” to link its brush extent with the zoom of the current “focus chart”.		 
		        .rangeChart(volumeChart)
		        .x(d3.scaleTime().domain([new Date(2000, 0, 1), new Date(2016, 11, 31)]))
		        .round(d3.timeMonth.round)
		        .xUnits(d3.timeMonths)
		        .elasticY(true)
		        .renderHorizontalGridLines(true)

		//LEGEND
		//Position the legend relative to the chart origin and specify items’ height and separation.		 
		        .legend(dc.legend().x(800).y(10).itemHeight(13).gap(5))
		        .brushOn(false)

		//Add the base layer of the stack with group. The second parameter specifies a series name for use in the legend. 
		//The .valueAccessor will be used for the base layer		 
		        .group(indexAvgByMonthGroup, 'Media Mensual de Contaminante')
		        .valueAccessor(function (d) {
		            return d.value.avg;
		        })

		//Stack additional layers with .stack. The first paramenter is a new group. The second parameter is the series name. The third is a value accessor.		 
		        .stack(monthlyMoveGroup, 'Monthly Index Move', function (d) {
		            return d.value;
		        })

		//Title can be called by any stack layer.		 
		        .title(function (d) {
		            var value = d.value.avg ? d.value.avg : d.value;
		            if (isNaN(value)) {
		                value = 0;
		            }
		            return dateFormat(d.key) + '\n' + numberFormat(value);
		        });






		    volumeChart.width(990) /* dc.barChart('#monthly-volume-chart', 'chartGroup'); */
		        .height(40)
		        .margins({top: 0, right: 50, bottom: 20, left: 40})
		        .dimension(moveMonths)
		        .group(volumeByMonthGroup)
		        .centerBar(true)
		        .gap(1)
		        .x(d3.scaleTime().domain([new Date(2000, 0, 1), new Date(2016, 11, 31)]))
		        .round(d3.timeMonth.round)
		        .alwaysUseRounding(true)
		        .xUnits(d3.timeMonths);








            // stationNO2Chart
            //     .width(768)
          		// .height(380)
	          	// .x(d3.scaleBand())
	          	// .xUnits(dc.units.ordinal)
	          	// //.brushOn(false)
	          	// .xAxisLabel('NO2')
	          	// .dimension(stationNameDim)
	          	// .barPadding(0.1)
	          	// .outerPadding(0.05)
	          	// .group(stationNO2Group);











				dc.renderAll();

		});