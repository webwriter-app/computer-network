export abstract class GraphNode {
    id: string;
    name: string;
    color: string;
    cssClass: string[] = [];

    constructor(color: string) {
        this.color = color;
        this.cssClass.push('deletable');
    }
}
