import { ComputerNetwork } from "../../..";
import { PacketSimulator } from "../../event-handlers/packet-simulator";
import { GraphEdge } from "../GraphEdge";
import { Data } from "../logicalNodes/DataNode";
import { DataHandlingDecorator } from "./DataHandlingDecorator";

export class SwitchableDecorator extends DataHandlingDecorator {
    macAddressTable: Map<string, number> = new Map(); //(mac, port)

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

    flood(dataNode: any, previousId: string, port: number, network: ComputerNetwork): void {
        this.portLinkMapping.forEach(linkId => {
            let edge: GraphEdge = network._graph.$('#'+linkId).data();
            if(edge.target == previousId && edge.outPort == port){
                //do not flood the incoming port
            }
            else if(edge.source == previousId && edge.inPort == port){
                //do not flood the incoming port
            }
            else {
                let directTargetId = edge.target==this.id ? edge.source : edge.target;
                let newData = Data.duplicateData(dataNode.data());
                let nextHop = network._graph.$('#'+directTargetId);
                let finalTarget = network._graph.$('#'+ network.macDatabase.get((dataNode.data() as Data).layer2header.macReceiver));
                PacketSimulator.initThenDirectSend(network._graph.$('#'+this.id), nextHop, newData, network);
                PacketSimulator.endToEndSend(nextHop, finalTarget, network._graph.$('#'+newData.id), network);
            }
        });
        dataNode.remove();
    }

    forward(previousNode: any, dataNode: any, network: ComputerNetwork): boolean {
        let receiverMac = (dataNode.data() as Data).layer2header.macReceiver;
        if (this.macAddressTable.has(receiverMac)){
            let edge: GraphEdge = network._graph.$('#'+this.portLinkMapping.get(this.macAddressTable.get(receiverMac))).data();
            let nextHopId: string = edge.target==this.id ? edge.source : edge.target;
            let nextHop = network._graph.$('#'+nextHopId);
            PacketSimulator.directSend(previousNode, nextHop, dataNode, network);
            PacketSimulator.endToEndSend(nextHop, network._graph.$('#'+ network.macDatabase.get(receiverMac)), dataNode, network);
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