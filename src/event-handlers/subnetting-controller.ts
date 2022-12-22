import { ComputerNetwork } from "../..";
import { Ipv4Address } from "../adressing/Ipv4Address";
import { GraphNode } from "../components/GraphNode";
import { Subnet } from "../components/logicalNodes/Subnet";
import { Router } from "../components/physicalNodes/Connector";
import { PhysicalNode } from "../components/physicalNodes/PhysicalNode";
import { AlertHelper } from "../utils/AlertHelper";
import NodeSingular from "cytoscape";
import { AddressingHelper } from "../utils/AdressingHelper";


export class SubnettingController {
    static assignGatewayOn = false;
    static mutexDragAndDrop: string;


    static toggleDragAndDropSubnetting(event: any, network: ComputerNetwork) {
        if (this.mutexDragAndDrop == "gateway") return;
        //if subnetting option is not active
        if (!event.target.checked) {
            event.target.checked = true;
            this.mutexDragAndDrop = "subnetting";
            network._cdnd.enable();
        }
        else {
            event.target.checked = false;
            network._cdnd.disable();
            this.mutexDragAndDrop = null;
        }
    }

    static toggleAssigningGateway(event: any) {
        if (this.mutexDragAndDrop == "subnetting") return;
        if (!event.target.checked) {
            event.target.checked = true;
            this.mutexDragAndDrop = "gateway";
        }
        else {
            event.target.checked = false;
            this.mutexDragAndDrop = null;
        }
        SubnettingController.assignGatewayOn = event.target.checked;
    }

    static addGateway(event: any, network: ComputerNetwork): void {
        var router = event.target;
        if (!(router.data() instanceof Router)) return;
        var mouse = event.position;
        network._graph.$('.subnet-node').forEach(subnet => {
            var pos = subnet.boundingBox();
            //drag router onto the edge of a subnet
            if ((((mouse.x > pos.x1 - 15 && mouse.x < pos.x1 + 15) || (mouse.x > pos.x2 - 15 && mouse.x < pos.x2 + 15)) && (mouse.y > pos.y1 && mouse.y < pos.y2)) ||
                (((mouse.y > pos.y1 - 15 && mouse.y < pos.y1 + 15) || (mouse.y > pos.y2 - 15 && mouse.y < pos.y2 + 15)) && (mouse.x > pos.x1 && mouse.x < pos.x2))) {
                router.data('subnets').push(subnet.data()); //add subnet to router node
                router.toggleClass("gateway-node", true);
                let gatewayList = subnet.data('gateways');
                if (!gatewayList.has(router.id)) gatewayList.set(router.id(), null); // add gateway to the subnet, with undefined port
                console.log(router);
            }
        });
    }

    static onDragInACompound(grabbedNode, compound, database: Map<string, Ipv4Address>): void {
        let subnet: Subnet = compound.data();
        let node: PhysicalNode = grabbedNode.data();

        //reset the IP address of a host based on the network ID
        if (Subnet.mode == "SUBNET_BASED") {
            if (node instanceof PhysicalNode && node.layer > 2) {
                node.portData.forEach(data => {
                    let ip4 = data.get('IPv4');
                    if (ip4 != null && !ip4.matchesNetworkCidr(subnet)) {
                        data.set('IPv4', Ipv4Address.generateNewIpGivenSubnet(database, ip4, subnet));
                    }
                });
                if (subnet.currentDefaultGateway != undefined && subnet.currentDefaultGateway != null) {
                    node.defaultGateway = subnet.currentDefaultGateway;
                    grabbedNode.addClass('gateway-changeable');
                }
                else {
                    grabbedNode.addClass('default-gateway-not-found');
                }
            }
            else if (node instanceof Subnet) {
                //if the subnet doesn't match supernet's CIDR
                if (!subnet.isSupernetOf(node)) {
                    database.delete(node.networkAddress.address) //delete the subnet from database
                    database.delete(AddressingHelper.getBroadcastAddress(node.networkAddress.address, node.bitmask));
                    node.networkAddress = null; //delete the subnet Address
                    grabbedNode.addClass("unconfigured-subnet"); //seems redundant? no direct mapping between cssClass and classes of cytopscape?
                    node.cssClass.push("unconfigured-subnet");
                    node.name = "";
                }
            }
        }//reset the Network ID based on new element
        else if (Subnet.mode == "HOST_BASED") {

            if (node instanceof PhysicalNode && node.layer > 2) {
                node.portData.forEach(data => {
                    let ip4 = data.get('IPv4');
                    if (ip4 != null && ip4 != undefined) Subnet.calculateCIDRGivenNewHost(subnet, ip4, database);
                    compound.classes(subnet.cssClass); 
                });
                if (subnet.currentDefaultGateway != undefined && subnet.currentDefaultGateway != null) {
                    node.defaultGateway = subnet.currentDefaultGateway;
                    grabbedNode.addClass('gateway-changeable');
                }
                else {
                    grabbedNode.addClass('default-gateway-not-found');
                }
            }
            else if (node instanceof Subnet) {
                Subnet.calculateCIDRGivenNewSubnet(subnet, node, database);
                compound.classes(subnet.cssClass);
            }
        }
    }

