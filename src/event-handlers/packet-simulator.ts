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
import { RoutingData } from '../utils/routingData';
import { Net } from '../components/logicalNodes/Net';

export class PacketSimulator {
    sourceEndPoint: string = '';
    targetEndPoint: string = '';
    sourceIp: string = '127.0.0.1';
    targetIp: string = '127.0.0.1';

    duration: number = 2000;
    aniCounter: number = 0;
    currentAnimations: Map<number, any> = new Map();
    elementsInAnimation: Map<number, any> = new Map();
    isPaused: boolean = false;
    focus: boolean = false;
    viewportAnimations: Map<number, any> = new Map();

    inited: boolean = false;

    private component: NetworkComponent;

    constructor(component: NetworkComponent) {
        this.component = component;
    }

    pauseOrResumeSession(network: NetworkComponent) {
        if (this.isPaused) {
            //resume
            (network.renderRoot.querySelector('#pause-ani') as SlIcon).src =
                '/node_modules/@shoelace-style/shoelace/dist/assets/icons/pause.svg';
            this.currentAnimations.forEach((ani) => {
                if (!ani.playing()) ani.play();
            });
            this.isPaused = false;
        } else {
            //pause
            (network.renderRoot.querySelector('#pause-ani') as SlIcon).src = 'resources/icons/resume.svg';
            this.currentAnimations.forEach((ani) => {
                if (ani.playing()) ani.pause();
            });
            this.isPaused = true;
        }
    }

    setSource(buttonEvent, network: NetworkComponent) {
        let sourceButton = buttonEvent.target;
        sourceButton.loading = true;
        let targetButton = network.renderRoot.querySelector('#setTargetBtn') as SlButton;
        targetButton.disabled = true;

        const self = this;
        network._graph.one('tap', 'node', function (event) {
            self.sourceEndPoint = event.target.id();
            const endpoint = network._graph.$('#' + self.sourceEndPoint);
            self.sourceIp = endpoint.data().portData.get(1).get('IPv4').address;

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
            network.requestUpdate();
        });
    }

