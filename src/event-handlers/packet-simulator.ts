import { SlButton, SlDetails, SlSelect } from "@shoelace-style/shoelace";
import { ComputerNetwork } from "../..";
import { DataHandlingDecorator } from "../components/dataDecorators/DataHandlingDecorator";
import { RoutableDecorator } from "../components/dataDecorators/Routable";
import { SimpleDecorator } from "../components/dataDecorators/SimpleDecorator";
import { SwitchableDecorator } from "../components/dataDecorators/Switchable";
import { GraphEdge } from "../components/GraphEdge";
import { Data, Frame, Packet } from "../components/logicalNodes/DataNode";
import { PhysicalNode } from "../components/physicalNodes/PhysicalNode";
import { AlertHelper } from "../utils/AlertHelper";

export class PacketSimulator {

    static sourceEndPoint: string = "";
    static targetEndPoint: string = "";
    static sourceIp: string = "";
    static targetIp: string = "";
    static duration: number = 0;



    static setSource(buttonEvent, network: ComputerNetwork) {
        let sourceButton = buttonEvent.target;
        sourceButton.loading = true;
        let targetButton = network.renderRoot.querySelector('#setTargetBtn') as SlButton;
        targetButton.disabled = true;
        network._graph.one('tap', 'node', function (event) {
            PacketSimulator.sourceEndPoint = event.target.id();
            sourceButton.loading = false;
            targetButton.disabled = false;
            let selects = network.renderRoot.querySelector('#ip-source-select') as SlSelect;
            selects.innerHTML = "";
            let node = event.target.data() as PhysicalNode;
            if (node.layer < 3) {
                AlertHelper.toastAlert('warning', 'exclamation-triangle', "", "Currently the widget only supports host as sender and receiver.");
            }
            else {
                node.portData.forEach((value, port) => {
                    selects.innerHTML += `<sl-menu-item value="` + value.get('IPv4').address + `">` + port + `: ` + value.get('IPv4').address + `</sl-menu-item>`;
                });
            }
        });
    }

    static setTarget(buttonEvent, network: ComputerNetwork) {
        let targetButton = buttonEvent.target;
        targetButton.loading = true;
        let sourceButton = network.renderRoot.querySelector('#setSourceBtn') as SlButton;
        sourceButton.disabled = true;
        network._graph.one('tap', 'node', function (event) {
            PacketSimulator.targetEndPoint = event.target.id();
            targetButton.loading = false;
            sourceButton.disabled = false;
            let selects = network.renderRoot.querySelector('#ip-target-select') as SlSelect;
            selects.innerHTML = "";
            let node = event.target.data() as PhysicalNode;
            if (node.layer < 3) {
                AlertHelper.toastAlert('warning', 'exclamation-triangle', "", "Currently the widget only supports host as sender and receiver.");
            }
            else {
                node.portData.forEach((value, port) => {
                    selects.innerHTML += `<sl-menu-item value="` + value.get('IPv4').address + `">` + port + `: ` + value.get('IPv4').address + `</sl-menu-item>\n`;
                });
                
            }
        });
    }

    static startSession(network: ComputerNetwork) {
        network._graph.$('node').lock();

        let source = network._graph.$('#' + PacketSimulator.sourceEndPoint);
        let target = network._graph.$('#' + PacketSimulator.targetEndPoint);

        if ((source.data() as PhysicalNode).layer < 3 || (target.data() as PhysicalNode).layer < 3) {
            AlertHelper.toastAlert('warning', 'exclamation-triangle', "", "The widget currently only support sending frame between layer 3 components");
        }

        network._graph.nodes('physical-node').forEach(node => {
            let nodeData: PhysicalNode = node.data() as PhysicalNode;
            if (!node.hasClass('decorated-node') && node.hasClass('physical-node')) {
                if (node.hasClass('host-node') || node.hasClass('router-node')) {
                    const decorated: RoutableDecorator = new RoutableDecorator(nodeData);
                    decorated.initiateRoutingTable(network);
                    node._private.data = decorated;
                    node.classes(decorated.cssClass);
                }
                else if (node.hasClass('switch-node') || node.hasClass('bridge-node')) {
                    const decorated: SwitchableDecorator = new SwitchableDecorator(nodeData);
                    node._private.data = decorated;
                    node.classes(decorated.cssClass);
                }
                else {
                    const decorated: SimpleDecorator = new SimpleDecorator(nodeData);
                    node._private.data = decorated;
                    node.classes(decorated.cssClass);
                }
            }
        });


        let data: Frame = new Frame(network.currentColor, "", "", this.sourceIp, this.targetIp);
        let sourceNode = network._graph.$('#' + this.sourceEndPoint);
        let sender: RoutableDecorator = sourceNode.data() as RoutableDecorator;

        let sourcePosition = sourceNode.position();

        network._graph.add({
            group: 'nodes',
            data: data,
            position: { x: sourcePosition.x, y: sourcePosition.y - 20 },
            classes: data.cssClass,
        });
        sender.sendData(network._graph.$('#' + data.id), network, sourceNode);

    }

    static initThenDirectSend(sourceNode: any, targetNode: any, data: Data, network: ComputerNetwork): void {
        let sourcePosition = sourceNode.position();

        network._graph.add({
            group: 'nodes',
            data: data,
            position: { x: sourcePosition.x, y: sourcePosition.y - 20 },
            classes: data.cssClass,
        });

        this.directSend(sourceNode, targetNode, network._graph.$('#' + data.id), network);
    }

