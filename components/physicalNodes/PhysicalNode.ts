import { Wifi } from "../logicalNodes/Wifi";

export abstract class PhysicalNode extends GraphNode {
    layer: number;
    wifiEnabled: boolean;
    wifiRange?: Wifi;
    backgroundPath: string;
    name: string;


    constructor(color: string, layer: number, wifiEnabled: boolean, name?: string, wifiRange?: Wifi){
        super(color, name);
        this.id = 'physicalNode' + PhysicalNode.counter;
        PhysicalNode.counter++;

        this.cssClass.push('physical-node');
        this.layer = layer;
        this.wifiEnabled = wifiEnabled;
        if (this.wifiEnabled) {
            if(wifiRange){
               this.wifiRange = wifiRange; 
            }
            else {
                this.wifiRange = Wifi.initWifiRange(color);
            }
        }
    }

    
}