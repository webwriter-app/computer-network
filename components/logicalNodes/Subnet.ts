import { IpAddress } from "../../adressing/addressTypes/IpAddress";
import { AddressingHelper } from "../../utils/Helper";
import { Router } from "../physicalNodes/Connector";

export class Subnet extends LogicalNode {



    cidr: number;
    gateway: Router;
    subnetNum: string;
    subnetMask: string;


    static calculateSubnetNumber(ips: IpAddress[]): string {
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
    
        let id = "";
        let count = 0;
        matches.forEach(octet => {
            if (octet != undefined && octet != "") {
                count += octet.length;
    
                while (octet.length != 8) {
                    octet += "0";
                }
                id += parseInt(octet, 2) + ".";
            }
            else {
                id += "0.";
            }
        });
    
        id = id.slice(0, -1) + " /" + count;
        return id;
    }
}