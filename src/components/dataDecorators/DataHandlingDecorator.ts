import { NetworkComponent } from '../../..';
import { Ipv4Address } from '../../adressing/Ipv4Address';
import { GraphEdge } from '../GraphEdge';
import { Packet, Frame } from '../logicalNodes/DataNode';
import { PhysicalNode } from '../physicalNodes/PhysicalNode';

export abstract class DataHandlingDecorator implements PhysicalNode {
    protected component!: PhysicalNode;
    layer!: number;
    numberOfInterfacesOrPorts!: number;
    portData: Map<number, Map<string, any>> = new Map();
    backgroundPath!: string;
    name!: string;
    portLinkMapping: Map<number, string> = new Map();
    defaultGateway?: [string, number];
    id!: string;
    color!: string;
    cssClass: string[] = [];
    parent?: string;

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
            this.parent = component.parent;
        }
    }

    getPortsOrInterfacesNames(): () => IterableIterator<number> {
        return this.component.getPortsOrInterfacesNames();
    }
    getIpAddresses(): Ipv4Address[] | null {
        return this.component.getIpAddresses();
    }

    handleDataIn(dataNode: any, previousNode: any, network: NetworkComponent): void {
        return;
    }

    sendData(dataNode: any, network: NetworkComponent): void {
        return;
    }

    getPortIn(previousId: String, network: NetworkComponent): number | null {
        let portIn: number | null = null;
        this.portLinkMapping.forEach((linkId, port) => {
            if (linkId != '' && linkId != null && linkId != undefined) {
                let edge: GraphEdge = network._graph.$('#' + linkId).data();
                if (edge.source == this.id && edge.target == previousId) {
                    portIn = port;
                } else if (edge.target == this.id && edge.source == previousId) {
                    portIn = port;
                }
            }
        });
        return portIn;
    }

    flood(dataNode: any, previousId: string, port: number, network: NetworkComponent): void {
        dataNode = dataNode.remove();

        this.portLinkMapping.forEach((linkId, portIn) => {
            if (linkId != null && linkId != undefined && linkId != '') {
                let edge: GraphEdge = network._graph.$('#' + linkId).data();
                if (port == portIn || edge.target == previousId || edge.source == previousId) {
                    //do not flood the incoming port
                } else {
                    let directTargetId = edge.target == this.id ? edge.source : edge.target;
                    let newData =
                        dataNode.data() instanceof Packet
                            ? Packet.cloneData(dataNode.data())
                            : Frame.cloneData(dataNode.data());
                    let nextHop = network._graph.$('#' + directTargetId);
                    network.packetSimulator.initThenDirectSend(
                        network._graph.$('#' + this.id),
                        nextHop,
                        newData,
                        network
                    );
                }
            }
        });
    }
}
