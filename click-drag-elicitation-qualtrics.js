$( document ).ready(function() {
    $('.chart').each(function( index ) {
    chart(index, $( this ).data());
    $( this ).before('<div style="text-align: right;"><button  class="undo btn  btn-warning mx-1"  disabled  type="button">Undo</button><button class="reset btn  btn-danger  mx-1" disabled  type="button">Reset</button><button class="normalize btn btn-primary  mx-1" style="color: #fff;"  type="button">Scale to Sum to 100</button></div>');
    $( this ).after('<div class="mt-2" style="text-align: center;margin-left:50px"><a class="SubmitDistribution btn btn-success">Submit the distribution</a></div>');
    });

    function chart(chartindex, params){


        let js_vars = {
            nb_bins: Number(params.n_bins),
            min: Number(params.min),
            step: Number(params.step),
                xAxisTitle: params.x_axis_title,
                yAxisTitle: params.y_axis_title,
            yMax: Number(params.y_max),
            xUnit: params.x_unit,
            DistributionResult:params.distribution_result,
            DistributionYData:params.distribution_ydata,
            DistributionXData:params.distribution_xdata,
            DistributionHistory:params.distribution_history
        }

        let history = [];
        function liveSend(data) {
            history.push(data);
                console.log(history);
        }

        // -----


        let min = 0;
        let max = 1;

        let step_tick;
        let nb_bins;
        let model_data;
        let min_tick;


        nb_bins = js_vars.nb_bins;
        min_tick = js_vars.min;
        step_tick = js_vars.step;
        model_data = [1, 0];


        let step = (max - min) / (nb_bins - 1);

        let zoom_area = 1.1;
        let startdate;
        let max_val = 1;

        let bins = [];



        let score = 0;


        let point_r = 10; //px

        let sent = false;


        function computevalue(sub) {
            let val = Math.round(100 * (1 - sub.reduce((a, b) => a + b, 0)));
            if (val > 0) {
                return val;
            } else {
                return 0;
            }
        }

        function senddata(delay_ms, serie) {
                liveSend(
                    {
                        'delay_ms': delay_ms,
                        'xData': serie.xData,
                                        'yData':serie.yData,
                    }
                ); 
        }

        function send_first() {
            if (sent == false) {
                senddata(0, chart.series[1]);
                sent = true;
            }
        };

        function settocurve() {
            mode = "curve";

            chart.series[1].setState("inactive", true);

            $('#bins_container').hide();


            chart.series[0].update({
                marker: {
                    enabled: true
                },
                opacity: 0.7,
                dragDrop: {
                    draggableY: true,
                    draggableX: true,
                },
            });
        }





        function stopdrag(point, e) {

            let curve = point.series;
            let data = curve.data;
            let bins = point.series.chart.series[1].data;
            let index = point.index;
            let dist = (bins[1].x - bins[0].x) / 2;


            if (point.dist > 2 * point_r) {
                return false;
            } else if (index == 0) {


                if (e.newPoint.x >= dist) {
                    if ((e.newPoint.x >= (data[index + 1].x) - dist)) {
                        return false;
                    } else {
                        //return false;
                        curve.addPoint([min, bins[0].y], true, false, false);
                    }
                }
            } else if (index == data.length - 1) {




                if (e.newPoint.x <= bins[bins.length - 2].x + (bins[bins.length - 1].x - bins[bins.length - 2].x) / 2) {
                    if (e.newPoint.x <= (data[index - 1].x) + dist) {
                        return false;
                    } else {
                        curve.addPoint([max, bins[bins.length - 1].y], true, false, false);
                    }
                }
            } else if ((e.newPoint.x <= (data[index - 1].x) + dist) || (e.newPoint.x >= (data[index + 1].x) - dist)) {
                return false;
            }




        }


        function bindata() {
            let data = [];
            for (i = 0; i < nb_bins; i = i + 1) {
                data.push(0)
            }
            return data;
        }

        function bindata_xy() {
            let data = [];
            for (i = 0; i < nb_bins; i = i + 1) {
                let x = min + i * step;
                data.push([x, 0])
            }
            return data;
        }

        function tickdisplay() {
                return '{value} ' + js_vars.xUnit;
        }

        function xAxis_visible() {
                return true;
        }

        function tickPositions() {
            let data = [];
            for (i = min; i < max; i = i + step) {
                data.push(i)
            }
            data.push(max); // to solve the rounding problem -> 1.0000000000000002 to 1
            return data;
        }

        let initdataspline = [
            [min, 0],
            [max, 0]
        ];
        let initsaved = [
            [initdataspline.slice(), bindata()]
        ];
        let saved = initsaved.slice();

        function save() {
            senddata(Date.now() - startdate, chart.series[1]);


            let lastserie0 = [];
            let lastserie1 = [];

            chart.series[0].data.forEach(function(i) {
                lastserie0.push([i.x, i.y]);
            });
            chart.series[1].data.forEach(function(i) {
                lastserie1.push([i.x, i.y]);
            });

            saved.push([lastserie0, lastserie1])

            if (saved.length > 0) {
                $('.undo').eq( chartindex ).prop("disabled", false);
                $('.reset').eq( chartindex ).prop("disabled", false);

            }

        }

        function max_zoom(max_h) {

            if (zoom_area * max_h > 1) {
                return 1
            } else {
                return zoom_area * max_h
            }
        }


        function normalize() {


            let sum = chart.series[1].yData.reduce((a, b) => a + b, 0);


            let data_bins = [];
            let sum_bins = 0;
            let data_curve = [];
            let max_height = 0;

            chart.series[1].data.forEach(function(point) {
                let new_point = point.y / sum;
                if (new_point > max_height) {
                    max_height = new_point
                }
                sum_bins = sum_bins + new_point;
                data_bins[point.index] = new_point;
            });

            chart.series[0].data.forEach(function(point) {
                data_curve[point.index] = [Math.round(point.x / step) * step, point.y / sum];

            });


            if (isNaN(sum_bins)) {
                setTimeout(function() {
                    chart.series[0].setData(initdataspline.slice(), true);
                    chart.series[1].setData(bindata(), true);
                    chart.yAxis[0].setExtremes(0, max_val);
                    save();
                }, 0);
            } else {

                setTimeout(function() {
                    chart.series[1].setData(data_bins, true);
                    chart.series[0].setData(data_curve, true);


                    chart.yAxis[0].setExtremes(0, max_zoom(max_height));
                    chart.series[0].update({
                        dragDrop: {
                            dragMaxY: chart.yAxis[0].max
                        }
                    });
                    save();


                }, 0);

            }




        }


        function update_bins(point, remove) {



            let x0 = Math.round(point.x / step) * step;
            let y0 = point.y;

            let x_start, y_start, x_end, y_end;


            if (point.series.data[point.index - 1]) {
                x_start = point.series.data[point.index - 1].x;
                y_start = point.series.data[point.index - 1].y;
            } else {
                x_start = point.series.xAxis.dataMin;
                y_start = point.series.yAxis.dataMin;
            }
            if (point.series.data[point.index + 1]) {
                x_end = point.series.data[point.index + 1].x;
                y_end = point.series.data[point.index + 1].y;
            } else {
                x_end = point.series.xAxis.dataMax;
                y_end = point.series.yAxis.dataMax;
            }




            if (remove) { //if point was removed
                x0 = x_end;
                y0 = y_end;
                point.remove();


            }

            let updatebins = [];

            chart.series[1].data.forEach(function(bin) {

                let x = bin.x;
                let linear_y;


                if (x >= x_start && x <= x_end) {


                    if (x < x0) {
                        linear_y = (((y0 - y_start) / (x0 - x_start)) * (x - x_start)) + y_start;

                    } else if (x > x0) {
                        linear_y = (((y0 - y_end) / (x0 - x_end)) * (x - x_end)) + y_end;

                    } else {
                        linear_y = y0;

                    }


                }
                updatebins.push(linear_y);
            });

            chart.series[1].setData(updatebins, true, true, true);
            save();




        }


        function add_point(serie, x, y) {

            if (mode == "curve" && x >= (min - step / 2) && x <= (max + step / 2)) {


                // Add it

                x = Math.round(x / step) * step;


                serie.data.forEach(function(point) {


                    if ((point.x === x)) { // point in the same x
                        point.remove();
                        if (point.y === y) {}
                    }

                });
                serie.addPoint([x, y], true, false, false);
                serie.data.forEach(function(point) {
                    if ((point.x === x) && (point.y === y)) { // point found
                        update_bins(point);
                    }
                });

            } else {

                let i = Math.round(x);
                let bin = chart.series[1].data[i];


                bin.update(y);
                add_point_from_bins(bin);
            }


        }

        function add_point_from_bins(bin) {
            let x = bin.x;
            let y = bin.y;
            let pointadded;

            chart.series[0].addPoint([x, y], true, false, false);
            chart.series[0].data.forEach(function(point) {
                if (point.x === x && point.y === y) {
                    pointadded = point;
                }
            });

            // remove point if there is already one
            if (pointadded.series.data[pointadded.index - 1] && Math.abs(pointadded.series.data[pointadded.index - 1].x - x) < step * 0.5) {
                pointadded.series.data[pointadded.index - 1].remove();
            }
            if (pointadded.series.data[pointadded.index + 1] && Math.abs(pointadded.series.data[pointadded.index + 1].x - x) < step * 0.5) {
                pointadded.series.data[pointadded.index + 1].remove();
            }

            // not adding a point if there is already one close to 1.5*step
            if (pointadded.series.data[pointadded.index - 1] && Math.abs(pointadded.series.data[pointadded.index - 1].x - x) > step * 1.5) {
                chart.series[0].addPoint([bin.series.data[bin.index - 1].x, bin.series.data[bin.index - 1].y], true, false, false);
            }
            if (pointadded.series.data[pointadded.index + 1] && Math.abs(pointadded.series.data[pointadded.index + 1].x - x) > step * 1.5) {
                chart.series[0].addPoint([bin.series.data[bin.index + 1].x, bin.series.data[bin.index + 1].y], true, false, false);
            }



            update_bins(pointadded);

        }
        let chart;
        drawChart();
        function drawChart(parameters) {
        
            if(parameters){
            js_vars = parameters;
            }
            nb_bins = js_vars.nb_bins;
            step = (max - min) / (nb_bins - 1);

            let container = $(".chart")[chartindex];
            
            chart = new Highcharts.Chart({

            credits: {
                enabled: false
            },
            chart: {
                renderTo: container,
                className: 'pointChart',
                margin: [10, 20, 60, 60],
                events: {




                    click: function(e) {
                            add_point(this.series[0], e.xAxis[0].value, e.yAxis[0].value)
                    },

                    load: function(e) {
                        startdate = Date.now();



                            senddata(0, this.series[1]);



                        
                        maxval = js_vars.yMax;
                    
                        if (maxval * zoom_area > 1) {
                            this.yAxis[0].setExtremes(0, 1);
                        } else {
                            this.yAxis[0].setExtremes(0, maxval * zoom_area);
                        }
                        this.series[0].update({
                            dragDrop: {
                                dragMaxY: this.yAxis[0].getExtremes().max
                            }
                        });


                            this.series[1].data.forEach(function(point) {
                                $('#binsinput').append('<input type="number" min="0" max="100" class="binsinput" id="bin_' + point.index + '" name="' + point.index + '">');
                            });


                



                        if (this.series[2]) {
                            max_val = Math.min(1, zoom_area * Math.max(...this.series[2].yData));
                        }

                    },
                                render: function(e) {
                                $("#data").html(this.series[1].yData.join());
                                }


                }
            },
            title: {
                text: ''
            },
            accessibility: {
                announceNewData: {
                    enabled: true
                }
            },
            xAxis: [{
                    id: 'first',
                    linkedTo: 1,
                    visible: false
                }, {
                    id: 'second',
                    visible: xAxis_visible(),
                    title: {
                        text: js_vars.xAxisTitle,
                        style: {
                        fontSize: '16px' // Set x-axis title font size
                        }
                    },



                    tickPositions: tickPositions(),
                    labels: {
                        formatter: function() {
                            let tick = min_tick + this.value * (nb_bins - 1) * step_tick;
                                if (tick >= 1000) {
                                    return Number((tick / 1000).toFixed(2)) + 'k ' + js_vars.xUnit;
                                } else {
                                    return Number((tick).toFixed(2)) + ' ' + js_vars.xUnit;

                                }
                            
                        },



                        style: {
                            fontSize: '16px'
                        },
                        y: 30,
                    },
                    min: min,
                    max: max,

                },
                {
                    id: 'normal',
                },

            ],
            yAxis: {
                visible: true,

                title: {
                    text: js_vars.yAxisTitle,
                    style: {
                        fontSize: '16px' // Set y-axis title font size
                        }
                },
                labels: {
                    formatter: function() {

                        return Math.round(100 * this.value);


                    },
                    style: {
                        fontSize: '16px'
                    },
                    x: -10
                },


                tickInterval: 0.05,
                min: 0,


            },
            legend: {
                enabled: false
            },
            exporting: {
                enabled: true
            },
            plotOptions: {
                series: {

                    dragDrop: {
                        dragMinY: 0,
                        dragMaxY: 1,
                        dragMinX: min,
                        dragMaxX: max,

                    },
                    marker: {
                        enabled: true,
                        radius: point_r,
                        color: '#000000',
                        states: {
                            hover: {
                                radiusPlus: 0,
                            }
                        }
                    },

                    point: {
                        events: {


                            mouseOut: function() {
                                $('#cursor').hide();
                            },


                            click: function(e) {
                                e.preventDefault();

                                let x = chart.series[0].xAxis.toValue(e.chartX),
                                    y = chart.series[0].yAxis.toValue(e.chartY);

                                if (this.series.index == 0) {
                                    if (this.index == 0) { // si point extrème
                                        this.update([min, 0]);
                                        update_bins(this);
                                    } else if (this.index == this.series.data.length - 1) {
                                        this.update([max, 0]);
                                        update_bins(this);
                                    } else if (this.dist < point_r) {
                                        update_bins(this, true); // true = remove;
                                    } else {

                                        add_point(chart.series[0], x, y);
                                    }

                                } else {
                                    add_point(chart.series[0], x, y);

                                }
                                /*
                                */
                            },

                            drag: function(e) {

                                if (this.series.index == 0) {
                                    return stopdrag(this, e);
                                }


                            },
                            drop: function(e) {
                                if (this.series.index == 1) // bins modified
                                {
                                    add_point_from_bins(this);




                                } else {


                                    let bins = chart.series[1];



                                    if (this.index == 0) {


                                        this.update([min, this.y]);


                                    } else if (this.index == this.series.data.length - 1) {

                                        this.update([max, this.y]);

                                    }


                                    update_bins(this);
                                }



                                return stopdrag(this, e);


                            },


                        }
                    },



                },

                column: {



                    states: {
                        inactive: {
                            enabled: false
                        }
                    },
                    allowPointSelect: false,

                    enableMouseTracking: false,
                    opacity: 0.7,

                    grouping: false,
                    pointPadding: 0.05,
                    groupPadding: 0.05,
                    borderWidth: 0,
                    color: "#2980b9",
                },



            },
            tooltip: {
                enabled: false,
                snap: 2
            },
            series: [{
                    data: initdataspline.slice(),
                    zIndex: 3,
                    stickyTracking: false,
                    type: "line",
                    xAxis: 'first',
                    dashStyle: 'dot',
                    opacity: 0.7,
                    allowPointSelect: false,
                    dragDrop: {
                        draggableY: true,
                        draggableX: true,
                    },
                },
                {
                    data: bindata_xy(),
                    type: 'column',
                    xAxis: 'second',
                    zIndex: 2,
                },
                {
                    data: model_data,
                    visible: false,
                    type: 'column',
                    zIndex: 1,
                    xAxis: 'second',
                    marker: {
                        enabled: false,
                    },
                    opacity: 0.7,
                    color: "#ffbf00",

                    lineWidth: 0,
                    zIndex: 0,
                    enableMouseTracking: false,
                    allowPointSelect: false,
                    states: {
                        inactive: {
                            enabled: false
                        }
                    }
                }
            ]
        });


                settocurve();
        
        }


            $(document).ready(function() {


                $('.normalize').eq( chartindex ).click(function(e) {
                    normalize();


                });

                $('.reset').eq( chartindex ).click(function(e) {
                    chart.series[0].setData(initdataspline.slice(), true);
                    chart.series[1].setData(bindata(), true);
                    senddata(Date.now() - startdate, chart.series[1]);
                    bins.forEach(function(bin, i) {
                        bin.set(100 * chart.series[1].data[i].y / chart.yAxis[0].max);
                    });
                    saved = initsaved.slice();
                    $('.undo').eq( chartindex ).prop("disabled", true);
                    $('.reset').eq( chartindex ).prop("disabled", true);

                    if (mode == "bins") {
                        $('#curve').click();
                    }
                });

                $('.undo').eq( chartindex ).click(function(e) {
                    if (saved.length > 1) {
                        chart.series[0].setData(saved[saved.length - 2][0], true);
                        chart.series[1].setData(saved[saved.length - 2][1], true);
                        senddata(Date.now() - startdate, chart.series[1]);
                        bins.forEach(function(bin, i) {
                            bin.set(100 * chart.series[1].data[i].y / chart.yAxis[0].max);
                        });
                        let max_height = chart.series[0].yData.reduce((a, b) => Math.max(a, b));
                        saved.pop();
                        chart.series[0].update({
                            dragDrop: {
                                dragMaxY: chart.yAxis[0].max
                            }
                        });

                        if (saved.length == 1) {
                            $('.undo').eq( chartindex ).prop("disabled", true);
                            $('.reset').eq( chartindex ).prop("disabled", true);
                        }


                    }


                });

                
                $("#NextButton").hide();
                

                // Bind a function to store the results to the '.SubmitDistribution' button.
                $(".SubmitDistribution").click(function () {
                    
                    var yData = chart.series[1].yData; //get data from highchart
                    var xData = chart.series[1].xData;
                    var sum = yData.reduce((a, b) => a + b, 0); //sum for normalization
                    var results = yData.map(v => (v / sum)); // normalization
                    var XYData = xData.map(function(c, i) { return [ c, results[i] ] }); // merge X and Y arrays like [[x1,y1],[x2,y2],...]

                    // Store the data in the "DistributionResult" and the history in the "DistributionHistory" embedded data field, check the 'SurveyFlow'
                    Qualtrics.SurveyEngine.setEmbeddedData(js_vars.DistributionResult, JSON.stringify(XYData));
                    Qualtrics.SurveyEngine.setEmbeddedData(js_vars.DistributionYData, results.join());
                    Qualtrics.SurveyEngine.setEmbeddedData(js_vars.DistributionXData, xData.join());
                    Qualtrics.SurveyEngine.setEmbeddedData(js_vars.DistributionHistory, JSON.stringify(history) );

                    $("#NextButton").click();
                });


            });


    }
});
