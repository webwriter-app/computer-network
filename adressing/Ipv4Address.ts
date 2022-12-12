import { Subnet } from "../components/logicalNodes/Subnet";
import { AddressingHelper } from "../utils/AdressingHelper";
import { AlertHelper } from "../utils/AlertHelper";
import { Address } from "./Address";

export class Ipv4Address extends Address {
    binaryOctets: string[];
    decimalOctets: number[];

    constructor(ipAddress: string, stringOctets: string[], binaryOctets: string[], decimalOctets: number[]) {
        super(3);
        this.address = ipAddress;
        this.octets = stringOctets;
        this.binaryOctets = binaryOctets;
        this.decimalOctets = decimalOctets;
    }

    static getLoopBackAddress(): Ipv4Address {
        //the octets are set as null cause there's no computation needed for loopback address
        return new Ipv4Address("127.0.0.1", null, null, null);
    }



    /**
     * 
     * @param ip an Ipv4 address (string) that's not validate
     * @param database of all "worldwide" addresses
     * @param bitmask only needed if the passed Address is of a subnet
     * @returns a valid Ipv4 address || null
     */
    static override validateAddress(ip: string, database: Map<string, Ipv4Address>, bitmask?: number): Ipv4Address {

        if (ip == null || ip == undefined || ip == "" || database.has(ip)) {
            return null;
        }
        let stringArray = ip.split('.');

        if (stringArray.length != 4) {
            return null;
        }

        let decimalArray: number[] = [];
        let binArray: string[] = [];

        stringArray.forEach(octet => {
            let intOctet = parseInt(octet);
            if (intOctet == undefined || intOctet < 0 || intOctet > 255) {
                return null;
            }
            decimalArray.push(intOctet);
            binArray.push(AddressingHelper.numTo8BitBinary(intOctet));
        });

        //check in case this is a network ID
        if (bitmask != null && !Number.isNaN(bitmask) && bitmask != undefined) {
            if (parseInt(binArray.join().slice(32 - bitmask, 32)) * 10 != 0) return null;
        }

        let result: Ipv4Address = new Ipv4Address(ip, stringArray, binArray, decimalArray);
        database.set(ip, result);

        return result;
    }

    static generateNewIpGivenSubnet(database: Map<string, Ipv4Address>, oldIp: Ipv4Address, subnet: Subnet): Ipv4Address {
        //TODO: fix bug here: bug for subnet with cidr = 24

        if (oldIp.matchesNetworkCidr(subnet)) {
            return oldIp;
        }
        let binaryArray = subnet.networkAddress.binaryOctets;

        let subnetPrefix = binaryArray.join('').slice(0, subnet.bitmask); //get the subnet-prefix

        let candidateIp = subnetPrefix;

        while (candidateIp.length != 32) {
            candidateIp += AddressingHelper.randomBetween(0, 1);
        }

        let ip = AddressingHelper.binaryToDecimalOctets(candidateIp).join('.');

        let n: number = 10;
        //if randomized ip exists, regenerate another IP (set timeout to n iterations)
        while (database.has(ip) && n > 0) {
            candidateIp = subnetPrefix;

            while (candidateIp.length != 32) {
                candidateIp += AddressingHelper.randomBetween(0, 1);
            }
            ip = AddressingHelper.binaryToDecimalOctets(candidateIp).join('.');
            n--;
        }

        if (database.has(ip)) AlertHelper.toastAlert("danger", "exclamation-triangle", "Can't generate an automatic address for this host", "");

        database.delete(oldIp.address);

        let result = this.validateAddress(ip, database);
        return result;
    }

    matchesNetworkCidr(subnet: Subnet): boolean {
        let binaryCompoundArray = subnet.networkAddress.binaryOctets;

        let binaryNodeArray = this.binaryOctets;

        if (binaryCompoundArray.join().slice(0, subnet.bitmask) == binaryNodeArray.join().slice(0, subnet.bitmask)) {
            return true;
        }
        return false;
    }



}