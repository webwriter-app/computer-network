import { Ipv4Address } from "../../adressing/Ipv4Address";
import { GraphNode } from "../GraphNode";
import { Router } from "./Connector";

export abstract class PhysicalNode extends GraphNode {
    layer: number;
    numberOfInterfacesOrPorts: number;
    portData: Map<number, Map<string, any>> = new Map(); //update on changing data on edges
    backgroundPath: string;
    name: string;
    portLinkMapping: Map<number, string> = new Map(); //updates on drawing edges (port-index, edge.id)

    //configure with subnetting extensions
    defaultGateway: [number, Router]; // port-index, Router
    

    constructor(color: string, layer: number, numberOfInterfacesOrPorts: number) {
        super(color);

        this.cssClass.push('physical-node');
        this.layer = layer;
        this.numberOfInterfacesOrPorts = numberOfInterfacesOrPorts;

        for (let i = 1; i <= numberOfInterfacesOrPorts; i++) {
            this.portData.set(i, new Map<string, any>());
            this.portLinkMapping.set(i, null); //init port-link
        }
    }

    getPortsOrInterfacesNames() {
        return this.portData.keys;
    }

    getIpAddresses() {
        if (this.layer < 3) {
            return null;
        }
        let ipAddresses: Ipv4Address[] = [];
        this.portData.forEach(data => ipAddresses.push(data.get('IPv4')));
        return ipAddresses;
    }
}

export type ConnectionType = "wireless" | "ethernet";