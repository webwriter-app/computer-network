import { AddressingHelper } from "../../utils/Helper";
import { Address } from "./Address";

export class MacAddress extends Address {

    constructor(macAddress: string, stringOctets: string[]){
        super(2);
        this.address = macAddress;
        this.octets = stringOctets;
    }

    /**
     * * TODO: chua nhet vao database
     * @param database 
     * @returns 
     */
    override generateRandomAddress(database: Map<string, MacAddress>): MacAddress {
            let macArray: string[] = [AddressingHelper.randomHex(), AddressingHelper.randomHex(), AddressingHelper.randomHex(), 
                AddressingHelper.randomHex(), AddressingHelper.randomHex(), AddressingHelper.randomHex()];
            let newMac: string = macArray.join(':');
        
            //get a new randomized MAC address if the generated one exists
            while (database.has(newMac)) {
                let randomAgain = AddressingHelper.randomBetween(0, 5);
                macArray[randomAgain] = AddressingHelper.randomHex();
                newMac = macArray.join(':');
            }

            return new MacAddress(newMac, macArray);
        }
    


    override validateAddress(mac: string, database: Map<string, MacAddress>): boolean{
        if (database.has(mac)) {
            return false;
        }

        if (this.regex.test(mac)) {
            return true;
        }
        else {
            return false;
        }
    }

}