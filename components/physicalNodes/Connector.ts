import { IpAddress } from "../../adressing/IpAddress";
import { Ipv6Address } from "../../adressing/Ipv6Address";
import { MacAddress } from "../../adressing/MacAddress";
import { ConnectionType, PhysicalNode } from "./PhysicalNode";

export abstract class Connector extends PhysicalNode {
    
    constructor(color: string, layer: number, numberOfInterfacesOrPorts?: number, interfacesNames?: string[], connectionTypes?: ConnectionType) {
        super(color, layer, numberOfInterfacesOrPorts, interfacesNames);
        switch(layer){
            case 1:
                switch(connectionTypes){
                    case ConnectionType.wireless:
                        this.portData.forEach((data) => {
                            data.set('connectionType', 'wireless');
                        });
                        break;
                    case ConnectionType.wirelessAndEthernet:
                        //TODO: possible to set later on the node
                        break;
                    default:
                        this.portData.forEach((data) => {
                            data.set('connectionType', 'ethernet');
                        });
                        break;
                }
                break;
            case 2:
                switch(connectionTypes){
                    case ConnectionType.wireless:
                        this.portData.forEach((data) => {
                            data.set('connectionType', 'wireless');
                            data.set('MAC', null);
                        });
                        break;
                    case ConnectionType.wirelessAndEthernet:
                        this.portData.forEach((data) => {
                            //TODO: possible to set LAN/wireless later on the node
                            data.set('MAC', null);
                        });
                        break;
                    default:
                        this.portData.forEach((data) => {
                            data.set('connectionType', 'ethernet');
                            data.set('MAC', null);
                        });
                        break;
                }
                break;
            case 3:
                switch(connectionTypes){
                case ConnectionType.wireless:
                        this.portData.forEach((data) => {
                            data.set('connectionType', 'wireless');
                            data.set('MAC', null);
                            data.set('IPv4', null);
                            data.set('IPv6', null);
                        });
                        break;
                    case ConnectionType.wirelessAndEthernet:
                        this.portData.forEach((data) => {
                            //TODO: possible to set LAN/wireless later on the node
                            data.set('MAC', null);
                            data.set('IPv4', null);
                            data.set('IPv6', null);
                        });
                        break;
                    default:
                        this.portData.forEach((data) => {
                            data.set('connectionType', 'ethernet');
                            data.set('MAC', null);
                            data.set('IPv4', null);
                            data.set('IPv6', null);
                        });
                        break;
                    }
                break;
            default:
                break;
        }
    }
}

export class Router extends Connector {
    constructor(color: string, numberOfInterfaces?: number,  interfacesNames?: string[], connectionTypes?: ConnectionType, name?: string, 
        portMacMapping?: Map<string, MacAddress>, portIpv4Mapping?: Map<string,IpAddress>, portIpv6Mapping?: Map<string, Ipv6Address>) {
        super(color, 3, numberOfInterfaces, interfacesNames, connectionTypes);

        this.id = 'router' + Router.counter;
        Router.counter++;
        if (name != null && this.name != undefined && this.name != "") {
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
    constructor(color: string,  connectionTypes?: ConnectionType, name?: string) {
        super(color, 1, 2, null, connectionTypes);
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
    constructor(color: string,  numberOfPorts?: number, name?: string) {
        super(color, 1, (numberOfPorts!=null && numberOfPorts!=0)? numberOfPorts : 2, null, ConnectionType.ethernet);
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
    constructor(color: string, numberOfPorts?: number, name?: string, portMacMapping?: Map<string, MacAddress>) {
        super(color, 2, (numberOfPorts!=null && numberOfPorts!=0)? numberOfPorts : 2, null, ConnectionType.ethernet);

        this.id = 'switch' + Switch.counter;
        Switch.counter++;
        if (name != null && this.name != undefined && this.name != "") {
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
    constructor(color: string, connectionTypes?: ConnectionType, portMacMapping?: Map<string, MacAddress>, name?: string) {
        super(color, 2, 2, null, connectionTypes);
        this.id = 'bridge' + Bridge.counter;
        Bridge.counter++;
        if (name != null && this.name != undefined && this.name != "") {
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
    constructor(color: string, numberOfPorts?: number, name?: string, portMacMapping?: Map<string, MacAddress>) {
        super(color, 2, (numberOfPorts!=null && numberOfPorts!=0)? numberOfPorts : 2, null, ConnectionType.wireless);

        this.id = 'accessPoint' + AccessPoint.counter;
        AccessPoint.counter++;
        if (name != null && this.name != undefined && this.name != "") {
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