import { PhysicalNode } from "./physicalNodes/PhysicalNode";

export abstract class GraphEdge {
    id: string;
    color: string;
    cssClass: string;
    from: PhysicalNode;
    to: PhysicalNode;
    mtu?: number;

    constructor(id: string, color: string, cssClass: string, from: PhysicalNode, to: PhysicalNode, mtu?: number){
        this.id = id;
        this.color = color;
        this.cssClass = cssClass;
        this.from = from;
        this.to = to;
        this.mtu = mtu;
    }
}

export class WiredEdge extends GraphEdge {

}

export class WirelessEdge extends GraphEdge {
    
}