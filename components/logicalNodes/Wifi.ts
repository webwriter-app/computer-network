import { LogicalNode } from "./LogicalNode";

export class Wifi extends LogicalNode {

    constructor(color: string) { 
        super(color);
        this.id = 'wifi' + Wifi.counter;
        Wifi.counter++;
        this.cssClass.push('wifi-node');
    }


    static initWifiRange(color: string) : Wifi {
        let newWifi : Wifi = new Wifi(color);
        return newWifi;
    }
  
}