import { IpAddress } from "../../adressing/IpAddress";
import { AddressingHelper } from "../../utils/Helper";
import { GraphNode } from "../GraphNode";
import { Router } from "../physicalNodes/Connector";
import { LogicalNode } from "./LogicalNode";

export class Subnet extends LogicalNode {
    cidr: number;
    gateways: Router[];
    networkAddress: IpAddress;
    subnetMask: string;
    //this is updated on drag-and-drop
    devices: GraphNode[] = [];
    mode: SubnettingMode;

    //3 last attributes --> subnet-based mode of subnetting extensions
    constructor(color: string, mode: SubnettingMode, networkAddress?: string, database?: Map<string, IpAddress>, cidr?: number) {
        super(color);
        this.id = 'subnet' + Subnet.counter;
        Subnet.counter++;
        this.cssClass.push('subnet-node');
        this.mode = mode;

        //subnet-based mode
        if (mode == SubnettingMode.SUBNET_BASED) {
            this.networkAddress = IpAddress.validateAddress(networkAddress, database);
            this.cidr = this.networkAddress != null ? cidr : null;
        }


        // this.devices = children;

        // let hostAddresses: IpAddress[] = [];
        // children.forEach(child => {
        //     if (child instanceof Subnet) {
        //         hostAddresses.push(child.networkAddress);
        //     }
        //     else if (child instanceof PhysicalNode){
        //         switch (child.layer) {
        //             case 3: hostAddresses = hostAddresses.concat((child as PhysicalNode).getIpAddresses());
        //                 break;
        //             default:
        //                 break;
        //         }
        //     }
        // });
        // this.calculateSubnetNumber(hostAddresses, database);
    }

    addHostToSubnet(host: GraphNode, database: Map<string, IpAddress>) {

    }


    calculateSubnetNumber(ips: IpAddress[], database: Map<string, IpAddress>): void {
        let matrix: string[][] = [];
        ips.forEach(ip => {
            matrix.push(ip.binaryOctets);
        });

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
        let mask: string = "";
        let binaryIp: string = "";

        matches.forEach(octet => {
            if (octet != undefined && octet != "") {
                count += octet.length;
                for (let i = 0; i < count; i++) {
                    mask += "1";
                }

                while (octet.length != 8) {
                    octet += "0";
                }
                id += parseInt(octet, 2) + ".";
                binaryIp += octet;
            }
            else {
                id += "0.";
                mask += "00000000";
                binaryIp += "00000000";
            }
        });

        let subnetNum = id.slice(0, -1);
        let networkAddress = IpAddress.validateAddress(subnetNum, database);
        while (networkAddress == null || networkAddress == undefined) {
            if (count == 0) {
                // let alert = new SlAlert;
                // alert.variant = "danger";
                // alert.closable = true;
                // alert.innerHTML = `
                //             <sl-icon slot="icon" name="exclamation-octagon"></sl-icon>
                //             <strong>No valid subnet can be created</strong>`
                // alert.toast();
                return;
            }
            //if the network address has already been assigned to a device or another network
            count--;
            mask = AddressingHelper.replaceAt(mask, count, "0");
            binaryIp = AddressingHelper.replaceAt(binaryIp, count, "0");
            let decimalOctets: number[] = [];
            let binaryOctets: string[] = [binaryIp.slice(0, 8), binaryIp.slice(8, 16), binaryIp.slice(16, 24), binaryIp.slice(24, 32)];
            binaryOctets.forEach(octet => decimalOctets.push(parseInt(octet, 2)));
            networkAddress = IpAddress.validateAddress(decimalOctets.join('.'), database);
        }

        this.cidr = count;
        this.name = subnetNum + " /" + this.cidr;
        this.subnetMask = mask;
        this.networkAddress = networkAddress;
    }
}


export enum SubnettingMode {
    SUBNET_BASED, HOST_BASED, MANUAL,
}