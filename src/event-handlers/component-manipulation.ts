import { SlInput, SlButton } from '@shoelace-style/shoelace';
import { NetworkComponent } from '../..';
import { Ipv4Address } from '../adressing/Ipv4Address';
import { Ipv6Address } from '../adressing/Ipv6Address';
import { MacAddress } from '../adressing/MacAddress';
import { Net } from '../components/logicalNodes/Net';
import { Repeater, Hub, Switch, Bridge, AccessPoint, Router } from '../components/physicalNodes/Connector';
import { Host } from '../components/physicalNodes/Host';
import { ConnectionType, PhysicalNode } from '../components/physicalNodes/PhysicalNode';
import { initNetwork } from '../network-config';
import { AddressingHelper } from '../utils/AdressingHelper';
import { biPcDisplayHorizontal, biPhone, iconToDataURI } from '../styles/icons';

interface ComponentData {
    componentType: string;
    color?: string;
}

interface PhysicalNodeData extends ComponentData {
    interfaces: Array<InterfaceData>;
}

interface NetNodeData extends ComponentData {
    net: NetData;
}

interface InterfaceData {
    name?: string;
    connectionType?: ConnectionType;
    mac?: string;
    ipv4?: string;
    ipv6?: string;
}

interface NetData {
    netid: string;
    netmask: string;
    bitmask: number;
}

export class GraphNodeFactory {
    static addNode(network: NetworkComponent, data: PhysicalNodeData | NetNodeData): void {
        if (data.componentType == '' || data.componentType == null) {
            return;
        }

        if (!network.networkAvailable) {
            initNetwork(network);
        }

        switch (data.componentType) {
            case 'edge': //edge is not added with the "plus-button"
                break;
            case 'net':
                const netData = data as NetNodeData;
                this.addNetNodeData(network, netData);

                // this.addNetNode(network);
                break;
            default:
                //default is adding physical node
                const nodeData = data as PhysicalNodeData;
                if (!nodeData.interfaces || nodeData.interfaces.length == 0) {
                    nodeData.interfaces = [];
                }
                this.addPhysicalNodeData(network, nodeData);
                break;
        }
    }

    private static addNetNode(network: NetworkComponent): void {
        let netId: string = (network.renderRoot.querySelector('#net-num') as SlInput).value.trim();
        let netmask: string = (network.renderRoot.querySelector('#net-mask') as SlInput).value.trim();
        let bitmask: number = (network.renderRoot.querySelector('#net-bitmask') as SlInput).valueAsNumber;

        let newNet = Net.createNet(network.currentColor, netId, netmask, bitmask, network.ipv4Database);

        if (newNet != null) {
            network._graph.add({
                group: 'nodes',
                data: newNet,
                classes: newNet.cssClass,
            });
        }
    }

    private static addNetNodeData(network: NetworkComponent, data: NetNodeData): void {
        let netid: string = data.net?.netid || '';
        let netmask: string = data.net?.netmask || '';
        let bitmask: number = data.net?.bitmask || 0;

        let color: string = data.color || '#70e6af';

        let newNet = Net.createNet(color, netid, netmask, bitmask, network.ipv4Database);

        if (newNet != null) {
            network._graph.add({
                group: 'nodes',
                data: newNet,
                classes: newNet.cssClass,
            });
        }
    }

