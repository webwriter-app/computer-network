import { AddressingHelper } from "../utils/AdressingHelper";
import { Address } from "./Address";

export class MacAddress extends Address {
    static regex: RegExp = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

    constructor(macAddress: string, stringOctets: string[]) {
        super(2);
        this.address = macAddress;
        this.octets = stringOctets;
    }

    /**
     * @param database 
     * @returns 
     */
    static generateRandomAddress(database: Map<string, MacAddress>): MacAddress {
        let macArray: string[] = [AddressingHelper.randomHex(), AddressingHelper.randomHex(), AddressingHelper.randomHex(),
        AddressingHelper.randomHex(), AddressingHelper.randomHex(), AddressingHelper.randomHex()];
        let newMac: string = macArray.join(':');

        //get a new randomized MAC address if the generated one exists
        while (database.has(newMac)) {
            let randomAgain = AddressingHelper.randomBetween(0, 5);
            macArray[randomAgain] = AddressingHelper.randomHex();
            newMac = macArray.join(':');
        }

        let result = new MacAddress(newMac, macArray);
        database.set(newMac, result);

        return result;
    }


    static override validateAddress(mac: string, database: Map<string, MacAddress>): MacAddress {
        if (database.has(mac) || mac=="" || mac==undefined || mac==null) {
            return null;
        }

        if (MacAddress.regex.test(mac)) {
            let macArray: string[] = mac.split(':');
            let result = new MacAddress(mac, macArray);
            database.set(mac, result);
            return result;
        }
        else {
            return null;
        }
    }

}