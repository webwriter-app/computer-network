import { ComputerNetwork } from "../../..";
import { PacketSimulator } from "../../event-handlers/packet-simulator";
import { GraphEdge } from "../GraphEdge";
import { Data, Packet, Frame } from "../logicalNodes/DataNode";
import { PhysicalNode } from "../physicalNodes/PhysicalNode";
import { DataHandlingDecorator } from "./DataHandlingDecorator";

export class SimpleDecorator extends DataHandlingDecorator {

    constructor(component?: PhysicalNode) {
        super(component);
        this.cssClass.push('simple-decorated');
    }

    handleDataIn(dataNode: any, previousNode: any, network: ComputerNetwork) {
        dataNode = dataNode.remove();
        let previousId = previousNode.id();

        this.portLinkMapping.forEach(linkId => {
            let edge: GraphEdge = network._graph.$('#' + linkId).data();
            if (edge.target == previousId) {
                //do not flood the incoming port
            }
            else if (edge.source == previousId) {
                //do not flood the incoming port
            }
            else {
                let directTargetId = edge.target == this.id ? edge.source : edge.target;
                let newData = (dataNode.data() instanceof Packet) ? Packet.cloneData(dataNode.data()) : Frame.cloneData(dataNode.data());
                let nextHop = network._graph.$('#' + directTargetId);
                PacketSimulator.initThenDirectSend(network._graph.$('#' + this.id), nextHop, newData, network);
            }
        });
        
    }

}