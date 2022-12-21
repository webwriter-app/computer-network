import { ComputerNetwork } from "../../..";
import { Ipv4Address } from "../../adressing/Ipv4Address";
import { AddressingHelper } from "../../utils/AdressingHelper";
import { AlertHelper } from "../../utils/AlertHelper";
import { GraphNode } from "../GraphNode";
import { Router } from "../physicalNodes/Connector";
import { PhysicalNode } from "../physicalNodes/PhysicalNode";
import { LogicalNode } from "./LogicalNode";

export class Subnet extends LogicalNode {
    bitmask: number;
    networkAddress: Ipv4Address;
    subnetMask: string;
    binarySubnetMask: string;

    static mode: SubnettingMode = "MANUAL"; //initial is manual
    //this is updated on drag-and-drop
    gateways: Map<string, number> = new Map(); //(routerId, portIndex)
    currentDefaultGateway: [string, number];

    private constructor(color: string, subnetNum: string, subnetmask: string, bitmask: number, database: Map<string, Ipv4Address>) {
        super(color);
        this.id = 'subnet' + Subnet.counter;
        Subnet.counter++;
        this.cssClass.push('subnet-node');

        //if bitmask is not null, calculate equivalent subnet mask
        if (bitmask != null) {
            this.bitmask = bitmask;
            this.binarySubnetMask = "".padStart(bitmask, '1').padEnd(32, '0');
            let derivedDecimalMask: number[] = AddressingHelper.binaryToDecimalOctets(this.binarySubnetMask);
            //if the input subnetmask is valid and doesn't match our bitmask
            this.subnetMask = derivedDecimalMask.join('.');
            if (subnetmask != null && derivedDecimalMask.join('.') != subnetmask) {
                AlertHelper.toastAlert("warning", "exclamation-diamond", "",
                    "The subnet mask you entered <strong>" + subnetmask + "</strong> doesn't match the bitmask <strong>"
                    + this.bitmask + "</strong>. Derived subnet mask is: " + this.subnetMask);
            }

        }
        else if (subnetmask != null) {
            //if bitmask is null, subnetmask!=null --> calculate bitmask from subnetmask
            this.subnetMask = subnetmask;
            this.binarySubnetMask = AddressingHelper.decimalStringWithDotToBinary(subnetmask);
            this.bitmask = (this.binarySubnetMask.match(new RegExp("1", "g")) || []).length;
        }

        let networkId = Ipv4Address.validateAddress(subnetNum, database, this.bitmask);
        if (networkId == null) {
            AlertHelper.toastAlert("danger", "exclamation-diamond", "Provided subnet number is not valid.", "");
            this.cssClass.push("unconfigured-subnet");
            return;
        }

        this.networkAddress = networkId != null ? networkId : null;
        this.name = (this.networkAddress != null && this.bitmask != undefined) ? this.networkAddress.address + " /" + this.bitmask : "";
    }

    static validateSubnetMask(subnetmask: string): boolean {
        if (!/^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/.test(subnetmask)) return false;
        let binMask: string = AddressingHelper.decimalStringWithDotToBinary(subnetmask);
        if (binMask.length != 32) return false;

        let ones: boolean = true;
        let zeros: boolean = false;
        for (let index = 0; index < binMask.length; index++) {
            let char = binMask.charAt(index);
            switch (char) {
                case '0':
                    if (ones) {
                        ones = false;
                        zeros = true;
                    }
                    break;
                case '1':
                    if (zeros) return false;
                    break;
                default: return false;
            }
        }
        return true;
    }

