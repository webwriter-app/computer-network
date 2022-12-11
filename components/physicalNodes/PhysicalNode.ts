import { Ipv4Address } from "../../adressing/IpAddress";
import { GraphEdge } from "../GraphEdge";
import { GraphNode } from "../GraphNode";
import { Router } from "./Connector";

export abstract class PhysicalNode extends GraphNode {
    layer: number;
    numberOfInterfacesOrPorts: number;
    portData: Map<string, Map<string, any>> = new Map(); //update on changing data on edges
    backgroundPath: string;
    name: string;
    portLinkMapping: Map<string, string> = new Map(); //updates on drawing edges (port, edge.id)


    //configure with subnetting extensions
    defaultGateway?: Router;
    subnetMask: string; //binary, without . --> better to XOR


    constructor(color: string, layer: number, numberOfInterfacesOrPorts: number, interfaceNames: string[], connectionType?: ConnectionType) {
        super(color);

        this.cssClass.push('physical-node');
        this.layer = layer;
        this.numberOfInterfacesOrPorts = numberOfInterfacesOrPorts;

        interfaceNames.forEach(i => {
            this.portData.set(i, new Map<string, any>());
            this.portLinkMapping.set(i, null); //init port
        });

        if (interfaceNames == null || interfaceNames == undefined || interfaceNames.length == 0) {
            for (let i = 1; i <= numberOfInterfacesOrPorts; i++) {
                this.portData.set(i.toString(), new Map<string, any>());
                this.portLinkMapping.set(i.toString(), null); //init port
            }
        }

        if (connectionType != null && connectionType != undefined) {
            this.portData.forEach((data) => data.set('Connection Type', connectionType));
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