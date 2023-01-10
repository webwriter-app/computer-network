import { ComputerNetwork } from "../../..";
import { Ipv4Address } from "../../adressing/Ipv4Address";
import { PacketSimulator } from "../../event-handlers/packet-simulator";
import { GraphEdge } from "../GraphEdge";
import { Data, Frame, Packet } from "../logicalNodes/DataNode";
import { PhysicalNode } from "../physicalNodes/PhysicalNode";

export class DataHandlingDecorator implements PhysicalNode {
    protected component: PhysicalNode;
    layer: number;
    numberOfInterfacesOrPorts: number;
    portData: Map<number, Map<string, any>> = new Map();
    backgroundPath: string;
    name: string;
    portLinkMapping: Map<number, string> = new Map();
    defaultGateway?: [string, number];
    id: string;
    color: string;
    cssClass: string[] = [];

    constructor(component?: PhysicalNode) {
        if (component != null) {
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
            this.cssClass.push('decorated-node');
        }
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

    getPortIn(previousId: String, network: ComputerNetwork): number {
        console.log(previousId);
        let portIn: number = null;
        this.portLinkMapping.forEach((linkId, port) => {
            console.log(linkId);
            if (linkId != "" && linkId != null && linkId != undefined) {
                let edge: GraphEdge = network._graph.$('#' + linkId).data();
                if (edge.source == this.id && edge.target == previousId) {
                    portIn = port;
                }
                else if (edge.target == this.id && edge.source == previousId) {
                    portIn = port;
                }
            }
        });
        return portIn;
    }

    static injectMethods(decoratorWithoutMethods: DataHandlingDecorator): DataHandlingDecorator {
        let realDecorator = new DataHandlingDecorator();
        realDecorator = Object.assign(realDecorator, decoratorWithoutMethods);
        return realDecorator;
    }

    flood(dataNode: any, previousId: string, port: number, network: ComputerNetwork): void {
        dataNode = dataNode.remove();

        this.portLinkMapping.forEach(linkId => {
            if (linkId != null && linkId != undefined && linkId != "") {
                let edge: GraphEdge = network._graph.$('#' + linkId).data();
                if (previousId != null && port != null && edge.target == previousId && edge.outPort == port) {
                    //do not flood the incoming port
                }
                else if (previousId != null && port != null && edge.source == previousId && edge.inPort == port) {
                    //do not flood the incoming port
                }
                else {
                    let directTargetId = edge.target == this.id ? edge.source : edge.target;
                    let newData = (dataNode.data() instanceof Frame) ? Frame.cloneData(dataNode.data()) : Packet.cloneData(dataNode.data());
                    let nextHop = network._graph.$('#' + directTargetId);
                    let finalTarget = network._graph.$('#' + network.macDatabase.get((dataNode.data() as Data).layer2header.macReceiver));
                    PacketSimulator.initThenDirectSend(network._graph.$('#' + this.id), nextHop, newData, network);
                    //PacketSimulator.endToEndSend(nextHop, finalTarget, network._graph.$('#'+newData.id), network);
                }
            }
        });  
    }
}