import { PhysicalNode } from "./physicalNodes/PhysicalNode";

export abstract class GraphEdge {
    id: string;
    color: string;
    cssClass: string;
    from: PhysicalNode;
    to: PhysicalNode;
    mtu?: number;
    static counter = 0;

    constructor(color: string, cssClass: string, from: PhysicalNode, to: PhysicalNode, mtu?: number){
        this.id = 'graphEdge' + GraphEdge.counter;
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