    private static addPhysicalNodeData(network: NetworkComponent, data: PhysicalNodeData): void {
        let numberOfPorts: number = data.interfaces.length;
        let color: string = data.color || '#70e6af';

        let names: Map<number, string> = new Map();
        let portConnectionTypes: Map<number, ConnectionType> = new Map();
        let portMacs: Map<number, MacAddress> = new Map();
        let portIpv4s: Map<number, Ipv4Address> = new Map();
        let portIpv6s: Map<number, Ipv6Address> = new Map();

        for (let index = 1; index <= numberOfPorts; index++) {
            let name: string = data.interfaces[index - 1].name || '';
            if (name != '') names.set(index, name);

            let connectionType: ConnectionType = data.interfaces[index - 1].connectionType || 'ethernet';
            portConnectionTypes.set(index, connectionType);

            let macAddress: MacAddress =
                MacAddress.validateAddress(data.interfaces[index - 1].mac, network.macDatabase) ||
                MacAddress.generateRandomAddress(network.macDatabase);
            portMacs.set(index, macAddress);

            switch (data.componentType) {
                case 'router':
                case 'computer':
                case 'mobile':
                    let ipv4: Ipv4Address =
                        Ipv4Address.validateAddress(data.interfaces[index - 1].ipv4, network.ipv4Database) ||
                        Ipv4Address.getLoopBackAddress();

                    let ipv6: Ipv6Address =
                        Ipv6Address.validateAddress(data.interfaces[index - 1].ipv6, network.ipv6Database) ||
                        Ipv6Address.getLoopBackAddress();

                    portIpv4s.set(index, ipv4);
                    portIpv6s.set(index, ipv6);
                    break;
            }
        }

        let component: PhysicalNode;
        switch (data.componentType) {
            //connectors
            //layer 1
            case 'repeater':
                component = new Repeater(color, portConnectionTypes, name);
                break;
            case 'hub':
                component = new Hub(color, numberOfPorts, name);
                break;

            //layer 2
            case 'switch':
                component = new Switch(color, numberOfPorts, portMacs, name);
                break;
            case 'bridge':
                component = new Bridge(color, portConnectionTypes, portMacs, name);
                break;
            case 'access-point':
                component = new AccessPoint(color, numberOfPorts, portMacs, name);
                break;

            //layer 3
            case 'router':
                component = new Router(
                    color,
                    numberOfPorts,
                    names,
                    portConnectionTypes,
                    portMacs,
                    portIpv4s,
                    portIpv6s,
                    name
                );
                break;

            //host
            case 'computer':
                component = new Host(
                    color,
                    iconToDataURI(biPcDisplayHorizontal),
                    numberOfPorts,
                    names,
                    portConnectionTypes,
                    portMacs,
                    portIpv4s,
                    portIpv6s,
                    name
                );
                break;
            case 'mobile':
                component = new Host(
                    color,
                    iconToDataURI(biPhone),
                    numberOfPorts,
                    names,
                    portConnectionTypes,
                    portMacs,
                    portIpv4s,
                    portIpv6s,
                    name
                );
                break;

            default:
                return;
        }

        if (component.layer >= 2) {
            portMacs.forEach((mac) => {
                MacAddress.addAddressToDatabase(mac, network.macDatabase, component.id);
            });
        }
        if (component.layer >= 3) {
            portIpv4s.forEach((ip4) => {
                Ipv4Address.addAddressToDatabase(ip4, network.ipv4Database, component.id);
            });
            portIpv6s.forEach((ip6) => {
                Ipv6Address.addAddressToDatabase(ip6, network.ipv6Database, component.id);
            });
        }

        network._graph.add({
            group: 'nodes',
            data: component,
            position: { x: 10, y: 10 },
            classes: component.cssClass,
        });
    }

