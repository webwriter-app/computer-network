import { SlButton } from "@shoelace-style/shoelace";
import { ComputerNetwork } from "../..";
import { Data, Frame } from "../components/logicalNodes/DataNode";

export class PacketSimulator {

    static sourceEndPoint: string = "";
    static targetEndPoint: string = "";
    static delay: number = 0;

    static setSource(buttonEvent, network: ComputerNetwork) {
        let sourceButton = buttonEvent.target;
        sourceButton.loading = true;
        let targetButton = network.renderRoot.querySelector('#setTargetBtn') as SlButton;
        targetButton.disabled = true;
        network._graph.one('tap', 'node', function (event) {
            PacketSimulator.sourceEndPoint = event.target.id();
            sourceButton.loading = false;
            targetButton.disabled = false;
        });
    }

    static setTarget(buttonEvent, network: ComputerNetwork) {
        let targetButton = buttonEvent.target;
        targetButton.loading = true;
        let sourceButton = network.renderRoot.querySelector('#setSourceBtn') as SlButton;
        sourceButton.disabled = true;
        network._graph.one('tap', 'node', function (event) {
            PacketSimulator.targetEndPoint = event.target.id();
            targetButton.loading = false;
            sourceButton.disabled = false;
        });
    }

    static startSession(network: ComputerNetwork){
        network._graph.$('node').lock();

        let frame = new Frame(network.currentColor);
        let source = network._graph.$('#'+PacketSimulator.sourceEndPoint);
        let target = network._graph.$('#'+PacketSimulator.targetEndPoint);

        this.initThenDirectSend(source, target, frame, network);
    }

    static initThenDirectSend(sourceNode: any, targetNode: any, data: Data, network: ComputerNetwork){
        let sourcePosition = sourceNode.position();
        let targetPosition = targetNode.position();

        network._graph.add({
            group: 'nodes',
            data: data,
            position: { x: sourcePosition.x, y: sourcePosition.y - 20},
            classes: data.cssClass,
        });

        network._graph.$('#'+data.id).animate({
            position: { x: targetPosition.x, y: targetPosition.y - 20},
          }, {
            duration: PacketSimulator.delay*1000
          });
    }

    static endToEndSend(sourceNode: any, targetNode: any, data: Data, network: ComputerNetwork){
        
    }

    static resetDatabase(network: ComputerNetwork){

    }
}