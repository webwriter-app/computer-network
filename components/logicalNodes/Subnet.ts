import { Ipv4Address } from "../../adressing/Ipv4Address";
import { AlertHelper } from "../../utils/AlertHelper";
import { AddressingHelper } from "../../utils/AdressingHelper";
import { GraphNode } from "../GraphNode";
import { Router } from "../physicalNodes/Connector";
import { LogicalNode } from "./LogicalNode";

export class Subnet extends LogicalNode {
    bitmask: number;
    networkAddress: Ipv4Address;
    subnetMask: string;
    binarySubnetMask: string;

    static mode: SubnettingMode = "MANUAL"; //initial is manual
    //this is updated on drag-and-drop
    devices: GraphNode[] = [];
    gateways: Router[];


    private constructor(color: string, subnetNum: string, subnetmask: string, bitmask: number, database: Map<string, Ipv4Address>) {
        super(color);
        this.id = 'subnet' + Subnet.counter;
        Subnet.counter++;
        this.cssClass.push('subnet-node');

        //if bitmask is not null, calculate equivalent subnet mask
        if (bitmask != null && bitmask != undefined && !Number.isNaN(bitmask)) {
            this.bitmask = bitmask;
            let subnetBin: string = "";
            for (let index = 0; index < 32; index++) {
                if (index < bitmask) {
                    subnetBin += "1";
                }
                else {
                    subnetBin += "0";
                }
            }
            this.binarySubnetMask = subnetBin;
            let derivedDecimalMask: number[] = AddressingHelper.binaryToDecimalOctets(subnetBin);

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
            if (Subnet.mode == "HOST_BASED") {
                AlertHelper.toastAlert("danger", "exclamation-diamond", "Hosts-based Mode for Subnetting extensions activated:",
                    "Cannot create a subnet without subnet number!");
                return null;
            }
            let unconfiguredSubnet = new Subnet(color, null, subnetmask, bitmask, database);
            unconfiguredSubnet.cssClass.push("unconfigured-subnet");
            return unconfiguredSubnet;
        }
        else {
            if ((bitmask == null || bitmask == undefined || Number.isNaN(bitmask)) &&
                subnetmask == null || subnetmask == undefined || subnetmask == "") {
                if (Subnet.mode == "HOST_BASED") {
                    AlertHelper.toastAlert("danger", "exclamation-diamond", "Hosts-based Mode for Subnetting extensions activated:",
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


    setMode(mode: SubnettingMode) {
        Subnet.mode = mode;
    }

    static calculateSubnetNumber(subnet: Subnet, ips: Ipv4Address[], database: Map<string, Ipv4Address>): void {
        let matrix: string[][] = [];
        let matchesCIDR = true;
        ips.forEach(ip => {
            if (!ip.matchesNetworkCidr(subnet)) matchesCIDR = false;
            matrix.push(ip.binaryOctets);
        });
        
        //return if all hosts still match network CIDR
        if(matchesCIDR==true){
            return;
        }

        let matches: [string, string, string, string] = ["", "", "", ""];

        let octet = 0;
        while (octet < 4) {
            let currentMatch = matrix[0][octet];

            for (let i = 1; i < matrix.length; i++) {
                let next = matrix[i][octet];
                currentMatch = AddressingHelper.getLongestMatch(currentMatch, next);

                //exist if no match found
                if (currentMatch == "") {
                    matches[octet] = "";
                    break;
                }
            }
            matches[octet] = currentMatch;

            //continue if more matches possible
            if (currentMatch.length == 8) {
                octet++;
            }
            else {
                break;
            }
        }

        let id: string = "";
        let count: number = 0;
        let binaryMask: string = "";
        let binaryIp: string = "";

        matches.forEach(octet => {
            if (octet != undefined && octet != "") {
                count += octet.length;
                for (let i = 0; i < count; i++) {
                    binaryMask += "1";
                }

                while (octet.length != 8) {
                    octet += "0";
                }
                id += parseInt(octet, 2) + ".";
                binaryIp += octet;
            }
            else {
                id += "0.";
                binaryMask += "00000000";
                binaryIp += "00000000";
            }
        });

        let subnetNum = id.slice(0, -1);
        let networkAddress = Ipv4Address.validateAddress(subnetNum, database);
        while (networkAddress == null || networkAddress == undefined) {
            if (count < 0) {
                AlertHelper.toastAlert("danger", "exclamation-triangle", "No subnet address is valid", "");
                database.delete(subnet.networkAddress.address); //delete the old 
                subnet.bitmask = null;
                subnet.name = "undefined";
                subnet.binarySubnetMask = null;
                subnet.subnetMask = null;
                subnet.networkAddress = null;
                return;
            }
            //if the network address has already been assigned to a device or another network
            count--;
            binaryMask = AddressingHelper.replaceAt(binaryMask, count, "0");
            binaryIp = AddressingHelper.replaceAt(binaryIp, count, "0");
            networkAddress = Ipv4Address.validateAddress(AddressingHelper.binaryToDecimalOctets(binaryIp).join('.'), database);
        }

        subnet.bitmask = count;
        subnet.name = subnetNum + " /" + subnet.bitmask;
        subnet.binarySubnetMask = binaryMask;
        subnet.subnetMask = AddressingHelper.binaryToDecimalOctets(binaryMask).join('.');
        subnet.networkAddress = networkAddress;
    }
}


export type SubnettingMode = "SUBNET_BASED" | "HOST_BASED" | "MANUAL";