    /**
     * Filter for valid bitmask and subnetmask
     * @param color 
     * @param subnetNum 
     * @param subnetmask 
     * @param bitmask 
     * @param database 
     * @returns 
     */
    static createSubnet(color: string, subnetNum: string, subnetmask: string, bitmask: number, database: Map<string, Ipv4Address>): Subnet {
        let bitmaskValid: boolean = !(bitmask == null || bitmask == undefined || Number.isNaN(bitmask) || bitmask < 0 || bitmask > 32);
        let subnetmaskValid: boolean = !(subnetmask == null || subnetmask == undefined || subnetmask == "" || !Subnet.validateSubnetMask(subnetmask));

        if (!bitmaskValid && !subnetmaskValid) {
            if (Subnet.mode == "SUBNET_BASED") {
                AlertHelper.toastAlert("danger", "exclamation-diamond", "Subnet-based Mode for Subnetting extensions activated:",
                    "Cannot create a subnet without bitmask and subnet mask!");
                return null;
            }
            let unconfiguredSubnet = new Subnet(color, subnetNum, subnetmaskValid ? subnetmask : null, bitmaskValid ? bitmask : null, database);
            unconfiguredSubnet.cssClass.push("unconfigured-subnet");
            return unconfiguredSubnet;
        }
        return new Subnet(color, subnetNum, subnetmaskValid ? subnetmask : null, bitmaskValid ? bitmask : null, database);
    }


    static setMode(mode: SubnettingMode) {
        Subnet.mode = mode;
    }

    /**
     * Calculate the network CIDR when a host is dragged into the network
     * 
     * @param subnet A network
     * @param ip The Ipv4 Address of a new host
     * @param database Ipv4 database
     */
    static calculateCIDRGivenNewHost(subnet: Subnet, ip: Ipv4Address, database: Map<string, Ipv4Address>): void {
        if (Subnet.mode != "HOST_BASED" || ip.matchesNetworkCidr(subnet)) {
            return;
        }
        let count: number;
        let candidateId: string;
        if (!subnet.cssClass.includes('unconfigured-subnet')) {
            let oldPrefix = subnet.networkAddress.binaryOctets.join('').slice(0, subnet.bitmask);
            let newPrefix = AddressingHelper.getPrefix([oldPrefix, ip.binaryOctets.join('')]);
            count = newPrefix.length;
            candidateId = newPrefix.padEnd(32, '0');
        }
        else {
            count = 30;
            candidateId = ip.binaryOctets.join('').slice(0, count).padEnd(32, '0');
        }
        this.testPossibleSubnetAddresses(count, candidateId, subnet, database);
    }

    private static testPossibleSubnetAddresses(count: number, candidateId: string, subnet: Subnet, database: Map<string, Ipv4Address>): void {
        if (Subnet.mode != "HOST_BASED") return;

        let candidateIdFormatted = AddressingHelper.binaryToDecimalOctets(candidateId).join('.');
        let candidateAddress = Ipv4Address.validateAddress(candidateIdFormatted, database, count);

        while (count > 0 && candidateAddress == null) {
            candidateId = AddressingHelper.replaceAt(candidateId, count, '0');
            candidateIdFormatted = AddressingHelper.binaryToDecimalOctets(candidateId).join('.');
            candidateAddress = Ipv4Address.validateAddress(candidateIdFormatted, database, count);
            count--;
        }

        //if no subnet address is available
        if (candidateAddress == null) {
            AlertHelper.toastAlert("warning", "exclamation-triangle", "Hosts-based mode:", "No valid network address can be assigned to this subnet.");
            database.delete(subnet.networkAddress.address);
            subnet.setSubnetInfo(null, null, null, null, true, "");
            return;
        }
        else {
            while (subnet.cssClass.includes('unconfigured-subnet')) {
                subnet.cssClass.splice(subnet.cssClass.indexOf('unconfigured-subnet'), 1);
            }
            if (subnet.networkAddress != null && subnet.networkAddress != undefined) {
                database.delete(subnet.networkAddress.address); //delete the old subnet ID from database
            }
            subnet.setSubnetInfo(candidateAddress, count, AddressingHelper.binaryToDecimalOctets("".padStart(count, '1').padEnd(32, '0')).join('.'),
                "".padStart(count, '1').padEnd(32, '0'), false)
        }
    }

