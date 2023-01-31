import { ComputerNetwork } from "../../..";
import { Ipv4Address } from "../../adressing/Ipv4Address";
import { PacketSimulator } from "../../event-handlers/packet-simulator";
import { AddressingHelper } from "../../utils/AdressingHelper";
import { AlertHelper } from "../../utils/AlertHelper";
import { AnimationHelper } from "../../utils/AnimationHelper";
import { GraphEdge } from "../GraphEdge";
import { Data, Packet, Frame } from "../logicalNodes/DataNode";
import { Subnet } from "../logicalNodes/Subnet";
import { Router } from "../physicalNodes/Connector";
import { Host } from "../physicalNodes/Host";
import { PhysicalNode } from "../physicalNodes/PhysicalNode";
import { DataHandlingDecorator } from "./DataHandlingDecorator";

export class RoutableDecorator extends DataHandlingDecorator {
    arpTableMacIp: Map<string, string> = new Map(); //(mac, ip)
    arpTableIpMac: Map<string, string> = new Map();
    routingTable: Map<string, [string, number, string]> = new Map(); // (CIDR 0.0.0.0 /0/ port) [interface-name, port, DC?]

    pendingPackets: Map<string, string[]> = new Map<string, string[]>(); //ip of receiver / list of ids of pending packets

    pathsToOtherRouters?: Map<string, string[]> = new Map<string, any>; //(ip of other router, path from this router to other router)
    subnets?: Subnet[];
    portSubnetMapping?: Map<number, Subnet> = new Map();

    constructor(component?: PhysicalNode) {
        super(component);
        this.cssClass.push('routable-decorated');
        if (component instanceof Router) {
            this.subnets = component.subnets;
            this.portSubnetMapping = component.portSubnetMapping;
        }
    }

    handleDataIn(dataNode: any, previousNode: any, network: ComputerNetwork): void {
        let data = dataNode.data();
        let receiverMac: string = data.layer2header.macReceiver;
        let receiverIp: string = data instanceof Packet ? data.layer3header.ipReceiver : data.layer2header.ipReceiver;

        let portIn: number = this.getPortIn(previousNode.data('id'), network);
        let thisMac: string = this.portData.get(portIn).get('MAC').address;
        let thisIp: string = this.portData.get(portIn).get('IPv4').address;

        if (receiverMac != "FF:FF:FF:FF:FF:FF" && receiverMac != thisMac) {
            if (data instanceof Frame) AnimationHelper.blinkingThenRemoveNode('discard-data-node-2part', dataNode.id(), network);
            if (data instanceof Packet) AnimationHelper.blinkingThenRemoveNode('discard-data-node-3part', dataNode.id(), network);
            return;
        }

        if (data instanceof Data) {
            if (data instanceof Frame && data.name.includes('ARP res')) {
                this.populateRoutingTableOnNewData(previousNode.id(), dataNode, network);
                this.populateArpTable(data.layer2header.ipSender, data.layer2header.macSender, network);
            }
            else if (data instanceof Frame && data.name.includes('ARP req')) {
                if (thisIp != receiverIp) {
                    AnimationHelper.blinkingThenRemoveNode('discard-data-node-2part', dataNode.id(), network);
                    return;
                }
                else {
                    this.populateRoutingTableOnNewData(previousNode.id(), dataNode, network);
                    this.receiveArpRequest(portIn, data.layer2header.macSender, data.layer2header.ipSender, data.layer2header.ipReceiver, network);
                }
            }
            else if (data instanceof Packet) {
                if (receiverIp == thisIp) {
                    AnimationHelper.blinkingThenRemoveNode('processing-data-node-3part', dataNode.id(), network);
                    AlertHelper.toastAlert('success', 'check2-all', "", "Your receiver has received the message!");
                }
                else if (this instanceof Router && this.cssClass.includes('gateway-node')) {
                    //data --> bóc layer 2, đọc layer 3 --> nếu layer 3 k phải mình + gateway --> remove layer 2 data, gửi tiếp:?
                    this.removeLayer2Header(data, network);
                    let portToSend = this.findPortToSend(data.layer3header.ipReceiver);
                    if (portToSend != null) {
                        if (data.layer2header.macReceiver == "") {
                            this.sendArpRequest(portIn, this.portData.get(portToSend).get('MAC'),
                                this.portData.get(portToSend).get('IPv4'),
                                data.layer3header.ipReceiver, network);
                            if (!this.pendingPackets.has(data.layer3header.ipReceiver)) this.pendingPackets.set(data.layer3header.ipReceiver, []);
                            this.pendingPackets.get(data.layer3header.ipReceiver).push(dataNode.id());
                        }
                        else {
                            let link: GraphEdge = network._graph.$('#' + this.portLinkMapping.get(this.findPortToSend(data.layer3header.ipReceiver))).data();
                            let nextHopId: string = link.source == this.id ? link.target : link.source;
                            let nextHop: any = network._graph.$('#' + nextHopId);
                            PacketSimulator.directSend(previousNode, nextHop, dataNode, network);
                            // PacketSimulator.findNextHopThenSend(nextHop, network._graph.$('#' + network.ipv4Database.get(data.layer3header.ipReceiver)),
                            //     dataNode, network);
                        }

                    }
                }
            }
        }
    }


