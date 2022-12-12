import { ComputerNetwork } from "..";
import { Ipv4Address } from "../adressing/Ipv4Address";
import { GraphNode } from "../components/GraphNode";
import { Subnet } from "../components/logicalNodes/Subnet";
import { Host } from "../components/physicalNodes/Host";
import { PhysicalNode } from "../components/physicalNodes/PhysicalNode";


export function toggleDragAndDropSubnetting(event: any, network: ComputerNetwork) {
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

/**
 * Handles addressing when dragged into a compound: reset the IP address of an element based on the network ID
 * 'cdnddrop': Emitted on a grabbed node when it is dropped (freed)
 */
export function onDragInACompound(event, compound, database: Map<string, Ipv4Address>): void {
    let subnet = compound.data(0);
    //reset the IP address of an element based on the network ID
    if (Subnet.mode == "SUBNET_BASED") {
        if (compound.data()! instanceof Subnet) {
            return;
        }
        let node = event.target.data(0);

        if (node instanceof PhysicalNode) {
            node.portData.forEach(data => {
                let ip4 = data.get('IPv4');
                if (!ip4.matchesNetworkCidr(subnet)) {
                    data.set('IPv4', Ipv4Address.generateNewIpGivenSubnet(database, ip4, subnet));
                }
            });
        }
        else if (node instanceof Subnet) {
            //if the subnet doesn't match supernet's CIDR
            if (!node.networkAddress.matchesNetworkCidr(subnet)) {
                node.networkAddress = null; //delete the subnet Address
                event.target.addClass("unconfigured-subnet");
                node.name = "";
                database.delete(node.networkAddress.address); //delete the subnet's old ID from database
            }
        }
    }//reset the Network ID based on new element
    else if (Subnet.mode = "HOST_BASED") {
        let ips: Ipv4Address[] = [];
        let matchesCIDR = true;
        compound.children().forEach(child => {
            let host: GraphNode = child.data();
            if (host instanceof Subnet && host.networkAddress != null && host.networkAddress != undefined) {
                if (!host.networkAddress.matchesNetworkCidr(subnet)) matchesCIDR = false;
                ips.push(host.networkAddress);
            }
            else if (host instanceof PhysicalNode) {
                host.portData.forEach(data => {
                    let ip = data.has('IPv4') ? data.get('IPv4') : null;
                    if (ip != null && ip.matchesNetworkCidr(subnet)) matchesCIDR = false;
                    ips.push(ip);
                });
            }
        });
        if(matchesCIDR) return; //do nothing if all hosts still match subnet CIDR
        
        Subnet.calculateSubnetNumber(subnet, ips, database);
    }
}
