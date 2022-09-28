let params = document.getElementById('draw').dataset;
console.log(params);

let js_vars = {
    interface: params.interface,
    prediction: true,
    nb_bins: Number(params.nb_bins),
    min: Number(params.min),
    step: Number(params.step),
    yMax: 1,
    playground: false,
    screen_payoff: 0.01,
    xUnit: '%',
    min_timeout: 30000,
}

function liveSend(data) {
    console.log(data);
}

// -----

const interface = js_vars.interface;
const prediction = js_vars.prediction;

const min = 0;
const max = 1;

let step_tick;
let nb_bins;
let model_data;
let min_tick;

if (prediction) {
    nb_bins = js_vars.nb_bins;
    min_tick = js_vars.min;
    step_tick = js_vars.step;
    model_data = [1, 0];
} else {
    model_data = JSON.parse(js_vars.model_data);
    nb_bins = model_data.length;
    min_tick = min;
    step_tick = (max - min) / (nb_bins - 1);
}

const step = (max - min) / (nb_bins - 1);

const zoom_area = 1.1;
let startdate;
let max_val = 1;

let bins = [];



let score = 0;


var point_r = 10; //px

let sent = false;

function payoff(score) {
    let payoff_val = Math.round(js_vars.screen_payoff * score * 100);
    if (payoff_val > 1) {
        return payoff_val + ' cents';
    } else {
        return payoff_val + ' cent';
    }
}

function computevalue(sub) {
    let val = Math.round(100 * (1 - sub.reduce((a, b) => a + b, 0)));
    if (val > 0) {
        return val;
    } else {
        return 0;
    }
}

function senddata(delay_ms, serie) {
    if (js_vars.playground != true) {
        liveSend({
            'history': {
                'delay_ms': delay_ms,
                'data': serie,
            }
        });
    }
}