    sendData(dataNode: any, network: ComputerNetwork, senderNode?: any): void {
        let data: Packet = dataNode.data();
        let receiverIp = data.layer3header.ipReceiver;
        let subnet: Subnet = senderNode.parent().data() as Subnet;

        //check if in same network
        if (subnet.networkAddress.binaryOctets.join('').slice(0, subnet.bitmask) == AddressingHelper.decimalStringWithDotToBinary(receiverIp).slice(0, subnet.bitmask)) {
            this.sendDataInSameNetwork(null, dataNode, this.getMacProvidedIp(data.layer3header.ipSender), data.layer3header.ipSender, "", data.layer3header.ipReceiver, network);
        }
        else {
            console.log(this.defaultGateway);
            this.sendDataToAnotherNetwork(null, dataNode, data.layer2header.macSender, data.layer3header.ipSender, data.layer2header.macReceiver,
                data.layer3header.ipReceiver, network._graph.$('#' + this.defaultGateway[0]).data().portData.get(this.defaultGateway[1]).get('IPv4'), network);
        }
    }

    sendArpRequest(portIn: number, macSender: string, ipSender: string, ipReceiver: string, network: ComputerNetwork): void {
        let arpRequest: Frame = Frame.createArpRequest(network.currentColor, macSender, ipSender, ipReceiver);
        PacketSimulator.initMessage(network._graph.$('#' + network.ipv4Database.get(ipSender)), arpRequest, network);
        let arpNode = network._graph.$('#' + arpRequest.id);
        this.sendDataInSameNetwork(portIn, arpNode, macSender, ipSender, arpRequest.layer2header.macReceiver, ipReceiver, network);
    }

    receiveArpRequest(portIn: number, macSender: string, ipSender: string, ipReceiver: string, network: ComputerNetwork): void {
        let macReceiver: string = this.portData.get(portIn).get('MAC').address;
        this.populateArpTable(ipSender, macSender, network);

        let arpRes: Frame = Frame.createArpResponse(network.currentColor, macReceiver, macSender,
            ipReceiver, ipSender);
        PacketSimulator.initMessage(network._graph.$('#' + this.id), arpRes, network);
        let arpNode = network._graph.$('#' + arpRes.id);
        this.sendDataInSameNetwork(portIn, arpNode, macReceiver, ipReceiver, macSender, ipSender, network);

    }

