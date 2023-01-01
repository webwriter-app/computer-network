import { LogicalNode } from "./LogicalNode";


export abstract class Data extends LogicalNode {
    backgroundPath: string;
    layer2header = {
        macSender: "",
        macReceiver: ""
    };
    
    constructor(color: string) {
        super(color);
        this.cssClass.push('data-node');
    }

    static duplicateData(data: Data): Data {
        return null;
    }
}

export class Frame extends Data {
    static counter = 0;
    layer3header = {
        ipSender: "",
        ipReceiver: ""
    };

    //"label": "L2    DATA",
    //"label": "L2 L3 DATA",
    constructor(color: string) {
        super("black "+color);
        this.id = 'subnet' + Frame.counter;
        Frame.counter++;
        this.cssClass.push('frame-node');
        this.backgroundPath = "doc/datagram/2header.png";
    }

    static duplicateData(data: Frame): Frame {
        let newData = new Frame(data.color);
        return newData;
    }
}

export class Packet extends Data {
    static counter = 0;

    //"label": "L2 ARP req",
    //"label": "L2 ARP res",
    constructor(color: string) {
        super(color);
        this.id = 'subnet' + Frame.counter;
        Frame.counter++;
        this.cssClass.push('frame-node');
        this.backgroundPath = "/node_modules/@shoelace-style/shoelace/dist/assets/icons/envelope.svg";
    }

    static duplicateData(data: Packet): Packet {
        let newData = new Packet(data.color);
        return newData;
    }
}