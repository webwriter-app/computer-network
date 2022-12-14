import { Address } from "./Address";

export class Ipv6Address extends Address {
    static regex: RegExp = /^(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}$/;

    constructor(address: string, stringOctets: string[]){
        super(3);
        this.address = address;
    }

    static getLoopBackAddress(): Ipv6Address{
        return new Ipv6Address("0:0:0:0:0:0:0:1", ["0","0","0","0","0","0","0","1"]);
    }

    static override validateAddress(address: string, database: Map<string, Address>): Address {
        if (database.has(address) || address=="" || address==undefined || address==null) {
            return null;
        }

        if (Ipv6Address.regex.test(address)) {
            let octets: string[] = address.split(':');
            let result = new Ipv6Address(address, octets);
            database.set(address, result);
            return result;
        }
        else {
            return null;
        }
    }
}