    sendDataInSameNetwork(lastPortIn: number, dataNode: any, macSender: string, ipSender: string,
        macReceiver: string, ipReceiver: string, network: ComputerNetwork): void {
        let thisNode = network._graph.$('#' + this.id);
        let receiverNode = network._graph.$('#' + network.ipv4Database.get(ipReceiver));
        let data = dataNode.data();
        if (!thisNode.parent().same(receiverNode.parent())) return;

        //tìm port to send? k thì ARP
        if (macReceiver == "FF:FF:FF:FF:FF:FF") {
            this.flood(dataNode, null, null, network);
        }
        else if (this.arpTableMacIp.has(macReceiver) || this.arpTableIpMac.has(ipReceiver)) {
            if (data instanceof Frame) {
                PacketSimulator.findNextHopThenSend(lastPortIn, thisNode, dataNode, network);
            }
            else if (data instanceof Packet) {
                let macReceiver: string = this.arpTableIpMac.get(ipReceiver);
                let port = this.findPortToSend(ipReceiver);
                let macSender: string = this.portData.get(port).get('MAC').address;

                this.addLayer2Header(data, macSender, macReceiver, network);
                PacketSimulator.findNextHopThenSend(lastPortIn, thisNode, dataNode, network);
            }
        }
        else {
            //TODO: arp request (mac & ip): của this. chứ kp của original --> mac ip của port nào?
            this.sendArpRequest(lastPortIn, macSender, ipSender, ipReceiver, network);
            if (!this.pendingPackets.has(ipReceiver)) this.pendingPackets.set(ipReceiver, []);
            this.pendingPackets.get(ipReceiver).push(dataNode.id());
        }
    }

    sendDataToAnotherNetwork(lastPortIn: number, dataNode: any, macSender: string, ipSender: string,
        macReceiver: string, ipReceiver: string, gatewayIp: string, network: ComputerNetwork): void {
        let senderNode = network._graph.$('#' + network.ipv4Database.get(ipSender));
        let receiverNode = network._graph.$('#' + network.ipv4Database.get(ipReceiver));

        if (senderNode.parent().same(receiverNode.parent())) return;

        if (this.arpTableMacIp.has(gatewayIp)) {
            this.sendDataInSameNetwork(lastPortIn, dataNode, macSender, ipSender, this.arpTableMacIp.get(gatewayIp), gatewayIp, network);
        }
        else {
            this.sendArpRequest(lastPortIn, macSender, ipSender, gatewayIp, network);
            if (!this.pendingPackets.has(gatewayIp)) this.pendingPackets.set(gatewayIp, []);
            this.pendingPackets.get(gatewayIp).push(dataNode.id());
        }
    }

    addLayer2Header(data: Packet, macSender: string, macReceiver: string, network: ComputerNetwork): void {
        data.layer2header.macSender = macSender;
        data.layer2header.macReceiver = macReceiver;
        data.name = "L2 L3 DATA";
        network._graph.$('#' + data.id).toggleClass('data-node-layer2-layer3', true);
        network._graph.$('#' + data.id).toggleClass('data-node-layer3', false);
    }
    removeLayer2Header(data: Packet, network: ComputerNetwork): void {
        data.layer2header.macSender = "";
        data.layer2header.macReceiver = "";
        this.name = "L3    DATA";
        network._graph.$('#' + data.id).toggleClass('data-node-layer2-layer3', false);
        network._graph.$('#' + data.id).toggleClass('data-node-layer3', true);
    }

    populateArpTable(ip: string, mac: string, network: ComputerNetwork): void {
        this.arpTableMacIp.set(mac, ip);
        this.arpTableIpMac.set(ip, mac);
        PacketSimulator.addOrUpdateTable(this.id, 'ArpTable', this.arpTableIpMac, network);

        //send out pending Packets after getting ARP table populated
        if (this.pendingPackets.has(ip)) {

            this.pendingPackets.get(ip).forEach(dataId => {
                let dataNode = network._graph.$('#' + dataId);
                let data: Packet = dataNode.data() as Packet;
                let source: PhysicalNode = network._graph.$('#' + network.ipv4Database.get(data.layer3header.ipSender)).data();
                let portToSend: number = null;
                source.portData.forEach((value, port) => {
                    if (value.get('IPv4').address == data.layer3header.ipSender) {
                        portToSend = port;
                    }
                });
                this.sendDataInSameNetwork(portToSend, dataNode, data.layer2header.macSender, data.layer3header.ipSender, mac, ip, network);
            });
            this.pendingPackets.set(ip, []);
        }
    }

