import { ComputerNetwork } from "..";
import { initNetwork } from "./network-creation";
import { SlButton } from "@shoelace-style/shoelace"

export function addNode(network: ComputerNetwork): void {
    if (network.currentNodeToAdd == "" || network.currentNodeToAdd == null) {
        return;
    }
    let name: String = (network.renderRoot.querySelector('#inputName') as HTMLInputElement).value.trim();

    if (name == null || name == "") {
        name = network.currentNodeToAdd + network.nodeCounter.toString();
    }

    network.nodeCounter++;

    if (!network.networkAvailable) {
        network.networkAvailable = true;
        initNetwork(network);
    }
    network._graph.add({
        group: 'nodes',
        data: {
            id: network.currentNodeToAdd + network.nodeCounter.toString(),
            name: name,
            backgroundPath: network.objectIconMap.get(network.currentNodeToAdd),
            color: network.currentColor
        },
        position: { x: 10, y: 10 },
    });

}

export function removeComponent(network: ComputerNetwork, componentId: String): void {
    network._graph.$('#' + componentId).remove();
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
        (network.renderRoot.querySelector('#resetColorBtn') as HTMLButtonElement).disabled = true;
    }
    else {
        network._edgeHandles.disableDrawMode();
        (network.renderRoot.querySelector('#drawMode') as SlButton).name = "share";
        (network.renderRoot.querySelector('#drawBtn') as HTMLElement).style.backgroundColor = "DodgerBlue";
        (network.renderRoot.querySelector('#resetColorBtn') as HTMLButtonElement).disabled = false;
    }
    network.drawModeOn = !network.drawModeOn;
}


export function toggleResetColor(network: ComputerNetwork): void {

    let changeColorHandler = function(event: any) {
        let node = event.target;
        node._private.data.color = network.currentColor;
    }

    if (!network.resetColorModeOn) {
        network._graph.on('tap', changeColorHandler);
        (network.renderRoot.querySelector('#changeColorMode') as SlButton).name = "pause";
        (network.renderRoot.querySelector('.rainbowBtn') as HTMLElement).style.boxShadow = "inset 0 0 0 100px SteelBlue";
        (network.renderRoot.querySelector('#drawBtn') as HTMLButtonElement).disabled = true;
    }
    else {
        // just remove handler
        network._graph.removeListener('tap');
        (network.renderRoot.querySelector('#changeColorMode') as SlButton).name = "eyedropper";
        (network.renderRoot.querySelector('.rainbowBtn') as HTMLElement).style.boxShadow = "inset 0 0 0 100px DodgerBlue";
        (network.renderRoot.querySelector('#drawBtn') as HTMLButtonElement).disabled = false;
    }
    network.resetColorModeOn = !network.resetColorModeOn;
}