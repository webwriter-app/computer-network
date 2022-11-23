import { ComputerNetwork } from "..";
import { initNetwork } from "./network-config";
import { SlAlert, SlButton, SlCheckbox } from "@shoelace-style/shoelace"
import { generateIpAddress, generateMacAddress, getBinIp, validateManualIp, validateManualMac } from "../adressing/generate-address";

export function addNode(network: ComputerNetwork): void {
    if (network.currentNodeToAdd == "" || network.currentNodeToAdd == null) {
        return;
    }
    let name: string = (network.renderRoot.querySelector('#inputName') as HTMLInputElement).value.trim();

    let inputIp: string = (network.renderRoot.querySelector('#inputIP') as HTMLInputElement).value.trim();

    let inputMac: string = (network.renderRoot.querySelector('#inputMAC') as HTMLInputElement).value.trim();

    let autoAdressing: boolean = (network.renderRoot.querySelector('#autoAdressing') as SlCheckbox).checked;

    let ip: string;
    let mac: string;

    if (autoAdressing) {
        ip = generateIpAddress();
        mac = generateMacAddress();
    }
    else {
        let errorInput: boolean = false;

        const alert = new SlAlert();
        alert.closable = true;

        if (validateManualIp(inputIp)) {
            ip = inputIp;
        }
        else {
            ip = generateIpAddress();
            errorInput = true;

            if (inputIp == "") {
                alert.innerHTML += `<li>No IP address is given,  automatically generate another IP Address.</li>`;
            }
            else {
                alert.innerHTML += `<li>The inserted IP Address <strong>` + inputIp + `</strong> is not valid,  automatically generate another IP Address.</li>`;
            }
        }

        if (validateManualMac(inputMac)) {
            mac = inputMac;
        }
        else {
            mac = generateMacAddress();
            errorInput = true;

            if (inputMac == "") {
                alert.innerHTML += `<li>No MAC address is given, automatically generate another MAC Address.</li>`;
            }
            else {
                alert.innerHTML += `<li>The inserted MAC Address <strong>` + inputMac + `</strong> is not valid, automatically generate another MAC Address.</li>`;
            }
        }

        if (errorInput) {
            alert.variant = "warning";
            alert.innerHTML = `<sl-icon slot=\"icon\" name=\"exclamation-triangle\"></sl-icon>` + alert.innerHTML;
            alert.toast();
            errorInput = false;

        }
    }


    let ipBin: string = getBinIp(ip);

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
        (network.renderRoot.querySelector('#drawBtn') as HTMLElement).style.backgroundColor = "rgb(2, 132, 199)";
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

    let changeColorHandler = function (event: any) {
        let node = event.target;
        node._private.data.color = network.currentColor;
    }

    if (!network.resetColorModeOn) {
        network._graph.on('tap', changeColorHandler);
        (network.renderRoot.querySelector('#changeColorMode') as SlButton).name = "pause";
        (network.renderRoot.querySelector('.rainbowBtn') as HTMLElement).style.boxShadow = "inset 0 0 0 100px rgb(2, 132, 199)";
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
