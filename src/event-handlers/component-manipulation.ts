import { SlInput, SlButton } from "@shoelace-style/shoelace";
import { ComputerNetwork } from "../..";
import { Ipv4Address } from "../adressing/Ipv4Address";
import { Ipv6Address } from "../adressing/Ipv6Address";
import { MacAddress } from "../adressing/MacAddress";
import { GraphNode } from "../components/GraphNode";
import { Subnet } from "../components/logicalNodes/Subnet";
import { Repeater, Hub, Switch, Bridge, AccessPoint, Router } from "../components/physicalNodes/Connector";
import { Host } from "../components/physicalNodes/Host";
import { ConnectionType, PhysicalNode } from "../components/physicalNodes/PhysicalNode";
import { initNetwork } from "../network-config";
import { EdgeController } from "./edge-controller";


export class GraphNodeFactory {

    static addNode(network: ComputerNetwork): void {
        if (network.currentComponentToAdd == "" || network.currentComponentToAdd == null) {
            return;
        }
        if (!network.networkAvailable) {
            network.networkAvailable = true;
            initNetwork(network);
        }

        switch (network.currentComponentToAdd) {
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

    static addSubnetNode(network: ComputerNetwork): void {
        let subnetNum: string = (network.renderRoot.querySelector('#subnet-num') as SlInput).value.trim();
        let subnetMask: string = (network.renderRoot.querySelector('#subnet-mask') as SlInput).value.trim();
        let bitmask: number = (network.renderRoot.querySelector('#subnet-bitmask') as SlInput).valueAsNumber;

        let newSubnet = Subnet.createSubnet(network.currentColor, subnetNum, subnetMask, bitmask, network.ipv4Database);

        if (newSubnet != null) {
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
            let inputInterfaceName: SlInput = network.renderRoot.querySelector('#interface-name-' + index) as SlInput;

            let name: string = (inputInterfaceName != null && inputInterfaceName.value) ? inputInterfaceName.value : "";

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
                : Ipv4Address.validateAddress(inputIpv4.value, network.ipv4Database);
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
                component = new Repeater(network.currentColor, portConnectionTypes, name);
                break;
            case "hub":
                component = new Hub(network.currentColor, numberOfPorts, name);
                break;

            //layer 2
            case "switch":
                component = new Switch(network.currentColor, numberOfPorts, portMacs, name);
                break;
            case "bridge":
                component = new Bridge(network.currentColor, portConnectionTypes, portMacs, name);
                break;
            case "access-point": component = new AccessPoint(network.currentColor, numberOfPorts, portMacs, name);
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

    static removeNode(node: any, network: ComputerNetwork): void {
        if (node.hasClass('subnet-node')) {
            this.removeSubnet(node, network);
        }
        else if (node.hasClass('gateway-node')) {
            this.removeGateway(node, network);
        }
        else {
            let physicalNode: PhysicalNode = node.data();
            if (physicalNode.layer > 2) {
                physicalNode.portData.forEach(data => {
                    network.ipv4Database.delete(data.get('IPv4').address);
                });

                physicalNode.portLinkMapping.forEach((linkId) => {
                    EdgeController.removeConnection(network._graph.$('#'+linkId).data(), network._graph);
                });
            }
        }
    }

    static removeGateway(node: any, network: ComputerNetwork): void {
        let gateway: Router = node.data();
        gateway.portSubnetMapping.forEach((subnet, port) => {
            subnet.gateways.delete(gateway.id);
            if (subnet.currentDefaultGateway[0] == gateway.id && subnet.currentDefaultGateway[1] == port) {
                if (subnet.gateways.size > 0) {
                    subnet.currentDefaultGateway = subnet.gateways.entries().next().value;
                    console.log(subnet.currentDefaultGateway);
                    console.log(subnet.gateways.entries().next().value);
                    network._graph.$('#' + subnet.id).children().forEach(child => {
                        let oldGateway = child.data('defaultGateway');
                        if (oldGateway[0] == node.id(), oldGateway[1] == port) {
                            child.data('defaultGateway', subnet.currentDefaultGateway); //pass by value? or reference (obmit this?)
                        }
                    });
                }
                else {
                    network._graph.$('#' + subnet.id).children().forEach(child => {
                        let oldGateway = child.data('defaultGateway');
                        if (oldGateway[0] == node.id(), oldGateway[1] == port) {
                            child.data('defaultGateway', null);
                            child.toggleClass('default-gateway-not-found', true);
                        }
                    });
                }
            }
        });
        gateway.portData.forEach(data => {
            network.ipv4Database.delete(data.get('IPv4').address);
        });
    }

    static removeSubnet(node: any, network: ComputerNetwork): void {
        //free addresses of all children
        node.children().forEach(child => {
            this.removeNode(child, network);
        });
        let subnet: Subnet = node.data() as Subnet;
        network.ipv4Database.delete(subnet.networkAddress.address); //free ID of network
        //free the port of the gateways
        subnet.gateways.forEach((port, gatewayId) => {
            let gateway: Router = network._graph.$('#' + gatewayId).data();
            gateway.portSubnetMapping.set(port, null);
            gateway.portLinkMapping.set(port, null);
            gateway.subnets = Array.from(gateway.portSubnetMapping.values()); //reset the color for gateway
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
