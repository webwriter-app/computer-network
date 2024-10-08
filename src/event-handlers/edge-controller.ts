import { SlIcon } from "@shoelace-style/shoelace";
import { ComputerNetwork } from "../..";
import { GraphEdge } from "../components/GraphEdge";
import { PhysicalNode } from "../components/physicalNodes/PhysicalNode";
import { AlertHelper } from "../utils/AlertHelper";
import NodeSingular from "cytoscape";


export class EdgeController {

    static toggleDrawMode(network: ComputerNetwork): void {
        if (!network.drawModeOn) {
            if (network.currentComponentToAdd != "edge") {
                return;
            }
            network._edgeHandles.enableDrawMode();
            (network.renderRoot.querySelector('#drawMode') as SlIcon).name = "pause";
            (network.renderRoot.querySelector('#drawBtn') as HTMLElement).style.backgroundColor = "#0291DB";
            (network.renderRoot.querySelector('#resetColorBtn') as HTMLButtonElement).disabled = true;
        }
        else {
            network._edgeHandles.disableDrawMode();
            (network.renderRoot.querySelector('#drawMode') as SlIcon).name = "plug";
            (network.renderRoot.querySelector('#drawBtn') as HTMLElement).style.backgroundColor = "#8BA8CC";
            (network.renderRoot.querySelector('#resetColorBtn') as HTMLButtonElement).disabled = false;
        }
        network.drawModeOn = !network.drawModeOn;
    }

    static canConnect(source: NodeSingular, target: NodeSingular): boolean {
        //disallow loop & duplicate edge
        if (source.same(target) || source.allAreNeighbors(target)) {
            return false;
        }

        let sourceNode = source.data();
        let targetNode = target.data();
        let sourceCheck: boolean = source.hasClass('physical-node');
        let targetCheck: boolean = target.hasClass('physical-node');

        if (!sourceCheck || !targetCheck) return false;

        //the edgehandles extensions use a ghost edge, that increases the degree by 1 from the source
        if (source.degree() > sourceNode.numberOfInterfacesOrPorts) {
            AlertHelper.toastAlert("warning", "exclamation-triangle", sourceNode.name + " is out of available ports.", "");
            return false;
        }
        if (target.degree() >= targetNode.numberOfInterfacesOrPorts) {
            AlertHelper.toastAlert("warning", "exclamation-triangle", targetNode.name + " is out of available ports.", "");
            return false;
        }

        return true;
    }

    static newUnconfiguredEdge(network: ComputerNetwork, source: PhysicalNode, target: PhysicalNode): any {
        let unconfiguredEdge = new GraphEdge(network.currentColor, source, target);
        return { group: 'edges', data: unconfiguredEdge, classes: unconfiguredEdge.cssClass };
    }

    static removeConnection(edge: GraphEdge, graph){ 
        if(edge.inPort!=undefined && edge.inPort!=null && !Number.isNaN(edge.inPort)){
            if(graph.$("#"+edge.from.id).data() instanceof PhysicalNode) graph.$("#"+edge.from.id).data().portLinkMapping.set(edge.inPort, null);
        }
        if(edge.outPort!=undefined && edge.outPort!=null && !Number.isNaN(edge.outPort)){
            if(graph.$("#"+edge.to.id).data() instanceof PhysicalNode) graph.$("#"+edge.to.id).data().portLinkMapping.set(edge.outPort, null);
        }
    }
}