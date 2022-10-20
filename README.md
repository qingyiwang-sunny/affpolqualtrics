---
editor_options: 
  markdown: 
    wrap: 72
---

# Click and drag belief elicitation interface for qualtrics

![](animated_gif/qualtrics_animated_gif.gif)

This is the Qualtrics JavaScript plugin for the **Click and Drag** _belief elicitation interface_ presented by [Paolo Crosetto](https://paolocrosetto.wordpress.com/) and [Thomas De Haan](https://sites.google.com/view/thomas-de-haan). Details of the interface, a paper presenting its performance with respect to other interfaces, and oTee code are available on the [Click and Drag website](https://beliefelicitation.github.io/).

## Installation for Qualtrics XM

This plugin will work with all Qualtrics plans that allow you to use JavaScript. This will **not** work with a free account, and also with some paid account. Look into your Qualtrics plan to see if you have access to custom JavaScript for your survey items.

### Import the .qsf template file

To install the plugin, simply download and import the [.qsf template
file](https://raw.githubusercontent.com/beliefelicitation/qualtrics/main/Click-and-drag_elicitation_builder_template.qsf)
into qualtrics :

1.  Download
    [here](https://raw.githubusercontent.com/beliefelicitation/qualtrics/main/Click-and-drag_elicitation_builder_template.qsf)
2.  Navigate to the `Survey` tab and click `Tools`. ![Import Export menu under    Tools](https://www.qualtrics.com/m/assets/support/wp-content/uploads/2021/03/import-export-survey-2.png)
3.  Select `Import/Export`.
4.  Choose `Import survey`.
5.  Click `Choose File` and browse your computer for the `.qsf`
    ![Import Survey window](https://www.qualtrics.com/m/assets/support/wp-content/uploads/2021/03/import-export-survey-4.png)
6.  Select a `Project Category`.
7.  Click `Import`.

### Custom the distribution graph

1.  Click on the question block.
2.  Click on `Html View`

You will find:

``` html
Predict using the interface: what will the inflation in the Euro Area in 2023 be?
<div style="text-align: right;">
    <button id="undo"  class="btn  btn-warning"  disabled  type="button">Undo</button>
    <button id="reset" class="btn  btn-danger" disabled  type="button">Reset</button>
    <button id="normalize" class="btn btn-primary" style="color: #fff;"  type="button">Normalize</button>
</div>

<div id="draw" data-n_bins="11" data-min="0" data-step="1" data-x_axis_title="Distribution" data-y_axis_title="Probability" data-x_unit="%"></div>

<div class="mt-2" style="text-align: center;margin-left:50px">
 <a class="btn btn-success" id="SubmitDistribution">Submit the distribution</a>
</div>
```

To customize the belief elicitation interface you just need to edit these parameters in the `div` line :

``` html
<div id="draw" data-n_bins="11" data-min="0" data-step="1" data-x_axis_title="Distribution" data-y_axis_title="Probability" data-x_unit="%"></div>
```

| Parameter               | Html variable     | Default Value|
|:------------------------|:------------------|:-------------|
| Number of bins          | data-n_bins       | 11           |
| Min value of the x axis | data-min          | 0            |
| Step between bins       | data-step         | 1            |
| X axis Title            | data-x_axis_title | Distribution |
| Y axis Title            | data-y_axis_title | Probability  |
| X axis unit             | data-x_unit       | \%           |

### Javascript code (not required for installation)

1.  Click on the question block. ![selecting a question and then clicking   Javascript](https://www.qualtrics.com/m/assets/support/wp-content/uploads/2021/04/JavaScript12.png)
2.  In the `Question behavior` section, select JavaScript.

### Libraries js/css (not required for installation)

To find where the js/css scripts are located

1. Navigate to the `Look and Feel` section of your survey, and click on the `Advanced` tab 
2. Edit the `Header`"` section, you will find the libraries scripts and libraries styles

## Output data

The plugin generates the following variables