    private static addPhysicalNode(network: NetworkComponent): void {
        let name: string = (network.renderRoot.querySelector('#inputName') as SlInput).value.trim();
        let inputNumOfPorts: SlInput = network.renderRoot.querySelector('#ports') as SlInput;
        let numberOfPorts: number =
            inputNumOfPorts.value != ''
                ? inputNumOfPorts.valueAsNumber
                : network.currentComponentToAdd == 'computer' || network.currentComponentToAdd == 'mobile'
                ? 1
                : 2;

        let names: Map<number, string> = new Map();
        let portConnectionTypes: Map<number, ConnectionType> = new Map();
        let portMacs: Map<number, MacAddress> = new Map();
        let portIpv4s: Map<number, Ipv4Address> = new Map();
        let portIpv6s: Map<number, Ipv6Address> = new Map();

        for (let index = 1; index <= numberOfPorts; index++) {
            let inputInterfaceName: SlInput = network.renderRoot.querySelector('#interface-name-' + index) as SlInput;

            let name: string = inputInterfaceName != null && inputInterfaceName.value ? inputInterfaceName.value : '';

            let inputConnection: SlInput = network.renderRoot.querySelector('#connection-type-' + index) as SlInput;
            let inputMac: SlInput = network.renderRoot.querySelector('#mac-' + index) as SlInput;
            let inputIpv4: SlInput = network.renderRoot.querySelector('#ip4-' + index) as SlInput;
            let inputIpv6: SlInput = network.renderRoot.querySelector('#ip6-' + index) as SlInput;

            let connectionType: ConnectionType =
                inputConnection != null ? (inputConnection.value == 'wireless' ? 'wireless' : 'ethernet') : 'ethernet';

            switch (network.currentComponentToAdd) {
                case 'switch':
                case 'bridge':
                case 'access-point':
                    let mac: MacAddress =
                        inputMac == null
                            ? MacAddress.generateRandomAddress(network.macDatabase)
                            : MacAddress.validateAddress(inputMac.value, network.macDatabase);
                    mac = mac != null ? mac : MacAddress.generateRandomAddress(network.macDatabase);

                    portMacs.set(index, mac);
                    break;
                case 'router':
                case 'computer':
                case 'mobile':
                    let macAddress: MacAddress =
                        inputMac == null
                            ? MacAddress.generateRandomAddress(network.macDatabase)
                            : MacAddress.validateAddress(inputMac.value, network.macDatabase);
                    macAddress =
                        macAddress != null ? macAddress : MacAddress.generateRandomAddress(network.macDatabase);

                    let ipv4: Ipv4Address =
                        inputIpv4 == null
                            ? Ipv4Address.getLoopBackAddress()
                            : Ipv4Address.validateAddress(inputIpv4.value, network.ipv4Database);
                    ipv4 = ipv4 != null ? ipv4 : Ipv4Address.getLoopBackAddress();

                    let ipv6: Ipv6Address =
                        inputIpv6 == null
                            ? Ipv6Address.getLoopBackAddress()
                            : Ipv6Address.validateAddress(inputIpv6.value, network.ipv6Database);
                    ipv6 = ipv6 != null ? ipv6 : Ipv6Address.getLoopBackAddress();

                    portMacs.set(index, macAddress);
                    portIpv4s.set(index, ipv4);
                    portIpv6s.set(index, ipv6);
                    break;
            }

            if (name != '') names.set(index, name);
            portConnectionTypes.set(index, connectionType);
        }

        let component: PhysicalNode;
        switch (network.currentComponentToAdd) {
            //connectors
            //layer 1
            case 'repeater':
                component = new Repeater(network.currentColor, portConnectionTypes, name);
                break;
            case 'hub':
                component = new Hub(network.currentColor, numberOfPorts, name);
                break;

            //layer 2
            case 'switch':
                component = new Switch(network.currentColor, numberOfPorts, portMacs, name);
                break;
            case 'bridge':
                component = new Bridge(network.currentColor, portConnectionTypes, portMacs, name);
                break;
            case 'access-point':
                component = new AccessPoint(network.currentColor, numberOfPorts, portMacs, name);
                break;

            //layer 3
            case 'router':
                component = new Router(
                    network.currentColor,
                    numberOfPorts,
                    names,
                    portConnectionTypes,
                    portMacs,
                    portIpv4s,
                    portIpv6s,
                    name
                );
                break;

            //host
            case 'computer':
                component = new Host(
                    network.currentColor,
                    'pc-display-horizontal',
                    numberOfPorts,
                    names,
                    portConnectionTypes,
                    portMacs,
                    portIpv4s,
                    portIpv6s,
                    name
                );
                break;
            case 'mobile':
                component = new Host(
                    network.currentColor,
                    'phone',
                    numberOfPorts,
                    names,
                    portConnectionTypes,
                    portMacs,
                    portIpv4s,
                    portIpv6s,
                    name
                );
                break;

            default:
                break;
        }

        if (component.layer >= 2) {
            portMacs.forEach((mac) => {
                MacAddress.addAddressToDatabase(mac, network.macDatabase, component.id);
            });
        }
        if (component.layer >= 3) {
            portIpv4s.forEach((ip4) => {
                Ipv4Address.addAddressToDatabase(ip4, network.ipv4Database, component.id);
            });
            portIpv6s.forEach((ip6) => {
                Ipv6Address.addAddressToDatabase(ip6, network.ipv6Database, component.id);
            });
        }

        network._graph.add({
            group: 'nodes',
            data: component,
            position: { x: 10, y: 10 },
            classes: component.cssClass,
        });
    }

