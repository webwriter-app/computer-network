import { ComputerNetwork } from "..";

let compoundCounter = 0;

export function toggleSubnetting(event: any, network: ComputerNetwork) {
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
export function onDragInACompound(event, compound): void {
    
    if (!compound._private.data) {
        return;
    }
    let node = event.target;

    let networkId = compound._private.data.ip;
    let prefix = networkId.split("/")[0].slice(0, -1);
    let cidr = parseInt(networkId.split("/")[1]);

    node._private.data.ip = generateNewIpProvidedCidr(node._private.data.ip, prefix, cidr);
}

/**
 * Create new "parent" (a compound - network)
 * @param grabbedNode 
 * @param dropSibling 
 */
export function generateNewSubnet(network: ComputerNetwork, grabbedNode, dropSibling) {
    let firstIp = grabbedNode._private.data.ip;
    let secondIp = dropSibling._private.data.ip;

    let networkId = calculateNetworkId([firstIp, secondIp]);

    let newParent = {
        group: 'nodes',
        data: {
            id: 'compound' + compoundCounter,
            name: networkId,
            color: network.currentColor,
            ip: networkId
        },
        classes: 'compound-label'
    };
    compoundCounter++;
    
    return newParent;
}