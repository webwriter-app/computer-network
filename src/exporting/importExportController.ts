import { ComputerNetwork } from '../..';
import { Ipv4Address } from '../adressing/Ipv4Address';
import { Ipv6Address } from '../adressing/Ipv6Address';
import { MacAddress } from '../adressing/MacAddress';
import { GraphEdge } from '../components/GraphEdge';
import { GraphNode } from '../components/GraphNode';
import { Subnet } from '../components/logicalNodes/Subnet';
import { AccessPoint, Bridge, Hub, Repeater, Router, Switch } from '../components/physicalNodes/Connector';
import { Host } from '../components/physicalNodes/Host';
import { ConnectionType, PhysicalNode } from '../components/physicalNodes/PhysicalNode';
import { initNetwork } from '../network-config';

export class ImportExportController {

    static reader: FileReader = new FileReader();

    static exportFile(network: ComputerNetwork): void {
        if (!network.networkAvailable) return;
        let data = {};
        let physicalNodes = [];
        let logicalNodes = [];
        let edges = [];

        network._graph.nodes('.physical-node').forEach(e => {
            let i = {};
            i['dataExport'] = e.data();
            i['dataExport']['cssClass'] = e.classes() as string[];
            let portData = [];
            let portLink = [];
            (e.data() as PhysicalNode).portData.forEach((values, port) => {
                let newData = {};
                newData['Name'] = values.get('Name');
                newData['Connection Type'] = values.get('Connection Type');
                newData['MAC'] = values.get('MAC');
                newData['IPv4'] = values.get('IPv4');
                newData['IPv6'] = values.get('IPv6');

                newData['index'] = port;
                portData.push(newData);
            });
            (e.data() as PhysicalNode).portLinkMapping.forEach((data, port) => {
                let newData = {};
                newData['index'] = port;
                newData['linkId'] = data;
                portLink.push(newData);
            });
            i['portData'] = portData;
            i['portLink'] = portLink;
            i['position'] = e.position();
            physicalNodes.push(i);
        });
        network._graph.nodes('.subnet-node').forEach(e => {
            let i = {};
            i['dataExport'] = e.data();
            i['dataExport']['cssClass'] = e.classes() as string[];
            i['position'] = e.position();
            logicalNodes.push(i);
        });
        network._graph.edges().forEach(e => {
            let i = {};
            i['dataExport'] = e.data();
            i['dataExport']['cssClass'] = e.classes() as string[];
            edges.push(i);
        });

        data['physical-nodes'] = physicalNodes;
        data['logical-nodes'] = logicalNodes;
        data['edges'] = edges;

        let myblob = new Blob([JSON.stringify(data)], {
            type: 'application/json'
        });
        let url = URL.createObjectURL(myblob);
        ImportExportController.download(url, 'network-graph-' + Date.now() + '.json');

    }

    static download(path, filename): void {
        // Create a new link
        const anchor = document.createElement('a');
        anchor.href = path;
        anchor.download = filename;

        // Append to the DOM
        document.body.appendChild(anchor);

        // Trigger `click` event
        anchor.click();

        // Remove element from DOM
        document.body.removeChild(anchor);
    };

