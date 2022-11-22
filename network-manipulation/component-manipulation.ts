import { ComputerNetwork } from "..";
import { initNetwork } from "./network-config";
import { SlButton } from "@shoelace-style/shoelace"
import { generateIpAddress, generateMacAddress, getBinIp, validateManualIp, validateManualMac } from "../adressing/generate-address";

export function addNode(network: ComputerNetwork): void {
    if (network.currentNodeToAdd == "" || network.currentNodeToAdd == null) {
        return;
    }
    let name: string = (network.renderRoot.querySelector('#inputName') as HTMLInputElement).value.trim();

    let inputIp: string = (network.renderRoot.querySelector('#inputIP') as HTMLInputElement).value.trim();

    let inputMac: string = (network.renderRoot.querySelector('#inputMAC') as HTMLInputElement).value.trim();
    
    
    let ip: string = validateManualIp(inputIp) ? inputIp : generateIpAddress();
    let ipBin: string = getBinIp(ip);

    let mac: string = validateManualMac(inputMac) ? inputMac : generateMacAddress();

    if (name == null || name == "") {
        name = network.currentNodeToAdd + network.nodeCounter.toString();
    }

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
            color: network.currentColor,
            mac: mac,
            ip: ip,
            ipBin: ipBin,
        },
        position: { x: 10, y: 10 },
        classes: 'element-label'
    });

    network.nodeCounter++;
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