    //TODO: automatically run this before the packet simulation
    static validateAllSubnets(network: ComputerNetwork): void {
        let subnets = network._graph.$('.subnet-node');
        let allCorrect = true;
        let alert = "";
        let unconfig = false;

        subnets.forEach(networkNode => {
            if (networkNode.hasClass('unconfigured-subnet')) {
                unconfig = true;
            }
            else {
                let nw: Subnet = networkNode.data() as Subnet;
                let hosts: GraphNode[] = [];
                let gateways: Router[] = [];
                //check if each subnet is correctly assigned locally
                networkNode.children().forEach(node => hosts.push(node.data()));
                nw.gateways.forEach((_port, id) => gateways.push(network._graph.$('#' + id)));
                if (!nw.validateSubnetLocally(hosts, gateways)) allCorrect = false;

                subnets.forEach(subnet => {
                    let isSupernet: boolean = (nw as Subnet).isSupernetOf(subnet.data());
                    let contains: boolean = networkNode.children().contains(subnet);
                    if (isSupernet && !contains) {
                        alert += "<li>" + nw.name + " should contain subnet " + subnet.data().name + "</li>";
                        allCorrect = false;
                    }
                    else if (!isSupernet && contains) {
                        alert += "<li>" + nw.name + " is not a supernet of " + subnet.data().name + "</li>";
                        allCorrect = false;
                    }
                });
            }
        });

        if (allCorrect && !unconfig) {
            AlertHelper.toastAlert("success", "check2-circle", "Well done!", "All subnets are correctly configured!")
        }
        else {
            alert += "<li>Unconfigured subnet still exists.</li>";
        }

        if (alert != "") AlertHelper.toastAlert("warning", "exclamation-triangle", "", alert);
    }


    static setUpGateway(gateway: NodeSingular, host: NodeSingular, gatewayPort: number, database: Map<string, Ipv4Address>): void {
        if (host.isChild() && gateway.hasClass('gateway-node')) {
            let subnet = host.parent();
            let gatewayNodeId = gateway.data().id;
            let gatewayList: Map<string, number> = subnet.data('gateways');
            if (!gatewayList.has(gatewayNodeId)) return;
            gatewayList.set(gatewayNodeId, gatewayPort);
            gateway.data('portSubnetMapping').set(gatewayPort, subnet.data());
            let ip4 = gateway.data('portData').get(gatewayPort).get('IPv4');

            if (subnet.data('currentDefaultGateway') == undefined) subnet.data('currentDefaultGateway', [gatewayNodeId, gatewayPort]);

            switch (Subnet.mode) {
                case 'HOST_BASED':
                    if (ip4 != null && ip4 != undefined) Subnet.calculateCIDRGivenNewHost(subnet.data() as Subnet, ip4, database);
                    break;
                case 'SUBNET_BASED':
                    if (ip4 != null && !ip4.matchesNetworkCidr(subnet.data() as Subnet)) {
                        gateway.data('portData').get(gatewayPort).set('IPv4', Ipv4Address.generateNewIpGivenSubnet(database, ip4, subnet.data() as Subnet));
                    }
                    break;
                default:
                    break;
            }
        }
    }

}