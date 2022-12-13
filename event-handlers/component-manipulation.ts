import { ComputerNetwork } from "..";
import { initNetwork } from "../network-config";
import { SlButton, SlInput } from "@shoelace-style/shoelace"
import { MacAddress } from "../adressing/MacAddress";
import { Ipv4Address } from "../adressing/Ipv4Address";
import { AccessPoint, Bridge, Hub, Repeater, Router, Switch } from "../components/physicalNodes/Connector";
import { Host } from "../components/physicalNodes/Host";
import { GraphNode } from "../components/GraphNode";
import { ConnectionType, PhysicalNode } from "../components/physicalNodes/PhysicalNode";
import { Ipv6Address } from "../adressing/Ipv6Address";
import { Subnet } from "../components/logicalNodes/Subnet";

export class GraphNodeFactory {

    static addNode(network: ComputerNetwork): void {
        if (network.currentComponentToAdd == "" || network.currentComponentToAdd == null) {
            return;
        }
        if (!network.networkAvailable) {
            network.networkAvailable = true;
            initNetwork(network);
        }

        switch(network.currentComponentToAdd){
            case 'edge': //edge is not added with the "plus-button"
                break;
            case 'subnet':
                this.addSubnetNode(network);
                break;
            default:
                //default is adding physical node
                this.addPhysicalNode(network);
                break;
        }

    }

    static addSubnetNode(network: ComputerNetwork): void{
        let subnetNum: string = (network.renderRoot.querySelector('#subnet-num') as SlInput).value.trim();
        let subnetMask: string = (network.renderRoot.querySelector('#subnet-mask') as SlInput).value.trim();
        let bitmask: number = (network.renderRoot.querySelector('#subnet-bitmask') as SlInput).valueAsNumber;

        let newSubnet = Subnet.createSubnet(network.currentColor, subnetNum, subnetMask, bitmask, network.ipv4Database, network.ipv4SubnetDatabase);

        if(newSubnet!=null){
            network._graph.add({
                group: 'nodes',
                data: newSubnet,
                classes: newSubnet.cssClass,
            });
        }
    }

    static addPhysicalNode(network: ComputerNetwork): void {

        let name: string = (network.renderRoot.querySelector('#inputName') as SlInput).value.trim();
        let inputNumOfPorts: SlInput = network.renderRoot.querySelector('#ports') as SlInput;
        let numberOfPorts: number = inputNumOfPorts.value != "" ? inputNumOfPorts.valueAsNumber :
            ((network.currentComponentToAdd == 'computer' || network.currentComponentToAdd == 'mobile') ? 1 : 2);


        let names: Map<number, string> = new Map();
        let portConnectionTypes: Map<number, ConnectionType> = new Map();
        let portMacs: Map<number, MacAddress> = new Map();
        let portIpv4s: Map<number, Ipv4Address> = new Map();
        let portIpv6s: Map<number, Ipv6Address> = new Map();

        for (let index = 1; index <= numberOfPorts; index++) {
            let inputPortName: SlInput = network.renderRoot.querySelector('#port-number-' + index) as SlInput;
            let inputInterfaceName: SlInput = network.renderRoot.querySelector('#interface-name-' + index) as SlInput;

            let name: string = (inputPortName != null && inputPortName.value) != "" ? inputPortName.value :
                (inputInterfaceName != null && inputInterfaceName.value) ? inputInterfaceName.value : "";

            let inputConnection: SlInput = network.renderRoot.querySelector('#connection-type-' + index) as SlInput;
            let inputMac: SlInput = network.renderRoot.querySelector('#mac-' + index) as SlInput;
            let inputIpv4: SlInput = network.renderRoot.querySelector('#ip4-' + index) as SlInput;
            let inputIpv6: SlInput = network.renderRoot.querySelector('#ip6-' + index) as SlInput;

            let connectionType: ConnectionType = inputConnection != null ? (inputConnection.value == "wireless" ?
                "wireless" : "ethernet") : "ethernet";

            let macAddress: MacAddress = inputMac == null ? MacAddress.generateRandomAddress(network.macDatabase)
                : MacAddress.validateAddress(inputMac.value, network.macDatabase);
            macAddress = macAddress != null ? macAddress : MacAddress.generateRandomAddress(network.macDatabase);

            let ipv4: Ipv4Address = inputIpv4 == null ? Ipv4Address.getLoopBackAddress()
                : Ipv4Address.validateIpv4Address(inputIpv4.value, network.ipv4Database, network.ipv4SubnetDatabase);
            ipv4 = ipv4 != null ? ipv4 : Ipv4Address.getLoopBackAddress();

            let ipv6: Ipv6Address = inputIpv6 == null ? Ipv6Address.getLoopBackAddress()
                : Ipv6Address.validateAddress(inputIpv6.value, network.ipv6Database);
            ipv6 = ipv6 != null ? ipv6 : Ipv6Address.getLoopBackAddress();

            if (name != "") names.set(index, name);
            portConnectionTypes.set(index, connectionType);
            portMacs.set(index, macAddress);
            portIpv4s.set(index, ipv4);
            portIpv6s.set(index, ipv6);
        }

        let component: GraphNode;
        switch (network.currentComponentToAdd) {
            //connectors
            //layer 1
            case "repeater":
                component = new Repeater(network.currentColor, names, portConnectionTypes, name);
                break;
            case "hub":
                component = new Hub(network.currentColor, numberOfPorts, names, name);
                break;

            //layer 2
            case "switch":
                component = new Switch(network.currentColor, numberOfPorts, names, portMacs, name);
                break;
            case "bridge":
                component = new Bridge(network.currentColor, names, portConnectionTypes, portMacs, name);
                break;
            case "access-point": component = new AccessPoint(network.currentColor, numberOfPorts, names, portMacs, name);
                break;

            //layer 3
            case "router":
                component = new Router(network.currentColor, numberOfPorts, names, portConnectionTypes, portMacs, portIpv4s, portIpv6s, name);
                break;

            //host 
            case "computer":
                component = new Host(network.currentColor, "pc-display-horizontal", numberOfPorts, names, portConnectionTypes, portMacs, portIpv4s, portIpv6s, name);
                break;
            case "mobile":
                component = new Host(network.currentColor, "phone", numberOfPorts, names, portConnectionTypes, portMacs, portIpv4s, portIpv6s, name);
                break;

            default:
                break;
        }

        network._graph.add({
            group: 'nodes',
            data: component,
            position: { x: 10, y: 10 },
            classes: component.cssClass,
        });
    }

    static toggleResetColor(network: ComputerNetwork): void {

        let changeColorHandler = function (event: any) {
            let node = event.target;
            node.data('color', network.currentColor);
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
