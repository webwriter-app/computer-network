import { Address } from "./Address";

export class Ipv6Address extends Address {
    //further development possible
    constructor(address: string){
        super(3);
        this.address = address;
    }

    static getLoopBackAddress(): Ipv6Address{
        return new Ipv6Address("0:0:0:0:0:0:0:1");
    }
}