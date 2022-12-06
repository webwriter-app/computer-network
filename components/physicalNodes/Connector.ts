import { Address } from "../../adressing/addressTypes/Address";
import { IpAddress } from "../../adressing/addressTypes/IpAddress";
import { MacAddress } from "../../adressing/addressTypes/MacAddress";
import { Wifi } from "../logicalNodes/Wifi";
import { PhysicalNode } from "./PhysicalNode";

export abstract class Connector extends PhysicalNode {
    routingPossible: boolean;
    //TODO: routing extensions
    forwardingTable?: Map<any, any>;
    inPort: number;
    outPort: number;
    addresses?: Map<string, Address[]>; //(port, MAC+IP)

    constructor(color: string, layer: number, wifiEnabled: boolean,
        inPort: number, outPort: number, addresses?: Array<Address>, wifiRange?: Wifi, forwardingTable?) {
        if (wifiEnabled) {
            super(color, layer, wifiEnabled, wifiRange);
            this.routingPossible = false;
            this.forwardingTable = null;
        }
        else {
            super(color, layer, false);
        }
        this.inPort = inPort? inPort : 1;
        this.outPort = outPort? outPort : 1;
        this.cssClass.push('connector-node');

        if (addresses) {
            this.addresses = new Map();
            if(this.layer==1){
                //addresses is empty
            }
            else if(this.layer==2){
                //the input must be arrays of MacAddresses
                let inPortCounter: number = 1;
                let outPortCounter: number = 1;
                while(inPortCounter <= inPort){
                    let currentAd: MacAddress = addresses.pop();
                    this.addresses.set('inPort'+inPortCounter, [currentAd]);
                    inPortCounter++;
                }
                while(outPortCounter <= outPort){
                    let currentAd: MacAddress = addresses.pop();
                    this.addresses.set('outPort'+outPortCounter, [currentAd]);
                    outPortCounter++;
                }
            }
            else if(this.layer==3){
                //the input must be arrays of MacAddresses + IPAddresses
                let macAddresses: MacAddress[] = [];
                let ipAddresses: IpAddress[] = [];

                addresses.forEach(address => {
                    if(address instanceof MacAddress){
                        macAddresses.push(address);
                    }
                    if(address instanceof IpAddress){
                        ipAddresses.push(address);
                    }
                });

                let inPortCounter: number = 1;
                let outPortCounter: number = 1;
                while(inPortCounter <= inPort){
                    this.addresses.set('inPort'+inPortCounter, [macAddresses.pop(), ipAddresses.pop()]);
                    inPortCounter++;
                }
                while(outPortCounter <= outPort){
                    this.addresses.set('outPort'+outPortCounter, [macAddresses.pop(), ipAddresses.pop()]);
                    outPortCounter++;
                }
            }

        }
    }
}

export class Router extends Connector {
    constructor(color: string, wifiEnabled: boolean,
        inPort: number, outPort: number, name?: string, addresses?: Address[]) {
        super(color, 3, wifiEnabled, inPort, outPort, addresses);
        this.id = 'router' + Router.counter;
        Router.counter++;
        if (name != null && this.name != undefined && this.name != "") {
            this.name = name;
        }
        else {
            this.name = this.id;
        }


        this.cssClass.push('router-node');
        this.backgroundPath = "/node_modules/@shoelace-style/shoelace/dist/assets/icons/router.svg";
    }
}

export class Repeater extends Connector {
    constructor(color: string, wifiEnabled: boolean, name?: string) {
        super(color, 1, wifiEnabled, 1, 1);
        this.id = 'repeater' + Repeater.counter;
        Repeater.counter++;
        if (name != null && this.name != undefined && this.name != "") {
            this.name = name;
        }
        else {
            this.name = this.id;
        }


        this.cssClass.push('repeater-node');
        this.backgroundPath = "/node_modules/@shoelace-style/shoelace/dist/assets/icons/hdd.svg";
    }
}

export class Hub extends Connector {
    constructor(color: string, wifiEnabled: boolean, inPort: number, outPort: number, name?: string) {
        super(color, 1, wifiEnabled, inPort, outPort);
        this.id = 'hub' + Hub.counter;
        Hub.counter++;
        if (name != null && this.name != undefined && this.name != "") {
            this.name = name;
        }
        else {
            this.name = this.id;
        }


        this.cssClass.push('hub-node');
        this.backgroundPath = "/node_modules/@shoelace-style/shoelace/dist/assets/icons/git.svg";
    }
}

export class Switch extends Connector {
    constructor(color: string, inPort: number, outPort: number, name?: string, macAddresses?: MacAddress[]) {
        super(color, 2, false, inPort, outPort, macAddresses);
        this.id = 'switch' + Switch.counter;
        Switch.counter++;
        if (name != null && this.name != undefined && this.name != "") {
            this.name = name;
        }
        else {
            this.name = this.id;
        }


        this.cssClass.push('switch-node');
        this.backgroundPath = "/node_modules/@shoelace-style/shoelace/dist/assets/icons/displayport.svg";
    }
}

export class Bridge extends Connector {
    constructor(color: string, wifiEnabled: boolean, inPort: number, outPort: number, name?: string, macAddresses?: MacAddress[]) {
        super(color, 2, wifiEnabled, inPort, outPort, macAddresses);
        this.id = 'bridge' + Bridge.counter;
        Bridge.counter++;
        if (name != null && this.name != undefined && this.name != "") {
            this.name = name;
        }
        else {
            this.name = this.id;
        }


        this.cssClass.push('bridge-node');
        //change icon
        this.backgroundPath = "/node_modules/@shoelace-style/shoelace/dist/assets/icons/displayport.svg";
    }
}

export class AccessPoint extends Connector {
    constructor(color: string, inPort: number, outPort: number, name?: string, macAddresses?: MacAddress[]) {
        super(color, 2, true, inPort, outPort, macAddresses);
        this.id = 'accessPoint' + AccessPoint.counter;
        AccessPoint.counter++;
        if (name != null && this.name != undefined && this.name != "") {
            this.name = name;
        }
        else {
            this.name = this.id;
        }
        this.cssClass.push('access-point-node');
        this.backgroundPath = "/node_modules/@shoelace-style/shoelace/dist/assets/icons/broadcast-pin.svg";
    }
}