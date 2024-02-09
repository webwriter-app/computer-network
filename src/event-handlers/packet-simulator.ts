import { SlButton, SlDetails, SlIcon, SlSelect } from '@shoelace-style/shoelace';
import { NetworkComponent } from '../..';
import { DataHandlingDecorator } from '../components/dataDecorators/DataHandlingDecorator';
import { RoutableDecorator } from '../components/dataDecorators/Routable';
import { SimpleDecorator } from '../components/dataDecorators/SimpleDecorator';
import { SwitchableDecorator } from '../components/dataDecorators/Switchable';
import { GraphEdge } from '../components/GraphEdge';
import { Data, Packet } from '../components/logicalNodes/DataNode';
import { PhysicalNode } from '../components/physicalNodes/PhysicalNode';
import { AlertHelper } from '../utils/AlertHelper';
import { TableHelper } from '../utils/TableHelper';
import { SubnettingController } from './subnetting-controller';

export class PacketSimulator {
    static sourceEndPoint: string = '';
    static targetEndPoint: string = '';
    static sourceIp: string = '127.0.0.1';
    static targetIp: string = '127.0.0.1';

    static duration: number = 2000;
    static aniCounter: number = 0;
    static currentAnimations: Map<number, any> = new Map();
    static elementsInAnimation: Map<number, any> = new Map();
    static isPaused: boolean = false;
    static focus: boolean = false;
    static viewportAnimations: Map<number, any> = new Map();

    static inited: boolean = false;

    static pauseOrResumeSession(network: NetworkComponent) {
        if (PacketSimulator.isPaused) {
            //resume
            (network.renderRoot.querySelector('#pause-ani') as SlIcon).src =
                '/node_modules/@shoelace-style/shoelace/dist/assets/icons/pause.svg';
            PacketSimulator.currentAnimations.forEach((ani) => {
                if (!ani.playing()) ani.play();
            });
            PacketSimulator.isPaused = false;
        } else {
            //pause
            (network.renderRoot.querySelector('#pause-ani') as SlIcon).src = 'resources/icons/resume.svg';
            PacketSimulator.currentAnimations.forEach((ani) => {
                if (ani.playing()) ani.pause();
            });
            PacketSimulator.isPaused = true;
        }
    }

    static setSource(buttonEvent, network: NetworkComponent) {
        let sourceButton = buttonEvent.target;
        sourceButton.loading = true;
        let targetButton = network.renderRoot.querySelector('#setTargetBtn') as SlButton;
        targetButton.disabled = true;
        network._graph.one('tap', 'node', function (event) {
            PacketSimulator.sourceEndPoint = event.target.id();
            sourceButton.loading = false;
            targetButton.disabled = false;
            let selects = network.renderRoot.querySelector('#ip-source-select') as SlSelect;
            selects.innerHTML = '';
            let node = event.target.data();
            if (!(node instanceof PhysicalNode || node instanceof DataHandlingDecorator) || node.layer < 3) {
                AlertHelper.toastAlert(
                    'warning',
                    'exclamation-triangle',
                    '',
                    'Currently the widget only supports host as sender and receiver.'
                );
            } else {
                node.portData.forEach((value, port) => {
                    selects.innerHTML +=
                        `<sl-menu-item value="` +
                        value.get('IPv4').address +
                        `">` +
                        port +
                        `: ` +
                        value.get('IPv4').address +
                        `</sl-menu-item>`;
                });
            }
        });
    }