    static removeNode(node: any, network: NetworkComponent): void {
        if (node.hasClass('net-node')) {
            this.removeNet(node, network);
        } else if (node.hasClass('gateway-node')) {
            this.removeGateway(node, network);
        } else {
            let physicalNode: PhysicalNode = node.data();
            if (physicalNode.layer > 2) {
                physicalNode.portData.forEach((data) => {
                    network.ipv4Database.delete(data.get('IPv4').address);
                });
            }
        }
    }

    static removeGateway(node: any, network: NetworkComponent): void {
        let gateway: Router = node.data();
        gateway.portNetMapping.forEach((net, port) => {
            net.gateways.delete(gateway.id);
            if (
                net.currentDefaultGateway != undefined &&
                net.currentDefaultGateway != null &&
                net.currentDefaultGateway[0] == gateway.id &&
                net.currentDefaultGateway[1] == port
            ) {
                if (net.gateways.size > 0) {
                    let iter = net.gateways.entries();
                    let temp = iter.next();
                    while (temp.value != undefined && temp.value[1] == null) {
                        temp = iter.next();
                    }
                    if (temp.value != undefined && temp.value[1] != null) {
                        net.currentDefaultGateway = temp.value;
                    } else {
                        net.currentDefaultGateway = null;
                    }
                } else {
                    net.currentDefaultGateway = null;
                }
            }
            network._graph
                .$('#' + net.id)
                .children()
                .forEach((child) => {
                    let oldGateway = child.data('defaultGateway');
                    if (
                        oldGateway != null &&
                        oldGateway != undefined &&
                        oldGateway[0] == node.id() &&
                        oldGateway[1] == port
                    ) {
                        if (net.currentDefaultGateway != null && net.currentDefaultGateway != undefined) {
                            child.data('defaultGateway', net.currentDefaultGateway);
                        } else {
                            child.data('defaultGateway', null);
                            child.toggleClass('default-gateway-not-found', true);
                            if (!child.data('cssClass').includes('default-gateway-not-found'))
                                child.data('cssClass').push('default-gateway-not-found');
                        }
                    }
                });
        });

        gateway.portData.forEach((data) => {
            network.ipv4Database.delete(data.get('IPv4').address);
        });
    }

    static removeNet(node: any, network: NetworkComponent): void {
        //free addresses of all children
        node.children().forEach((child) => {
            this.removeNode(child, network);
        });
        let net: Net = node.data() as Net;
        if (net.networkAddress != null && net.networkAddress != undefined) {
            network.ipv4Database.delete(AddressingHelper.getBroadcastAddress(net.networkAddress.address, net.bitmask)); //remove the broadcast address
            network.ipv4Database.delete(net.networkAddress.address); //free ID of network
        }
        //free the port of the gateways
        net.gateways.forEach((port, gatewayId) => {
            let gateway: Router = network._graph.$('#' + gatewayId).data();
            if (port != null && port != undefined && !Number.isNaN(port)) {
                gateway.portNetMapping.set(port, null);
                gateway.portLinkMapping.set(port, null);
            }

            gateway.nets.forEach((nw, index, array) => {
                if (nw.id == net.id) {
                    array.splice(index, 1);
                }
            });
            if (gateway.nets.length == 0) network._graph.$('#' + gatewayId).toggleClass('gateway-node', false); //if the gateway has no networks --> back to router-node
        });
    }

    static toggleResetColor(network: NetworkComponent): void {
        let changeColorHandler = function (event: any) {
            let node = event.target;
            node.data('color', network.currentColor);
        };

        if (!network.resetColorModeOn) {
            network._graph.on('tap', changeColorHandler);
            (network.renderRoot.querySelector('#resetColorBtn') as SlButton).name = 'pause';
            (network.renderRoot.querySelector('#resetColorBtn') as HTMLElement).style.backgroundColor = '#0291DB';
            (network.renderRoot.querySelector('#drawBtn') as HTMLButtonElement).disabled = true;
        } else {
            // just remove handler
            network._graph.removeListener('tap');
            (network.renderRoot.querySelector('#resetColorBtn') as SlButton).name = 'eyedropper';
            (network.renderRoot.querySelector('#resetColorBtn') as HTMLElement).style.backgroundColor = '#8BA8CC';
            (network.renderRoot.querySelector('#drawBtn') as HTMLButtonElement).disabled = false;
        }
        network.resetColorModeOn = !network.resetColorModeOn;
    }
}
