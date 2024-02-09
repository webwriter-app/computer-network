import { Ipv4Address } from '../../adressing/Ipv4Address';
import { Ipv6Address } from '../../adressing/Ipv6Address';
import { MacAddress } from '../../adressing/MacAddress';
import { ConnectionType, PhysicalNode } from './PhysicalNode';

export class Host extends PhysicalNode {
    constructor(
        color: string,
        icon: string,
        numberOfInterfaces: number,
        names: Map<number, string>,
        portConnectionTypes: Map<number, ConnectionType>,
        portMacMapping: Map<number, MacAddress>,
        portIpv4Mapping: Map<number, Ipv4Address>,
        portIpv6Mapping: Map<number, Ipv6Address>,
        name?: string,
        id?: string
    ) {
        super(color, 7, numberOfInterfaces);

        if (id != null && id != undefined && id != '') {
            this.id = id;
            Host.counter = +id.charAt(id.length - 1);
        } else {
            this.id = 'host' + Host.counter;
        }
        Host.counter++;

        if (name != null && name != undefined && name != '') {
            this.name = name;
        } else {
            this.name = this.id;
        }

        for (let index = 1; index <= numberOfInterfaces; index++) {
            let name = names.get(index);
            if (name != undefined && name != null && name != '') {
                this.portData.get(index).set('Name', name);
            } else {
                this.portData.get(index).set('Name', portConnectionTypes.get(index) + index);
            }
        }

        portConnectionTypes.forEach((connectionType, port) => {
            this.portData.get(port).set('Connection Type', connectionType);
        });
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
        this.backgroundPath = icon;
    }
}
