import { ComputerNetwork } from '../../..';
import { Ipv4Address } from '../../adressing/Ipv4Address';
import { AddressingHelper } from '../../utils/AdressingHelper';
import { AlertHelper } from '../../utils/AlertHelper';
import { GraphNode } from '../GraphNode';
import { Router } from '../physicalNodes/Connector';
import { PhysicalNode } from '../physicalNodes/PhysicalNode';
import { LogicalNode } from './LogicalNode';

export class Net extends LogicalNode {
    bitmask: number;
    networkAddress: Ipv4Address;
    netmask: string;
    binaryNetmask: string;

    parent?: string;

    static mode: SubnettingMode = 'MANUAL'; //initial is manual
    //this is updated on drag-and-drop
    gateways: Map<string, number> = new Map(); //(routerId, portIndex)
    currentDefaultGateway: [string, number];

    constructor(
        color: string,
        netAd: string,
        netmask: string,
        bitmask: number,
        database: Map<string, string>,
        id?: string
    ) {
        super(color);

        if (id != null && id != undefined && id != '') {
            this.id = id;
            Net.counter = +id.charAt(id.length - 1);
        } else {
            this.id = 'net' + Net.counter;
        }
        Net.counter++;

        this.cssClass.push('net-node');

        //if bitmask is not null, calculate equivalent netmask
        if (bitmask != null) {
            this.bitmask = bitmask;
            this.binaryNetmask = ''.padStart(bitmask, '1').padEnd(32, '0');
            let derivedDecimalMask: number[] = AddressingHelper.binaryToDecimalOctets(this.binaryNetmask);
            //if the input netmask is valid and doesn't match our bitmask
            this.netmask = derivedDecimalMask.join('.');
            if (netmask != null && derivedDecimalMask.join('.') != netmask) {
                AlertHelper.toastAlert(
                    'warning',
                    'exclamation-diamond',
                    '',
                    'The  netmask you entered <strong>' +
                        netmask +
                        "</strong> doesn't match the bitmask <strong>" +
                        this.bitmask +
                        '</strong>. Derived netmask is: ' +
                        this.netmask
                );
            }
        } else if (netmask != null) {
            //if bitmask is null, netmask!=null --> calculate bitmask from netmask
            this.netmask = netmask;
            this.binaryNetmask = AddressingHelper.decimalStringWithDotToBinary(netmask);
            this.bitmask = (this.binaryNetmask.match(new RegExp('1', 'g')) || []).length;
        }

        let networkId = Ipv4Address.validateAddress(netAd, database, this.bitmask);
        if (networkId == null) {
            if (id == null || id == undefined || id == '') {
                AlertHelper.toastAlert('danger', 'exclamation-diamond', 'Provided network ID is not valid.', '');
            }

            this.cssClass.push('unconfigured-net');
            return;
        }

        this.networkAddress = networkId != null ? networkId : null;
        this.name =
            this.networkAddress != null && this.bitmask != undefined
                ? this.networkAddress.address + ' /' + this.bitmask
                : '';
        Ipv4Address.addAddressToDatabase(this.networkAddress, database, this.id, this.bitmask);
    }

    /**
     * Filter for valid bitmask and netmask
     * @param color
     * @param netAd
     * @param netmask
     * @param bitmask
     * @param database
     * @returns
     */
    static createNet(
        color: string,
        netAd: string,
        netmask: string,
        bitmask: number,
        database: Map<string, string>
    ): Net {
        let bitmaskValid: boolean = !(
            bitmask == null ||
            bitmask == undefined ||
            Number.isNaN(bitmask) ||
            bitmask < 0 ||
            bitmask > 32
        );
        let netmaskValid: boolean = !(
            netmask == null ||
            netmask == undefined ||
            netmask == '' ||
            !AddressingHelper.validateNetMask(netmask)
        );

        if (!bitmaskValid && !netmaskValid) {
            if (Net.mode == 'NET_BASED') {
                AlertHelper.toastAlert(
                    'danger',
                    'exclamation-diamond',
                    'Net-based Mode for CIDR/Subnetting activated:',
                    'Cannot create a net without both bitmask and netmask!'
                );
                return null;
            }
            let unconfiguredNet = new Net(
                color,
                netAd,
                netmaskValid ? netmask : null,
                bitmaskValid ? bitmask : null,
                database
            );
            unconfiguredNet.cssClass.push('unconfigured-net');
            return unconfiguredNet;
        }
        return new Net(color, netAd, netmaskValid ? netmask : null, bitmaskValid ? bitmask : null, database);
    }

    static setMode(mode: SubnettingMode) {
        Net.mode = mode;
    }

