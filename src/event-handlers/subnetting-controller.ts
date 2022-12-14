import { ComputerNetwork } from "../..";
import { Ipv4Address } from "../adressing/Ipv4Address";
import { GraphNode } from "../components/GraphNode";
import { Subnet } from "../components/logicalNodes/Subnet";
import { PhysicalNode } from "../components/physicalNodes/PhysicalNode";
import { AlertHelper } from "../utils/AlertHelper";


export class SubnettingController {
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
                    if (ip4 != null && ip4.address != "127.0.0.1" && !ip4.matchesNetworkCidr(subnet)) {
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

    static validateAllSubnets(network: ComputerNetwork): void {
        let subnets = network._graph.$('.subnet-node');
        let allCorrect = true;
        let alert = "";

        subnets.forEach(networkNode => {
            let network = networkNode.data();
            let hosts: GraphNode[] = [];
            //check if each subnet is correctly assigned locally
            networkNode.children().forEach(node => hosts.push(node.data()));
            if (!network.validateSubnetLocally(hosts)) allCorrect = false;

            subnets.forEach(subnet => {
                let isSupernet: boolean = (network as Subnet).isSupernetOf(subnet.data());
                let contains: boolean = networkNode.children().contains(subnet);
                if (isSupernet && !contains) {
                    alert += "<li>" + network.name + " should contain subnet " + subnet.data().name + "</li>";
                    allCorrect = false;
                }
                else if (!isSupernet && contains) {
                    alert += "<li>" + network.name + " is not a supernet of " + subnet.data().name + "</li>";
                    allCorrect = false;
                }
            });
        });


        if (alert != "") AlertHelper.toastAlert("warning", "exclamation-triangle", "", alert);

        if (allCorrect) {
            AlertHelper.toastAlert("success", "check2-circle", "Well done!", "All subnets are correctly configured!")
        }
    }

}