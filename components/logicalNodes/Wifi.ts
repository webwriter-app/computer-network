export class Wifi extends LogicalNode {

  
    static counter: number = 0;

    constructor(id: string, color: string, cssClass: string) { 
        super(id, color, cssClass);
    }


    static initWifiRange(color: string) : Wifi {
        let newWifi : Wifi = new Wifi('wifi'+Wifi.counter, color, 'wifi');
        Wifi.counter++;
        return newWifi;
    }
  
}