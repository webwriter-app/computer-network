import { ComputerNetwork } from "..";
import { initNetwork } from "../network-config";
import { SlAlert, SlButton, SlCheckbox, SlInput } from "@shoelace-style/shoelace"
import { MacAddress } from "../adressing/addressTypes/MacAddress";
import { IpAddress } from "../adressing/addressTypes/IpAddress";
import { AccessPoint, Bridge, Hub, Repeater, Router, Switch } from "../components/physicalNodes/Connector";
import { Host } from "../components/physicalNodes/Host";
import { GraphNode } from "../components/GraphNode";
import { Address } from "../adressing/addressTypes/Address";

export class GraphNodeFactory {

    static addNode(network: ComputerNetwork): void {
        if (network.currentComponentToAdd == "" || network.currentComponentToAdd == null) {
            return;
        }

        let name: string = (network.renderRoot.querySelector('#inputName') as HTMLInputElement).value.trim();

        let inputIp: string = (network.renderRoot.querySelector('#inputIP') as HTMLInputElement).value.trim();

        let inputMac: string = (network.renderRoot.querySelector('#inputMAC') as HTMLInputElement).value.trim();

        let autoAdressing: boolean = (network.renderRoot.querySelector('#autoAdressing') as SlCheckbox).checked;

        let wifiEnabled: boolean = (network.renderRoot.querySelector('#wifi') as SlCheckbox).checked;

        let inputInPort: number = +(network.renderRoot.querySelector('#inputPorts') as SlInput).value.trim();
        let inputOutPort: number = +(network.renderRoot.querySelector('#outputPorts') as SlInput).value.trim();

        let inPortNum: number = inputInPort != 0 ? +inputInPort : 1;
        let outPortNum: number = inputOutPort != 0 ? +inputOutPort : 1;

        let component: GraphNode;

        //TODO: wifi enabled button

        switch (network.currentComponentToAdd) {
            //connectors
            //layer 1
            case "repeater":
                component = new Repeater(network.currentColor, wifiEnabled, name);
                break;
            case "hub":
                component = new Hub(network.currentColor, wifiEnabled, inPortNum, outPortNum, name);
                break;

            //layer 2
            case "switch": case "bridge": case "access-point":
                let macAddresses: MacAddress[] = [];
                for (let i = 0; i < inPortNum + outPortNum; i++) {
                    macAddresses.push(MacAddress.generateRandomAddress(network.macDatabase));
                }

                switch (network.currentComponentToAdd) {
                    case "switch":
                        component = new Switch(network.currentColor, inPortNum, outPortNum, name, macAddresses);
                        break;
                    case "bridge":
                        component = new Bridge(network.currentColor, wifiEnabled, inPortNum, outPortNum, name, macAddresses);
                        break;
                    case "access-point": component = new AccessPoint(network.currentColor, inPortNum, outPortNum, name, macAddresses);
                        break;
                }
                break;
            //layer 3
            case "router":
                let mixedAddresses: Address[] = [];
                for (let i = 0; i < inPortNum + outPortNum; i++) {
                    mixedAddresses.push(MacAddress.generateRandomAddress(network.macDatabase));
                    mixedAddresses.push(IpAddress.generateRandomAddress(network.ipDatabase));
                }
                component = new Router(network.currentColor, wifiEnabled, inPortNum, outPortNum, name, mixedAddresses);
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

                    if (errorInput) {
                        alert.variant = "warning";
                        alert.innerHTML = `<sl-icon slot=\"icon\" name=\"exclamation-triangle\"></sl-icon>` + alert.innerHTML;
                        alert.toast();
                        errorInput = false;

                    }
                }
                component = new Host(network.currentColor, ip, mac, network.currentComponentToAdd == "mobile", wifiEnabled, name);
                break;

            default:
                break;
        }

        if (!network.networkAvailable) {
            network.networkAvailable = true;
            initNetwork(network);
        }

        network._graph.add({
            group: 'nodes',
            data: component,
            position: { x: 10, y: 10 },
            classes: component.cssClass,
        });
    }

    static removeComponent(network: ComputerNetwork, componentId: String): void {
        network._graph.$('#' + componentId).remove();
    }


    static toggleDrawMode(network: ComputerNetwork): void {
        //TODO: create wireless "edge"
        if (network.currentComponentToAdd != "nondirected-wire") {
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
