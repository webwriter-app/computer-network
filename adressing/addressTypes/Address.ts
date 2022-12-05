export abstract class Address {
    layer: number;
    address: string;
    static regex: RegExp;
    octets: string[];


    constructor(layer: number){
        if(layer<2){
            this.address = "";
        }
    }

    static generateRandomAddress(database: Map<string, Address>): Address {
        return null;
    }

    static validateAddress(address: string, database: Map<string, Address>): Address {
        return null;
    }
}