    /**
     * Calculate the network CIDR when a subnet is dragged into the network
     * 
     * @param subnet A network
     * @param ip The subnet ID
     * @param database Ipv4 database
     * @param bitmask of the subnet
     */
    static calculateCIDRGivenNewSubnet(supernet: Subnet, subnet: Subnet, database: Map<string, Ipv4Address>): void {
        if (Subnet.mode != "HOST_BASED" || supernet.isSupernetOf(subnet) || subnet.cssClass.includes('unconfigured-subnet')) return;

        let count: number;
        let candidateId: string;
        if (!supernet.cssClass.includes('unconfigured-subnet')) {
            let oldSupernetPrefix = supernet.networkAddress.binaryOctets.join('').slice(0, supernet.bitmask);
            let subnetPrefix = subnet.networkAddress.binaryOctets.join('').slice(0, subnet.bitmask);
            let newPrefix = AddressingHelper.getPrefix([oldSupernetPrefix, subnetPrefix]);
            count = newPrefix.length;
            candidateId = newPrefix.padEnd(32, '0');
        }
        else {
            let count = subnet.bitmask - 1;
            let subnetPrefix = subnet.networkAddress.binaryOctets.join('').slice(0, subnet.bitmask);
            candidateId = AddressingHelper.replaceAt(subnetPrefix, count, '0').padEnd(32, '0');
        }
        Subnet.testPossibleSubnetAddresses(count, candidateId, supernet, database);
    }

    validateSubnetLocally(hosts: GraphNode[], gateways: Router[]): boolean {
        if (this.cssClass.includes('unconfigured-subnet')) return false;
        let unmatchedPairs: Map<string, string> = new Map(); //("host", [subnet,type of host])
        hosts.forEach(host => {
            if (host instanceof PhysicalNode && host.layer > 2) {
                host.portData.forEach(data => {
                    if (!data.get('IPv4').matchesNetworkCidr(this)) {
                        unmatchedPairs.set(data.get('IPv4').address, "host");
                    }
                });
            }
            else if (host instanceof Subnet) {
                if (!this.isSupernetOf(host) && !host.cssClass.includes('unconfigured-subnet')) {
                    unmatchedPairs.set(host.name, "subnet");
                }
            }
        });
        gateways.forEach(gateway => {
            let port = this.gateways.get(gateway.id);
            let ip4 = gateway.portData.get(port).get('IPv4');
            if (!ip4.matchesNetworkCidr(this)) {
                unmatchedPairs.set(ip4.address, "gateway");
            }
        });

        if (unmatchedPairs.size == 0) return true;
        let alert: string = "<ul>";
        unmatchedPairs.forEach((type, node) => {
            switch (type) {
                case 'host':
                    alert += "<li>Host " + node + "</li>";
                    break;
                case 'subnet':
                    alert += "<li>Subnet " + node + "</li>";
                    break;
                case 'gateway':
                    alert += "<li>Gateway " + node + "</li>";
                    break;
            }
        });
        alert += "</ul>"
        AlertHelper.toastAlert("warning", "exclamation-triangle", "Unmatched addresses for network " + this.name, alert);
    }


    isSupernetOf(subnet: Subnet): boolean {
        if (subnet == null || this.cssClass.includes('unconfigured-subnet') || subnet.cssClass.includes('unconfigured-subnet')) {
            return false;
        }
        if (this.bitmask >= subnet.bitmask) return false;
        return this.networkAddress.binaryOctets.join('').slice(0, this.bitmask) == subnet.networkAddress.binaryOctets.join('').slice(0, this.bitmask);
    }

    private setSubnetInfo(networkAddress: Ipv4Address, bitmask: number, subnetmask: string, binarySubnetmask: string, unconfig: boolean, name?: string) {
        this.bitmask = bitmask;
        this.networkAddress = networkAddress;
        this.subnetMask = subnetmask;
        this.binarySubnetMask = binarySubnetmask;
        this.name = name != null ? this.name = name : this.networkAddress.address + " /" + this.bitmask;
        if (!unconfig) {
            while (this.cssClass.includes('unconfigured-subnet')) {
                this.cssClass.splice(this.cssClass.indexOf('unconfigured-subnet'), 1);
            }
        }
        else {
            this.cssClass.push('unconfigured-subnet');
        }
    }

