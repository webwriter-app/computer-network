abstract class GraphNode {
    id: string;
    color: string;
    cssClass: string[];
    
    constructor(id: string, color: string, cssClass: string) {
        this.id = id;
        this.color = color;
        this.cssClass.push(cssClass);
    }

   
}