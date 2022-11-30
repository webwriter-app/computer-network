export abstract class Address {
    layer: number;
    address: string;
    regex: RegExp;
    octets: string[];


    constructor(layer: number){
        if(layer<2){
            this.address = "";
        }
        else if(layer==3){
            this.regex = new RegExp("^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$");
        }
        else if(layer==2){
            this.regex = new RegExp("/^([0-9A-Fa-f]{2}[:]){5}([0-9A-Fa-f]{2})$/");
        }
    }

    generateRandomAddress(database: Map<string, Address>): Address{
        return null;
    }

    validateAddress(address: string, database: Map<string, Address>): boolean{
        return false;
    }
}