    /**
     * Calculate the network CIDR when a host is dragged into the network
     *
     * @param net A network
     * @param ip The Ipv4 Address of a new host
     * @param database Ipv4 database
     */
    static calculateCIDRGivenNewHost(net: Net, ip: Ipv4Address, database: Map<string, string>): void {
        if (Net.mode != 'HOST_BASED' || ip.matchesNetworkCidr(net)) {
            return;
        }
        let count: number;
        let candidateId: string;
        if (!net.cssClass.includes('unconfigured-net')) {
            let oldPrefix = net.networkAddress.binaryOctets.join('').slice(0, net.bitmask);
            let newPrefix = AddressingHelper.getPrefix([oldPrefix, ip.binaryOctets.join('')]);
            count = newPrefix.length;
            candidateId = newPrefix.padEnd(32, '0');
        } else {
            count = 30;
            candidateId = ip.binaryOctets.join('').slice(0, count).padEnd(32, '0');
        }
        this.testPossibleNetAddresses(count, candidateId, net, database);
    }

    private static testPossibleNetAddresses(
        count: number,
        candidateId: string,
        net: Net,
        database: Map<string, string>
    ): void {
        if (Net.mode != 'HOST_BASED') return;
        if (net.networkAddress != null && net.networkAddress != undefined) {
            Ipv4Address.removeAddressFromDatabase(net.networkAddress, database, net.bitmask);
        }

        let candidateIdFormatted = AddressingHelper.binaryToDecimalOctets(candidateId).join('.');
        let candidateAddress = Ipv4Address.validateAddress(candidateIdFormatted, database, count);

        while (count > 0 && candidateAddress == null) {
            candidateId = AddressingHelper.replaceAt(candidateId, count, '0');
            candidateIdFormatted = AddressingHelper.binaryToDecimalOctets(candidateId).join('.');
            candidateAddress = Ipv4Address.validateAddress(candidateIdFormatted, database, count);
            count--;
        }

        //if no net address is available
        if (candidateAddress == null) {
            AlertHelper.toastAlert(
                'warning',
                'exclamation-triangle',
                'Hosts-based mode:',
                'No valid network address can be assigned to this net.'
            );
            net.setNetInfo(null, null, null, null, true, '');
            return;
        } else {
            net.setNetInfo(
                candidateAddress,
                count,
                AddressingHelper.binaryToDecimalOctets(''.padStart(count, '1').padEnd(32, '0')).join('.'),
                ''.padStart(count, '1').padEnd(32, '0'),
                false
            );
            Ipv4Address.addAddressToDatabase(net.networkAddress, database, net.id, net.bitmask);
        }
    }

    /**
     * Calculate the network CIDR when a net is dragged into the net
     *
     * @param supernet A network
     * @param subnet A network that is dragged into the supernet
     * @param database Ipv4 database
     */
    static calculateCIDRGivenNewSubnet(supernet: Net, subnet: Net, database: Map<string, string>): void {
        if (Net.mode != 'HOST_BASED' || supernet.isSupernetOf(subnet) || subnet.cssClass.includes('unconfigured-net'))
            return;

        let count: number;
        let candidateId: string;
        if (!supernet.cssClass.includes('unconfigured-net')) {
            let oldSupernetPrefix = supernet.networkAddress.binaryOctets.join('').slice(0, supernet.bitmask);
            let subnetPrefix = subnet.networkAddress.binaryOctets.join('').slice(0, subnet.bitmask);
            let newPrefix = AddressingHelper.getPrefix([oldSupernetPrefix, subnetPrefix]);
            count = newPrefix.length;
            candidateId = newPrefix.padEnd(32, '0');
        } else {
            let count = subnet.bitmask - 1;
            let subnetPrefix = subnet.networkAddress.binaryOctets.join('').slice(0, subnet.bitmask);
            candidateId = AddressingHelper.replaceAt(subnetPrefix, count, '0').padEnd(32, '0');
        }
        Net.testPossibleNetAddresses(count, candidateId, supernet, database);
    }