    //initiate before simulation
    initiateRoutingTable(network: ComputerNetwork): void {
        let node = network._graph.$('#' + this.id);
        if (this.cssClass.includes('host-node')) {
            this.portData.forEach((value, port) => {
                let ipv4: Ipv4Address = value.get('IPv4');
                if (ipv4.address != "127.0.0.1") this.routingTable.set("0.0.0.0 /0", [value.get('Name'), port, 'default']);
            });
        }
        else if (this.cssClass.includes('router-node')) {
            let router: Router = this as Router;
            router.portSubnetMapping.forEach((subnet, port) => {
                this.routingTable.set(subnet.name, [this.portData.get(port).get('Name'), port, 'DC']);
            });
            network._graph.nodes('.subnet-node').forEach(node => {
                let subnet = node.data() as Subnet;

                if (!this.routingTable.has(subnet.name)) {
                    let min = Number.MAX_VALUE;
                    let lastGatewayId: string;
                    subnet.gateways.forEach((_value, gatewayNodeId) => {
                        if (this.pathsToOtherRouters.has(gatewayNodeId)) {
                            if (min > this.pathsToOtherRouters.get(gatewayNodeId).length) {
                                lastGatewayId = gatewayNodeId;
                                min = this.pathsToOtherRouters.get(gatewayNodeId).length;
                            }
                        }
                    });

                    let port: number = this.getPortIn(this.pathsToOtherRouters.get(lastGatewayId)[1], network);
                    this.routingTable.set(subnet.name, [this.portData.get(port).get('Name'), port, 'OSPF']);
                }
            });
        }
        PacketSimulator.addOrUpdateTable(this.id, 'RoutingTable', this.routingTable, network);
    }


    //TODO: multiple path to another network? link-state-routing? OSPF?
    populateRoutingTableOnNewData(previousId: string, dataNode: any, network: ComputerNetwork): void {
        let gateway = network._graph.$('#' + this.id);
        let data = dataNode.data();
        let portIn = this.getPortIn(previousId, network);


        if (!this.cssClass.includes('gateway-node')) {
            if (data instanceof Frame) {
                this.routingTable.set(dataNode.data().layer2header.ipSender, [this.portData.get(portIn).get('Name'), portIn, 'Dyn.']);
                PacketSimulator.addOrUpdateTable(this.id, 'RoutingTable', this.routingTable, network);
                AnimationHelper.blinkingThenRemoveNode('processing-data-node-2part', dataNode.id(), network);
            }
            else if (data instanceof Packet) {
                this.routingTable.set(dataNode.data().layer3header.ipSender, [this.portData.get(portIn).get('Name'), portIn, 'Dyn.']);
                PacketSimulator.addOrUpdateTable(this.id, 'RoutingTable', this.routingTable, network);
                AnimationHelper.blinkingThenRemoveNode('processing-data-node-3part', dataNode.id(), network);
            }
        }
        else {
            if (data instanceof Frame) {
                return;
            }
            else if (data instanceof Packet) {
                let senderId = network.ipv4Database.get(data.layer3header.ipSender);
                let subnet = network._graph.$('#' + senderId).parent().data() as Subnet;

                if (!this.routingTable.has(subnet.name)) {
                    this.routingTable.set(subnet.name, [this.portData.get(portIn).get('Name'), portIn, 'Dyn.']);
                    PacketSimulator.addOrUpdateTable(this.id, 'RoutingTable', this.routingTable, network);
                    AnimationHelper.blinkingThenRemoveNode('processing-data-node-3part', dataNode.id(), network);
                }
            }
        }
    }

    findPortToSend(ip: string): number {
        if (ip == "127.0.0.1") return null;
        if (this.routingTable.has(ip)) return this.routingTable.get(ip)[1];

        this.routingTable.forEach(([_interface, port], cidrOrIp) => {
            let masking = cidrOrIp.split(' /');
            let binaryMask = AddressingHelper.decimalStringWithDotToBinary(masking[0]);
            let binaryNode = AddressingHelper.decimalStringWithDotToBinary(ip);
            if (binaryMask.slice(0, +masking[1]) == binaryNode.slice(0, +masking[1])) {
                return port;
            }
        });
        return null;
    }


    getMacProvidedIp(ip: string): string {
        let mac = null;
        this.portData.forEach(value => {
            if (value.get('IPv4').address == ip) mac = value.get('MAC').address;
        });
        return mac;
    }

}