    setTarget(buttonEvent, network: NetworkComponent) {
        let targetButton = buttonEvent.target;
        targetButton.loading = true;
        let sourceButton = network.renderRoot.querySelector('#setSourceBtn') as SlButton;
        sourceButton.disabled = true;

        const self = this;
        network._graph.one('tap', 'node', function (event) {
            self.targetEndPoint = event.target.id();
            const endpoint = network._graph.$('#' + self.targetEndPoint);
            self.targetIp = endpoint.data().portData.get(1).get('IPv4').address;

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

    startSession(network: NetworkComponent) {
        if (!this.inited) {
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
            if (!network.subnettingController.validateAllNets(true, network)) {
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
        if (this.sourceEndPoint == '' || this.targetEndPoint == '') {
            AlertHelper.toastAlert(
                'danger',
                'exclamation-triangle',
                '',
                'The sender or receiver is not selected yet, use the <b>Choose sender/ receiver</b> button then <b>click</b> on the graph node.'
            );
            return;
        }

        network._graph.$('node').lock();

        let source = network._graph.$('#' + this.sourceEndPoint);
        let target = network._graph.$('#' + this.targetEndPoint);

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

    initSession(network: NetworkComponent) {
        if (!network.subnettingController.validateAllNets(true, network)) {
            AlertHelper.toastAlert(
                'danger',
                'exclamation-triangle',
                'Your graph is not qualified for this feature:',
                'Please use the <b>Check</b> button of the Subnetting/CIDR feature for more details'
            );
            return;
        }
        if (this.inited) {
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

        this.routeDiscovery(network);

        this.inited = true;
    }

    routeDiscovery(network: NetworkComponent) {
        network._graph.nodes('.gateway-node').forEach((node) => {
            const routingData: {
                address: string;
                nextHop: string;
                bitmask: number;
                interfaceName: string;
                port: number;
            }[] = [];

            const exploreNet = (net: Net, outPort: number) => {
                console.log('exploring routes for ' + node.data('name'), net, outPort);

                const gateways: Map<string, number> = net.gateways;
                gateways.forEach((port, gateway) => {
                    const gatewayNode = network._graph.$('#' + gateway);
                    const gatewayData = gatewayNode.data();
                    const nets = gatewayData.portNetMapping;

                    nets.forEach((net, key) => {
                        if (routingData.find((data) => data.address == net.networkAddress.address) == undefined) {
                            routingData.push({
                                address: net.networkAddress.address,
                                nextHop: gatewayData.portData.get(port).get('IPv4').address,
                                bitmask: net.bitmask,
                                interfaceName: gatewayData.portData.get(port).get('Name'),
                                port: outPort,
                            });
                            exploreNet(net, port);
                        }
                    });
                });
            };

            const portNetMapping: Map<number, Net> = node.data().portNetMapping;
            portNetMapping.forEach((net, key) => {
                routingData.push({
                    address: net.networkAddress.address,
                    nextHop: 'on-link',
                    bitmask: net.bitmask,
                    interfaceName: node.data().portData.get(key).get('Name'),
                    port: key,
                });

                exploreNet(net, key);
            });

            routingData.forEach((data) => {
                node.data().routingTable.set(
                    data.address,
                    new RoutingData(data.address, data.nextHop, data.bitmask, data.interfaceName, data.port)
                );
            });
        });
    }

    initThenDirectSend(sourceNode: any, targetNode: any, data: Data, network: NetworkComponent): void {
        let sourcePosition = sourceNode.position();

        network._graph.add({
            group: 'nodes',
            data: data,
            position: { x: sourcePosition.x, y: sourcePosition.y - 20 },
            classes: data.cssClass,
        });

        this.directSend(sourceNode, targetNode, network._graph.$('#' + data.id), network);
    }

    initMessage(sourceNode: any, data: Data, network: NetworkComponent): void {
        let sourcePosition = sourceNode.position();

        network._graph.add({
            group: 'nodes',
            data: data,
            position: { x: sourcePosition.x, y: sourcePosition.y - 20 },
            classes: data.cssClass,
        });
    }

    findNextHopThenSend(portIn: number, sourceNode: any, dataNode: any, network: NetworkComponent): void {
        let source: DataHandlingDecorator = sourceNode.data();
        let macReceiver: string = dataNode.data().layer2header.macReceiver;

        if (source instanceof SwitchableDecorator) {
            let port: number = source.macAddressTable.get(macReceiver);
            let link: GraphEdge = network._graph.$('#' + source.portLinkMapping.get(port)).data();
            let nextHopId: string = link.source == source.id ? link.target : link.source;
            let nextHop: any = network._graph.$('#' + nextHopId);
            this.directSend(sourceNode, nextHop, dataNode, network);
        } else if (source instanceof RoutableDecorator) {
            let port: number = source.findPortToSend((source as RoutableDecorator).arpTableMacIp.get(macReceiver));
            let link: GraphEdge = network._graph.$('#' + source.portLinkMapping.get(port)).data();
            console.log('source is routable', port, link);
            let nextHopId: string = link.source == source.id ? link.target : link.source;
            let nextHop: any = network._graph.$('#' + nextHopId);
            this.directSend(sourceNode, nextHop, dataNode, network);
        } else if (source instanceof SimpleDecorator) {
            source.flood(dataNode, null, portIn, network);
        }
    }

    directSend(previousNode: any, targetNode: any, dataNode: any, network: NetworkComponent): void {
        let targetPosition = targetNode.position();

        let a = network._graph.$('#' + dataNode.id()).animation(
            {
                position: { x: targetPosition.x, y: targetPosition.y - 20 },
            },
            {
                duration: this.duration,
            }
        );

        let target = targetNode.data();
        let aniId = this.aniCounter;

        this.currentAnimations.set(aniId, a);
        if (!this.elementsInAnimation.has(aniId)) {
            this.elementsInAnimation.set(aniId, previousNode.union(targetNode));
        } else {
            this.elementsInAnimation.set(
                aniId,
                this.elementsInAnimation.get(aniId).union(previousNode).union(targetNode)
            );
        }
        this.aniCounter++;

        //change viewport to contain both source and target in view
        if (this.focus) {
            let eles;
            this.elementsInAnimation.forEach((e) => {
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
            let viewportAniId: number = this.aniCounter;
            this.viewportAnimations.set(viewportAniId, b);
            if (this.viewportAnimations.size > 0) {
                this.viewportAnimations.forEach((ani) => ani.stop());
            }
            b.play()
                .promise()
                .then(() => this.viewportAnimations.delete(viewportAniId));
        }

        a.play()
            .promise()
            .then(() => {
                this.currentAnimations.delete(aniId);
                this.elementsInAnimation.delete(aniId);
                if (target.cssClass.includes('routable-decorated')) {
                    (target as RoutableDecorator).handleDataIn(dataNode, previousNode, network);
                } else if (target.cssClass.includes('switchable-decorated')) {
                    (target as SwitchableDecorator).handleDataIn(dataNode, previousNode, network);
                } else if (target.cssClass.includes('simple-decorated')) {
                    (target as SimpleDecorator).handleDataIn(dataNode, previousNode, network);
                }
            });
    }

    stopSession(network: NetworkComponent) {
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
        this.currentAnimations.forEach((ani) => {
            ani.stop();
            ani._private.target.remove();
        });

        this.currentAnimations = new Map();
        network._graph.nodes('.data-node').forEach((node) => node.remove());
    }
}
export type TableType = 'RoutingTable' | 'ArpTable' | 'MacAddressTable';
