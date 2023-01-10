import { ComputerNetwork } from "../../..";
import { Ipv4Address } from "../../adressing/Ipv4Address";
import { PacketSimulator } from "../../event-handlers/packet-simulator";
import { AddressingHelper } from "../../utils/AdressingHelper";
import { GraphEdge } from "../GraphEdge";
import { Data, Frame, Packet } from "../logicalNodes/DataNode";
import { Subnet } from "../logicalNodes/Subnet";
import { Router } from "../physicalNodes/Connector";
import { Host } from "../physicalNodes/Host";
import { PhysicalNode } from "../physicalNodes/PhysicalNode";
import { DataHandlingDecorator } from "./DataHandlingDecorator";

export class RoutableDecorator extends DataHandlingDecorator {
    arpTable: Map<string, string> = new Map(); //(ip, mac)
    routingTable: Map<string, [string, number, string]> = new Map(); // (CIDR 0.0.0.0 /0/ port) [interface-name, port, DC?]

    pendingFrames: Map<String, Array<any>> = new Map();

    constructor(component?: PhysicalNode) {
        super(component);
        this.cssClass.push('routable-decorated');
    }


    handleDataIn(dataNode: any, previousNode: any, network: ComputerNetwork): void {
        console.log('check-point-3');
        let data = dataNode.data();
        //router: if mac match --> scrap L2 header, đọc L3 header --> findPort để gửi sang network khác
        let receiverMac = data.layer2header.macReceiver;
        console.log(data);

        if (data instanceof Data) {
            console.log('checkpoint-1');
            console.log(previousNode);
            let port: number = this.getPortIn(previousNode.data('id'), network);
            console.log(port);
            console.log(data instanceof Packet);
            console.log(data.name.includes('ARP req'));
            //check layer2header xem có phải cho mình k nếu k thì throw
            if (receiverMac!='FF:FF:FF:FF:FF:FF' && network.macDatabase.get(receiverMac) != this.id) return;
            //có --> arpRes ? arpReq ? Data
            if (data instanceof Packet && data.name.includes('ARP res') && network.macDatabase.get(data.layer2header.macReceiver)==this.id) {
                console.log('checkpoint-2');
                this.populateArpTable(data.layer2header.ipSender, data.layer2header.macSender, network);
            }
            else if (data instanceof Packet && data.name.includes('ARP req') && network.ipv4Database.get(data.layer2header.ipReceiver)==this.id) {
                console.log('receiver should call this');
                this.receiveArpRequest(data.layer2header.macSender, data.layer2header.ipSender, data.layer2header.ipReceiver, network);
            }
            else if (data instanceof Frame && data.name.includes('DATA')) {
                console.log('checkpoint-3');
                if (receiverMac != this.portData.get(port).get('MAC')) {
                    //TODO: visualize throw packet here
                    return;
                }
                else if (data.layer3header.ipReceiver != this.portData.get(port).get('IPv4') && this instanceof Router && this.cssClass.includes('gateway-node')) {
                    //data --> bóc layer 2, đọc layer 3 --> nếu layer 3 k phải mình + gateway --> remove layer 2 data, gửi tiếp:?
                    this.removeLayer2Header(data);
                    let portToSend = this.findPortToSend(data.layer3header.ipReceiver);
                    if (portToSend != null) {
                        if (data.layer2header.macReceiver == "") {
                            this.sendArpRequest(this.portData.get(portToSend).get('MAC'), this.portData.get(portToSend).get('IPv4'),
                                data.layer3header.ipReceiver, network);
                            if (!this.pendingFrames.has(data.layer3header.ipReceiver)) this.pendingFrames.set(data.layer3header.ipReceiver, []);
                            this.pendingFrames.get(data.layer3header.ipReceiver).push(dataNode);
                        }
                        else {
                            let link: GraphEdge = network._graph.$('#' + this.portLinkMapping.get(this.findPortToSend(data.layer3header.ipReceiver))).data();
                            let nextHopId: string = link.source == this.id ? link.target : link.source;
                            let nextHop: any = network._graph.$('#' + nextHopId);
                            PacketSimulator.directSend(previousNode, nextHop, dataNode, network);
                            PacketSimulator.endToEndSend(nextHop, network._graph.$('#' + network.ipv4Database.get(data.layer3header.ipReceiver)),
                                dataNode, network);
                        }

                    }
                }
            }
        }
    }

