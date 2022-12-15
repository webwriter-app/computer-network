export abstract class Address {
    layer: number;
    address: string;
    octets: string[];


    constructor(layer: number){
        this.layer = layer;
        if(layer<2){
            this.address = "";
        }
    }

    static validateAddress(address: string, database: Map<string, Address>): Address {
        return null;
    }
}