    static importFile(network: ComputerNetwork): void {

        const fileInput = (network.renderRoot.querySelector('#import-file') as HTMLInputElement);
        const selectedFile = fileInput.files[0];

        ImportExportController.reader.onloadend = async () => {
            initNetwork(network);
            network.ipv4Database = new Map();
            network.macDatabase = new Map();
            network.ipv6Database = new Map();

            let json;
            if (typeof ImportExportController.reader.result === "string") {
                json = JSON.parse(ImportExportController.reader.result);
            }
            json['logical-nodes'].forEach(subnet => {
                let data: Subnet = new Subnet(subnet['dataExport']['color'], subnet['dataExport']['networkAddress']['address'],
                    subnet['dataExport']['subnetMask'], subnet['dataExport']['bitmask'], network.ipv4Database, subnet['dataExport']['id']);

                data.cssClass = subnet['dataExport']['cssClass'];

                network._graph.add({
                    group: 'nodes',
                    data: data,
                    classes: data.cssClass,
                    position: subnet['position']
                });
            });

            json['physical-nodes'].forEach(element => {
                let data: PhysicalNode;
                let cssClasses: string[] = element['dataExport']['cssClass'];
                let nameMap: Map<number, string> = new Map();
                let connectionMap: Map<number, ConnectionType> = new Map();
                let macMap: Map<number, MacAddress> = new Map();
                let ipv4Map: Map<number, Ipv4Address> = new Map();
                let ipv6Map: Map<number, Ipv6Address> = new Map();


                element['portData'].forEach(p => {
                    nameMap.set(p['index'], p["Name"]);
                    connectionMap.set(p['index'], p["Connection Type"]);
                    if (p.hasOwnProperty('MAC')) {
                        let mac: MacAddress = MacAddress.validateAddress(p["MAC"]["address"], network.macDatabase);
                        macMap.set(p['index'], mac);
                        MacAddress.addAddressToDatabase(mac, network.macDatabase, element['dataExport']['id']);
                    }
                    if (p.hasOwnProperty('IPv4')) {
                        let ip4: Ipv4Address = Ipv4Address.validateAddress(p["IPv4"]["address"], network.ipv4Database);
                        ipv4Map.set(p['index'], ip4);
                        Ipv4Address.addAddressToDatabase(ip4, network.ipv4Database, element['dataExport']['id']);
                    }
                    if (p.hasOwnProperty('IPv6')) {
                        let ip6: Ipv6Address = Ipv6Address.validateAddress(p["IPv6"]["address"], network.ipv6Database);
                        ipv6Map.set(p['index'], ip6);
                        Ipv6Address.addAddressToDatabase(ip6, network.ipv6Database, element['dataExport']['id']);
                    }
                });

                if (cssClasses.includes('router-node')) {
                    data = new Router(element['dataExport']['color'], element['dataExport']['numberOfInterfacesOrPorts'], nameMap,
                        connectionMap, macMap, ipv4Map, ipv6Map, element['dataExport']['name'], element['dataExport']['id']);
                }
                else if (cssClasses.includes('repeater-node')) {
                    data = new Repeater(element['dataExport']['color'], connectionMap, element['dataExport']['name'], element['dataExport']['id']);
                }
                else if (cssClasses.includes('hub-node')) {
                    data = new Hub(element['dataExport']['color'], element['dataExport']['numberOfInterfacesOrPorts'],
                        element['dataExport']['name'], element['dataExport']['id']);
                }
                else if (cssClasses.includes('switch-node')) {
                    data = new Switch(element['dataExport']['color'], element['dataExport']['numberOfInterfacesOrPorts'],
                        macMap, element['dataExport']['name'], element['dataExport']['id']);
                }
                else if (cssClasses.includes('bridge-node')) {
                    data = new Bridge(element['dataExport']['color'], connectionMap, macMap, element['dataExport']['name'], element['dataExport']['id']);
                }
                else if (cssClasses.includes('access-point-node')) {
                    data = new AccessPoint(element['dataExport']['color'], element['dataExport']['numberOfInterfacesOrPorts'],
                        macMap, element['dataExport']['name'], element['dataExport']['id']);
                }
                else if (cssClasses.includes('host-node')) {
                    data = new Host(element['dataExport']['color'], element['dataExport']['backgroundPath'].split('/')[7].split('.')[0],
                        element['dataExport']['numberOfInterfacesOrPorts'], nameMap, connectionMap, macMap, ipv4Map, ipv6Map,
                        element['dataExport']['name'], element['dataExport']['id']);
                }

                element['portLink'].forEach(p => {
                    data.portLinkMapping.set(p['index'], p['linkId']);
                })

                data.cssClass = cssClasses;

                if (element['dataExport'].hasOwnProperty('parent')) {
                    data.parent = element['dataExport']['parent'];

                    network._graph.add({
                        group: 'nodes',
                        data: data,
                        classes: data.cssClass,
                        position: element['position'],
                        parent: network._graph.$('#' + element['dataExport']['parent'])
                    });
                }
                else {
                    network._graph.add({
                        group: 'nodes',
                        data: data,
                        classes: element['dataExport']['cssClass'],
                        position: element['position']
                    });
                }
            });

            json['edges'].forEach(edge => {
                let graphEdge: GraphEdge = new GraphEdge(edge['dataExport']['color'],
                    network._graph.$('#' + edge['dataExport']['source']).data() as PhysicalNode,
                    network._graph.$('#' + edge['dataExport']['target']).data() as PhysicalNode);

                GraphEdge.addPorts(graphEdge, edge['dataExport']['inPort'], edge['dataExport']['outPort']);

                graphEdge.cssClass = edge['dataExport']['cssClass'];

                network._graph.add({
                    group: 'edges',
                    data: graphEdge,
                    classes: graphEdge.cssClass
                });
            });

            network._graph.elements().forEach(e => {
                console.log(e.id());
                console.log(e.classes());
            });
        }

        ImportExportController.reader.readAsText(selectedFile, 'UTF-8');
    }

}