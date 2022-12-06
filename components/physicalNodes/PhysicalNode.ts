import { GraphNode } from "../GraphNode";
import { Wifi } from "../logicalNodes/Wifi";

export abstract class PhysicalNode extends GraphNode {
    layer: number;
    wifiEnabled: boolean;
    wifiRange?: Wifi;
    backgroundPath: string;
    name: string;


    constructor(color: string, layer: number, wifiEnabled: boolean, wifiRange?: Wifi){
        super(color);

        this.cssClass.push('physical-node');
        this.layer = layer;
        this.wifiEnabled = wifiEnabled;
        if (this.wifiEnabled) {
            this.cssClass.push('wifi-enabled');
        }
        else{
            this.cssClass.push('not-wifi');
        }
    }

    
}