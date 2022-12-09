import { IpAddress } from "../../adressing/IpAddress";
import { Ipv6Address } from "../../adressing/Ipv6Address";
import { MacAddress } from "../../adressing/MacAddress";
import { ConnectionType, PhysicalNode } from "./PhysicalNode";

export class Host extends PhysicalNode {

    constructor(color: string, icon: string, numberOfInterfaces?: number,  interfacesNames?: string[], connectionTypes?: ConnectionType, name?: string, 
        portMacMapping?: Map<string, MacAddress>, portIpv4Mapping?: Map<string,IpAddress>, portIpv6Mapping?: Map<string, Ipv6Address>) {
        super(color, 3, numberOfInterfaces, interfacesNames, connectionTypes);

        this.id = 'host'+Host.counter;
        Host.counter++;
        
        //TODO: fix bug: name got over lapped by parent!
        if (name != null && this.name!=undefined && this.name!="") {
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

        this.cssClass.push('host-node');
        this.backgroundPath = "/node_modules/@shoelace-style/shoelace/dist/assets/icons/"+icon+".svg";
    }
}