    validateNetLocally(hosts: GraphNode[], gateways: Router[], network: ComputerNetwork, noAlert: boolean): boolean {
        if (this.cssClass.includes('unconfigured-net')) return false;
        let allCorrect: boolean = true;
        let unmatchedPairs: Map<string, [string, string]> = new Map(); //("host", [type of host, name])

        let shouldContains: Map<string, string> = new Map(); //(ip, name)
        hosts.forEach((host) => {
            if (host instanceof PhysicalNode && host.layer > 2) {
                host.portData.forEach((data) => {
                    if (!data.get('IPv4').matchesNetworkCidr(this)) {
                        unmatchedPairs.set(data.get('IPv4').address, ['host', host.name]);
                        allCorrect = false;
                    }
                });
            } else if (host instanceof Net) {
                if (!this.isSupernetOf(host) && !host.cssClass.includes('unconfigured-net')) {
                    unmatchedPairs.set(host.name, ['net', host.name]);
                    allCorrect = false;
                }
            }
        });
        gateways.forEach((gateway) => {
            let port = this.gateways.get(gateway.id);
            let ip4 = gateway.portData.get(port).get('IPv4');
            console.log(this, gateway, port, ip4);
            if (!ip4.matchesNetworkCidr(this)) {
                unmatchedPairs.set(ip4.address, ['gateway', gateway.name]);
                allCorrect = false;
            }
        });

        network._graph
            .$('.host-node')
            .orphans()
            .forEach((host) => {
                host.data().portData.forEach((data) => {
                    let ip4 = data.get('IPv4');
                    if (ip4.matchesNetworkCidr(this) && ip4.address != '127.0.0.1') {
                        shouldContains.set(ip4.address, host.data('name'));
                        allCorrect = false;
                    }
                });
            });

        if (allCorrect) return true;

        if (noAlert && !allCorrect) return false;

        let alert: string = '';
        if (unmatchedPairs.size != 0) {
            alert += 'should not contain: <ul>';
            unmatchedPairs.forEach(([type, name], node) => {
                switch (type) {
                    case 'host':
                        alert += '<li>Host ' + name + ': ' + node + '</li>';
                        break;
                    case 'net':
                        alert += '<li>Net ' + node + '</li>';
                        break;
                    case 'gateway':
                        alert += '<li>Gateway ' + name + ': ' + node + '</li>';
                        break;
                }
            });
            alert += '</ul>';
        }
        if (shouldContains.size != 0) {
            alert += 'should contain: <ul>';
            shouldContains.forEach((name, ip) => {
                alert += '<li>Host ' + name + ' with address ' + ip + '</li>';
            });
            alert += '</ul>';
        }

        AlertHelper.toastAlert('warning', 'exclamation-triangle', 'Network ' + this.name, alert);
        return false;
    }

    isSupernetOf(subnet: Net): boolean {
        if (
            subnet == null ||
            this.cssClass.includes('unconfigured-net') ||
            subnet.cssClass.includes('unconfigured-net')
        ) {
            return false;
        }
        if (this.bitmask >= subnet.bitmask) return false;
        return (
            this.networkAddress.binaryOctets.join('').slice(0, this.bitmask) ==
            subnet.networkAddress.binaryOctets.join('').slice(0, this.bitmask)
        );
    }

    private setNetInfo(
        networkAddress: Ipv4Address,
        bitmask: number,
        netmask: string,
        binaryNetmask: string,
        unconfig: boolean,
        name?: string
    ) {
        this.bitmask = bitmask;
        this.networkAddress = networkAddress;
        this.netmask = netmask;
        this.binaryNetmask = binaryNetmask;
        this.name = name != null ? (this.name = name) : this.networkAddress.address + ' /' + this.bitmask;
        if (!unconfig) {
            while (this.cssClass.includes('unconfigured-net')) {
                this.cssClass.splice(this.cssClass.indexOf('unconfigured-net'), 1);
            }
        } else {
            this.cssClass.push('unconfigured-net');
        }
    }

