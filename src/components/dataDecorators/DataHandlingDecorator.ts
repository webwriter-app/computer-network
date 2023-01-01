import { ComputerNetwork } from "../../..";
import { Ipv4Address } from "../../adressing/Ipv4Address";
import { PhysicalNode } from "../physicalNodes/PhysicalNode";

export class DataHandlingDecorator implements PhysicalNode {
    protected component: PhysicalNode;
    layer: number;
    numberOfInterfacesOrPorts: number;
    portData: Map<number, Map<string, any>>;
    backgroundPath: string;
    name: string;
    portLinkMapping: Map<number, string>;
    defaultGateway?: [string, number];
    id: string;
    color: string;
    cssClass: string[];

    constructor(component: PhysicalNode) {
        this.component = component;
        this.layer = component.layer;
        this.numberOfInterfacesOrPorts = component.numberOfInterfacesOrPorts;
        this.portData = component.portData;
        this.backgroundPath = component.backgroundPath;
        this.name = component.name;
        this.portLinkMapping = component.portLinkMapping;
        this.defaultGateway = component.defaultGateway;
        this.id = component.id;
        this.color = component.color;
        this.cssClass = component.cssClass;
    }
    

    getPortsOrInterfacesNames(): () => IterableIterator<number> {
        return this.component.getPortsOrInterfacesNames();
    }
    getIpAddresses(): Ipv4Address[] {
        return this.component.getIpAddresses();
    }
    
    handleDataIn(dataNode: any, previousNode: any, network: ComputerNetwork): void {
        return;
    }

    sendData(dataNode: any, network: ComputerNetwork): void {
        return;
    }
}