    static setTarget(buttonEvent, network: NetworkComponent) {
        let targetButton = buttonEvent.target;
        targetButton.loading = true;
        let sourceButton = network.renderRoot.querySelector('#setSourceBtn') as SlButton;
        sourceButton.disabled = true;
        network._graph.one('tap', 'node', function (event) {
            PacketSimulator.targetEndPoint = event.target.id();
            targetButton.loading = false;
            sourceButton.disabled = false;
            let selects = network.renderRoot.querySelector('#ip-target-select') as SlSelect;
            selects.innerHTML = '';
            let node = event.target.data();
            if (!(node instanceof PhysicalNode || node instanceof DataHandlingDecorator) || node.layer < 3) {
                AlertHelper.toastAlert(
                    'warning',
                    'exclamation-triangle',
                    '',
                    'Currently the widget only supports host as sender and receiver.'
                );
            } else {
                node.portData.forEach((value, port) => {
                    selects.innerHTML +=
                        `<sl-menu-item value="` +
                        value.get('IPv4').address +
                        `">` +
                        port +
                        `: ` +
                        value.get('IPv4').address +
                        `</sl-menu-item>\n`;
                });
            }
        });
    }

    static startSession(network: NetworkComponent) {
        if (!PacketSimulator.inited) {
            AlertHelper.toastAlert(
                'danger',
                'exclamation-triangle',
                '',
                'Please <b>Init</b> a session before simulating sending a packet.'
            );
            return;
        }
        let addedNodeAfterInit = network._graph.filter(function (element) {
            return element.hasClass('physical-node') && !element.hasClass('decorated-node');
        });
        if (addedNodeAfterInit.size() > 0) {
            //check graph again
            if (!SubnettingController.validateAllNets(true, network)) {
                AlertHelper.toastAlert(
                    'danger',
                    'exclamation-triangle',
                    'Your graph is not qualified for this feature:',
                    'Please use the <b>Check</b> button of the Subnetting/CIDR feature for more details'
                );
                return;
            }
            //decorate all new added nodes after init
            addedNodeAfterInit.forEach((node) => {
                let nodeData: PhysicalNode = node.data() as PhysicalNode;

                if (node.hasClass('host-node') || node.hasClass('router-node')) {
                    const decorated: RoutableDecorator = new RoutableDecorator(nodeData, network);
                    node._private.data = decorated;
                    node.classes(decorated.cssClass);
                } else if (
                    node.hasClass('switch-node') ||
                    node.hasClass('bridge-node') ||
                    node.hasClass('access-point-node')
                ) {
                    const decorated: SwitchableDecorator = new SwitchableDecorator(nodeData, network);
                    node._private.data = decorated;
                    node.classes(decorated.cssClass);
                } else {
                    const decorated: SimpleDecorator = new SimpleDecorator(nodeData);
                    node._private.data = decorated;
                    node.classes(decorated.cssClass);
                }
            });
        }
        if (PacketSimulator.sourceEndPoint == '' || PacketSimulator.targetEndPoint == '') {
            AlertHelper.toastAlert(
                'danger',
                'exclamation-triangle',
                '',
                'The sender or receiver is not selected yet, use the <b>Choose sender/ receiver</b> button then <b>click</b> on the graph node.'
            );
            return;
        }

        network._graph.$('node').lock();

        let source = network._graph.$('#' + PacketSimulator.sourceEndPoint);
        let target = network._graph.$('#' + PacketSimulator.targetEndPoint);

        if ((source.data() as PhysicalNode).layer < 3 || (target.data() as PhysicalNode).layer < 3) {
            AlertHelper.toastAlert(
                'warning',
                'exclamation-triangle',
                '',
                'The widget currently only support sending Parcel between layer 3 components'
            );
        }

        //create data packet
        let data: Packet = new Packet(network.currentColor, '', '', this.sourceIp, this.targetIp);
        let sourceNode = network._graph.$('#' + this.sourceEndPoint);
        let sender: RoutableDecorator = sourceNode.data() as RoutableDecorator;

        let sourcePosition = sourceNode.position();
        network._graph.add({
            group: 'nodes',
            data: data,
            position: { x: sourcePosition.x, y: sourcePosition.y - 20 },
            classes: data.cssClass,
        });
        if (this.sourceIp == '127.0.0.1' || this.targetIp == '127.0.0.1') {
            AlertHelper.toastAlert(
                'success',
                'check2-all',
                '',
                'Your packet finished sending with the <b>loop-back address</b>.'
            );
            return;
        }
        sender.sendData(network._graph.$('#' + data.id), network, sourceNode);
    }

