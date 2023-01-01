import { ComputerNetwork } from "../../..";
import { PacketSimulator } from "../../event-handlers/packet-simulator";
import { GraphEdge } from "../GraphEdge";
import { Data } from "../logicalNodes/DataNode";
import { DataHandlingDecorator } from "./DataHandlingDecorator";

export class SwitchableDecorator extends DataHandlingDecorator {
    macAddressTable: Map<string, number> = new Map(); //(mac, port)

    

    populateTable(data: Data, previousId: String, network: ComputerNetwork): void {
        let senderMac: string = data.layer2header.macSender;
        
        this.portLinkMapping.forEach(linkId => {
            let edge: GraphEdge = network._graph.$('#'+linkId).data();
            if(edge.source == this.id && edge.target == previousId){
                this.macAddressTable.set(senderMac, edge.outPort);
            }
            else if(edge.target == this.id && edge.source == previousId){
                this.macAddressTable.set(senderMac, edge.inPort);
            }
        });
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
                PacketSimulator.initThenDirectSend(network._graph.$('#'+this.id), nextHop, newData, network);
                

            }
        });
    }

    forward: void;

    handleDataIn(dataNode: any, previousNode: any, network: ComputerNetwork): void {
        throw new Error("Method not implemented.");
    }

}