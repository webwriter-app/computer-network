import { IpAddress } from "../../adressing/addressTypes/IpAddress";
import { MacAddress } from "../../adressing/addressTypes/MacAddress";
import { PhysicalNode } from "./PhysicalNode";

export abstract class Host extends PhysicalNode {
    ip: IpAddress;
    mac: MacAddress;
}

export class Computer extends Host {


}

export class Mobile extends Host {


}