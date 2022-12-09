import { IpAddress } from "../../adressing/IpAddress";
import { GraphEdge } from "../GraphEdge";
import { GraphNode } from "../GraphNode";
import { Router } from "./Connector";

export abstract class PhysicalNode extends GraphNode {
    layer: number;
    numberOfInterfacesOrPorts: number;
    portData: Map<string, Map<string, any>>; //update on changing data on edges
    connectionTypes: ConnectionType;
    backgroundPath: string;
    name: string;
    portLinkMapping: Map<string, GraphEdge>; //updates on drawing edges


    //configure with subnetting extensions
    defaultGateway?: Router; 
    subnetMask: string; //binary, without . --> better to XOR


    constructor(color: string, layer: number, numberOfInterfacesOrPorts: number, interfacesNames?: string[], connectionType?: ConnectionType) {
        super(color);

        this.cssClass.push('physical-node');
        this.layer = layer;
        this.numberOfInterfacesOrPorts = numberOfInterfacesOrPorts;

        if (interfacesNames == null || interfacesNames == undefined || interfacesNames.length != numberOfInterfacesOrPorts) {
            for (let i: number = 1; i <= numberOfInterfacesOrPorts; i++) {
                this.portData.set(i.toString(), new Map<string, any>());
                this.portLinkMapping.set(i.toString(), null); //init port
            }
        }
        else {
            interfacesNames.forEach(i => {
                this.portData.set(i, new Map<string, any>());
                this.portLinkMapping.set(i, null); //init port
            });
        }

        this.connectionTypes = (connectionType == null || connectionType == undefined) ? ConnectionType.wirelessAndEthernet : connectionType;
    }

    getPortsOrInterfacesNames() {
        return this.portData.keys;
    }

    getIpAddresses(){
        if(this.layer<3){
            return null;
        }
        let ipAddresses: IpAddress[] = [];
        this.portData.forEach(data => ipAddresses.push(data.get('IPv4')));
        return ipAddresses;
    }


}

export enum ConnectionType {
    wireless,
    ethernet,
    wirelessAndEthernet
}