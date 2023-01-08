import { LogicalNode } from "./LogicalNode";


export abstract class Data extends LogicalNode {
    backgroundPath: string;
    layer2header;

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
    layer2header = {
        macSender: "",
        macReceiver: ""
    };
    layer3header = {
        ipSender: "",
        ipReceiver: ""
    };

    constructor(color: string, macSender: string, macReceiver: string, ipv4Sender: string, ipv4Receiver: string) {
        super(color);
        this.id = 'frame' + Frame.counter;
        Frame.counter++;
        this.layer2header.macSender = macSender;
        this.layer2header.macReceiver = macReceiver;
        this.layer3header.ipSender = ipv4Sender;
        this.layer3header.ipReceiver = ipv4Receiver;
        this.cssClass.push('frame-node');
        if (macSender != "" && macReceiver != "") {
            this.backgroundPath = "doc/datagram/2header-3header.png";
            this.name = "L2 L3 DATA";
        }
        else {
            this.backgroundPath = "doc/datagram/3header.png";
            this.name = "L3    DATA";
        }

    }

    static duplicateData(data: Frame): Frame {
        let newData = data;
        newData.id = 'frame' + Frame.counter;
        Frame.counter++;
        return newData;
    }
}

export class Packet extends Data {
    static counter = 0;

    layer2header = {
        macSender: "",
        macReceiver: "",
        ipSender: "",
        ipReceiver: ""
    };

    private constructor(color: string) {
        super(color);
        this.id = 'packet' + Frame.counter;
        Frame.counter++;
        this.cssClass.push('frame-node');
        this.backgroundPath = "doc/datagram/2header.png";
    }

    static duplicateData(data: Packet): Packet {
        let newData = data;
        newData.id = 'packet' + Packet.counter;
        Frame.counter++;
        return newData;
    }

    static createArpRequest(color: string, macSender: string, ipSender: string, ipReceiver: string): Packet {
        let arpReq: Packet = new Packet(color);
        arpReq.layer2header.macSender = macSender;
        arpReq.layer2header.macReceiver = "FF:FF:FF:FF:FF:FF"; //broadcast
        arpReq.layer2header.ipSender = ipSender;
        arpReq.layer2header.ipReceiver = ipReceiver;
        arpReq.name = "L2 ARP req";
        return arpReq;
    }

    static createArpResponse(color: string, macSender: string, macReceiver: string, ipSender: string, ipReceiver: string): Packet {
        let arpRes: Packet = new Packet(color);
        arpRes.layer2header.macSender = macSender;
        arpRes.layer2header.macReceiver = macReceiver;
        arpRes.layer2header.ipSender = ipSender;
        arpRes.layer2header.ipReceiver = ipReceiver;
        arpRes.name = "L2 ARP res";
        return arpRes;
    }
}