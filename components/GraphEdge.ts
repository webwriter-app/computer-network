import { PhysicalNode } from "./physicalNodes/PhysicalNode";

export abstract class GraphEdge {
    id: string;
    color: string;
    cssClass: string;
    from: PhysicalNode;
    to: PhysicalNode;
    mtu?: number;
    static counter = 0;
    source: string;
    target: string;

    constructor(color: string, from: PhysicalNode, to: PhysicalNode, mtu?: number){
        this.id = 'graphEdge' + GraphEdge.counter;
        GraphEdge.counter++;
        this.color = color;
        this.cssClass = "color-edge";
        this.from = from;
        this.to = to;
        this.mtu = mtu;
        this.source = this.from.id;
        this.target = this.to.id;
    }
}

export class WiredEdge extends GraphEdge {
    constructor(color: string, from: PhysicalNode, to: PhysicalNode, mtu?: number){
        super(color, from, to, mtu);
    }
}

export class WirelessEdge extends GraphEdge {
    constructor(from: PhysicalNode, to: PhysicalNode, mtu?: number){
        super("white", from, to, mtu);
    }
}