'use strict';

/* jshint globalstrict: true */
/* global dc,d3,crossfilter,colorbrewer */

/* VARIABLES GLOBALES PARA LAS GRÁFICAS */
		

		/* Creamos una variable que será la que gestione los datos del índice de las estaciones.
		En este caso es importante saber que el tipo de gráfico (gráfico de barras => rowChart)
		lo definimos con las funciones de dc, y el tag que le pasamos como parámetro debe coincidir
		con el nombre del <div> en el HTML que lo contendrá */
		var stationNameChart = dc.rowChart("#stationName");
		var dayOfWeekChart = dc.rowChart('#day-of-week-chart');
		var hoursChart = dc.pieChart('#hours-chart');
		var contaminantesChart = dc.lineChart('#monthly-contaminantes-chart');
		var contaminantesVolumeChart = dc.barChart('#contaminantes-volume-chart');
		var TMPChart = dc.lineChart('#monthly-TMP-chart');
		var TMPVolumeChart = dc.barChart('#TMP-volume-chart');
		var HRChart = dc.lineChart('#monthly-HR-chart');
		var HRVolumeChart = dc.barChart('#HR-volume-chart');
		

		

		/* Función de D3 */

		d3.csv("Datos_1.csv", function(err, data){
			/* Si hay errores, los mostramos y terminamos la ejecución del programa*/
			if( err ) throw err;
			/* Si no hay errores, mostramos los datos por consola */
			//console.log(data);
			

			/* Como los datos se obtienen desde nu archivo CSV, hay que formatear la fecha antes
			trabajar con el con dc.js */
			var dateFormatSpecifier = '%Y-%m-%d %H:%M:%S';
		    var dateFormat = d3.timeFormat(dateFormatSpecifier);
		    var dateFormatParser = d3.timeParse(dateFormatSpecifier);
		    var numberFormat = d3.format('.2f');

		    data.forEach(function (d) {
		        d.dd = dateFormatParser(d.fecha);
		        d.month = d3.timeMonth(d.dd); // pre-calculate month for better performance
		        d.SO2 = +d.SO2;
		        d.NO2 = +d.NO2;
		        d.NO = +d.NO;
		        d.CO = +d.CO;
		        d.PM10 = +d.PM10;
		        d.HR = +d.HR;
		        d.TMP = d.TMP;

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



			var yearlyPerformanceGroup = yearlyDimension.group().reduceSum(
			        /* callback for when data is added to the current filter results */
			        function (d) {
			        	return d.NO2;
			        }

			    );


    		var dateDimension = ndx.dimension(function (d) {
        		return d.dd;
    		});

		    var monthDimension = ndx.dimension(function (d) {
		        return d.month;
		    });
		 
		    // var monthlyMoveGroup = monthDimension.group().reduceSum(function (d) {
		    //     return Math.abs(d.NO2);
		    // });

		    var NO2ByMonthGroup = monthDimension.group().reduceSum(function (d) {
		        return Math.abs(d.NO2);
		    });

		    var NOByMonthGroup = monthDimension.group().reduceSum(function (d) {
		        return Math.abs(d.NO);
		    });

		    var PM10ByMonthGroup = monthDimension.group().reduceSum(function (d) {
		        return Math.abs(d.PM10);
		    });

		    var COByMonthGroup = monthDimension.group().reduceSum(function (d) {
		        return Math.abs(d.CO);
		    });		    

		    var TMPByMonthGroup = monthDimension.group().reduceSum(function (d) {
		        return d.TMP;
		    });	

		    var HRByMonthGroup = monthDimension.group().reduceSum(function (d) {
		        return Math.abs(d.HR);
		    });		

		    var SO2ByMonthGroup = monthDimension.group().reduceSum(function (d) {
		        return Math.abs(d.SO2);
		    });	


		    var indexAvgByMonthGroup = monthDimension.group().reduce(
		        function (p, v) {
		            ++p.days;
		            p.total += v.NO2;
		            p.avg = Math.round(p.total / p.days);
		            return p;
		        },
		        function (p, v) {
		            --p.days;
		            p.total -= v.NO2;
		            p.avg = p.days ? Math.round(p.total / p.days) : 0;
		            return p;
		        },
		        function () {
		            return {days: 0, total: 0, avg: 0};
		        }
		    );

		    var dayOfWeek = ndx.dimension(function (d) {
		        var day = d.dd.getDay();
		        var name = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
		        return day + '.' + name[day];
		    });
		    var dayOfWeekGroup = dayOfWeek.group();


		    var hourOfTheDayDimension = ndx.dimension(function (d) {
		        var hour = d.dd.getHours();
		        var name = ['00', '01', '02', '03', '04', '05',
		        			'06', '07', '08', '09', '10', '11',
		        			'12', '13', '14', '15', '16', '17',
		        			'18', '19', '20', '21', '22', '23'];
		        return hour + '.' + name[hour];
		    });
		    var hourOfTheDayGroup = hourOfTheDayDimension.group();


			var stationNameDim = ndx.dimension( function(d){ return d.Titulo; } ),
				stationNO2Dim = ndx.dimension( function(d){ return d.NO2; } );




			/* Agrupamos los datos de cada categoría de tal forma que podamos trabajar con ellos */
			var stationNameGroup = stationNameDim.group();
			var stationNO2Group = stationNO2Dim.group().reduceCount();




			/* Asignamos los valores a representar a la variable que contiene la gráfica */
			stationNameChart
				.width(400)
				.dimension(stationNameDim)
				.group(stationNameGroup);




			dayOfWeekChart /* dc.rowChart('#day-of-week-chart', 'chartGroup') */
			    .width(180)
			    .height(180)
			    .margins({top: 20, left: 10, right: 10, bottom: 20})
			    .group(dayOfWeekGroup)
			    .dimension(dayOfWeek)
			//Assign colors to each value in the x scale domain			 
			    .label(function (d) {
			        return d.key.split('.')[1];
			    })
			//Title sets the row text			 
			    .title(function (d) {
			        return d.value;
			    })
			    .elasticX(true)
			    .xAxis().ticks(4);



			hoursChart /* dc.pieChart('#quarter-chart', 'chartGroup') */
		        .width(190)
		        .height(190)
		        .radius(70)
		        .innerRadius(40)
		        .externalLabels(15)
		        .minAngleForLabel(0)
		        .group(hourOfTheDayGroup)
		        .dimension(hourOfTheDayDimension)
		        //.drawPaths(true)
		        .label(function (d) {
			        return d.key.split('.')[1];
			    });










		contaminantesChart /* dc.lineChart('#monthly-move-chart', 'chartGroup') */
			    .renderArea(true)
		        .width(990)
		        .height(200)
		        .transitionDuration(1000)
		        .margins({top: 30, right: 50, bottom: 25, left: 40})
		        .dimension(monthDimension)
		        .mouseZoomable(true)

		//Specify a “range chart” to link its brush extent with the zoom of the current “focus chart”.		 
		        .rangeChart(contaminantesVolumeChart)
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
		        // .group(indexAvgByMonthGroup, 'Media Mensual de NO2')
		        // .valueAccessor(function (d) {
		        //     return d.value.avg;
		        // })
		        .group(NO2ByMonthGroup, 'Media Mensual de NO2')
		        .valueAccessor(function (d) {
		            return d.value/6154;
		        })

		//Stack additional layers with .stack. The first paramenter is a new group. The second parameter is the series name. The third is a value accessor.		 
		        .stack(NOByMonthGroup, 'Media Mensual de NO', function (d) {
		            return d.value/8989;
		        })
		        .stack(COByMonthGroup, 'Media Mensual de CO', function (d) {
		            return d.value/431472;
		        })
		        .stack(SO2ByMonthGroup, 'Media Mensual de SO2', function (d) {
		            return d.value/52174;
		        })		        
		        .stack(PM10ByMonthGroup, 'Media Mensual de PM10', function (d) {
		            return d.value/30189;
		        })		        

		//Title can be called by any stack layer.		 
		        .title(function (d) {
		            var value = d.value.avg ? d.value.avg : d.value;
		            if (isNaN(value)) {
		                value = 0;
		            }
		            return dateFormat(d.key) + '\n' + numberFormat(value);
		        });



		    contaminantesVolumeChart.width(990) /* dc.barChart('#monthly-volume-chart', 'chartGroup'); */
		        .height(40)
		        .margins({top: 0, right: 50, bottom: 20, left: 40})
		        .dimension(monthDimension)
		        .group(NOByMonthGroup)
		        .centerBar(true)
		        .gap(1)
		        .x(d3.scaleTime().domain([new Date(2000, 0, 1), new Date(2016, 11, 31)]))
		        .round(d3.timeMonth.round)
		        .alwaysUseRounding(true)
		        .xUnits(d3.timeMonths);





		TMPChart /* dc.lineChart('#monthly-move-chart', 'chartGroup') */
			    .renderArea(true)
		        .width(990)
		        .height(200)
		        .transitionDuration(1000)
		        .margins({top: 30, right: 50, bottom: 25, left: 40})
		        .dimension(monthDimension)
		        .mouseZoomable(true)

		//Specify a “range chart” to link its brush extent with the zoom of the current “focus chart”.		 
		        .rangeChart(TMPVolumeChart)
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
		        // .group(indexAvgByMonthGroup, 'Media Mensual de NO2')
		        // .valueAccessor(function (d) {
		        //     return d.value.avg;
		        // })
		        .group(TMPByMonthGroup, 'Media Mensual Temperatura')
		        .valueAccessor(function (d) {
		        	console.log(d);
		            return d.value/4000;
		        })

		//Stack additional layers with .stack. The first paramenter is a new group. The second parameter is the series name. The third is a value accessor.		 
		        // .stack(monthlyMoveGroup, 'Media Mensual de PM10', function (d) {
		        //     return d.value;
		        // })



		//Title can be called by any stack layer.		 
		        .title(function (d) {
		            var value = d.value.avg ? d.value.avg : d.value;
		            if (isNaN(value)) {
		                value = 0;
		            }
		            return dateFormat(d.key) + '\n' + numberFormat(value);
		        });



		    TMPVolumeChart.width(990) /* dc.barChart('#monthly-volume-chart', 'chartGroup'); */
		        .height(40)
		        .margins({top: 0, right: 50, bottom: 20, left: 40})
		        .dimension(monthDimension)
		        .group(TMPByMonthGroup)
		        .centerBar(true)
		        .gap(1)
		        .x(d3.scaleTime().domain([new Date(2000, 0, 1), new Date(2016, 11, 31)]))
		        .round(d3.timeMonth.round)
		        .alwaysUseRounding(true)
		        .xUnits(d3.timeMonths);









		HRChart /* dc.lineChart('#monthly-move-chart', 'chartGroup') */
			    .renderArea(true)
		        .width(990)
		        .height(200)
		        .transitionDuration(1000)
		        .margins({top: 30, right: 50, bottom: 25, left: 40})
		        .dimension(monthDimension)
		        .mouseZoomable(true)

		//Specify a “range chart” to link its brush extent with the zoom of the current “focus chart”.		 
		        .rangeChart(HRVolumeChart)
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
		        // .group(indexAvgByMonthGroup, 'Media Mensual de NO2')
		        // .valueAccessor(function (d) {
		        //     return d.value.avg;
		        // })
		        .group(HRByMonthGroup, 'Media Mensual de Humedad Rel.')
		        .valueAccessor(function (d) {
		            return d.value/3800;
		        })

		//Stack additional layers with .stack. The first paramenter is a new group. The second parameter is the series name. The third is a value accessor.		 
		        // .stack(NOByMonthGroup, 'Media Mensual de NO', function (d) {
		        //     return d.value/1000;
		        // })

		//Title can be called by any stack layer.		 
		        .title(function (d) {
		            var value = d.value.avg ? d.value.avg : d.value;
		            if (isNaN(value)) {
		                value = 0;
		            }
		            return dateFormat(d.key) + '\n' + numberFormat(value);
		        });




		    HRVolumeChart.width(990) /* dc.barChart('#monthly-volume-chart', 'chartGroup'); */
		        .height(40)
		        .margins({top: 0, right: 50, bottom: 20, left: 40})
		        .dimension(monthDimension)
		        .group(HRByMonthGroup)	        
		        .centerBar(true)
		        .gap(1)
		        .x(d3.scaleTime().domain([new Date(2000, 0, 1), new Date(2016, 11, 31)]))
		        .round(d3.timeMonth.round)
		        .alwaysUseRounding(true)
		        .xUnits(d3.timeMonths);


				dc.renderAll();

		});