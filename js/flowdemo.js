requirejs.config({
    baseUrl: 'js',
    //except, if the module ID starts with "modules",
    //load it from the js/modules directory
    paths: {
        jquery: '../libs/jquery/jquery-2.1.4',
        jqueryui: '../libs/jquery-ui/jquery-ui-1.12.1/jquery-ui',
        //jqueryuiscroll: '../libs/jquery-ui/jquery.dnd_page_scroll',
        //dragscroll: '../libs/dragscroll/dragscroll',
        jqueryspectrum: '../libs/spectrum/spectrum',
        jqueryuictxm: '../libs/jquery-ui/jquery-ui-contextmenu-1.7.0/jquery.ui-contextmenu',
        knockout: '../libs/knockout/knockout-3.4.0',
        modules: 'modules'
    },
    shim: {
        'jqueryui': {
            deps: ["jquery"],
            exports: "jqueryui"
        },
        //'jqueryuiscroll': {
        //    deps: ['jquery'],
        //    exports: 'jqueryuiscroll'
        //},
        //'dragscroll': {
        //    deps: ['jquery'],
        //    exports: 'dragscroll'
        //},
        'jqueryspectrum': {
            deps: ['jquery'],
            exports: 'jqueryspectrum'
        },
        'jqueryuictxm': {
            deps: ["jqueryui"],
            exports: "jqueryuictxm"
        }
    }
});

requirejs([
        'jqueryui',
        //'jqueryuiscroll',
        //'dragscroll',
        'jqueryspectrum',
        'jqueryuictxm',
        'knockout',
        'modules/dataflow'],
    //function ($, dragscroll, jqueryspectrum, jqueryuictxm, ko, dataflow) {
    function ($, jqueryspectrum, jqueryuictxm, ko, dataflow) {
        dataflow.initFlowDemo();
    }
);