    handleChangesOnNewNetInfo(
        newNetId: string,
        newnetmask: string,
        newBitmask: number,
        network: ComputerNetwork
    ): boolean {
        let bitmaskValid: boolean = !(
            newBitmask == null ||
            newBitmask == undefined ||
            Number.isNaN(newBitmask) ||
            newBitmask < 0 ||
            newBitmask > 32
        );
        let netmaskValid: boolean = !(
            newnetmask == null ||
            newnetmask == undefined ||
            newnetmask == '' ||
            !AddressingHelper.validateNetMask(newnetmask)
        );

        let networkToFree: [string, number] = !this.cssClass.includes('unconfigured-net')
            ? [this.networkAddress.address, this.bitmask]
            : null;

        if (!bitmaskValid && !netmaskValid) return false;

        //if bitmask valid, calculate equivalent net mask
        if (bitmaskValid) {
            let derivedDecimalMask: number[] = AddressingHelper.binaryToDecimalOctets(
                ''.padStart(newBitmask, '1').padEnd(32, '0')
            );
            //if the input netmask is valid and doesn't match our bitmask
            if (netmaskValid && derivedDecimalMask.join('.') != newnetmask) {
                AlertHelper.toastAlert(
                    'warning',
                    'exclamation-diamond',
                    '',
                    'The netmask you entered <strong>' +
                        newnetmask +
                        "</strong> doesn't match the bitmask <strong>" +
                        newBitmask +
                        '</strong>. Derived netmask is: ' +
                        derivedDecimalMask.join('.')
                );
            }
            newnetmask = derivedDecimalMask.join('.');
        } else if (netmaskValid) {
            //if bitmask not valid --> calculate bitmask from netmask
            newBitmask = (AddressingHelper.decimalStringWithDotToBinary(newnetmask).match(new RegExp('1', 'g')) || [])
                .length;
        }

        if (
            this.networkAddress != null &&
            newNetId == this.networkAddress.address &&
            (this.bitmask == undefined || this.bitmask == null || this.bitmask >= newBitmask)
        ) {
            network.ipv4Database.delete(
                AddressingHelper.getBroadcastAddress(this.networkAddress.address, this.bitmask)
            );
            this.setNetInfo(
                this.networkAddress,
                newBitmask,
                newnetmask,
                AddressingHelper.decimalStringWithDotToBinary(newnetmask),
                false
            );
            network.ipv4Database.set(
                AddressingHelper.getBroadcastAddress(this.networkAddress.address, this.bitmask),
                null
            );
            AlertHelper.toastAlert('success', 'check2-circle', 'Your changes have been saved.', '');
            return true;
        }

        let networkId = Ipv4Address.validateAddress(newNetId, network.ipv4Database, newBitmask);

        if (networkId == null) return false;

        switch (Net.mode) {
            case 'HOST_BASED':
                if (
                    this.bitmask >= newBitmask &&
                    this.networkAddress.binaryOctets.join('').slice(0, newBitmask) ==
                        networkId.binaryOctets.join('').slice(0, newBitmask)
                ) {
                    this.setNetInfo(
                        networkId,
                        newBitmask,
                        newnetmask,
                        AddressingHelper.decimalStringWithDotToBinary(newnetmask),
                        false
                    );
                } else {
                    AlertHelper.toastAlert(
                        'danger',
                        'exclamation-triangle',
                        'Host-based mode on:',
                        "New network doesn't extend old network!"
                    );
                    return false;
                }
                break;

            case 'NET_BASED':
                this.setNetInfo(
                    networkId,
                    newBitmask,
                    newnetmask,
                    AddressingHelper.decimalStringWithDotToBinary(newnetmask),
                    false
                );

                network._graph
                    .$('#' + this.id)
                    .children()
                    .forEach((node) => {
                        let nodeData = node.data();
                        if (nodeData instanceof PhysicalNode && nodeData.layer > 2) {
                            nodeData.portData.forEach((data) => {
                                let ip4 = data.get('IPv4');
                                if (ip4 != null && !ip4.matchesNetworkCidr(this)) {
                                    Ipv4Address.removeAddressFromDatabase(ip4, network.ipv4Database);
                                    let newIpv4 = Ipv4Address.generateNewIpGivenNet(network.ipv4Database, ip4, this);
                                    data.set('IPv4', newIpv4);
                                    Ipv4Address.addAddressToDatabase(newIpv4, network.ipv4Database, nodeData.id);
                                }
                            });
                        } else if (nodeData instanceof Net) {
                            //if the subnet doesn't match supernet's CIDR
                            if (!this.isSupernetOf(nodeData)) {
                                network.ipv4Database.delete(nodeData.networkAddress.address); //delete the subnet from database
                                network.ipv4Database.delete(
                                    AddressingHelper.getBroadcastAddress(
                                        nodeData.networkAddress.address,
                                        nodeData.bitmask
                                    )
                                );
                                nodeData.networkAddress = null; //delete the subnet Address
                                node.toggleClass('unconfigured-net', true);
                                nodeData.cssClass.push('unconfigured-net');
                                nodeData.name = '';
                            }
                        }
                    });
                this.gateways.forEach((port, id) => {
                    let gateway = network._graph.$('#' + id);
                    let ip4 = gateway.data('portData').get(port).get('IPv4');
                    if (ip4 != null && !ip4.matchesNetworkCidr(this)) {
                        Ipv4Address.removeAddressFromDatabase(ip4, network.ipv4Database);
                        let newIp4 = Ipv4Address.generateNewIpGivenNet(network.ipv4Database, ip4, this);
                        gateway.data('portData').get(port).set('IPv4', newIp4);
                        Ipv4Address.addAddressToDatabase(newIp4, network.ipv4Database, gateway.id());
                    }
                });
                break;
            case 'MANUAL':
                this.setNetInfo(
                    networkId,
                    newBitmask,
                    newnetmask,
                    AddressingHelper.decimalStringWithDotToBinary(newnetmask),
                    false
                );
                break;
        }

        if (networkToFree != null) {
            network.ipv4Database.delete(AddressingHelper.getBroadcastAddress(networkToFree[0], networkToFree[1]));
            network.ipv4Database.delete(networkToFree[0]);
        }
        AlertHelper.toastAlert('success', 'check2-circle', 'Your changes have been saved.', '');
        return true;
    }
}

export type SubnettingMode = 'NET_BASED' | 'HOST_BASED' | 'MANUAL';
