import { Wifi } from "../logicalNodes/Wifi";

export abstract class PhysicalNode extends GraphNode {
    layer: number;
    wifiEnabled: boolean;
    wifiRange?: Wifi;
    backgroundPath: string;
    name: string;


    constructor(id: string, color: string, cssClass: string, layer: number, wifiEnabled: boolean, wifiRange?: Wifi){
        super(id, color, cssClass);
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