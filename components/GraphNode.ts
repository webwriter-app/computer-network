export abstract class GraphNode {
    id: string;
    name: string;
    color: string;
    cssClass: string[] = [];
    static counter = 0;

    constructor(color: string) {
        this.color = color;
        this.cssClass.push('element-label');
    }


}