    static initMessage(sourceNode: any, data: Data, network: ComputerNetwork): void {
        let sourcePosition = sourceNode.position();

        network._graph.add({
            group: 'nodes',
            data: data,
            position: { x: sourcePosition.x, y: sourcePosition.y - 20 },
            classes: data.cssClass,
        });
    }

    static findNextHopThenSend(portIn: number, sourceNode: any, dataNode: any, network: ComputerNetwork): void {
        let source: DataHandlingDecorator = sourceNode.data();
        let macReceiver: string = dataNode.data().layer2header.macReceiver;

        if (source instanceof SwitchableDecorator) {
            let port: number = source.macAddressTable.get(macReceiver);
            let link: GraphEdge = network._graph.$('#' + source.portLinkMapping.get(port)).data();
            let nextHopId: string = link.source == source.id ? link.target : link.source;
            let nextHop: any = network._graph.$('#' + nextHopId);
            PacketSimulator.directSend(sourceNode, nextHop, dataNode, network);
        }
        else if (source instanceof RoutableDecorator) {
            console.log(source);
            console.log(macReceiver);
            console.log((source as RoutableDecorator).arpTableMacIp.get(macReceiver));
            let port: number = source.findPortToSend((source as RoutableDecorator).arpTableMacIp.get(macReceiver));
            console.log(port);
            let link: GraphEdge = network._graph.$('#' + source.portLinkMapping.get(port)).data();
            let nextHopId: string = link.source == source.id ? link.target : link.source;
            let nextHop: any = network._graph.$('#' + nextHopId);
            PacketSimulator.directSend(sourceNode, nextHop, dataNode, network);
        }
        else if (source instanceof SimpleDecorator) {
            source.flood(dataNode, null, portIn, network);
        }
    }

    static directSend(previousNode: any, targetNode: any, dataNode: any, network: ComputerNetwork): void {
        let targetPosition = targetNode.position();

        let a = network._graph.$('#' + dataNode.id())
            .animation({
                position: { x: targetPosition.x, y: targetPosition.y - 20 },
            }, {
                duration: PacketSimulator.duration
            });

        let target = targetNode.data();

        a.play().promise().then(() => {
            if (target.cssClass.includes('routable-decorated')) {
                (target as RoutableDecorator).handleDataIn(dataNode, previousNode, network);
            }
            else if (target.cssClass.includes('switchable-decorated')) {
                (target as SwitchableDecorator).handleDataIn(dataNode, previousNode, network);
            }
            else if (target.cssClass.includes('simple-decorated')) {
                (target as SimpleDecorator).handleDataIn(dataNode, previousNode, network);
            }
        });

    }

    static addOrUpdateTable(nodeId: string, tableType: TableType, tableData: any, network: ComputerNetwork): void {
        let tableRows = "";
        let label = "";
        let tableId = "";
        switch (tableType) {
            case 'ArpTable':
                if (!(tableData instanceof Map<string, string>)) return;
                label = "ARP Table -" + nodeId;
                tableId = "arp-table-" + nodeId;
                tableRows += `<caption>` + label + `</caption>`;
                (tableData as Map<string, string>).forEach((mac, ip) => {
                    tableRows += `<tr><td>` + ip + `</td><td>` + mac + `</td></tr>`
                });
                break;

            case 'RoutingTable':
                if (!(tableData instanceof Map<string, [string, number, string]>)) return;
                label = "Routing Table -" + nodeId;
                tableId = "routing-table-" + nodeId;
                tableRows += `<table id="` + tableId + `"><caption>` + label + `</caption>`;
                (tableData as Map<string, [string, number, string]>).forEach(([interfaceName, _port, connection], mask) => {
                    tableRows += `<tr><td>` + interfaceName + `</td><td>` + mask + `</td><td>` + connection + `</td></tr>`
                });
                break;

            case 'MacAddressTable':
                if (!(tableData instanceof Map<string, number>)) return;
                label = "Mac Address Table -" + nodeId;
                tableId = "mac-address-table-" + nodeId;
                tableRows += `<table id="` + tableId + `"><caption>` + label + `</caption>`;
                (tableData as Map<string, number>).forEach((port, mac) => {
                    tableRows += `<tr><td>` + port + `</td><td>` + mac + `</td></tr>`
                });
                break;
        }

        let detail = (network.renderRoot.querySelector('#tables-for-' + nodeId) as SlDetails);
        if (detail == null) {
            detail = new SlDetails();
            detail.id = 'tables-for-' + nodeId;
            detail.summary = label;
            switch (tableType) {
                case 'ArpTable': case 'RoutingTable':
                    detail.innerHTML = `<table id="arp-table-` + nodeId + `"></table>` + `<table id="routing-table-` + nodeId + `"></table>`;
                    break;
                case 'MacAddressTable':
                    detail.innerHTML = `<table id="mac-address-table-` + nodeId + `"></table>`;
                    break;
            }
            (network.renderRoot.querySelector('#tables-for-packet-simulator') as SlDetails).appendChild(detail);
        }

        let tableElement = (network.renderRoot.querySelector('#' + tableId) as HTMLElement);
        tableElement.innerHTML = tableRows;
    }

    static resetDatabase(network: ComputerNetwork) {

    }
}

type TableType = "RoutingTable" | "ArpTable" | "MacAddressTable"