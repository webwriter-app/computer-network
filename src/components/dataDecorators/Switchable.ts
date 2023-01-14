import { ComputerNetwork } from "../../..";
import { PacketSimulator } from "../../event-handlers/packet-simulator";
import { GraphEdge } from "../GraphEdge";
import { Data } from "../logicalNodes/DataNode";
import { PhysicalNode } from "../physicalNodes/PhysicalNode";
import { DataHandlingDecorator } from "./DataHandlingDecorator";

export class SwitchableDecorator extends DataHandlingDecorator {
    macAddressTable: Map<string, number> = new Map(); //(mac, port)

    constructor(component?: PhysicalNode) {
        super(component);
        this.cssClass.push('switchable-decorated');
    }

    learn(data: Data, previousId: String, network: ComputerNetwork): void {
        let senderMac: string = data.layer2header.macSender;
        
        if(this.macAddressTable.has(senderMac)) return;

        this.portLinkMapping.forEach(linkId => {
            let edge: GraphEdge = network._graph.$('#'+linkId).data();
            if(edge.source == this.id && edge.target == previousId){
                this.macAddressTable.set(senderMac, edge.outPort);
            }
            else if(edge.target == this.id && edge.source == previousId){
                this.macAddressTable.set(senderMac, edge.inPort);
            }
        });
        PacketSimulator.addOrUpdateTable(this.id, 'MacAddressTable', this.macAddressTable, network);
    }

    forward(previousNode: any, dataNode: any, network: ComputerNetwork): boolean {
        let receiverMac = (dataNode.data() as Data).layer2header.macReceiver;
        if (this.macAddressTable.has(receiverMac)){
            let edge: GraphEdge = network._graph.$('#'+this.portLinkMapping.get(this.macAddressTable.get(receiverMac))).data();
            let nextHopId: string = edge.target==this.id ? edge.source : edge.target;
            let nextHop = network._graph.$('#'+nextHopId);
            PacketSimulator.directSend(previousNode, nextHop, dataNode, network);
            PacketSimulator.findNextHopThenSend(nextHop, network._graph.$('#'+ network.macDatabase.get(receiverMac)), dataNode, network);
            return true;
        }
        return false;
    }

    handleDataIn(dataNode: any, previousNode: any, network: ComputerNetwork): void {
        let data: Data = dataNode.data();
        this.learn(data, previousNode.id(), network);
        if(!this.forward(previousNode, dataNode, network)) this.flood(dataNode, previousNode.id(), this.macAddressTable.get(data.layer2header.macSender), network);
    }

}