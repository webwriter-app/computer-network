import { ComputerNetwork } from "..";
import cytoscape from "cytoscape/dist/cytoscape.esm.min.js";
import edgehandles from 'cytoscape-edgehandles/cytoscape-edgehandles.js';

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

    network._graph.on('tap', 'node', (e: any) => {
        var node = e.target;
        console.log('tapped ' + node.id());
        network.selectedNode = node.id();
    });


    // the default values of each option are outlined below:
    let defaults = {
        canConnect: function (sourceNode, targetNode) {
            // whether an edge can be created between source and target
            return !sourceNode.same(targetNode); // e.g. disallow loops
        },
        edgeParams: function (sourceNode, targetNode) {
            // for edges between the specified source and target
            // return element object to be passed to cy.add() for edge
            return {};
        },
        hoverDelay: 150, // time spent hovering over a target node before it is considered selected
        snap: true, // when enabled, the edge can be drawn by just moving close to a target node (can be confusing on compound graphs)
        snapThreshold: 50, // the target node must be less than or equal to this many pixels away from the cursor/finger
        snapFrequency: 15, // the number of times per second (Hz) that snap checks done (lower is less expensive)
        noEdgeEventsInDraw: true, // set events:no to edges during draws, prevents mouseouts on compounds
        disableBrowserGestures: true // during an edge drawing gesture, disable browser gestures such as two-finger trackpad swipe and pinch-to-zoom
    };

    //register edge handles
    network._edgeHandles = network._graph.edgehandles(defaults);
}