function send_first() {
    if (sent == false) {
        senddata(0, chart.series[1].yData);
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

function settobins() {
    mode = "bins";

    $('#bins_container').show();


    bins.forEach(function(bin, i) {
        bin.set(100 * chart.series[1].data[i].y / chart.yAxis[0].max);
    });




    chart.series[0].setState("inactive", true);
    chart.series[0].update({
        marker: {
            enabled: false
        },
        opacity: 0,
        dragDrop: {
            draggableY: false,
            draggableX: false,
        },
    });


}




function stopdrag(point, e) {

    var curve = point.series;
    var data = curve.data;
    var bins = point.series.chart.series[1].data;
    var index = point.index;
    var dist = (bins[1].x - bins[0].x) / 2;


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

function setgaussian(series, mean, sigma) {
    let updatedata = [];
    series.data.forEach(function(point) {
        var new_point = (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((point.x - mean) / sigma, 2))
        updatedata[point.index] = new_point;
    });
    series.setData(updatedata, true);
}

function setgaussians(series, means, sigmas, weights) {
    let updatedata = [];
    series.data.forEach(function(point) {
        let new_point = 0;
        for (i = 0; i < means.length; i = i + 1) {
            new_point += weights[i] * (1 / (sigmas[i] * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((point.x - means[i]) / sigmas[i], 2));
        }
        updatedata[point.index] = new_point;
    });
    series.setData(updatedata, true);
}

function bindata() {
    var data = [];
    for (i = 0; i < nb_bins; i = i + 1) {
        data.push(0)
    }
    return data;
}

function bindata_xy() {
    var data = [];
    for (i = 0; i < nb_bins; i = i + 1) {
        let x = min + i * step;
        data.push([x, 0])
    }
    return data;
}

function tickdisplay() {
    if (prediction) {
        return '{value} ' + js_vars.xUnit
    } else {
        return '{}'
    }
}

function xAxis_visible() {
    if (prediction) {
        return true;
    } else {
        return false;
    }
}

function tickPositions() {
    var data = [];
    for (i = min; i < max; i = i + step) {
        data.push(i)
    }
    data.push(max); // to solve the rounding problem -> 1.0000000000000002 to 1
    return data;
}

var initdataspline = [
    [min, 0],
    [max, 0]
];
var initsaved = [
    [initdataspline.slice(), bindata()]
];
var saved = initsaved.slice();

function save() {
    senddata(Date.now() - startdate, chart.series[1].yData);


    var lastserie0 = [];
    var lastserie1 = [];

    chart.series[0].data.forEach(function(i) {
        lastserie0.push([i.x, i.y]);
    });
    chart.series[1].data.forEach(function(i) {
        lastserie1.push([i.x, i.y]);
    });

    saved.push([lastserie0, lastserie1])

    if (saved.length > 0) {
        $('#undo').prop("disabled", false);
        $('#reset').prop("disabled", false);

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


    var sum = chart.series[1].yData.reduce((a, b) => a + b, 0);


    var data_bins = [];
    var sum_bins = 0;
    var data_curve = [];
    var max_height = 0;

    chart.series[1].data.forEach(function(point) {
        var new_point = point.y / sum;
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



    var x0 = Math.round(point.x / step) * step;
    var y0 = point.y;




    if (point.series.data[point.index - 1]) {
        var x_start = point.series.data[point.index - 1].x;
        var y_start = point.series.data[point.index - 1].y;
    } else {
        var x_start = point.series.xAxis.dataMin;
        var y_start = point.series.yAxis.dataMin;
    }
    if (point.series.data[point.index + 1]) {
        var x_end = point.series.data[point.index + 1].x;
        var y_end = point.series.data[point.index + 1].y;
    } else {
        var x_end = point.series.xAxis.dataMax;
        var y_end = point.series.yAxis.dataMax;
    }




    if (remove) { //if point was removed
        x0 = x_end;
        y0 = y_end;
        point.remove();


    }

    var updatebins = [];

    chart.series[1].data.forEach(function(bin) {

        var x = bin.x;


        if (x >= x_start && x <= x_end) {


            if (x < x0) {
                var linear_y = (((y0 - y_start) / (x0 - x_start)) * (x - x_start)) + y_start;

            } else if (x > x0) {
                var linear_y = (((y0 - y_end) / (x0 - x_end)) * (x - x_end)) + y_end;

            } else {
                var linear_y = y0;

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

        var i = Math.round(x);
        var bin = chart.series[1].data[i];


        bin.update(y);
        add_point_from_bins(bin);
    }


}

function add_point_from_bins(bin) {
    var x = bin.x;
    var y = bin.y;
    var pointadded;

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

var chartoptions = {

    credits: {
        enabled: false
    },
    chart: {
        className: 'pointChart',
        margin: [10, 0, 50, 60],
        events: {




            click: function(e) {
                if (interface == "ours") {
                    add_point(this.series[0], e.xAxis[0].value, e.yAxis[0].value)
                }
            },

            load: function(e) {
                startdate = Date.now();


                if (interface != "metaculus") {

                    senddata(0, this.series[1].yData);


                }



                if (prediction) {
                    maxval = js_vars.yMax
                } else {
                    maxval = Math.max.apply(Math, model_data);

                }
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

                if (interface == "number") {
                    this.update({
                        yAxis: {
                            visible: true
                        }
                    })

                    this.series[1].data.forEach(function(point) {
                        $('#binsinput').append('<input type="number" min="0" max="100" class="binsinput" id="bin_' + point.index + '" name="' + point.index + '">');
                    });


                }



                if (this.series[2]) {
                    max_val = Math.min(1, zoom_area * Math.max(...this.series[2].yData));
                }

            },
            render: function(e) {



                var canvas = this.series[2];
                var sub = this.series[1].yData.map(function(num, idx) {
                    return Math.abs(num - canvas.yData[idx]);
                });
                var value = computevalue(sub);
                score = value / 100;

                $('.progress-bar').css('width', value + '%').attr('aria-valuenow', value);
                $('.progress-bar').html(value + ' %');
                $('#score_cents').html(payoff(score));


                bins.forEach(function(bin, i) {
                    bin.set(100 * chart.series[1].data[i].y / chart.yAxis[0].max);
                });


            },

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
                text: 'What will inflation in 2023 in the Euro Area be?'
            },



            tickPositions: tickPositions(),
            labels: {
                formatter: function() {
                    let tick = min_tick + this.value * (nb_bins - 1) * step_tick;
                    if (prediction) {
                        if (tick >= 1000) {
                            return Number((tick / 1000).toFixed(2)) + 'k ' + js_vars.xUnit;
                        } else {
                            return Number((tick).toFixed(2)) + ' ' + js_vars.xUnit;

                        }
                    } else {
                        return tick;
                    }
                },



                style: {
                    fontSize: '10px'
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
            text: 'Probability'
        },
        labels: {
            formatter: function() {

                return Math.round(100 * this.value) + " %";


            },
            style: {
                fontSize: '10px'
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

                        var x = chart.series[0].xAxis.toValue(e.chartX),
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


                            var bins = chart.series[1];



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
            color: "#007bff",
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
}

function drawDefaultChart() {
    chart = new Highcharts.Chart('draw', chartoptions);

    if (interface == "ours") {
        settocurve();
    } else {
        settobins();
    }
}

$(document).ready(function() {



    $(".otree-timer").appendTo("#timer");



    $('.otree-timer__time-left').on('update.countdown', function(event) {

        if (event.offset.totalSeconds <= js_vars.min_timeout) {
            $('#validate_btn').prop("disabled", false);
        }
        if (event.offset.totalSeconds == js_vars.min_timeout) {
            $(".toast").toast('show');
        }
    });




    drawDefaultChart();



    function update_number(input) {

        var bin = input.name;
        chart.series[1].data[bin].update(parseFloat(input.value / 100));
        senddata(Date.now() - startdate, chart.series[1].yData);
    }


    $(".binsinput")
        .change(function() {
            update_number(this);
        })


    $('input[type=radio][name=mode]').change(function() {
        if (this.value == 'curve') {

            settocurve();
        } else if (this.value == 'bins') {

            settobins();
        }
    });

    $('#normalize').click(function(e) {
        normalize();


    });

    $('#reset').click(function(e) {
        chart.series[0].setData(initdataspline.slice(), true);
        chart.series[1].setData(bindata(), true);
        senddata(Date.now() - startdate, chart.series[1].yData);
        bins.forEach(function(bin, i) {
            bin.set(100 * chart.series[1].data[i].y / chart.yAxis[0].max);
        });
        saved = initsaved.slice();
        $('#undo').prop("disabled", true);
        $('#reset').prop("disabled", true);

        if (mode == "bins") {
            $('#curve').click();
        }
    });

    $('#undo').click(function(e) {
        if (saved.length > 1) {
            chart.series[0].setData(saved[saved.length - 2][0], true);
            chart.series[1].setData(saved[saved.length - 2][1], true);
            senddata(Date.now() - startdate, chart.series[1].yData);
            bins.forEach(function(bin, i) {
                bin.set(100 * chart.series[1].data[i].y / chart.yAxis[0].max);
            });
            var max_height = chart.series[0].yData.reduce((a, b) => Math.max(a, b));
            saved.pop();
            //chart.yAxis[0].setExtremes(0,max_zoom(max_height));
            chart.series[0].update({
                dragDrop: {
                    dragMaxY: chart.yAxis[0].max
                }
            });

            if (saved.length == 1) {
                $('#undo').prop("disabled", true);
                $('#reset').prop("disabled", true);
            }


        }


    });

    $('.binsinput').keydown(function(e) {
        if (e.keyCode == 13) {
            var inputs = $('.binsinput');
            if (inputs[inputs.index(this) + 1] != null) {
                inputs[inputs.index(this) + 1].focus();
            } else {
                update_number(this);
            }
            e.preventDefault();
            return false;
        }
    });


    function pdf(x) {
        return 1 / Math.sqrt(2 * Math.PI) * Math.exp(-(x ** 2) / 2);
    }

    function cdf(x) {
        return (1 + math.erf(x / Math.sqrt(2))) / 2;
    }

    function compute_param(center, left_handle, right_handle) {
        e = center;
        w = right_handle - left_handle;
        a = (left_handle - center) + (right_handle - center);
        return [e, w, a];
    }


    function skew(x, e, w, a) {
        t = (x - e) / w;
        return 2 / w * pdf(t) * cdf(a * t);
    }

    if (interface == "metaculus") {

        $("#add_component").show();



        let left_handles = [];
        let centers = [];
        let right_handles = [];
        let weights = [];

        let sliders = [];


        const startleft = 0;
        const startright = 1;


        function update_gauss() {

            let updatedgauss = [];
            chart.series[1].data.forEach(function(point) {
                let new_point = 0;
                for (i = 0; i < sliders.length; i = i + 1) {
                    [e, w, a] = compute_param(centers[i], left_handles[i], right_handles[i]);
                    new_point += weights[i] * skew(point.x, e, w, a);
                }
                updatedgauss.push(new_point);
            });

            let sum = updatedgauss.reduce((a, b) => a + b, 0);
            let normalized_skew = [];
            for (let val of updatedgauss) {
                normalized_skew.push(val / sum);
            }
            chart.series[1].setData(normalized_skew, true, false, true);
        }


        function createslider(nameid) {

            let slider = document.getElementById(nameid);
            let id = parseInt(nameid.replace("slider_", ""));


            sliders.push(noUiSlider.create(slider, {
                start: [startleft, min + 0.5 * (max - min), startright],
                connect: true,
                range: {
                    'min': min,
                    'max': max
                },

            }));



            weights = [];
            for (var i = 0; i < (id + 1); i++) {
                weights.push(1 / (id + 1));
            }

            left_handles.push(startleft);
            centers.push(0);
            right_handles.push(startright);

            let left_handles_diff;
            let right_handles_diff

            slider.noUiSlider.on('start', function(values, handle, unencoded, tap, positions, noUiSlider) {
                if (handle == 1) {
                    left_handles_diff = math.abs(values[1] - values[0])
                    right_handles_diff = math.abs(values[2] - values[1])
                }
            });

            slider.noUiSlider.on('slide', function(values, handle, unencoded, tap, positions, noUiSlider) {
                if (handle == 1) {
                    if ((parseFloat(values[0]) <= min) && (math.abs(values[1] - values[0]) < left_handles_diff)) {
                        slider.noUiSlider.setHandle(0, min, true, true);
                    } else {
                        slider.noUiSlider.setHandle(0, values[1] - left_handles_diff, true, true);
                    }
                    slider.noUiSlider.setHandle(2, parseFloat(values[1]) + parseFloat(right_handles_diff), true, true);




                }
            });


            slider.noUiSlider.on('update', function(values) {

                let id = this.target.id.replace("slider_", "");

                left_handles[id] = parseFloat(values[0]);
                centers[id] = parseFloat(values[1]);
                right_handles[id] = parseFloat(values[2]);

                update_gauss();
                send_first();
            });

            slider.noUiSlider.on('end', function(values) {
                save();

            });


        }




        createslider("slider_0");

        $('#add_component').on('click', function() {
            let id = "slider_" + sliders.length;
            $('#sliders').append('<div class="slider mt-3" id="' + id + '"></div>');
            createslider(id);
            $("#remove_component").show();
        });

        $('#remove_component').on('click', function() {
            let slider = sliders.slice(-1);
            slider[0].destroy();
            sliders.pop();
            left_handles.pop();
            centers.pop();
            right_handles.pop();
            weights.pop();
            $('.slider').last().remove();

            weights = [];
            for (var i = 0; i < sliders.length; i++) {
                weights.push(1 / (sliders.length));
            }

            update_gauss();

            if (sliders.length == 1) {
                $("#remove_component").hide();
            }
        });


    } else if ((interface == "bins") || (interface == "ours")) {

        if (interface == "bins") {
            $('#bins_container').show();
        }
        if (interface == "ours") {
            $('#topchart').show();
        }

        function behaviour(interface) {
            if (interface == 'bins') {
                return "drag";
            } else {
                return "drag";
            }
        }


        for (let i = 0; i < nb_bins; i++) {

            $('#binsliders').append('<div class="binslider" id="bin_' + i + '"></div>');

            let bin = document.getElementById("bin_" + i);


            bins.push(noUiSlider.create(bin, {

                start: [0],
                behaviour: behaviour(interface),
                connect: [true, false],
                // Put '0' at the bottom of the slider
                direction: 'rtl',
                orientation: 'vertical',
                range: {
                    'min': 0,
                    'max': 100
                }
            }));

            bin.noUiSlider.on('update', function(values, handle) {

                var value = values[handle];

                let b = this.target.id.split('_')[1];
                let new_val = parseFloat(value * chart.yAxis[0].max / 100);


            });

            bin.noUiSlider.on('end', function(values, handle) {

                var value = values[handle];

                let b = this.target.id.split('_')[1];
                let new_val = parseFloat(value * chart.yAxis[0].max / 100);
                if (new_val >= max_val) {
                    new_val == max_val;
                }
                add_point(chart.series[0], b, new_val);


            });

        }

    }

});
