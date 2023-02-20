import { SlButton, SlDetails, SlIcon, SlSelect } from "@shoelace-style/shoelace";
import { ComputerNetwork } from "../..";
import { DataHandlingDecorator } from "../components/dataDecorators/DataHandlingDecorator";
import { RoutableDecorator } from "../components/dataDecorators/Routable";
import { SimpleDecorator } from "../components/dataDecorators/SimpleDecorator";
import { SwitchableDecorator } from "../components/dataDecorators/Switchable";
import { GraphEdge } from "../components/GraphEdge";
import { Data, Packet } from "../components/logicalNodes/DataNode";
import { PhysicalNode } from "../components/physicalNodes/PhysicalNode";
import { AlertHelper } from "../utils/AlertHelper";
import { TableHelper } from "../utils/TableHelper";

export class PacketSimulator {

    static sourceEndPoint: string = "";
    static targetEndPoint: string = "";
    static sourceIp: string = "";
    static targetIp: string = "";

    static duration: number = 2000;
    static aniCounter: number = 0;
    static currentAnimations: Map<number, any> = new Map();
    static elementsInAnimation: Map<number, any> = new Map();
    static isPaused: boolean = false;
    static focus: boolean = false;

    static inited: boolean = false;


    static pauseOrResumeSession(network: ComputerNetwork) {
        if (PacketSimulator.isPaused) {
            //resume
            (network.renderRoot.querySelector('#pause-ani') as SlIcon).src = "/node_modules/@shoelace-style/shoelace/dist/assets/icons/pause.svg";
            PacketSimulator.currentAnimations.forEach((ani) => {
                if (!ani.playing()) ani.play();
            });
            PacketSimulator.isPaused = false;
        }
        else {
            //pause
            (network.renderRoot.querySelector('#pause-ani') as SlIcon).src = "resources/icons/resume.svg";
            PacketSimulator.currentAnimations.forEach((ani) => {
                if (ani.playing()) ani.pause();
            });
            PacketSimulator.isPaused = true;
        }
    }

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
            let node = event.target.data();
            if (!(node instanceof PhysicalNode || node instanceof DataHandlingDecorator) || node.layer < 3) {
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
            let node = event.target.data();
            if (!(node instanceof PhysicalNode || node instanceof DataHandlingDecorator) || node.layer < 3) {
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
            AlertHelper.toastAlert('warning', 'exclamation-triangle', "", "The widget currently only support sending Parcel between layer 3 components");
        }

        //create data packet
        let data: Packet = new Packet(network.currentColor, "", "", this.sourceIp, this.targetIp);
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

    static initSession(network: ComputerNetwork) {
        if (!PacketSimulator.inited) {
            //decorate all physical nodes
            network._graph.nodes('.physical-node').forEach(node => {
                let nodeData: PhysicalNode = node.data() as PhysicalNode;
                if (!node.hasClass('decorated-node') && node.hasClass('physical-node')) {
                    if (node.hasClass('host-node') || node.hasClass('router-node')) {
                        const decorated: RoutableDecorator = new RoutableDecorator(nodeData, network);
                        node._private.data = decorated;
                        node.classes(decorated.cssClass);
                    }
                    else if (node.hasClass('switch-node') || node.hasClass('bridge-node')) {
                        const decorated: SwitchableDecorator = new SwitchableDecorator(nodeData, network);
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
            PacketSimulator.inited = true;
        }
        else {
            (network.renderRoot.querySelector('#tables-for-packet-simulator') as SlDetails).innerHTML = "";
            //init tables again
            network._graph.nodes('.routable-decorated').forEach(node => {
                let nodeData: RoutableDecorator = node.data() as RoutableDecorator;
                PacketSimulator.initTable(nodeData.id, 'ArpTable', network);
                PacketSimulator.initTable(nodeData.id, 'RoutingTable', network);
            });

            network._graph.nodes('.switchable-decorated').forEach(node => {
                let nodeData: SwitchableDecorator = node.data() as SwitchableDecorator;
                PacketSimulator.initTable(nodeData.id, 'MacAddressTable', network);
            });
        }
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
            let port: number = source.findPortToSend((source as RoutableDecorator).arpTableMacIp.get(macReceiver));
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
        let aniId = PacketSimulator.aniCounter;

        PacketSimulator.currentAnimations.set(aniId, a);
        if (!PacketSimulator.elementsInAnimation.has(aniId)) {
            PacketSimulator.elementsInAnimation.set(aniId, previousNode.union(targetNode));
        }
        else {
            PacketSimulator.elementsInAnimation.set(aniId, PacketSimulator.elementsInAnimation.get(aniId).union(previousNode).union(targetNode));
        }
        PacketSimulator.aniCounter++;

        //change viewport to contain both source and target in view
        if (PacketSimulator.focus) {
            let eles;
            PacketSimulator.elementsInAnimation.forEach(e => {
                if (eles == undefined) {
                    eles = e;
                }
                else {
                    eles = eles.union(e);
                }
            });
            network._graph.animate({
                fit: {
                    eles: eles,
                    padding: 80,
                }
            });
        }

        a.play().promise().then(() => {
            PacketSimulator.currentAnimations.delete(aniId);
            PacketSimulator.elementsInAnimation.delete(aniId);
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

    static initTable(nodeId: string, tableType: TableType, network: ComputerNetwork): void {
        let label = "";
        let tableId = "";
        let tableCols = "";
        switch (tableType) {
            case 'ArpTable':
                label = "ARP Table";
                tableId = "arp-table-" + nodeId;
                tableCols = "<tr><td></td><td>IP</td><td>MAC</td></tr>";
                break;

            case 'RoutingTable':
                label = "Routing Table"
                tableId = "routing-table-" + nodeId;
                tableCols = "<tr><td></td><td>ID</td><td>Gateway</td><td>Bitmask</td><td>Port</td></tr>";
                break;

            case 'MacAddressTable':
                label = "Mac Address Table";
                tableId = "mac-address-table-" + nodeId;
                tableCols = "<tr><td></td><td>Port</td><td>MAC</td></tr>";
                break;
        }

        let detail = (network.renderRoot.querySelector('#details-for-' + tableId) as SlDetails);
        if (detail == null) {
            detail = new SlDetails();
            detail.id = '#details-for-' + tableId;
            detail.summary = label + " of " + nodeId;
            detail.className = "details-for-table";
            detail.open = true;
            (network.renderRoot.querySelector('#tables-for-packet-simulator') as SlDetails).appendChild(detail);
        }
        switch (tableType) {
            case 'ArpTable':
                detail.innerHTML += `<table class="fixedArp" id="arp-table-` + nodeId + `">` + tableCols + `</table></div><br/>`;
                break;
            case 'RoutingTable':
                detail.innerHTML += `<table class="fixedRout" id="routing-table-` + nodeId + `">` + tableCols + `</table></div><br/>`;
                break;
            case 'MacAddressTable':
                detail.innerHTML += `<table class="fixedMac" id="mac-address-table-` + nodeId + `">` + tableCols + `</table></div><br/>`;
                break;
        }

        let addButton = new SlButton();
        addButton.size = "small";
        addButton.innerHTML = "Add";
        addButton.addEventListener('click', () => TableHelper.addRow(tableId, tableType, network));

        let removeButton = new SlButton();
        removeButton.size = "small";
        removeButton.innerHTML = "Remove";
        removeButton.addEventListener('click', () => TableHelper.deleteRow(tableId, network));

        let saveButton = new SlButton();
        saveButton.size = "small";
        saveButton.innerHTML = "Save";
        saveButton.addEventListener('click', () => TableHelper.updateTable(tableId, tableType, network));

        detail.append(addButton);
        detail.append(removeButton);
        detail.append(saveButton);
    }

    static stopSession(network: ComputerNetwork) {
        (network.renderRoot.querySelector('#tables-for-packet-simulator') as SlDetails).innerHTML = "";

        network._graph.nodes('switchable-decorated').forEach(node => {
            let nodeData: SwitchableDecorator = node.data();
            nodeData.macAddressTable = new Map();
        });

        network._graph.nodes('routable-decorated').forEach(node => {
            let nodeData: RoutableDecorator = node.data();
            nodeData.routingTable = new Map();
            nodeData.arpTableIpMac = new Map();
            nodeData.arpTableMacIp = new Map();
        });

        //stop all animations and remove related packet/frame nodes
        PacketSimulator.currentAnimations.forEach(ani => {
            ani.stop();
            ani._private.target.remove();
        });

        PacketSimulator.currentAnimations = new Map();
        network._graph.nodes('.data-node').forEach(node => node.remove());
    }
}

export type TableType = "RoutingTable" | "ArpTable" | "MacAddressTable"