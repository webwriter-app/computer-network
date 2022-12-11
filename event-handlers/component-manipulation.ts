import { ComputerNetwork } from "..";
import { initNetwork } from "../network-config";
import { SlButton, SlInput } from "@shoelace-style/shoelace"
import { MacAddress } from "../adressing/MacAddress";
import { IpAddress } from "../adressing/IpAddress";
import { AccessPoint, Bridge, Hub, Repeater, Router, Switch } from "../components/physicalNodes/Connector";
import { Host } from "../components/physicalNodes/Host";
import { GraphNode } from "../components/GraphNode";
import { ConnectionType } from "../components/physicalNodes/PhysicalNode";
import { Ipv6Address } from "../adressing/Ipv6Address";

export class GraphNodeFactory {

    static addNode(network: ComputerNetwork): void {
        if (network.currentComponentToAdd == "" || network.currentComponentToAdd == null) {
            return;
        }

        let name: string = (network.renderRoot.querySelector('#inputName') as HTMLInputElement).value.trim();

        let inputNumOfPorts: SlInput = network.renderRoot.querySelector('#ports') as SlInput;
        let numberOfPorts: number = inputNumOfPorts.value != "" ? inputNumOfPorts.valueAsNumber :
            ((network.currentComponentToAdd == 'computer' || network.currentComponentToAdd == 'mobile')? 1 : 2);

        let portNumbers: string[] = [];
        let interfaceNames: string[] = [];

        let portConnectionTypes: Map<string, ConnectionType> = new Map();
        let portMacs: Map<string, MacAddress> = new Map();
        let portIpv4s: Map<string, IpAddress> = new Map();
        let portIpv6s: Map<string, Ipv6Address> = new Map();

        for (let index = 1; index <= numberOfPorts; index++) {
            let inputPortName: SlInput = network.renderRoot.querySelector('#port-number-' + index) as SlInput;
            let inputInterfaceName: SlInput = network.renderRoot.querySelector('#interface-name-' + index) as SlInput;

            if (inputPortName != null) portNumbers.push(inputPortName.value);
            if (inputInterfaceName != null) interfaceNames.push(inputInterfaceName.value);

            let name: string = (inputPortName != null && inputPortName.value) != "" ? inputPortName.value :
                (inputInterfaceName != null && inputInterfaceName.value) ? inputInterfaceName.value : index.toString();

            let inputConnection: SlInput = network.renderRoot.querySelector('#connection-type-' + index) as SlInput;
            let inputMac: SlInput = network.renderRoot.querySelector('#mac-' + index) as SlInput;
            let inputIpv4: SlInput = network.renderRoot.querySelector('#ip4-' + index) as SlInput;
            //let inputIpv6: SlInput = network.renderRoot.querySelector('#ip6-' + index) as SlInput;

            let connectionType: ConnectionType = inputConnection != null ? (inputConnection.value == "Wireless" ?
                ConnectionType.wireless : ConnectionType.ethernet) : ConnectionType.ethernet;

            let macAddress: MacAddress = inputMac == null ? MacAddress.generateRandomAddress(network.macDatabase)
                : MacAddress.validateAddress(inputMac.value, network.macDatabase);
            macAddress = macAddress != null ? macAddress : MacAddress.generateRandomAddress(network.macDatabase);

            let ipv4: IpAddress = inputIpv4 == null ? IpAddress.getLoopBackAddress()
                : IpAddress.validateAddress(inputIpv4.value, network.ipDatabase);
            ipv4 = ipv4 != null ? ipv4 : IpAddress.getLoopBackAddress();

            let ipv6: Ipv6Address = Ipv6Address.getLoopBackAddress();

            portConnectionTypes.set(name, connectionType);
            portMacs.set(name, macAddress);
            portIpv4s.set(name, ipv4);
            portIpv6s.set(name, ipv6);
        }

        let component: GraphNode;
        switch (network.currentComponentToAdd) {
            //connectors
            //layer 1
            case "repeater":
                console.log(portNumbers);
                console.log(portConnectionTypes);
                component = new Repeater(network.currentColor, portNumbers, portConnectionTypes, name);
                break;
            case "hub":
                component = new Hub(network.currentColor, numberOfPorts, portNumbers, name);
                break;

            //layer 2
            case "switch":
                component = new Switch(network.currentColor, numberOfPorts, portNumbers, portMacs, name);
                break;
            case "bridge":
                component = new Bridge(network.currentColor, portNumbers, portConnectionTypes, portMacs, name);
                break;
            case "access-point": component = new AccessPoint(network.currentColor, numberOfPorts, portNumbers, portMacs, name);
                break;

            //layer 3
            case "router":
                component = new Router(network.currentColor, numberOfPorts, interfaceNames, portConnectionTypes, portMacs, portIpv4s, portIpv6s, name);
                break;

            //host 
            case "computer":
                component = new Host(network.currentColor, "pc-display-horizontal", numberOfPorts, interfaceNames, portConnectionTypes, portMacs, portIpv4s, portIpv6s, name);
                break;
            case "mobile":
                component = new Host(network.currentColor, "mobile", numberOfPorts, interfaceNames, portConnectionTypes, portMacs, portIpv4s, portIpv6s, name);
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

        console.log(component);
    }

    static removeComponent(network: ComputerNetwork, componentId: String): void {
        network._graph.$('#' + componentId).remove();
    }


    static toggleDrawMode(network: ComputerNetwork): void {
        if (!network.drawModeOn) {
            if (network.currentComponentToAdd != "nondirected-edge" && network.currentComponentToAdd != "directed-edge") {
                return;
            }
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
