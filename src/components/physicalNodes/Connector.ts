
import { Ipv4Address } from "../../adressing/Ipv4Address";
import { Ipv6Address } from "../../adressing/Ipv6Address";
import { MacAddress } from "../../adressing/MacAddress";
import { ConnectionType, PhysicalNode } from "./PhysicalNode";

export abstract class Connector extends PhysicalNode {

    constructor(color: string, layer: number, numberOfInterfacesOrPorts: number, names: Map<number, string>, portConnectionTypes: Map<number, ConnectionType>, connectionType?: ConnectionType) {
        super(color, layer, numberOfInterfacesOrPorts);

        for (let index = 1; index <= numberOfInterfacesOrPorts; index++) {
            let name = names.get(index);
            if (name != undefined && name != null && name != "") { this.portData.get(index).set('Name', name); }
            else {
                this.portData.get(index).set('Name', portConnectionTypes != null ? portConnectionTypes.get(index) + index
                    : connectionType != null ? connectionType + index : index);
            }
        }

        if (connectionType != null && connectionType != undefined) {
            this.portData.forEach((data) => data.set('Connection Type', connectionType));
        }
        else if (portConnectionTypes != null) {
            portConnectionTypes.forEach((connectionType, port) => {
                this.portData.get(port).set('Connection Type', connectionType);
            });
        }
        this.cssClass.push("connector-node");
    }

}

export class Router extends Connector {
    //TODO: portLinkMapping bị xóa
    //--> check + remove router (remove bằng routerid + port index) from list of gateways của subnet
    portGatewayMapping: Map<number, string> = new Map(); //(port-index, id of subnet-node)


    constructor(color: string, numberOfInterfaces: number, names: Map<number, string>, portConnectionTypes: Map<number, ConnectionType>,
        portMacMapping: Map<number, MacAddress>, portIpv4Mapping: Map<number, Ipv4Address>, portIpv6Mapping: Map<number, Ipv6Address>, name?: string) {
        super(color, 3, numberOfInterfaces, names, portConnectionTypes);

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
    constructor(color: string, names: Map<number, string>, portConnectionTypes: Map<number, ConnectionType>, name?: string) {
        super(color, 1, 2, names, portConnectionTypes);
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
    constructor(color: string, numberOfPorts: number, names: Map<number, string>, name?: string) {
        super(color, 1, (numberOfPorts != null && numberOfPorts != 0) ? numberOfPorts : 2, names, null, "ethernet");
        this.id = 'hub' + Hub.counter;
        Hub.counter++;
        if (name != null && name != undefined && name != "") {
            this.name = name;
        }
        else {
            this.name = this.id;
        }

        this.cssClass.push('hub-node');
        this.backgroundPath = "doc/icons/hub.svg";
    }
}

export class Switch extends Connector {
    constructor(color: string, numberOfPorts: number, names: Map<number, string>, portMacMapping: Map<number, MacAddress>, name?: string) {
        super(color, 2, (numberOfPorts != null && numberOfPorts != 0) ? numberOfPorts : 2, names, null, "ethernet");

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
        this.backgroundPath = "doc/icons/switch.svg";
    }
}

export class Bridge extends Connector {
    constructor(color: string, names: Map<number, string>, portConnectionTypes: Map<number, ConnectionType>, portMacMapping: Map<number, MacAddress>, name?: string) {
        super(color, 2, 2, names, portConnectionTypes);
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
        this.backgroundPath = "doc/icons/bridge.svg";
    }
}

export class AccessPoint extends Connector {
    constructor(color: string, numberOfPorts: number, names: Map<number, string>, portMacMapping: Map<number, MacAddress>, name?: string) {
        super(color, 2, (numberOfPorts != null && numberOfPorts != 0) ? numberOfPorts : 2, names, null, "wireless");

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