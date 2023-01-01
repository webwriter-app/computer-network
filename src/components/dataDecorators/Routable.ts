import { ComputerNetwork } from "../../..";
import { DataHandlingDecorator } from "./DataHandlingDecorator";

export class RoutableDecorator extends DataHandlingDecorator{
    arpTable: Map<string, string>; //(ip, mac)
    routingTable: Map<string, string>; // (CIDR 0.0.0.0 /0, ip(defaultGateway-host)/ interface(router), ?routingProtocol (only for router))

    
    handleDataIn(dataNode: any, previousNode: any, network: ComputerNetwork): void {
        throw new Error("Method not implemented.");
    }

    sendArpRequest: void;
    receiveArpRequest: void;

    sendFrameInSameNetwork: void;
    sendFrameToAnotherNetwork: void;

    addLayer2Header: void;
    removeLayer2Header: void;

    populateArpTable: void;
    populateRoutingTable: void;
}