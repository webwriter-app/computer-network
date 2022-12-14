import { Ipv4Address } from "../../adressing/Ipv4Address";
import { AlertHelper } from "../../utils/AlertHelper";
import { AddressingHelper } from "../../utils/AdressingHelper";
import { GraphNode } from "../GraphNode";
import { Router } from "../physicalNodes/Connector";
import { LogicalNode } from "./LogicalNode";
import { PhysicalNode } from "../physicalNodes/PhysicalNode";

export class Subnet extends LogicalNode {
    bitmask: number;
    networkAddress: Ipv4Address;
    subnetMask: string;
    binarySubnetMask: string;

    static mode: SubnettingMode = "MANUAL"; //initial is manual
    //this is updated on drag-and-drop
    gateways: Map<[string, number], Router> = new Map(); //([routerid, port-index], Router)


    private constructor(color: string, subnetNum: string, subnetmask: string, bitmask: number, database: Map<string, Ipv4Address>) {
        super(color);
        this.id = 'subnet' + Subnet.counter;
        Subnet.counter++;
        this.cssClass.push('subnet-node');

        //if bitmask is not null, calculate equivalent subnet mask
        if (bitmask != null && bitmask != undefined && !Number.isNaN(bitmask)) {
            this.bitmask = bitmask;
            this.binarySubnetMask = "".padStart(bitmask, '1').padEnd(32, '0');
            let derivedDecimalMask: number[] = AddressingHelper.binaryToDecimalOctets(this.binarySubnetMask);

            if (derivedDecimalMask.join('.') != subnetmask) {
                AlertHelper.toastAlert("warning", "exclamation-diamond", "The subnet mask you entered doesn't match the subnet number and subnet bits.",
                    "Derived subnet mask is: " + derivedDecimalMask.join('.'));
            }
            this.subnetMask = derivedDecimalMask.join('.');
        }
        else {
            //if bitmask is null, subnetmask!=null --> calculate bitmask from subnetmask
            if (subnetmask != null && subnetmask != "" && subnetmask != undefined) {
                this.subnetMask = subnetmask;
                this.binarySubnetMask = AddressingHelper.decimalStringWithDotToBinary(subnetmask);
                this.bitmask = (this.binarySubnetMask.match(new RegExp("1", "g")) || []).length;
            }
            //if both null, set nothing
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

    static createSubnet(color: string, subnetNum: string, subnetmask: string, bitmask: number, database: Map<string, Ipv4Address>): Subnet {
        if (subnetNum == null || subnetNum == undefined || subnetNum == "") {
            if (Subnet.mode == "SUBNET_BASED") {
                AlertHelper.toastAlert("danger", "exclamation-diamond", "Subnet-based Mode for Subnetting extensions activated:",
                    "Cannot create a subnet without subnet number!");
                return null;
            }
            let unconfiguredSubnet = new Subnet(color, null, subnetmask, bitmask, database);
            unconfiguredSubnet.cssClass.push("unconfigured-subnet");
            return unconfiguredSubnet;
        }
        else {
            if ((bitmask == null || bitmask == undefined || Number.isNaN(bitmask)) &&
                (subnetmask == null || subnetmask == undefined || subnetmask == "")) {
                if (Subnet.mode == "SUBNET_BASED") {
                    AlertHelper.toastAlert("danger", "exclamation-diamond", "Subnet-based Mode for Subnetting extensions activated:",
                        "Cannot create a subnet without bitmask and subnet mask!");
                    return null;
                }
                let unconfiguredSubnet = new Subnet(color, subnetNum, null, null, database);
                unconfiguredSubnet.cssClass.push("unconfigured-subnet");
                return unconfiguredSubnet;
            }
            else {
                return new Subnet(color, subnetNum, subnetmask, bitmask, database);
            }
        }
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
        if (ip.matchesNetworkCidr(subnet)) {
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
        let candidateIdFormatted = AddressingHelper.binaryToDecimalOctets(candidateId).join('.');
        let candidateAddress = Ipv4Address.validateAddress(candidateIdFormatted, database, count);

        while (count > 0 && candidateAddress == null) {
            count--;
            candidateId = AddressingHelper.replaceAt(candidateId, count, '0');
            candidateIdFormatted = AddressingHelper.binaryToDecimalOctets(candidateId).join('.');
            candidateAddress = Ipv4Address.validateAddress(candidateIdFormatted, database, count);
        }

        //if no subnet address is available
        if (candidateAddress == null) {
            AlertHelper.toastAlert("warning", "exclamation-triangle", "Hosts-based mode:", "No valid network address can be assigned to this subnet.");
            return;
        }
        else {
            while (subnet.cssClass.includes('unconfigured-subnet')) {
                subnet.cssClass.splice(subnet.cssClass.indexOf('unconfigured-subnet'), 1);
            }
            if (subnet.networkAddress != null && subnet.networkAddress != undefined &&
                subnet.bitmask != null && subnet.bitmask != undefined && !Number.isNaN(subnet.bitmask)) {
                database.delete(subnet.networkAddress.address); //delete the old subnet from database
            }
            subnet.networkAddress = candidateAddress;
            subnet.bitmask = count;
            subnet.binarySubnetMask = "".padStart(count, '1').padEnd(32, '0');
            subnet.subnetMask = AddressingHelper.binaryToDecimalOctets(subnet.binarySubnetMask).join('.');
            subnet.name = candidateIdFormatted + " /" + count;
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
        if (supernet.isSupernetOf(subnet)) return;
        if (subnet.cssClass.includes('unconfigured-subnet')) {
            //not enough info to auto-generate network ID
            return;
        }

        let count: number;
        let candidateId: string;
        if (!supernet.cssClass.includes('unconfigured-subnet')) {
            let oldSupernetPrefix = supernet.networkAddress.binaryOctets.join('').slice(0, supernet.bitmask);
            console.log(oldSupernetPrefix);
            let subnetPrefix = subnet.networkAddress.binaryOctets.join('').slice(0, subnet.bitmask);
            console.log(subnetPrefix);
            let newPrefix = AddressingHelper.getPrefix([oldSupernetPrefix, subnetPrefix]);
            console.log(newPrefix);
            count = newPrefix.length;
            console.log(count);
            candidateId = newPrefix.padEnd(32, '0');
        }
        else {
            let count = subnet.bitmask - 1;
            let subnetPrefix = subnet.networkAddress.binaryOctets.join('').slice(0, subnet.bitmask);
            candidateId = AddressingHelper.replaceAt(subnetPrefix, count, '0').padEnd(32, '0');
        }
        Subnet.testPossibleSubnetAddresses(count, candidateId, supernet, database);
    }

    validateSubnetLocally(hosts: GraphNode[]): boolean {
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
        if (unmatchedPairs.size == 0) return true;
        let alert: string = "<ul>";
        unmatchedPairs.forEach((type, host) => {
            switch (type) {
                case 'host':
                    alert += "<li>Host " + host + "</li>";
                    break;
                case 'subnet':
                    alert += "<li>Subnet " + host + "</li>";
                    break;
            }
        });
        alert += "</ul>"
        AlertHelper.toastAlert("warning", "exclamation-triangle", "Unmatched addresses for network " + this.name, alert);
    }


    isSupernetOf(subnet: Subnet): boolean {
        if (this.cssClass.includes('unconfigured-subnet') || subnet.cssClass.includes('unconfigured-subnet')) {
            return false;
        }
        if (this.bitmask >= subnet.bitmask) return false;
        return this.networkAddress.binaryOctets.join('').slice(0, this.bitmask) == subnet.networkAddress.binaryOctets.join('').slice(0, this.bitmask);
    }

}


export type SubnettingMode = "SUBNET_BASED" | "HOST_BASED" | "MANUAL";