    static initSession(network: NetworkComponent) {
        if (!SubnettingController.validateAllNets(true, network)) {
            AlertHelper.toastAlert(
                'danger',
                'exclamation-triangle',
                'Your graph is not qualified for this feature:',
                'Please use the <b>Check</b> button of the Subnetting/CIDR feature for more details'
            );
            return;
        }
        if (PacketSimulator.inited) {
            (network.renderRoot.querySelector('#tables-for-packet-simulator') as SlDetails).innerHTML = '';
            //init tables again
            network._graph.nodes('.routable-decorated').forEach((node) => {
                let nodeData: RoutableDecorator = node.data() as RoutableDecorator;
                TableHelper.initTable(nodeData.id, 'ArpTable', network);
                TableHelper.initTable(nodeData.id, 'RoutingTable', network);
            });

            network._graph.nodes('.switchable-decorated').forEach((node) => {
                let nodeData: SwitchableDecorator = node.data() as SwitchableDecorator;
                TableHelper.initTable(nodeData.id, 'MacAddressTable', network);
            });
        }

        //decorate all physical nodes
        network._graph.nodes('.physical-node').forEach((node) => {
            let nodeData: PhysicalNode = node.data() as PhysicalNode;
            if (!node.hasClass('decorated-node') && node.hasClass('physical-node')) {
                if (node.hasClass('host-node') || node.hasClass('router-node')) {
                    const decorated: RoutableDecorator = new RoutableDecorator(nodeData, network);
                    node._private.data = decorated;
                    node.classes(decorated.cssClass);
                } else if (
                    node.hasClass('switch-node') ||
                    node.hasClass('bridge-node') ||
                    node.hasClass('access-point-node')
                ) {
                    const decorated: SwitchableDecorator = new SwitchableDecorator(nodeData, network);
                    node._private.data = decorated;
                    node.classes(decorated.cssClass);
                } else {
                    const decorated: SimpleDecorator = new SimpleDecorator(nodeData);
                    node._private.data = decorated;
                    node.classes(decorated.cssClass);
                }
            }
        });
        PacketSimulator.inited = true;
    }

    static initThenDirectSend(sourceNode: any, targetNode: any, data: Data, network: NetworkComponent): void {
        let sourcePosition = sourceNode.position();

        network._graph.add({
            group: 'nodes',
            data: data,
            position: { x: sourcePosition.x, y: sourcePosition.y - 20 },
            classes: data.cssClass,
        });

        this.directSend(sourceNode, targetNode, network._graph.$('#' + data.id), network);
    }

    static initMessage(sourceNode: any, data: Data, network: NetworkComponent): void {
        let sourcePosition = sourceNode.position();

        network._graph.add({
            group: 'nodes',
            data: data,
            position: { x: sourcePosition.x, y: sourcePosition.y - 20 },
            classes: data.cssClass,
        });
    }

    static findNextHopThenSend(portIn: number, sourceNode: any, dataNode: any, network: NetworkComponent): void {
        let source: DataHandlingDecorator = sourceNode.data();
        let macReceiver: string = dataNode.data().layer2header.macReceiver;

        if (source instanceof SwitchableDecorator) {
            let port: number = source.macAddressTable.get(macReceiver);
            let link: GraphEdge = network._graph.$('#' + source.portLinkMapping.get(port)).data();
            let nextHopId: string = link.source == source.id ? link.target : link.source;
            let nextHop: any = network._graph.$('#' + nextHopId);
            PacketSimulator.directSend(sourceNode, nextHop, dataNode, network);
        } else if (source instanceof RoutableDecorator) {
            let port: number = source.findPortToSend((source as RoutableDecorator).arpTableMacIp.get(macReceiver));
            let link: GraphEdge = network._graph.$('#' + source.portLinkMapping.get(port)).data();
            let nextHopId: string = link.source == source.id ? link.target : link.source;
            let nextHop: any = network._graph.$('#' + nextHopId);
            PacketSimulator.directSend(sourceNode, nextHop, dataNode, network);
        } else if (source instanceof SimpleDecorator) {
            source.flood(dataNode, null, portIn, network);
        }
    }

