import { GraphNode } from "../GraphNode";

export abstract class LogicalNode extends GraphNode { 
    
    constructor(color: string) { 
        super(color);
        this.cssClass.push('logical-node');
    }
}