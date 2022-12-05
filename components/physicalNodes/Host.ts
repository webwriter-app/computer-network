import { IpAddress } from "../../adressing/addressTypes/IpAddress";
import { MacAddress } from "../../adressing/addressTypes/MacAddress";
import { Wifi } from "../logicalNodes/Wifi";
import { PhysicalNode } from "./PhysicalNode";

export class Host extends PhysicalNode {
    ip: IpAddress;
    mac: MacAddress;

    constructor(color: string, ip: IpAddress, mac: MacAddress, mobile: boolean, wifiEnabled?: boolean, name?: string, wifiRange?: Wifi) {
        super(color, 2, wifiEnabled, name, wifiRange);
        this.ip = ip;
        this.mac = mac;
        this.cssClass.push('host-node');
        if (mobile) {
            this.backgroundPath = "/node_modules/@shoelace-style/shoelace/dist/assets/icons/phone.svg";
        }
        else {
            this.backgroundPath = "/node_modules/@shoelace-style/shoelace/dist/assets/icons/pc-display-horizontal.svg";
        }
    }
}