    sendData(dataNode: any, network: ComputerNetwork, senderNode?: any): void {
        let data: Frame = dataNode.data();
        let receiverIp = data.layer3header.ipReceiver;
        let subnet: Subnet = senderNode.parent().data() as Subnet;

        //check if in same network
        if (subnet.networkAddress.binaryOctets.join('').slice(0, subnet.bitmask) == AddressingHelper.decimalStringWithDotToBinary(receiverIp).slice(0, subnet.bitmask)) {
            this.sendDataInSameNetwork(dataNode, data.layer2header.macSender, data.layer3header.ipSender, data.layer2header.macReceiver, data.layer3header.ipReceiver, network);
        }
        else {
            this.sendDataToAnotherNetwork(dataNode, data.layer2header.macSender, data.layer3header.ipSender, data.layer2header.macReceiver,
                data.layer3header.ipReceiver, network._graph.$('#' + this.defaultGateway[0]).data().portData.get(this.defaultGateway[1]).get('IPv4'), network);
        }
    }

    sendArpRequest(macSender: string, ipSender: string, ipReceiver: string, network: ComputerNetwork): void {
        let arpRequest: Packet = Packet.createArpRequest(network.currentColor, macSender, ipSender, ipReceiver);
        PacketSimulator.initMessage(network._graph.$('#' + network.ipv4Database.get(ipSender)), arpRequest, network);
        let arpNode = network._graph.$('#' + arpRequest.id);
        this.sendDataInSameNetwork(arpNode, macSender, ipSender, arpRequest.layer2header.macReceiver, ipReceiver, network);
    }

    receiveArpRequest(macSender: string, ipSender: string, ipReceiver: string, network: ComputerNetwork): void {
        let macReceiver: string = "";
        console.log('should call this -1');
        if (network.ipv4Database.get(ipReceiver) == this.id) {
            console.log('should call this -2');
            this.portData.forEach(value => {
                if (value.get('IPv4') == ipReceiver) macReceiver = value.get('MAC');
            })
            let arpRes: Packet = Packet.createArpResponse(network.currentColor, macReceiver, macSender, ipReceiver, ipSender);
            PacketSimulator.initMessage(network._graph.$('#' + network.ipv4Database.get(ipSender)), arpRes, network);
            let arpNode = network._graph.$('#' + arpRes.id);
            this.sendDataInSameNetwork(arpNode, macReceiver, ipReceiver, macSender, ipSender, network);
        }
    }

    sendDataInSameNetwork(dataNode: any, macSender: string, ipSender: string,
        macReceiver: string, ipReceiver: string, network: ComputerNetwork): void {
        let senderNode = network._graph.$('#' + network.ipv4Database.get(ipSender));
        let receiverNode = network._graph.$('#' + network.ipv4Database.get(ipReceiver));

        console.log(dataNode);
        console.log(macReceiver);
        //tìm port to send? k thì ARP
        if (macReceiver == "FF:FF:FF:FF:FF:FF") {
            this.flood(dataNode, null, null, network);
        }
        else if (this.arpTable.has(ipReceiver)) {
            let data: Data = dataNode.data() as Data;
            this.addLayer2Header(data, data.layer2header.macSender, this.arpTable.get(ipReceiver));
            PacketSimulator.endToEndSend(senderNode, receiverNode, dataNode, network);
        }
        else {
            //TODO: arp request (mac & ip): của this. chứ kp của original --> mac ip của port nào?
            this.sendArpRequest(macSender, ipSender, ipReceiver, network);
            this.pendingFrames.set(ipReceiver, dataNode);
        }

        if (!senderNode.parent().same(receiverNode.parent())) return;



    }
    sendDataToAnotherNetwork(dataNode: any, macSender: string, ipSender: string,
        macReceiver: string, ipReceiver: string, gatewayIp: string, network: ComputerNetwork): void {
        let senderNode = network._graph.$('#' + network.ipv4Database.get(ipSender));
        let receiverNode = network._graph.$('#' + network.ipv4Database.get(ipReceiver));

        if (senderNode.parent().same(receiverNode.parent())) return;

        if (this.arpTable.has(gatewayIp)) {
            this.sendDataInSameNetwork(dataNode, macSender, ipSender, this.arpTable.get(gatewayIp), gatewayIp, network);
        }
        else {
            this.sendArpRequest(macSender, ipSender, gatewayIp, network);
            if (this.pendingFrames.has(gatewayIp)) this.pendingFrames.set(gatewayIp, []);
            this.pendingFrames.get(gatewayIp).push(dataNode);
        }
    }

