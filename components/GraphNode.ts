abstract class GraphNode {
    id: string;
    name: string;
    color: string;
    cssClass: string[];
    static counter = 0;

    constructor(color: string, name?: string) {
        this.id = 'graphNode' + GraphNode.counter;
        GraphNode.counter++;

        if (name != null) {
            this.name = name;
        }
        else {
            this.name = this.id;
        }

        this.color = color;
        this.cssClass.push('element-label');
    }


}