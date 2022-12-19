import { AlertHelper } from "../utils/AlertHelper";
import { ConnectionType, PhysicalNode } from "./physicalNodes/PhysicalNode";

export class GraphEdge {
    id: string;
    color: string;
    cssClass: string[] = [];
    from: PhysicalNode;
    to: PhysicalNode;
    inPort: number;
    outPort: number;
    static counter = 0;
    source: string;
    target: string;

    //config on edge details 
    portIn: string; //can be port or interface --> TODO: different visualization for layer 2 and 3 connection
    portOut: string;

    constructor(color: string, from: PhysicalNode, to: PhysicalNode) {
        this.id = 'graphEdge' + GraphEdge.counter;
        GraphEdge.counter++;
        this.color = color;
        this.cssClass.push("color-edge");
        this.cssClass.push("unconfigured-edge");
        this.from = from;
        this.to = to;
        this.source = this.from.id;
        this.target = this.to.id;
    }


    static addPorts(edge: GraphEdge, inPort: number, outPort: number): GraphEdge {
        let inPortData: Map<string, any> = edge.from.portData.get(inPort);
        let outPortData: Map<string, any> = edge.to.portData.get(outPort);

        if (inPortData.get('Connection Type') == "wireless" && outPortData.get('Connection Type') == "wireless") {
            edge.cssClass.push("wireless-edge");
        }
        else if ((inPortData.get('Connection Type') == "wireless" && outPortData.get('Connection Type') == "ethernet") ||
            (inPortData.get('Connection Type') == "ethernet" && outPortData.get('Connection Type') == "wireless")) {
            AlertHelper.toastAlert("danger", "exclamation-triangle", 
            "The connection type of assigned ports are not compatible!", 
            "Please re-assign your ports or dismiss this connection.");
                return null;
        }
        else {
            edge.cssClass.push("wired-edge");
        }

        edge.cssClass.push("labelled-edge");
        
        let index;
        if ((index=edge.cssClass.indexOf("unconfigured-edge"))>-1) edge.cssClass.splice(index, 1);

        edge.from.portLinkMapping.set(inPort, edge.id);
        edge.to.portLinkMapping.set(outPort, edge.id);

        edge.inPort = inPort;
        edge.outPort = outPort;

        return edge;

        //check if one node belongs to a subnet, if yes --> other node must be a router
    }
}

