import { ComputerNetwork } from "..";
import { initNetwork } from "./network-creation";
import { SlButton } from "@shoelace-style/shoelace"

export function addNode(network: ComputerNetwork): void {
    if (network.currentNodeToAdd == "" || network.currentNodeToAdd == null) {
        return;
    }
    let name: String = (network.renderRoot.querySelector('#inputName') as HTMLInputElement).value.trim();

    if (name == null || name == "") {
        name = network.currentNodeToAdd + network.counter.toString();
    }

    network.counter++;

    if (!network.networkAvailable) {
        network.networkAvailable = true;
        initNetwork(network);
    }
    network._graph.add({
        group: 'nodes',
        data: {
            id: network.currentNodeToAdd + network.counter.toString(),
            name: name,
            backgroundPath: network.objectIconMap.get(network.currentNodeToAdd),
            color: network.currentColor
        },
        position: { x: 10, y: 10 },
    });

}

export function removeNode(network: ComputerNetwork): void {
    network._graph.$('#' + network.selectedNode).remove();
}

export function toggleDrawMode(network: ComputerNetwork): void {
    //TODO: create wireless "edge"
    if (network.edgeType != "wire") {
        return;
    }
    if (!network.drawModeOn) {
        network._edgeHandles.enableDrawMode();
        (network.renderRoot.querySelector('#drawMode') as SlButton).name = "pause";
        (network.renderRoot.querySelector('#drawBtn') as HTMLElement).style.backgroundColor = "SteelBlue";
    }
    else {
        network._edgeHandles.disableDrawMode();
        (network.renderRoot.querySelector('#drawMode') as SlButton).name = "play";
        (network.renderRoot.querySelector('#drawBtn') as HTMLElement).style.backgroundColor = "DodgerBlue";
    }
    network.drawModeOn = !network.drawModeOn;
}