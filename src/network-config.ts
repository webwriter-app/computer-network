import { ComputerNetwork } from "..";
import cytoscape from "cytoscape/dist/cytoscape.esm.min.js";
import edgehandles from 'cytoscape-edgehandles/cytoscape-edgehandles.js';
import contextMenus from 'cytoscape-context-menus/cytoscape-context-menus.js';
import compoundDragAndDrop from 'cytoscape-compound-drag-and-drop/cytoscape-compound-drag-and-drop.js';
import nodeHtmlLabel from 'cytoscape-node-html-label/dist/cytoscape-node-html-label.min.js'
import NodeSingular from "cytoscape";


// import CSS as well
import 'cytoscape-context-menus/cytoscape-context-menus.css';
import { DialogFactory } from "./event-handlers/dialog-content";
import { EdgeController } from "./event-handlers/edge-controller";

import { AlertHelper } from "./utils/AlertHelper";
import { SubnettingController } from "./event-handlers/subnetting-controller";
import { Address } from "./adressing/Address";
import { GraphEdge } from "./components/GraphEdge";
import { Subnet } from "./components/logicalNodes/Subnet";
import { PhysicalNode } from "./components/physicalNodes/PhysicalNode";
import { Router } from "./components/physicalNodes/Connector";
import { GraphNodeFactory } from "./event-handlers/component-manipulation";


// register extension
cytoscape.use(contextMenus);
cytoscape.use(edgehandles);
cytoscape.use(compoundDragAndDrop);
cytoscape.use(nodeHtmlLabel);