    static directSend(previousNode: any, targetNode: any, dataNode: any, network: NetworkComponent): void {
        let targetPosition = targetNode.position();

        let a = network._graph.$('#' + dataNode.id()).animation(
            {
                position: { x: targetPosition.x, y: targetPosition.y - 20 },
            },
            {
                duration: PacketSimulator.duration,
            }
        );

        let target = targetNode.data();
        let aniId = PacketSimulator.aniCounter;

        PacketSimulator.currentAnimations.set(aniId, a);
        if (!PacketSimulator.elementsInAnimation.has(aniId)) {
            PacketSimulator.elementsInAnimation.set(aniId, previousNode.union(targetNode));
        } else {
            PacketSimulator.elementsInAnimation.set(
                aniId,
                PacketSimulator.elementsInAnimation.get(aniId).union(previousNode).union(targetNode)
            );
        }
        PacketSimulator.aniCounter++;

        //change viewport to contain both source and target in view
        if (PacketSimulator.focus) {
            let eles;
            PacketSimulator.elementsInAnimation.forEach((e) => {
                if (eles == undefined) {
                    eles = e;
                } else {
                    eles = eles.union(e);
                }
            });
            let b = network._graph.animation({
                fit: {
                    eles: eles,
                    padding: 80,
                },
            });
            let viewportAniId: number = PacketSimulator.aniCounter;
            PacketSimulator.viewportAnimations.set(viewportAniId, b);
            if (PacketSimulator.viewportAnimations.size > 0) {
                PacketSimulator.viewportAnimations.forEach((ani) => ani.stop());
            }
            b.play()
                .promise()
                .then(() => PacketSimulator.viewportAnimations.delete(viewportAniId));
        }

        a.play()
            .promise()
            .then(() => {
                PacketSimulator.currentAnimations.delete(aniId);
                PacketSimulator.elementsInAnimation.delete(aniId);
                if (target.cssClass.includes('routable-decorated')) {
                    (target as RoutableDecorator).handleDataIn(dataNode, previousNode, network);
                } else if (target.cssClass.includes('switchable-decorated')) {
                    (target as SwitchableDecorator).handleDataIn(dataNode, previousNode, network);
                } else if (target.cssClass.includes('simple-decorated')) {
                    (target as SimpleDecorator).handleDataIn(dataNode, previousNode, network);
                }
            });
    }

    static stopSession(network: NetworkComponent) {
        (network.renderRoot.querySelector('#tables-for-packet-simulator') as SlDetails).innerHTML = '';

        network._graph.nodes('.switchable-decorated').forEach((node) => {
            let nodeData: SwitchableDecorator = node.data();
            nodeData.macAddressTable = new Map();
        });

        network._graph.nodes('.routable-decorated').forEach((node) => {
            let nodeData: RoutableDecorator = node.data();
            nodeData.routingTable = new Map();
            nodeData.arpTableIpMac = new Map();
            nodeData.arpTableMacIp = new Map();
        });

        //stop all animations and remove related packet/frame nodes
        PacketSimulator.currentAnimations.forEach((ani) => {
            ani.stop();
            ani._private.target.remove();
        });

        PacketSimulator.currentAnimations = new Map();
        network._graph.nodes('.data-node').forEach((node) => node.remove());
    }
}
export type TableType = 'RoutingTable' | 'ArpTable' | 'MacAddressTable';
