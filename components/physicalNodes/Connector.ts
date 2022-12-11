import { IpAddress } from "../../adressing/IpAddress";
import { Ipv6Address } from "../../adressing/Ipv6Address";
import { MacAddress } from "../../adressing/MacAddress";
import { ConnectionType, PhysicalNode } from "./PhysicalNode";

export abstract class Connector extends PhysicalNode {

    constructor(color: string, layer: number, numberOfInterfacesOrPorts: number, interfaceNames: string[], portConnectionTypes: Map<string, ConnectionType>, connectionType?: ConnectionType) {
        super(color, layer, numberOfInterfacesOrPorts, interfaceNames, connectionType);

        if (portConnectionTypes != null) {
            portConnectionTypes.forEach((connectionType, port) => {
                this.portData.get(port).set('connection-type', connectionType);
            });
        }
    }
}

export class Router extends Connector {
    constructor(color: string, numberOfInterfaces: number, interfaceNames: string[], portConnectionTypes: Map<string, ConnectionType>,
        portMacMapping: Map<string, MacAddress>, portIpv4Mapping: Map<string, IpAddress>, portIpv6Mapping: Map<string, Ipv6Address>, name?: string) {
        super(color, 3, numberOfInterfaces, interfaceNames, portConnectionTypes);

        this.id = 'router' + Router.counter;
        Router.counter++;
        if (name != null && name != undefined && name != "") {
            this.name = name;
        }
        else {
            this.name = this.id;
        }

        portMacMapping.forEach((macAddress, port) => {
            this.portData.get(port).set('MAC', macAddress);
        });
        portIpv4Mapping.forEach((ip4, port) => {
            this.portData.get(port).set('IPv4', ip4);
        });
        portIpv6Mapping.forEach((ip6, port) => {
            this.portData.get(port).set('IPv6', ip6);
        });

        this.cssClass.push('router-node');
        this.backgroundPath = "/node_modules/@shoelace-style/shoelace/dist/assets/icons/router.svg";
    }
}

export class Repeater extends Connector {
    constructor(color: string, portNumbers: string[], portConnectionTypes: Map<string, ConnectionType>, name?: string) {
        super(color, 1, 2, portNumbers, portConnectionTypes);
        this.id = 'repeater' + Repeater.counter;
        Repeater.counter++;
        if (name != null && name != undefined && name != "") {
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
    constructor(color: string, numberOfPorts: number, portNumbers: string[], name?: string) {
        super(color, 1, (numberOfPorts != null && numberOfPorts != 0) ? numberOfPorts : 2, portNumbers, null, ConnectionType.ethernet);
        this.id = 'hub' + Hub.counter;
        Hub.counter++;
        if (name != null && name != undefined && name != "") {
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
    constructor(color: string, numberOfPorts: number, portNumbers: string[], portMacMapping: Map<string, MacAddress>, name?: string) {
        super(color, 2, (numberOfPorts != null && numberOfPorts != 0) ? numberOfPorts : 2, portNumbers, null, ConnectionType.ethernet);

        this.id = 'switch' + Switch.counter;
        Switch.counter++;
        if (name != null && name != undefined && name != "") {
            this.name = name;
        }
        else {
            this.name = this.id;
        }
        portMacMapping.forEach((macAddress, port) => {
            this.portData.get(port).set('MAC', macAddress);
        });
        this.cssClass.push('switch-node');
        this.backgroundPath = "/node_modules/@shoelace-style/shoelace/dist/assets/icons/displayport.svg";
    }
}

export class Bridge extends Connector {
    constructor(color: string, portNumbers: string[], portConnectionTypes: Map<string, ConnectionType>, portMacMapping: Map<string, MacAddress>, name?: string) {
        super(color, 2, 2, portNumbers, portConnectionTypes);
        this.id = 'bridge' + Bridge.counter;
        Bridge.counter++;
        if (name != null && name != undefined && name != "") {
            this.name = name;
        }
        else {
            this.name = this.id;
        }

        portMacMapping.forEach((macAddress, port) => {
            this.portData.get(port).set('MAC', macAddress);
        });

        this.cssClass.push('bridge-node');
        //change icon
        this.backgroundPath = "/node_modules/@shoelace-style/shoelace/dist/assets/icons/displayport.svg";
    }
}

export class AccessPoint extends Connector {
    constructor(color: string, numberOfPorts: number, portNumbers: string[], portMacMapping: Map<string, MacAddress>, name?: string) {
        super(color, 2, (numberOfPorts != null && numberOfPorts != 0) ? numberOfPorts : 2, portNumbers, null, ConnectionType.wireless);

        this.id = 'accessPoint' + AccessPoint.counter;
        AccessPoint.counter++;
        if (name != null && name != undefined && name != "") {
            this.name = name;
        }
        else {
            this.name = this.id;
        }
        portMacMapping.forEach((macAddress, port) => {
            this.portData.get(port).set('MAC', macAddress);
        });

        this.cssClass.push('access-point-node');
        this.backgroundPath = "/node_modules/@shoelace-style/shoelace/dist/assets/icons/broadcast-pin.svg";
    }
}