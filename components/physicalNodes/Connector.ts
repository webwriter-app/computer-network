import { Address } from "../../adressing/addressTypes/Address";
import { Wifi } from "../logicalNodes/Wifi";
import { PhysicalNode } from "./PhysicalNode";

export abstract class Connector extends PhysicalNode {
    routingPossible: boolean;
    //TODO: routing extensions
    forwardingTable?: Map<any, any>;
    inPort: number;
    outPort: number;
    addresses: Address[];

    constructor(color: string, layer: number, wifiEnabled: boolean,
        inPort: number, outPort: number, wifiRange?: Wifi, forwardingTable?, addresses?: Array<Address>) {
        if (wifiEnabled) {
            super(color, layer, wifiEnabled, wifiRange);
            this.routingPossible = false;
            this.forwardingTable = null;
        }
        else {
            super(color, layer, false);
        }
        this.inPort = inPort;
        this.outPort = outPort;
        this.cssClass.push('connector');

        if (!addresses) {
            //TODO: auto set address for the connector, depends on its layer
            //this.addresses.push();
        }
    }
}

export class Router extends Connector {
    constructor(color: string, wifiEnabled: boolean,
        inPort: number, outPort: number, name?: string) {
        super(color, 3, wifiEnabled, inPort, outPort);

        if (name != null && this.name!=undefined && this.name!="") {
            this.name = name;
        }
        else {
            this.name = this.id;
        }

        this.id = 'router' + Router.counter;
        Router.counter++;
        this.cssClass.push('router-node');
        this.backgroundPath = "/node_modules/@shoelace-style/shoelace/dist/assets/icons/router.svg";
    }
}

export class Repeater extends Connector {
    constructor(color: string, wifiEnabled: boolean, name?: string) {
        super(color, 1, wifiEnabled, 1, 1);

        if (name != null && this.name!=undefined && this.name!="") {
            this.name = name;
        }
        else {
            this.name = this.id;
        }

        this.id = 'repeater' + Repeater.counter;
        Repeater.counter++;
        this.cssClass.push('repeater-node');
        this.backgroundPath = "/node_modules/@shoelace-style/shoelace/dist/assets/icons/hdd.svg";
    }
}

export class Hub extends Connector {
    constructor(color: string, wifiEnabled: boolean, inPort: number, outPort: number, name?: string) {
        super(color, 1, wifiEnabled, inPort, outPort);

        if (name != null && this.name!=undefined && this.name!="") {
            this.name = name;
        }
        else {
            this.name = this.id;
        }

        this.id = 'hub' + Hub.counter;
        Hub.counter++;
        this.cssClass.push('hub-node');
        this.backgroundPath = "/node_modules/@shoelace-style/shoelace/dist/assets/icons/git.svg";
    }
}

export class Switch extends Connector {
    constructor(color: string, inPort: number, outPort: number, name?: string) {
        super(color, 2, false, inPort, outPort);

        if (name != null && this.name!=undefined && this.name!="") {
            this.name = name;
        }
        else {
            this.name = this.id;
        }

        this.id = 'switch' + Switch.counter;
        Switch.counter++;
        this.cssClass.push('switch-node');
        this.backgroundPath = "/node_modules/@shoelace-style/shoelace/dist/assets/icons/displayport.svg";
    }
}

export class Bridge extends Connector {
    constructor(color: string, wifiEnabled: boolean, inPort: number, outPort: number, name?: string) {
        super(color, 2, wifiEnabled, inPort, outPort);

        if (name != null && this.name!=undefined && this.name!="") {
            this.name = name;
        }
        else {
            this.name = this.id;
        }

        this.id = 'bridge' + Bridge.counter;
        Bridge.counter++;
        this.cssClass.push('bridge-node');
        //change icon
        this.backgroundPath = "/node_modules/@shoelace-style/shoelace/dist/assets/icons/displayport.svg";
    }
}

export class AccessPoint extends Connector {
    constructor(color: string, inPort: number, outPort: number, name?: string) {
        super(color, 2, true, inPort, outPort);

        if (name != null && this.name!=undefined && this.name!="") {
            this.name = name;
        }
        else {
            this.name = this.id;
        }

        this.id = 'accessPoint' + AccessPoint.counter;
        AccessPoint.counter++;
        this.cssClass.push('access-point-node');
        this.backgroundPath = "/node_modules/@shoelace-style/shoelace/dist/assets/icons/broadcast-pin.svg";
    }
}