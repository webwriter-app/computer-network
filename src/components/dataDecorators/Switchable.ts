import { ComputerNetwork } from "../../..";
import { PacketSimulator } from "../../event-handlers/packet-simulator";
import { TableHelper } from "../../utils/TableHelper";
import { GraphEdge } from "../GraphEdge";
import { Data } from "../logicalNodes/DataNode";
import { PhysicalNode } from "../physicalNodes/PhysicalNode";
import { DataHandlingDecorator } from "./DataHandlingDecorator";

export class SwitchableDecorator extends DataHandlingDecorator {
    macAddressTable: Map<string, number> = new Map(); //(mac, port)

    constructor(component: PhysicalNode, network: ComputerNetwork) {
        super(component);
        this.cssClass.push('switchable-decorated');
        PacketSimulator.initTable(this.id, 'MacAddressTable', network);
    }

    learn(data: Data, previousId: String, network: ComputerNetwork): void {
        let senderMac: string = data.layer2header.macSender;
        
        if(this.macAddressTable.has(senderMac)) return;

        let port = this.getPortIn(previousId, network);
        this.macAddressTable.set(senderMac, port);

        TableHelper.addRow('mac-address-table-' + this.id, "ArpTable", network, [port, senderMac]);
    }

    forward(_previousNode: any, dataNode: any, network: ComputerNetwork): boolean {
        let receiverMac = (dataNode.data() as Data).layer2header.macReceiver;
        if (this.macAddressTable.has(receiverMac)){
            let edge: GraphEdge = network._graph.$('#'+this.portLinkMapping.get(this.macAddressTable.get(receiverMac))).data();
            let nextHopId: string = edge.target==this.id ? edge.source : edge.target;
            let nextHop = network._graph.$('#'+nextHopId);
            PacketSimulator.directSend(network._graph.$('#'+this.id), nextHop, dataNode, network);
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