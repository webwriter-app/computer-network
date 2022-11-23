import { ComputerNetwork } from "..";
import cytoscape from "cytoscape/dist/cytoscape.esm.min.js";
import edgehandles from 'cytoscape-edgehandles/cytoscape-edgehandles.js';
import contextMenus from 'cytoscape-context-menus/cytoscape-context-menus.js';
import compoundDragAndDrop from 'cytoscape-compound-drag-and-drop/cytoscape-compound-drag-and-drop.js';
import nodeHtmlLabel from 'cytoscape-node-html-label/dist/cytoscape-node-html-label.min.js'
import NodeSingular from "cytoscape";

// import CSS as well
import 'cytoscape-context-menus/cytoscape-context-menus.css';
import { removeComponent } from "./component-manipulation";
import { SlAlert, SlCheckbox } from "@shoelace-style/shoelace";
import { handleChangesInDialog } from "../dialog/dialog-content";
import { generateNewSubnet, onDragInACompound } from "../adressing/subnetting-controller";



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
                "selector": "node",
                "style": {
                    "shape": "round-rectangle",
                    "height": 20,
                    "width": 20,
                    "font-size": 15
                }
            },
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
                    "curve-style": "bezier",
                    "label": ""
                }
            },
            {
                "selector": ".color-edge",
                "style": {
                    "line-color": "data(color)"
                }
            },
            {
                "selector": ".element-label",
                "style": {
                    "text-valign": "bottom",
                    "text-halign": "center",
                    "font-size": 10,
                    "text-wrap": "wrap",
                    "background-color": "data(color)",
                    "background-image": "data(backgroundPath)",
                    "font-family": "system-ui"
                }
            },
            {
                "selector": ".compound-label",
                "style": {
                    "text-valign": "top",
                    "text-halign": "center",
                    "font-size": 8,
                    "text-wrap": "wrap",
                    "font-family": "system-ui",
                    "background-opacity": 0.4,
                    "background-color": "data(color)"
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
        minZoom: 3,
        maxZoom: 1e50,
    });


    //options for context menu
    let menuOptions = {
        evtType: "cxttap",
        menuItems: [
            {
                id: "details",
                content: "View Details...",
                tooltipText: "View Details",
                selector: ".element-label",
                onClickFunction: function (event) {
                    let node = event.target;
                    let id = node._private.data.id;

                    handleChangesInDialog(id, node, network);
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
                    removeComponent(network, component.id());
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
            return !sourceNode.same(targetNode); // e.g. disallow loops
        },
        edgeParams: function (sourceNode: NodeSingular, targetNode: NodeSingular, i: number) {
            // for edges between the specified source and target
            // return element object to be passed to cy.add() for edge
            // NB: i indicates edge index in case of edgeType: 'node'
            let edge = { group: 'edges', data: { id: 'e' + network.edgeCounter, source: sourceNode.data("id"), target: targetNode.data("id"), color: network.currentColor }, classes: "color-edge" };
            network.edgeCounter++;
            return edge;
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


    //options for drap-and-drop compound nodes
    const compoundOptions = {
        grabbedNode: node => true, // filter function to specify which nodes are valid to grab and drop into other nodes
        dropTarget: (dropTarget, grabbedNode) => {

            if (dropTarget._private.data.id.includes('compound')) {
                if (dropTarget._private.children.length >= Math.pow(2, 32 - parseInt(dropTarget._private.data.ip.split('/')[1]))) {

                    let isChild: boolean = false;

                    dropTarget._private.children.forEach(child => {
                        //if grabbed node is child of the network, then fire no alert
                        if (child._private.data.id == grabbedNode._private.data.id) {
                            isChild = true;
                            return true;
                        }
                    });

                    if (!isChild) {
                        let alert = new SlAlert;
                        alert.variant = "danger";
                        alert.closable = true;
                        alert.innerHTML = `
                            <sl-icon slot="icon" name="exclamation-octagon"></sl-icon>
                            <strong>This subnet has no available IP address.</strong><br />
                            Please drag your component onto another subnet, or change the target subnet's ID!`
                        alert.toast();

                    }
                    return false;
                }
            }
            return true;
        }, // filter function to specify which parent nodes are valid drop targets




        dropSibling: (dropSibling, grabbedNode) => true, // filter function to specify which orphan nodes are valid drop siblings
        newParentNode: (grabbedNode, dropSibling) => (generateNewSubnet(network, grabbedNode, dropSibling)), // specifies element json for parent nodes added by dropping an orphan node on another orphan (a drop sibling). You can chose to return the dropSibling in which case it becomes the parent node and will be preserved after all its children are removed.
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

    network._cdnd = network._graph.compoundDragAndDrop(compoundOptions);
    network._cdnd.disable();


    network._graph.on('cdnddrop', (event, compound, dropSibling) => onDragInACompound(event, compound));

    //TODO: custom badge for extensions (e.g. firewall)
    network._graph.nodeHtmlLabel([
        {
            query: ".element-label",
            valign: "bottom",
            halign: "center",
            halignBox: 'center',
            valignBox: 'bottom',
            tpl: function (data) {
                let showIp: boolean = (network.renderRoot.querySelector('#IpCheckBox') as SlCheckbox).checked;
                let showBinIp: boolean = (network.renderRoot.querySelector('#IpBinCheckBox') as SlCheckbox).checked;
                let showMac: boolean = (network.renderRoot.querySelector('#MacCheckBox') as SlCheckbox).checked;

                //if no data needed to be shown
                if (!showIp && !showBinIp && !showMac) {
                    return "";
                }

                let additionalLabel = "";

                let hasPre: boolean = false;

                additionalLabel += `<div><span class="element-info-box"><p>`;

                if (showIp) {
                    additionalLabel += `IP: ${data.ip}`;
                    hasPre = true;
                }

                if (showMac) {
                    if (hasPre) {
                        additionalLabel += `<br>`;
                    }
                    additionalLabel += `MAC: ${data.mac}`;
                    hasPre = true;
                }

                if (showBinIp) {
                    if (hasPre) {
                        additionalLabel += `<br>`;
                    }
                    additionalLabel += `IP(2): ${data.ipBin}`;
                }
                return additionalLabel + `</p></div>`;
            }
        }
    ]);
}