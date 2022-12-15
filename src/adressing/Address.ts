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

    /**
     * will be overrided with concrete address types
     * 
     * Validate and add new valid address to database
     * @param address 
     * @param database 
     * @returns of type Address if passed address string is valid (valid format + not preexisted in database) | null
     */
    static validateAddress(address: string, database: Map<string, Address>): Address {
        return null;
    }
}