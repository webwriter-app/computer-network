import { ComputerNetwork } from "../..";
import { Ipv4Address } from "../adressing/Ipv4Address";
import { GraphNode } from "../components/GraphNode";
import { Subnet } from "../components/logicalNodes/Subnet";
import { Router } from "../components/physicalNodes/Connector";
import { PhysicalNode } from "../components/physicalNodes/PhysicalNode";
import { AlertHelper } from "../utils/AlertHelper";
import NodeSingular from "cytoscape";


export class SubnettingController {
    static assignGatewayOn = false;


    static toggleDragAndDropSubnetting(event: any, network: ComputerNetwork) {
        //if subnetting option is not active
        if (!event.target.checked) {
            event.target.checked = true;
            network._cdnd.enable();
        }
        else {
            event.target.checked = false;
            network._cdnd.disable();
        }
    }

    static toggleAssigningGateway(event: any) {
        if (!event.target.checked) {
            event.target.checked = true;
        }
        else {
            event.target.checked = false;
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
                if (!gatewayList.has(router.id)) gatewayList.set(router.id, null); // add gateway to the subnet, with undefined port
                console.log(router);
            }
        });
    }

    static onDragInACompound(grabbedNode, compound, database: Map<string, Ipv4Address>): void {
        let subnet = compound.data();
        let node = grabbedNode.data();

        //a layer 3 host needs to have a gateway (saves the IP address of the gateway)
        if (node instanceof PhysicalNode && node.layer > 2) {
            node.subnet = subnet;
            grabbedNode.addClass('default-gateway-not-found');
        }

        //reset the IP address of a host based on the network ID
        if (Subnet.mode == "SUBNET_BASED") {
            if (node instanceof PhysicalNode && node.layer > 2) {
                node.portData.forEach(data => {
                    let ip4 = data.get('IPv4');
                    if (ip4 != null && !ip4.matchesNetworkCidr(subnet)) {
                        data.set('IPv4', Ipv4Address.generateNewIpGivenSubnet(database, ip4, subnet));
                    }
                });
            }
            else if (node instanceof Subnet) {
                //if the subnet doesn't match supernet's CIDR
                if (!subnet.isSupernetOf(node)) {
                    database.delete(node.networkAddress.address) //delete the subnet from database
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
                });
            }
            else if (node instanceof Subnet) {
                Subnet.calculateCIDRGivenNewSubnet(subnet, node, database);
            }
        }
    }

    //TODO: automatically run this before the packet simulation
    static validateAllSubnets(network: ComputerNetwork): void {
        let subnets = network._graph.$('.subnet-node');
        let allCorrect = true;
        let alert = "";

        subnets.forEach(networkNode => {
            let nw: Subnet = networkNode.data() as Subnet;
            let hosts: GraphNode[] = [];
            let gateways: Router[] = [];
            //check if each subnet is correctly assigned locally
            networkNode.children().forEach(node => hosts.push(node.data()));
            nw.gateways.forEach((_port, id) => gateways.push(network._graph.$('#'+id)));
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
        });

        if (alert != "") AlertHelper.toastAlert("warning", "exclamation-triangle", "", alert);

        if (allCorrect) {
            AlertHelper.toastAlert("success", "check2-circle", "Well done!", "All subnets are correctly configured!")
        }
    }


    static setUpGateway(gateway: NodeSingular, host: NodeSingular, gatewayPort: number, database: Map<string, Ipv4Address>): void {
        if (host.isChild() && gateway.hasClass('gateway-node')) {
            let subnet = host.parent();
            if (!subnet.data('gateways').has(gateway.id)) return;
            subnet.data('gateways').set(gateway.id, gatewayPort);
            gateway.data('portSubnetMapping').set(gatewayPort, subnet);
            let ip4 = gateway.data('portData').get(gatewayPort).get('IPv4');

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