export function initNetwork(network: ComputerNetwork): void {
    network._graph = cytoscape({
        container: network._cy,

        boxSelectionEnabled: false,
        autounselectify: true,

        style: [
            {
                "selector": "[name]",
                "style": {
                    "label": "data(name)"
                }
            },
            {
                "selector": ":selected",
                "style": {
                    "background-color": "grey",
                    "line-color": "black",
                    "target-arrow-color": "black",
                    "source-arrow-color": "black",
                    "text-outline-color": "black"
                }
            },
            {
                "selector": "edge",
                "style": {
                    "width": 1,
                    "curve-style": "straight",
                }
            },
            {
                "selector": ".color-edge",
                "style": {
                    "line-color": "data(color)",
                    "color": "black"
                }
            },
            {
                "selector": ".unconfigured-edge",
                "style": {
                    "line-style": "dotted",
                    "line-opacity": 0.8,
                    "font-size": 5,
                    "label": "please assign the ports/ interfaces",
                    "edge-text-rotation": "autorotate"
                }
            },
            {
                "selector": ".labelled-edge",
                "style": {
                    "text-wrap": "wrap",
                    "font-size": 8,
                    "edge-text-rotation": "autorotate",
                    'source-text-offset': 50,
                    'source-text-rotation': 'autorotate',
                    'target-text-offset': 50,
                    'target-text-rotation': 'autorotate',
                    "source-label": function (edge) {
                        let source: PhysicalNode = edge.data('from');
                        let port: number = edge.data('inPort');
                        let portData: Map<string, any> = source.portData.get(port);
                        let label = "";
                        //TOEXTEND:hide IPv6 since the widget doesn't support IPv6 atm
                        portData.forEach((value, key) => label += (key == 'Connection Type' || key == 'IPv6') ? "" :
                            (value instanceof Address ? key + ": " + value.address + "\n" : value + "\n"));
                        return label;
                    },
                    "target-label": function (edge) {
                        let target: PhysicalNode = edge.data('to');
                        let port: number = edge.data('outPort');
                        let portData: Map<string, any> = target.portData.get(port);
                        let label = "";
                        portData.forEach((value, key) => label += (key == 'Connection Type' || key == 'IPv6') ? "" :
                            (value instanceof Address ? key + ": " + value.address + "\n" : value + "\n"));
                        return label;
                    },
                    "label": ""
                }
            },
            {
                "selector": ".wireless-edge",
                "style": {
                    "line-style": "dashed",
                    "line-dash-pattern": [6, 3]
                }
            },
            {
                "selector": ".wired-edge",
                "style": {
                    "line-style": "solid",
                }
            },
            {
                "selector": ".physical-node",
                "style": {
                    "text-valign": "bottom",
                    "text-halign": "center",
                    "shape": "round-rectangle",
                    "height": 20,
                    "width": 20,
                    "font-size": 15,
                    "text-wrap": "wrap",
                    "background-color": "data(color)",
                    "background-image": "data(backgroundPath)",
                    "font-family": "monospace",
                }
            },
            {
                "selector": ".unconfigured-subnet",
                "style": {
                    "label": "unconfigured"
                }
            },
            {
                "selector": ".subnet-node",
                "style": {
                    "text-valign": "top",
                    "text-halign": "center",
                    "shape": "round-rectangle",
                    "height": 50,
                    "width": 50,
                    "font-size": 8,
                    "text-wrap": "wrap",
                    "font-family": "monospace",
                    "background-opacity": 0.4,
                    "background-color": "data(color)",
                }
            },
            {
                "selector": ".gateway-node",
                "style": {
                    "background-fill": "linear-gradient",
                    "background-gradient-stop-colors": function (gateway) {
                        let colors: string[] = (gateway.data() as Router).colorsForGateway();
                        return colors.join(' ');
                    },
                }
            },
            {
                "selector": ".data-node",
                "style": {
                    "text-valign": "center",
                    "text-halign": "center",
                    "shape": "round-rectangle",
                    "height": 15,
                    "width": 60,
                    "font-size": 10,
                    "text-wrap": "wrap",
                    "background-image": "data(backgroundPath)",
                    "font-family": "monospace",
                }
            }
        ],

        layout: {
            name: 'grid',
            padding: 2
        },
        // initial viewport state:
        zoom: 5,
        pan: { x: 0, y: 0 },
        minZoom: 1,
        maxZoom: 1e50,
    });


    //options for context menu
    let menuOptions = {
        evtType: "cxttap",
        menuItems: [
            {
                id: "details-for-host",
                content: "View Details...",
                tooltipText: "View Details",
                selector: ".physical-node",
                onClickFunction: function (event) {
                    let node = event.target;
                    let id = node.data().id;
                    if (node.isChild()) {
                        DialogFactory.handleChangesInDialogForPhysicalNode(id, node, network, node.hasClass('gateway-node'), node.parent().data());
                    }
                    else {
                        DialogFactory.handleChangesInDialogForPhysicalNode(id, node, network, node.hasClass('gateway-node'));
                    }
                },
                hasTrailingDivider: true
            },
            {
                id: "details-for-subnet",
                content: "View Details...",
                tooltipText: "View Details",
                selector: ".subnet-node",
                onClickFunction: function (event) {
                    let node = event.target;
                    let id = node.data().id;

                    DialogFactory.handleChangesInDialogForSubnet(id, node, network);
                },
                hasTrailingDivider: true
            },
            {
                id: "configure-port",
                content: "Configure ports for this connection",
                selector: ".unconfigured-edge",
                onClickFunction: function (event) {
                    let edge = event.target;
                    let graphEdge: GraphEdge = edge.data();
                    DialogFactory.generateInputsDetailsForEdge(network, edge, graphEdge.from, graphEdge.to);
                },
                hasTrailingDivider: true
            },
            {
                id: "configure-default-gateway",
                content: "Configure default gateway for this connection",
                selector: ".default-gateway-not-found, .gateway-changeable",
                onClickFunction: function (event) {
                    let node = event.target;
                    DialogFactory.handleChangeDefaultGateway(node.parent().data(), node.id(), node, network);
                },
                hasTrailingDivider: true
            },
            {
                id: 'remove', // ID of menu item
                content: 'Remove', // Display content of menu item
                tooltipText: 'Remove this component', // Tooltip text for menu item
                // Filters the elements to have this menu item on cxttap
                // If the selector is not truthy no elements will have this menu item on cxttap
                selector: "node, edge",
                onClickFunction: (event) => { // The function to be executed on click
                    let component = event.target;
                    if (component.isEdge()) {
                        EdgeController.removeConnection(component.data(), network._graph);
                    }
                    else {
                        //GraphNodeFactory.removeNode(component, network);
                    }
                    component.remove();
                },
                disabled: false, // Whether the item will be created as disabled
                show: true, // Whether the item will be shown or not
                hasTrailingDivider: true, // Whether the item will have a trailing divider
                coreAsWell: false // Whether core instance have this item on cxttap
            },

        ],
        menuItemClasses: ["custom-menu-item", "custom-menu-item:hover"],
        contextMenuClasses: ["custom-context-menu"]
    };


    // options for edgehandles
    let edgehandlesOptions = {
        canConnect: function (sourceNode, targetNode) {
            // whether an edge can be created between source and target
            return EdgeController.canConnect(sourceNode, targetNode);
        },
        edgeParams: function (sourceNode: NodeSingular, targetNode: NodeSingular) {
            return EdgeController.newUnconfiguredEdge(network, sourceNode.data(), targetNode.data());
        },
        preview: true, // whether to show added edges preview before releasing selection
        stackOrder: 4, // Controls stack order of edgehandles canvas element by setting it's z-index
        handleSize: 10, // the size of the edge handle put on nodes
        handleLineType: 'ghost', // can be 'ghost' for real edge, 'straight' for a straight line, or 'draw' for a draw-as-you-go line
        handleLineWidth: 1, // width of handle line in pixels
        handleIcon: false, // Pass an Image-object to use as icon on handle. Icons are resized according to zoom and centered in handle.
        handleNodes: 'node',

        hoverDelay: 150, // time spent hovering over a target node before it is considered selected
        snap: false, // when enabled, the edge can be drawn by just moving close to a target node (can be confusing on compound graphs)
        snapThreshold: 50, // the target node must be less than or equal to this many pixels away from the cursor/finger
        snapFrequency: 15, // the number of times per second (Hz) that snap checks done (lower is less expensive)
        noEdgeEventsInDraw: true, // set events:no to edges during draws, prevents mouseouts on compounds
        disableBrowserGestures: true // during an edge drawing gesture, disable browser gestures such as two-finger trackpad swipe and pinch-to-zoom
    };


    //options for drap-and-drop compound nodes - no handle on drag out of compound
    const subnettingOptions = {
        grabbedNode: node => { return node.connectedEdges().length == 0; }, // nodes valid to grab and drop into subnet: ones that don't have any link
        dropTarget: (dropTarget, grabbedNode) => {

            grabbedNode.on('cdnddrop', (event, target, sibling) => {
                let parent = target != null ? target : sibling;
                if (parent.data() instanceof Subnet) {
                    switch (Subnet.mode) {
                        case 'HOST_BASED': //subnet's info get regenerated based on hosts in host_mode
                            SubnettingController.onDragInACompound(grabbedNode, parent, network.ipv4Database);
                            break;
                        case 'SUBNET_BASED': //the subnet must be configured to drag hosts into (subnet_mode)
                            let bitmask: number = parent.data().bitmask;
                            if (bitmask != null && bitmask != undefined && !Number.isNaN(bitmask)) {
                                //check if current num. of hosts exceed allowed && subnet is configured
                                if (((Math.pow(2, 32 - bitmask) - 2) > parent.children().length) && !parent.hasClass('unconfigured-subnet')) {
                                    SubnettingController.onDragInACompound(grabbedNode, parent, network.ipv4Database);
                                }
                            }
                            else {
                                AlertHelper.toastAlert('danger', 'exclamation-triangle', "Subnet-based mode activated:", "Unable to drag hosts into unconfigured subnet.");
                            }
                            break;
                        default:
                            SubnettingController.onDragInACompound(grabbedNode, parent, network.ipv4Database);
                            break;
                    }
                }
            });

            if (dropTarget.hasClass('unconfigured-subnet') && Subnet.mode == "SUBNET_BASED") return false;
            return dropTarget.data() instanceof Subnet;
        }, // filter function to specify which parent nodes are valid drop targets
        dropSibling: (dropSibling, grabbedNode) => { return (dropSibling.data() instanceof Subnet); }, // filter function to specify which orphan nodes are valid drop siblings
        newParentNode: (grabbedNode, dropSibling) => {
            if (dropSibling.data() instanceof Subnet) return dropSibling;
        }, // specifies element json for parent nodes added by dropping an orphan node on another orphan (a drop sibling). You can chose to return the dropSibling in which case it becomes the parent node and will be preserved after all its children are removed.
        boundingBoxOptions: { // same as https://js.cytoscape.org/#eles.boundingBox, used when calculating if one node is dragged over another
            includeOverlays: false,
            includeLabels: true
        },
        overThreshold: 10, // make dragging over a drop target easier by expanding the hit area by this amount on all sides
        outThreshold: 10 // make dragging out of a drop target a bit harder by expanding the hit area by this amount on all sides
    };


    //register edge handles
    network._edgeHandles = network._graph.edgehandles(edgehandlesOptions);

    //register context menu
    network._instance = network._graph.contextMenus(menuOptions);

    network._cdnd = network._graph.compoundDragAndDrop(subnettingOptions);
    network._cdnd.disable();


    //TODO: custom badge for extensions (e.g. firewall)
    network._graph.nodeHtmlLabel([
        {
            query: ".default-gateway-not-found",
            valign: "top",
            halign: "right",
            tpl: function () {
                return `<sl-icon src="doc/icons/no-internet.svg">`;
            }
        }
    ]);

    network._graph.on('tapend', '.router-node', function (event) {
        if (!SubnettingController.assignGatewayOn) return;
        SubnettingController.addGateway(event, network);
    });


    //handle database and port assignment on removing node/edge
    network._graph.on('remove', 'node', (event) => {
        GraphNodeFactory.removeNode(event.target, network);
    });
    network._graph.on('remove', 'edge', (event) => {
        EdgeController.removeConnection(event.target.data(), network._graph);
    });
}