    handleChangesOnNewSubnetInfo(newSubnetNum: string, newSubnetMask: string, newBitmask: number, network: ComputerNetwork): boolean {
        let bitmaskValid: boolean = !(newBitmask == null || newBitmask == undefined || Number.isNaN(newBitmask) || newBitmask < 0 || newBitmask > 32);
        let subnetmaskValid: boolean = !(newSubnetMask == null || newSubnetMask == undefined || newSubnetMask == "" || !Subnet.validateSubnetMask(newSubnetMask));

        if (!bitmaskValid && !subnetmaskValid) return false;

        //if bitmask valid, calculate equivalent subnet mask
        if (bitmaskValid) {
            let derivedDecimalMask: number[] = AddressingHelper.binaryToDecimalOctets("".padStart(newBitmask, '1').padEnd(32, '0'));
            console.log(derivedDecimalMask);
            //if the input subnetmask is valid and doesn't match our bitmask
            if (subnetmaskValid && derivedDecimalMask.join('.') != newSubnetMask) {
                AlertHelper.toastAlert("warning", "exclamation-diamond", "",
                    "The subnet mask you entered <strong>" + newSubnetMask + "</strong> doesn't match the bitmask <strong>"
                    + newBitmask + "</strong>. Derived subnet mask is: " + derivedDecimalMask.join('.'));

            }
            newSubnetMask = derivedDecimalMask.join('.');
        }
        else if (subnetmaskValid) {
            //if bitmask not valid --> calculate bitmask from subnetmask
            newBitmask = (AddressingHelper.decimalStringWithDotToBinary(newSubnetMask).match(new RegExp("1", "g")) || []).length;
        }

        let networkId = Ipv4Address.validateAddress(newSubnetNum, network.ipv4Database, newBitmask);

        if (networkId == null) return false;

        switch (Subnet.mode) {
            case 'HOST_BASED':
                console.log("checkpoint-0");
                if (this.bitmask >= newBitmask && this.networkAddress.binaryOctets.join('').slice(0, newBitmask)
                    == networkId.binaryOctets.join('').slice(0, newBitmask)) {
                        console.log("checkpoint-1");
                    this.setSubnetInfo(networkId, newBitmask, newSubnetMask, AddressingHelper.decimalStringWithDotToBinary(newSubnetMask), false);
                }
                else {
                    AlertHelper.toastAlert('danger', 'exclamation-triangle', 'Host-based mode on:', "New network doesn't extend old network!");
                    console.log("checkpoint-2");
                    return false;
                }
                break;

            case 'SUBNET_BASED':
                this.setSubnetInfo(networkId, newBitmask, newSubnetMask, AddressingHelper.decimalStringWithDotToBinary(newSubnetMask), false);

                network._graph.$('#' + this.id).children().forEach(node => {
                    let nodeData = node.data();
                    if (nodeData instanceof PhysicalNode && nodeData.layer > 2) {
                        nodeData.portData.forEach(data => {
                            let ip4 = data.get('IPv4');
                            if (ip4 != null && !ip4.matchesNetworkCidr(this)) {
                                data.set('IPv4', Ipv4Address.generateNewIpGivenSubnet(network.ipv4Database, ip4, this));
                            }
                        });
                    }
                    else if (nodeData instanceof Subnet) {
                        //if the subnet doesn't match supernet's CIDR
                        if (!this.isSupernetOf(nodeData)) {
                            network.ipv4Database.delete(nodeData.networkAddress.address) //delete the subnet from database
                            nodeData.networkAddress = null; //delete the subnet Address
                            node.toggleClass("unconfigured-subnet", true);
                            nodeData.cssClass.push("unconfigured-subnet");
                            nodeData.name = "";
                        }
                    }
                });
                this.gateways.forEach((port, id) => {
                    let gateway = network._graph.$('#' + id);
                    let ip4 = gateway.data('portData').get(port).get('IPv4');
                    if (ip4 != null && !ip4.matchesNetworkCidr(this)) {
                        gateway.data('portData').get(port).set('IPv4', Ipv4Address.generateNewIpGivenSubnet(network.ipv4Database, ip4, this));
                    }
                });
                break;
            case 'MANUAL':
                this.setSubnetInfo(networkId, newBitmask, newSubnetMask, AddressingHelper.decimalStringWithDotToBinary(newSubnetMask), false);
                break;
        }

        AlertHelper.toastAlert("success", "check2-circle", "Your changes have been saved.", "");
        return true;
    }

}




export type SubnettingMode = "SUBNET_BASED" | "HOST_BASED" | "MANUAL";
