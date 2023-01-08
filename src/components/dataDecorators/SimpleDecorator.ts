import { ComputerNetwork } from "../../..";
import { PacketSimulator } from "../../event-handlers/packet-simulator";
import { GraphEdge } from "../GraphEdge";
import { Data } from "../logicalNodes/DataNode";
import { PhysicalNode } from "../physicalNodes/PhysicalNode";
import { DataHandlingDecorator } from "./DataHandlingDecorator";

export class SimpleDecorator extends DataHandlingDecorator {
    
    constructor(component?: PhysicalNode) {
        super(component);
        this.cssClass.push('simple-decorated');
    }

    handleDataIn(dataNode: any, previousNode: any, network: ComputerNetwork) {
        let previousId = previousNode.id();
        let port = this.getPortIn(previousId, network);

        this.portLinkMapping.forEach(linkId => {
            let edge: GraphEdge = network._graph.$('#' + linkId).data();
            if (edge.target == previousId && edge.outPort == port) {
                //do not flood the incoming port
            }
            else if (edge.source == previousId && edge.inPort == port) {
                //do not flood the incoming port
            }
            else {
                let directTargetId = edge.target == this.id ? edge.source : edge.target;
                let newData = Data.duplicateData(dataNode.data());
                let nextHop = network._graph.$('#' + directTargetId);
                let finalTarget = network._graph.$('#' + network.macDatabase.get((dataNode.data() as Data).layer2header.macReceiver));
                PacketSimulator.initThenDirectSend(network._graph.$('#' + this.id), nextHop, newData, network);
                PacketSimulator.endToEndSend(nextHop, finalTarget, network._graph.$('#' + newData.id), network);
            }
        });
        dataNode.remove();
    }

    static injectMethods(decoratorWithoutMethods: SimpleDecorator): SimpleDecorator {
        let realDecorator = new SimpleDecorator();
        realDecorator = Object.assign(realDecorator, decoratorWithoutMethods);
        return realDecorator;
    }
}