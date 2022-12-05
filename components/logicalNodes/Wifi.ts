export class Wifi extends LogicalNode {

  
    static counter: number = 0;

    constructor(color: string, name?: string) { 
        super(color, name);
        this.id = 'wifi' + Wifi.counter;
        Wifi.counter++;
        this.cssClass.push('wifi-node');
    }


    static initWifiRange(color: string) : Wifi {
        let newWifi : Wifi = new Wifi('wifi'+Wifi.counter, color);
        Wifi.counter++;
        return newWifi;
    }
  
}