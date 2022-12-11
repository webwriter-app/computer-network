import { Subnet } from "../components/logicalNodes/Subnet";
import { AddressingHelper } from "../utils/Helper";
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

    static getLoopBackAddress(): Ipv4Address{
        //the octets are set as null cause there's no computation needed for loopback address
        return new Ipv4Address("127.0.0.1", null, null, null);
    }


    /**
     * @param ip 
     * @param database of all Ip Addresses
     * @returns IpAddress object of given IP
     */
    static override validateAddress(ip: string, database: Map<string, Ipv4Address>): Ipv4Address {

        if (database.has(ip)) {
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
                return false;
            }
            decimalArray.push(intOctet);
            binArray.push(AddressingHelper.numTo8BitBinary(intOctet));
        });

        let result: Ipv4Address = new Ipv4Address(ip, stringArray, binArray, decimalArray);
        database.set(ip, result);

        return result;
    }

    static generateNewIpForSubnet(database: Map<string, Ipv4Address>, oldIp: Ipv4Address, subnet: Subnet): Ipv4Address {
        //TODO: fix bug here: bug for subnet with cidr = 24

        if (oldIp.matchesNetworkCidr(subnet)) {
            return oldIp;
        }
        let binaryArray = subnet.networkAddress.binaryOctets;

        let newIp = binaryArray.join('').slice(0, subnet.cidr);

        let candidateIp = newIp;

        while (candidateIp.length != 32) {
            candidateIp += AddressingHelper.randomBetween(0, 1);
        }

        let binaryNew = [candidateIp.slice(0, 8), candidateIp.slice(8, 16), candidateIp.slice(16, 24), candidateIp.slice(24, 32)];

        let decimalNew = [parseInt(binaryNew[0], 2), parseInt(binaryNew[1], 2), parseInt(binaryNew[2], 2), parseInt(binaryNew[3], 2)];

        let ip = decimalNew.join('.');


        let n: number = 10;
        //if randomized ip exists, regenerate another IP (set timeout to n iterations)
        while (database.has(ip) && n > 0) {
            candidateIp = newIp;

            while (candidateIp.length != 32) {
                candidateIp += AddressingHelper.randomBetween(0, 1);
            }

            binaryNew = [newIp.slice(0, 8), newIp.slice(8, 16), newIp.slice(16, 24), newIp.slice(24, 32)];
            decimalNew = [parseInt(binaryNew[0], 2), parseInt(binaryNew[1], 2), parseInt(binaryNew[2], 2), parseInt(binaryNew[3], 2)];
            ip = decimalNew.join('.');

            n--;
        }

        database.delete(oldIp.address);

        let result = new Ipv4Address(ip, [decimalNew[0].toString(), decimalNew[1].toString(), decimalNew[2].toString(), decimalNew[3].toString()], binaryNew, decimalNew);

        database.set(ip, result);

        return result;
    }

    matchesNetworkCidr(subnet: Subnet): boolean {
        let binaryCompoundArray = subnet.networkAddress.binaryOctets;

        let binaryNodeArray = this.binaryOctets;

        if (binaryCompoundArray.join().slice(0, subnet.cidr) == binaryNodeArray.join().slice(0, subnet.cidr)) {
            return true;
        }
        return false;
    }

    

}