    addLayer2Header(data: Data, macSender: string, macReceiver: string): void {
        data.backgroundPath = "doc/datagram/header-3header.png";
        data.layer2header.macSender = macSender;
        data.layer2header.macReceiver = macReceiver;
        this.name = "L2 L3 DATA";
    }
    removeLayer2Header(data: Data): void {
        data.backgroundPath = "doc/datagram/3header.png";
        data.layer2header.macSender = "";
        data.layer2header.macReceiver = "";
        this.name = "L3    DATA";
    }

    populateArpTable(ip: string, mac: string, network: ComputerNetwork): void {
        this.arpTable.set(ip, mac);
        PacketSimulator.addOrUpdateTable(this.id, 'ArpTable', this.arpTable, network);
        //send out pending frames after getting ARP table populated
        this.pendingFrames.get(ip).forEach(dataNode => {
            let data: Frame = dataNode.data() as Frame;
            this.sendDataInSameNetwork(data, data.layer2header.macSender, data.layer3header.ipSender, mac, ip, network);
        });
    }

    //initiate before simulation
    initiateRoutingTable(network: ComputerNetwork): void {
        let node = network._graph.$('#' + this.id);
        if (this instanceof Host) {
            this.portData.forEach((value, port) => {
                let ipv4: Ipv4Address = value.get('IPv4');
                if (ipv4.address != "127.0.0.1") this.routingTable.set("0.0.0.0 /0", [value.get('Name'), port, null]);
            });
        }
        else if (this instanceof Router) {
            if (node.hasClass('gateway-node')) {
                let gateway: Router = this as Router;
                gateway.portSubnetMapping.forEach((subnet, port) => {
                    this.routingTable.set(subnet.name, [this.portData.get(port).get('Name'), port, 'DC']);
                });
            }
        }
        PacketSimulator.addOrUpdateTable(this.id, 'RoutingTable', this.routingTable, network);
    }


    //TODO: multiple path to another network? link-state-routing? OSPF?
    populateRoutingTableOnNewPacket(previousId: string, dataNode: any, network: ComputerNetwork): void {
        let gateway = network._graph.$('#' + this.id);
        let data = dataNode.data();
        if (!this.cssClass.includes('gateway-node')) return;
        if (data instanceof Packet) {
            return;
        }
        else if (data instanceof Frame) {
            let senderId = network.ipv4Database.get(data.layer3header.ipSender);
            let subnet = network._graph.$('#' + senderId).parent().data() as Subnet;
            let portIn = this.getPortIn(previousId, network);
            if (!this.routingTable.has(subnet.name)) {
                this.routingTable.set(subnet.name, [this.portData.get(portIn).get('Name'), portIn, 'Dyn.']);
            }
        }
        PacketSimulator.addOrUpdateTable(this.id, 'RoutingTable', this.routingTable, network);
    }

    findPortToSend(ip: string): number {
        if (ip = "127.0.0.1") return null;
        this.routingTable.forEach(([_interface, port], cidr) => {
            let masking = cidr.split(' /');
            let binaryMask = AddressingHelper.decimalStringWithDotToBinary(masking[0]);
            let binaryNode = AddressingHelper.decimalStringWithDotToBinary(ip);
            if (binaryMask.slice(0, +masking[1]) == binaryNode.slice(0, +masking[1])) {
                return port;
            }
        });
        return null;
    }

    static injectMethods(decoratorWithoutMethods: RoutableDecorator): RoutableDecorator {
        let realDecorator = new RoutableDecorator();
        realDecorator = Object.assign(realDecorator, decoratorWithoutMethods);
        return realDecorator;
    }

}