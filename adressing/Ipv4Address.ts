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
     * @param subnetDatabase of all "worldwide" Subnets
     * @param bitmask only needed if the passed Address is of a subnet
     * @returns a valid Ipv4 address || null
     */
    static validateIpv4Address(ip: string, database: Map<string, Ipv4Address>,
        subnetDatabase: Map<string, Map<number, Ipv4Address>>, bitmask?: number): Ipv4Address {
        let isNetworkId: boolean = (bitmask != null && !Number.isNaN(bitmask) && bitmask != undefined);

        if (ip == null || ip == undefined || ip == "" || database.has(ip)) {
            return null;
        }
        if (subnetDatabase.has(ip)) {
            //if this is a subnet
            if (isNetworkId) {
                if (subnetDatabase.get(ip).has(bitmask)) return null;
            }
            else {
                //the network ID can't be assigned to host
                return null;
            }
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

        let result: Ipv4Address = new Ipv4Address(ip, stringArray, binArray, decimalArray);

        if (isNetworkId) {
            if (parseInt(binArray.join('').slice(bitmask)) * 10 != 0) return null;
            if (!subnetDatabase.has(ip)) {
                subnetDatabase.set(ip, new Map());
            }
            subnetDatabase.get(ip).set(bitmask, result);
            return result;
        }
        else {
            database.set(ip, result);
            return result;
        }
    }

    static generateNewIpGivenSubnet(database: Map<string, Ipv4Address>, subnetDatabase: Map<string, Map<number, Ipv4Address>>,
        oldIp: Ipv4Address, subnet: Subnet): Ipv4Address {

        if (oldIp.matchesNetworkCidr(subnet)) {
            return oldIp;
        }

        let subnetPrefix: string = subnet.networkAddress.binaryOctets.join('').slice(0, subnet.bitmask);
        let candidateIp: string = subnetPrefix;

        let reservedAddresses: string[] = ["127.0.0.1", subnetPrefix.padEnd(32, '1'), subnetPrefix.padEnd(32, '0')];

        while (candidateIp.length != 32) {
            candidateIp += AddressingHelper.randomBetween(0, 1);
        }
        let ip = AddressingHelper.binaryToDecimalOctets(candidateIp).join('.');

        let n: number = 10; //TODO: how many iterations is appropriate?
        //if randomized ip exists/reserved, regenerate another IP (set timeout to n iterations)
        while (n > 0 && (database.has(ip) || subnetDatabase.has(ip) || reservedAddresses.includes(candidateIp))) {
            candidateIp = subnetPrefix;
            while (candidateIp.length != 32) {
                candidateIp += AddressingHelper.randomBetween(0, 1);
            }
            ip = AddressingHelper.binaryToDecimalOctets(candidateIp).join('.');
            n--;
        }

        database.delete(oldIp.address);
        if (database.has(ip) || subnetDatabase.has(ip)) {
            AlertHelper.toastAlert("danger", "exclamation-triangle", "Can't generate an automatic address for this host", "");
            return null;
        }
        let result = this.validateIpv4Address(ip, database, subnetDatabase);
        return result;
    }

    matchesNetworkCidr(subnet: Subnet): boolean {
        if (this.address == "127.0.0.1") return true; //exclude loop-back address
        if (subnet.cssClass.includes('unconfigured-subnet')) return false;

        let binaryCompoundArray = subnet.networkAddress.binaryOctets;
        let binaryNodeArray = this.binaryOctets;
        if (binaryCompoundArray.join('').slice(0, subnet.bitmask) == binaryNodeArray.join('').slice(0, subnet.bitmask)) {
            return true;
        }
        return false;
    }





}