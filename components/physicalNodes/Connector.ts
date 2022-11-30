import { Address } from "../../adressing/addressTypes/Address";
import { Wifi } from "../logicalNodes/Wifi";
import { PhysicalNode } from "./PhysicalNode";

export abstract class Connector extends PhysicalNode {
    routingPossible: boolean;
    //TODO: routing extensions
    forwardingTable?: Map<any,any>;
    inPort: number;
    outPort: number;
    addresses: Address[];
    

    constructor(id: string, color: string, cssClass: string, layer: number, wifiEnabled: boolean, 
         inPort: number, outPort: number, wifiRange?: Wifi, forwardingTable?, addresses?: Array<Address>){
        if(wifiEnabled){
            super(id, color, cssClass, layer, wifiEnabled, wifiRange);
            this.routingPossible = false;
            this.forwardingTable = null;
        }
        else {
            super(id, color, cssClass, layer, false);
        }
        this.inPort = inPort;
        this.outPort = outPort;

        if(!addresses){
            //TODO: auto set address for the connector, depends on its layer
            //let address = new Address();
            this.addresses.push();
        }
    }
}

export class Router extends Connector{

    
}

export class Repeater extends Connector{

}

export class Hub extends Connector{

    
}

export class Switch extends Connector{

    
}

export class Bridge extends Connector{

    
}

export class AccessPoint extends Connector{

    
}