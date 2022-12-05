import { ComputerNetwork } from "..";
import { initNetwork } from "./network-config";
import { SlAlert, SlButton, SlCheckbox } from "@shoelace-style/shoelace"
import { MacAddress } from "../adressing/addressTypes/MacAddress";
import { IpAddress } from "../adressing/addressTypes/IpAddress";
import { AccessPoint, Bridge, Hub, Repeater, Router, Switch } from "../components/physicalNodes/Connector";
import { Host } from "../components/physicalNodes/Host";

export class GraphNodeFactory {

    static addNode(network: ComputerNetwork): void {
        if (network.currentComponentToAdd == "" || network.currentComponentToAdd == null) {
            return;
        }

        let name: string = (network.renderRoot.querySelector('#inputName') as HTMLInputElement).value.trim();

        let inputIp: string = (network.renderRoot.querySelector('#inputIP') as HTMLInputElement).value.trim();

        let inputMac: string = (network.renderRoot.querySelector('#inputMAC') as HTMLInputElement).value.trim();

        let autoAdressing: boolean = (network.renderRoot.querySelector('#autoAdressing') as SlCheckbox).checked;

        let data;

        //TODO: wifi enabled button

        switch (network.currentComponentToAdd) {
            //connectors

            //layer 1
            case "repeater":
                data = new Repeater(network.currentColor, false, name);
                break;
            case "hub":
                //TODO: input fields for number of input/ output ports
                data = new Hub(network.currentColor, false, 2, 2, name);
                break;

            //layer 2
            case "switch":
                data = new Switch(network.currentColor, 2, 2, name);
                break;
            case "bridge":
                data = new Bridge(network.currentColor, false, 2, 2, name);
                break;
            case "access-point":
                data = new AccessPoint(network.currentColor, 2, 2, name);
                break;

            //layer 3
            case "router":
                data = new Router(network.currentColor, false, 2, 2, name);
                break;

            //host 
            case "computer": case "mobile":
                let ip: IpAddress;
                let mac: MacAddress;
                if (autoAdressing) {
                    ip = IpAddress.generateRandomAddress(network.ipDatabase);
                    mac = MacAddress.generateRandomAddress(network.macDatabase);
                }
                else {
                    let errorInput: boolean = false;

                    const alert = new SlAlert();
                    alert.closable = true;



                    if (IpAddress.validateAddress(inputIp, network.ipDatabase) != null) {
                        ip = IpAddress.validateAddress(inputIp, network.ipDatabase);
                    }
                    else {
                        ip = IpAddress.generateRandomAddress(network.ipDatabase);
                        errorInput = true;

                        if (inputIp == "") {
                            alert.innerHTML += `<li>No IP address is given,  automatically generate another IP Address.</li>`;
                        }
                        else {
                            alert.innerHTML += `<li>The inserted IP Address <strong>` + inputIp + `</strong> is not valid,  automatically generate another IP Address.</li>`;
                        }
                    }

                    if (MacAddress.validateAddress(inputMac, network.macDatabase) != null) {
                        mac = MacAddress.validateAddress(inputMac, network.macDatabase);
                    }
                    else {
                        mac = MacAddress.generateRandomAddress(network.macDatabase);
                        errorInput = true;

                        if (inputMac == "") {
                            alert.innerHTML += `<li>No MAC address is given, automatically generate another MAC Address.</li>`;
                        }
                        else {
                            alert.innerHTML += `<li>The inserted MAC Address <strong>` + inputMac + `</strong> is not valid, automatically generate another MAC Address.</li>`;
                        }
                    }

                    data = new Host(network.currentColor, ip, mac, false, false, name);

                    if (errorInput) {
                        alert.variant = "warning";
                        alert.innerHTML = `<sl-icon slot=\"icon\" name=\"exclamation-triangle\"></sl-icon>` + alert.innerHTML;
                        alert.toast();
                        errorInput = false;

                    }
                }
            // //edge
            // case "WiredEdge":
            //     data = new WiredEdge();
            // break;

            // case "WirelessEdge":
            //     data = new WirelessEdge();
            // break;
            default:
                break;
        }

        if (!network.networkAvailable) {
            network.networkAvailable = true;
            initNetwork(network);
        }

        network._graph.add({
            group: 'nodes',
            data: data,
            position: { x: 10, y: 10 },
            classes: data.cssClass,
        });
    }

    static toggleDrawMode(network: ComputerNetwork): void {
        //TODO: create wireless "edge"
        if (network.currentComponentToAdd != "WiredEdge") {
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


    static toggleResetColor(network: ComputerNetwork): void {

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


}
