import { ConnectionType, PhysicalNode } from "./physicalNodes/PhysicalNode";

export class GraphEdge {
    id: string;
    color: string;
    cssClass: string[] = [];
    from: PhysicalNode;
    to: PhysicalNode;
    static counter = 0;
    source: string;
    target: string;
    
    //config on edge details 
    portIn: string; //can be port or interface --> TODO: different visualization for layer 2 and 3 connection
    portOut: string;

    constructor(color: string, from: PhysicalNode, to: PhysicalNode){
        this.id = 'graphEdge' + GraphEdge.counter;
        GraphEdge.counter++;
        this.color = color;
        this.cssClass.push("color-edge");
        this.from = from;
        this.to = to;
        this.source = this.from.id;
        this.target = this.to.id;
    }


    addPorts(inPort: string, outPort: string): void {
        let inPortData: Map<string,any> = this.from.portData.get(inPort);
        let outPortData: Map<string,any> = this.to.portData.get(outPort);

        if(inPortData.get('connectionType')==ConnectionType.wireless || outPortData.get('connectionType')==ConnectionType.wireless){
            this.cssClass.push("wireless-edge");
        }
        else if((inPortData.get('connectionType')==ConnectionType.wireless || outPortData.get('connectionType')==ConnectionType.ethernet) ||
        (inPortData.get('connectionType')==ConnectionType.ethernet || outPortData.get('connectionType')==ConnectionType.wireless)){
            this.cssClass.push("error-edge");
            return;
        }
        else{
            this.cssClass.push("wired-edge");
        }

        this.from.portLinkMapping.set(inPort, this);
        this.to.portLinkMapping.set(outPort, this);
        

        //check if one node belongs to a subnet, if yes --> other node must be a router
    }
}

