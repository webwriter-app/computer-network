import { ComputerNetwork } from "..";
import { IpAddress } from "../adressing/IpAddress";
import { GraphNode } from "../components/GraphNode";
import { Subnet } from "../components/logicalNodes/Subnet";
import { Host } from "../components/physicalNodes/Host";


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
export function onDragInACompound(event, compound, database: Map<string, IpAddress>): void {

    // if (compound._private.data !instanceof Subnet) {
    //     return;
    // }
    // let node = event.target._private.data;
    // let subnet = compound._private.data;

    // if(node instanceof Host){
    //     if(node.ip.matchesNetworkCidr(subnet)){
    //         return;
    //     }
    //     node.ip = IpAddress.generateNewIpForSubnet(database, node.ip, subnet);
    // }
    //TODO: handle for node instanceof Connector, Subnet
}

/**
 * Create new "parent" (a compound - network)
 * @param grabbedNode 
 * @param router 
 */
export function generateNewSubnet(network: ComputerNetwork, grabbedNode, router) {

    // let childNode = grabbedNode._private.data;

    // if (childNode instanceof GraphNode) {
    //     let data = new Subnet(network.currentColor, router._private.data, network.ipDatabase, [childNode]);
    //     console.log(data);
    //     return {
    //         group: 'nodes',
    //         data: data,
    //         classes: data.cssClass
    //     };
    // }
    // else {
    //     return null;
    // }
}