import { ComputerNetwork } from "..";
import cytoscape from "cytoscape/dist/cytoscape.esm.min.js";
import edgehandles from 'cytoscape-edgehandles/cytoscape-edgehandles.js';
import contextMenus from 'cytoscape-context-menus/cytoscape-context-menus.js';
import NodeSingular from "cytoscape";

// import CSS as well
import 'cytoscape-context-menus/cytoscape-context-menus.css';
import { removeComponent } from "./component-manipulation";
import { SlDialog } from "@shoelace-style/shoelace";
import { generateDialog, InputData } from "../dialog/dialog-content";


// register extension
cytoscape.use(contextMenus);
cytoscape.use(edgehandles);


export function initNetwork(network: ComputerNetwork): void {
    network._graph = cytoscape({
        container: network._cy,

        boxSelectionEnabled: false,
        autounselectify: true,

        style: cytoscape.stylesheet()
            .selector('node')
            .css({
                "shape": "round-rectangle",
                "label": "data(name)",
                "height": 20,
                "width": 20,
                'background-image': "data(backgroundPath)",
                'background-color': "data(color)",
                'font-size': 15,

            })
            .selector(':selected')
            .css({
                'background-color': 'grey',
                'line-color': 'black',
                'target-arrow-color': 'black',
                'source-arrow-color': 'black',
                'text-outline-color': 'black'
            })
            //EDGE
            .selector('edge')
            .css({
                width: 1,
                "line-color": "data(color)",
                'curve-style': 'bezier',
                label: ""
            })

        ,
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
                selector: "node",
                onClickFunction: function (event) {
                    let node = event.target;

                    //pass data of current node into the dialog
                    let inputFields2 = generateDialog(new Map<string, InputData>([
                        ["name", new InputData("Name", "The name of this component", node._private.data.name, true)],
                        ["mac", new InputData("MAC", "The MAC-Address of this component", "", true)],
                        ["ip", new InputData("IP", "The IP-Address of this component", "", true)],
                    ]));

                    
                    let dialog = (network.renderRoot.querySelector('#testDialog') as SlDialog);

                    //TODO: how to appendChild here???
                    //dialog.innerHTML = inputFields.toString();
                    inputFields2.forEach(e => dialog.appendChild(e));
                    dialog.show();

                    const closeButton = dialog.querySelector('sl-button[slot="footer"]');
                    closeButton.addEventListener('click', () => dialog.hide());
                },
                hasTrailingDivider: true
            },
            {
                id: 'remove', // ID of menu item
                content: 'Remove', // Display content of menu item
                tooltipText: 'Remove this component', // Tooltip text for menu item
                image: { src: "/node_modules/@shoelace-style/shoelace/dist/assets/icons/trash.svg", width: 12, height: 12, x: 100, y: 52 }, // menu icon
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
            let edge = { group: 'edges', data: { id: 'e' + network.edgeCounter, source: sourceNode.data("id"), target: targetNode.data("id"), color: network.currentColor } };
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

    //register edge handles
    network._edgeHandles = network._graph.edgehandles(edgehandlesOptions);

    //register context menu
    network._instance = network._graph.contextMenus(menuOptions);

}