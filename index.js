"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.ComputerNetwork = void 0;
var lit_1 = require("@webwriter/lit");
var lit_2 = require("lit");
var decorators_js_1 = require("lit/decorators.js");
require("./simulators/simulators.ts");
require("@shoelace-style/shoelace/dist/themes/light.css");
var cytoscape_esm_min_js_1 = require("cytoscape/dist/cytoscape.esm.min.js");
var ComputerNetwork = /** @class */ (function (_super) {
    __extends(ComputerNetwork, _super);
    function ComputerNetwork() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.nodes = [];
        _this.edges = [];
        _this.currentNodeToAdd = "none";
        _this.currentColor = "white";
        _this.objectIconMap = [
            ["pc-display-horizontal", "/node_modules/@shoelace-style/shoelace/dist/assets/icons/pc-display-horizontal.svg"],
            ["hdd", "/node_modules/@shoelace-style/shoelace/dist/assets/icons/hdd.svg"],
            ["cloudy", "/node_modules/@shoelace-style/shoelace/dist/assets/icons/cloudy.svg"],
        ];
        _this.counter = 0;
        return _this;
    }
    ComputerNetwork.prototype.render = function () {
        var _this = this;
        return (0, lit_2.html)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n    <div class=\"canvas\" id=\"myCanvas\">\n    <div id=\"cy\"></div>\n    </div>\n\n    <div class=\"base\">\n      <span>", "</span>\n      <button class=\"btn\" @click=\"", "\"><sl-icon name=\"pc-display-horizontal\"></sl-icon></button>\n      \n\n      <button class=\"btn\"><sl-icon name=\"share\"></sl-icon></button>\n      <button class=\"btn\" @click=\"", "\"><sl-icon name=\"cloudy\"></sl-icon></button>\n\n      <div class=\"addOption\">\n          <button class=\"btn\"><sl-icon name=\"plus-square\" @click=\"", "\"></sl-icon></button>\n          <button class=\"btn\"><sl-icon name=\"dash-square\"></sl-icon></button>\n      </div>\n    </div>\n      \n    \n\n    <network-simulator></network-simulator>\n    "], ["\n    <div class=\"canvas\" id=\"myCanvas\">\n    <div id=\"cy\"></div>\n    </div>\n\n    <div class=\"base\">\n      <span>", "</span>\n      <button class=\"btn\" @click=\"", "\"><sl-icon name=\"pc-display-horizontal\"></sl-icon></button>\n      \n\n      <button class=\"btn\"><sl-icon name=\"share\"></sl-icon></button>\n      <button class=\"btn\" @click=\"", "\"><sl-icon name=\"cloudy\"></sl-icon></button>\n\n      <div class=\"addOption\">\n          <button class=\"btn\"><sl-icon name=\"plus-square\" @click=\"", "\"></sl-icon></button>\n          <button class=\"btn\"><sl-icon name=\"dash-square\"></sl-icon></button>\n      </div>\n    </div>\n      \n    \n\n    <network-simulator></network-simulator>\n    "])), this.currentNodeToAdd, function () { return _this.currentNodeToAdd = "pc-display-horizontal"; }, function () { return _this.currentNodeToAdd = "cloudy"; }, this.addNode);
    };
    ComputerNetwork.prototype.addNode = function () {
        this.nodes.push({ data: { id: this.currentNodeToAdd + this.counter.toString(), name: this.currentNodeToAdd + this.counter.toString() } });
        this.counter++;
        this.initNetwork(this.objectIconMap.get(this.currentNodeToAdd));
    };
    ComputerNetwork.prototype.initNetwork = function (nodeBackground) {
        this._cy = (0, cytoscape_esm_min_js_1["default"])({
            container: this._cy,
            boxSelectionEnabled: false,
            autounselectify: true,
            style: cytoscape_esm_min_js_1["default"].stylesheet()
                .selector('node')
                .css({
                "shape": "round-rectangle",
                "label": this.id,
                "height": 20,
                "width": 20,
                'background-image': nodeBackground,
                'background-color': "white"
            })
                .selector(':selected')
                .css({
                'background-color': 'grey',
                'line-color': 'black',
                'target-arrow-color': 'black',
                'source-arrow-color': 'black',
                'text-outline-color': 'black'
            }),
            elements: {
                nodes: this.nodes,
                edges: this.edges
            },
            layout: {
                name: 'grid',
                padding: 2
            }
        });
        this._cy.on('tap', 'node', function () {
            try { // your browser may block popups
                window.open(this.data('href'));
            }
            catch (e) { // fall back on url change
                window.location.href = this.data('href');
            }
        });
    };
    ComputerNetwork.styles = (0, lit_2.css)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n      .base {\n        display: flex;\n        width: calc(85vw + 1px);\n        height: calc(22vh - 10px);\n        margin-bottom: 2vh;\n        background-color: LightBlue;\n      }\n      .btn {\n        border-radius: 1vh;\n        background-color: DodgerBlue;\n        border: none;\n        color: white;\n        padding: 10px;\n        margin: 5vh 2vw;\n        font-size: 16px;\n        cursor: pointer;\n        width: 10vh;\n        height: 10vh;\n      }\n      /* Darker background on mouse-over */\n      .btn:hover {\n        background-color: SteelBlue;\n    }\n    .addOption {\n      position: fixed;\n      right: 2vw;\n      width: 30vw;\n      height: calc(22vh - 10px);\n      margin-bottom: 2vh;\n    }\n    canvas {\n      display: flex;\n      width: 85vw;\n      height: 75vh;\n      border: 1px solid CadetBlue;\n    }\n    \n    .dropdown {\n      position: relative;\n      display: inline-block;\n    }\n    \n    .dropdown-content {\n      display: none;\n      position: absolute;\n      background-color: #f1f1f1;\n      min-width: 160px;\n      box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);\n      z-index: 1;\n    }\n    \n    .dropdown-content a {\n      color: black;\n      padding: 12px 16px;\n      text-decoration: none;\n      display: block;\n    }\n    #cy {\n      height: 100%;\n      width: 100%;\n      position: absolute;\n      left: 0;\n      top: 0;\n    }\n    \n    .dropdown-content a:hover {background-color: #ddd;}\n    \n    .dropdown:hover .dropdown-content {display: block;}\n    \n    .dropdown:hover .dropbtn {background-color: #3e8e41;}\n\n    :host([active]) {\n      border: 1px solid red;\n    }"], ["\n      .base {\n        display: flex;\n        width: calc(85vw + 1px);\n        height: calc(22vh - 10px);\n        margin-bottom: 2vh;\n        background-color: LightBlue;\n      }\n      .btn {\n        border-radius: 1vh;\n        background-color: DodgerBlue;\n        border: none;\n        color: white;\n        padding: 10px;\n        margin: 5vh 2vw;\n        font-size: 16px;\n        cursor: pointer;\n        width: 10vh;\n        height: 10vh;\n      }\n      /* Darker background on mouse-over */\n      .btn:hover {\n        background-color: SteelBlue;\n    }\n    .addOption {\n      position: fixed;\n      right: 2vw;\n      width: 30vw;\n      height: calc(22vh - 10px);\n      margin-bottom: 2vh;\n    }\n    canvas {\n      display: flex;\n      width: 85vw;\n      height: 75vh;\n      border: 1px solid CadetBlue;\n    }\n    \n    .dropdown {\n      position: relative;\n      display: inline-block;\n    }\n    \n    .dropdown-content {\n      display: none;\n      position: absolute;\n      background-color: #f1f1f1;\n      min-width: 160px;\n      box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);\n      z-index: 1;\n    }\n    \n    .dropdown-content a {\n      color: black;\n      padding: 12px 16px;\n      text-decoration: none;\n      display: block;\n    }\n    #cy {\n      height: 100%;\n      width: 100%;\n      position: absolute;\n      left: 0;\n      top: 0;\n    }\n    \n    .dropdown-content a:hover {background-color: #ddd;}\n    \n    .dropdown:hover .dropdown-content {display: block;}\n    \n    .dropdown:hover .dropbtn {background-color: #3e8e41;}\n\n    :host([active]) {\n      border: 1px solid red;\n    }"])));
    __decorate([
        (0, decorators_js_1.query)('#cy')
    ], ComputerNetwork.prototype, "_cy");
    __decorate([
        (0, decorators_js_1.property)({ type: (Array), reflect: true })
    ], ComputerNetwork.prototype, "nodes");
    __decorate([
        (0, decorators_js_1.property)({ type: (Array), reflect: true })
    ], ComputerNetwork.prototype, "edges");
    __decorate([
        (0, decorators_js_1.property)({ type: String, reflect: true })
    ], ComputerNetwork.prototype, "currentNodeToAdd");
    __decorate([
        (0, decorators_js_1.property)({ type: String, reflect: true })
    ], ComputerNetwork.prototype, "currentColor");
    __decorate([
        (0, decorators_js_1.property)({ type: Number, reflect: true })
    ], ComputerNetwork.prototype, "counter");
    ComputerNetwork = __decorate([
        (0, decorators_js_1.customElement)("computer-network")
    ], ComputerNetwork);
    return ComputerNetwork;
}(lit_1.LitElementWw));
exports.ComputerNetwork = ComputerNetwork;
var templateObject_1, templateObject_2;
