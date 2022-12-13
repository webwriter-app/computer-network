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


    private constructor(color: string, subnetNum: string, subnetmask: string, bitmask: number,
        database: Map<string, Ipv4Address>, subnetDatabase: Map<string, Map<number, Ipv4Address>>) {
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

        let networkId = Ipv4Address.validateIpv4Address(subnetNum, database, subnetDatabase, this.bitmask);
        if (networkId == null) {
            AlertHelper.toastAlert("danger", "exclamation-diamond", "Provided subnet number is not valid.", "");
            this.cssClass.push("unconfigured-subnet");
            return;
        }
        this.networkAddress = networkId != null ? networkId : null;

        this.name = (this.networkAddress != null && this.bitmask != undefined) ? this.networkAddress.address + " /" + this.bitmask : "";
    }

    static createSubnet(color: string, subnetNum: string, subnetmask: string, bitmask: number,
        database: Map<string, Ipv4Address>, subnetDatabase: Map<string, Map<number, Ipv4Address>>): Subnet {
        if (subnetNum == null || subnetNum == undefined || subnetNum == "") {
            if (Subnet.mode == "SUBNET_BASED") {
                AlertHelper.toastAlert("danger", "exclamation-diamond", "Subnet-based Mode for Subnetting extensions activated:",
                    "Cannot create a subnet without subnet number!");
                return null;
            }
            let unconfiguredSubnet = new Subnet(color, null, subnetmask, bitmask, database, subnetDatabase);
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
                let unconfiguredSubnet = new Subnet(color, subnetNum, null, null, database, subnetDatabase);
                unconfiguredSubnet.cssClass.push("unconfigured-subnet");
                return unconfiguredSubnet;
            }
            else {
                return new Subnet(color, subnetNum, subnetmask, bitmask, database, subnetDatabase);
            }
        }
    }


    static setMode(mode: SubnettingMode) {
        Subnet.mode = mode;
    }

    static calculateSubnetNumber(subnet: Subnet, ips: Ipv4Address[], database: Map<string, Ipv4Address>,
        subnetDatabase: Map<string, Map<number, Ipv4Address>>, subnetPrefixes?: string[]): boolean {
        if (ips.length == 0 && subnetPrefixes.length == 0) {
            return false;
        }
        if (ips.length + subnetPrefixes.length == 1) {
            if (ips.length == 1) {
                let count = 30; //starting from 30 since bitmask 31 --> 2 address (1 reserved for broadcast + 1 reserved for network ID --> none for the new hosts)
                let subnetNum: string = ips[0].address.slice(0, -2).padEnd(32, '0');
                subnet.networkAddress = Ipv4Address.validateIpv4Address(subnetNum, database, subnetDatabase, count);
                while (subnet.networkAddress == null && count >= 0) {
                    count--;
                    subnetNum = AddressingHelper.replaceAt(subnetNum, count, "0");
                    subnet.networkAddress = Ipv4Address.validateIpv4Address(subnetNum, database, subnetDatabase, count);
                }
                if (count < 0) {
                    AlertHelper.toastAlert('danger', 'exclamation-triangle', "Unable to autogenerate network ID for this subnet!", "");
                    return false;
                }
                subnet.bitmask = count;
                subnet.name = subnetNum + " /" + subnet.bitmask;
                subnet.binarySubnetMask = "".padStart(count, "1").padEnd(32, "0");
                subnet.subnetMask = AddressingHelper.binaryToDecimalOctets(subnet.binarySubnetMask).join('.');
                return true;
            } else {

            }
        }

        let toMatch: string[] = [];
        let matchesCIDR = true;
        let configured: boolean = !subnet.cssClass.includes('unconfigured-subnet');

        ips.forEach(ip => {
            if (configured && !ip.matchesNetworkCidr(subnet)) matchesCIDR = false;
            toMatch.push(ip.binaryOctets.join(''));
        });

        subnetPrefixes.forEach(prefix => {
            if (configured && prefix.length <= subnet.bitmask) matchesCIDR = false;
            else if (configured && prefix.slice(0, subnet.bitmask) != subnet.networkAddress.address.slice(0, subnet.bitmask)) matchesCIDR = false;
            toMatch.push(prefix);
        });

        //return if all hosts still match network CIDR
        if (configured && matchesCIDR == true) {
            return;
        }
        let networkPrefix = AddressingHelper.getPrefix(toMatch);
        let count = 32 - networkPrefix.length;
        let binaryIp = networkPrefix.padEnd(32, '0');
        let binaryMask = "".padStart(count, '1').padEnd(32, '0');
        let subnetNum = AddressingHelper.binaryToDecimalOctets(binaryIp).join('.');
        let networkAddress = Ipv4Address.validateIpv4Address(subnetNum, database, subnetDatabase, count);

        while (networkAddress == null || networkAddress == undefined) {
            if (count < 0) {
                AlertHelper.toastAlert("danger", "exclamation-triangle", "No subnet address is valid", "");
                database.delete(subnet.networkAddress.address); //delete the old 
                subnet.bitmask = null;
                subnet.name = "undefined";
                subnet.binarySubnetMask = null;
                subnet.subnetMask = null;
                subnet.networkAddress = null;
                return false;
            }
            //if the network address has already been assigned to a device or another network
            count--;
            binaryMask = AddressingHelper.replaceAt(binaryMask, count, "0");
            binaryIp = AddressingHelper.replaceAt(binaryIp, count, "0");
            networkAddress = Ipv4Address.validateIpv4Address(AddressingHelper.binaryToDecimalOctets(binaryIp).join('.'), database,
                subnetDatabase, count);
        }

        subnet.bitmask = count;
        subnet.name = subnetNum + " /" + subnet.bitmask;
        subnet.binarySubnetMask = binaryMask;
        subnet.subnetMask = AddressingHelper.binaryToDecimalOctets(binaryMask).join('.');
        subnet.networkAddress = networkAddress;
        return true;
    }

    validateSubnet(hosts: GraphNode[]): boolean {
        if (this.cssClass.includes('unconfigured-subnet')) return false;
        let unmatchedPairs: Map<string, [string, string]> = new Map(); //("host", [subnet,type of host])
        hosts.forEach(host => {
            if (host instanceof PhysicalNode && host.layer > 2) {
                host.portData.forEach(data => {
                    if (!data.get('IPv4').matchesNetworkCidr(this)) {
                        unmatchedPairs.set(data.get('IPv4').address, [this.networkAddress.address, "host"]);
                    }
                });
            }
            else if (host instanceof Subnet) {
                if (!host.networkAddress.matchesNetworkCidr(this)) {
                    unmatchedPairs.set(host.networkAddress.address, [this.networkAddress.address, "subnet"]);
                }
            }
        });
        if (unmatchedPairs.size == 0) return true;
        let alert: string = "<ul>";
        unmatchedPairs.forEach(([subnet, type], host) => {
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

}


export type SubnettingMode = "SUBNET_BASED" | "HOST_BASED" | "MANUAL";
