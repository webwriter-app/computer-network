abstract class LogicalNode extends GraphNode { 
    
    constructor(color: string, name?: string) { 
        super(color, name);
        this.id = 'logicalNode' + LogicalNode.counter;
        LogicalNode.counter++;
        this.cssClass.push('logical-node');
    }
}