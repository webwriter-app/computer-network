import { ComputerNetwork } from '../..';
import { Ipv4Address } from '../adressing/Ipv4Address';
import { Ipv6Address } from '../adressing/Ipv6Address';
import { MacAddress } from '../adressing/MacAddress';
import { GraphEdge } from '../components/GraphEdge';
import { GraphNode } from '../components/GraphNode';
import { Subnet } from '../components/logicalNodes/Subnet';
import { AccessPoint, Bridge, Hub, Repeater, Router, Switch } from '../components/physicalNodes/Connector';
import { Host } from '../components/physicalNodes/Host';
import { PhysicalNode } from '../components/physicalNodes/PhysicalNode';
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
            console.log(e.data());
            let i = {};
            i['dataExport'] = e.data();
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
            console.log(e.data());
            let i = {};
            i['dataExport'] = e.data();
            i['position'] = e.position();
            logicalNodes.push(i);
        });
        network._graph.edges().forEach(e => {
            console.log(e.data());
            let i = {};
            i['dataExport'] = e.data();
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

            let json;
            if (typeof ImportExportController.reader.result === "string") {
                json = JSON.parse(ImportExportController.reader.result);
            }
            json['logical-nodes'].forEach(subnet => {
                let data: Subnet = subnet['dataExport'] as Subnet;
                data.networkAddress = Ipv4Address.validateAddress(subnet['dataExport']['networkAddress']['address'],
                    network.ipv4Database, subnet['dataExport']['bitmask']);
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
                if (cssClasses.includes('router-node')) {
                    data = element['dataExport'] as Router;
                }
                else if (cssClasses.includes('repeater-node')) {
                    data = element['dataExport'] as Repeater;
                }
                else if (cssClasses.includes('hub-node')) {
                    data = element['dataExport'] as Hub;
                }
                else if (cssClasses.includes('switch-node')) {
                    data = element['dataExport'] as Switch;
                }
                else if (cssClasses.includes('bridge-node')) {
                    data = element['dataExport'] as Bridge;
                }
                else if (cssClasses.includes('access-point-node')) {
                    data = element['dataExport'] as AccessPoint;
                }
                else if (cssClasses.includes('host-node')) {
                    data = element['dataExport'] as Host;
                }
                data.portData = new Map();

                element['portData'].forEach(p => {
                    data.portData.set(p['index'], new Map<string, any>([
                        ["Name", p["Name"]],
                        ["Connection Type", p["Connection Type"]],
                        ["MAC", MacAddress.validateAddress(p["MAC"]["address"], network.macDatabase)],
                        ["IPv4", Ipv4Address.validateAddress(p["IPv4"]["address"], network.ipv4Database)],
                        ["IPv6", Ipv6Address.validateAddress(p["IPv6"]["address"], network.ipv6Database)],
                    ]));
                });

                data.portLinkMapping = new Map();
                element['portLink'].forEach(p => {
                    data.portLinkMapping.set(p['index'], p['linkId']);
                })

                console.log(data);

                if (element.hasOwnProperty('parent')) {
                    network._graph.add({
                        group: 'nodes',
                        data: data,
                        classes: data.cssClass,
                        position: element['position'],
                        //parent: element['parent']
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

            await this.delay(10000);

            json['edges'].forEach(edge => {
                let graphEdge = edge['dataExport'] as GraphEdge;
                graphEdge.from = network._graph.$('#' + edge.source).data() as PhysicalNode;
                graphEdge.to = network._graph.$('#' + edge.target).data() as PhysicalNode;
                console.log(network._graph.$('#' + edge.source).data());
                console.log(network._graph.$('#' + edge.source).data() as PhysicalNode);
                network._graph.add({
                    group: 'edges',
                    data: graphEdge,
                    classes: graphEdge.cssClass
                });
            });

            network.networkAvailable = true;
        }

        ImportExportController.reader.readAsText(selectedFile, 'UTF-8');
    }

    static delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

}