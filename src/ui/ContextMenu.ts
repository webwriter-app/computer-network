import { SlChangeEvent, SlColorPicker, SlDialog, SlInput, SlSelect } from '@shoelace-style/shoelace';
import { names } from 'konva/types/Node';
import { html, TemplateResult } from 'lit';
import { NetworkComponent } from 'src';
import { Ipv4Address } from '../adressing/Ipv4Address';
import { Ipv6Address } from '../adressing/Ipv6Address';
import { MacAddress } from '../adressing/MacAddress';
import { Net } from '../components/logicalNodes/Net';
import { Router } from '../components/physicalNodes/Connector';
import { GraphNodeFactory } from '../event-handlers/component-manipulation';
import { biAlphabet, biDashSquare, biEthernet, biPCICardNetwork, biPlusSquare, biTrash, biWifi } from '../styles/icons';
import { EdgeController } from '../event-handlers/edge-controller';

import { styleMap } from 'lit/directives/style-map.js';
import { GraphEdge } from '../components/GraphEdge';
import { SubnettingController } from '../event-handlers/subnetting-controller';
import { AlertHelper } from '../utils/AlertHelper';
import { AddressingHelper } from '../utils/AdressingHelper';
import { Host } from 'src/components/physicalNodes/Host';

export function contextMenuTemplate(this: NetworkComponent): TemplateResult {
    const type = this.selectedObject?.isNode()
        ? this.selectedObject.data('cssClass').includes('net-node')
            ? 'network'
            : 'node'
        : 'edge';

    return html`
        ${type === 'network' ? networkContextDialogTemplate.bind(this)() : ''}
        ${type === 'node' ? nodeContextDialogTemplate.bind(this)() : ''}
        ${type === 'edge' ? edgeContextDialogTemplate.bind(this)() : ''}

        <div id="contextMenu" class="contextmenu" @contextmenu=${(e: Event) => e.preventDefault()} style="display:none">
            ${type === 'network' ? networkContextMenuTemplate.bind(this)() : ''}
            ${type === 'node' ? nodeContextMenuTemplate.bind(this)() : ''}
            ${type === 'edge' ? edgeContextMenuTemplate.bind(this)() : ''}
        </div>
    `;
}

function nodeContextMenuTemplate(this: NetworkComponent): TemplateResult {
    return html`
        <div class="contextmenu__header">
            <sl-input
                type="text"
                placeholder="Name"
                @sl-input=${(e: SlChangeEvent) => {
                    this.selectedObject?.data('name', (e.target as HTMLInputElement).value);
                }}
                value=${this.selectedObject?.data('name')}
            >
                <span slot="prefix">${biAlphabet}</span>
            </sl-input>
            <sl-button
                class="contextmenu__delete"
                circle
                @click="${() => {
                    GraphNodeFactory.removeNode(this.selectedObject, this);
                    this.selectedObject.remove();
                    this.contextMenu.style.display = 'none';
                }}"
                >${biTrash}</sl-button
            >
        </div>
        <hr />
        <sl-button
            @click="${() => {
                (this.shadowRoot?.querySelector('#nodeContextDialog') as SlDialog).show();
            }}"
            >Change Port Config</sl-button
        >
        <sl-color-picker
            id="color-picker"
            swatches=${this.colors.join('; ')}
            @sl-change="${(e: SlChangeEvent) => {
                const color = (e.target as SlColorPicker).value;
                this.selectedObject?.data('color', color);
            }}"
            value=${this.selectedObject?.data('color')}
        ></sl-color-picker>
        ${this.selectedObject.data().constructor.name == '_Host' &&
        this.selectedObject.isChild() &&
        this.selectedObject.parent().data('gateways')?.size > 0
            ? html`
                  <sl-select
                      label="Default Gateway"
                      @sl-change=${(e: Event) => {
                          const key = (e.target as HTMLSelectElement).value;
                          const port = this.selectedObject.parent().data('gateways')?.get(key);
                          this.selectedObject.data('defaultGateway', [key, port]);
                      }}
                      value=${this.selectedObject.data('defaultGateway')
                          ? this.selectedObject.data('defaultGateway')[0]
                          : ''}
                  >
                      ${Array.from(this.selectedObject.parent().data('gateways')?.keys()).map((key) => {
                          return html`<sl-option value=${key as string}>${key}</sl-option>`;
                      })}
                  </sl-select>
              `
            : ''}
    `;
}

function edgeContextMenuTemplate(this: NetworkComponent): TemplateResult {
    return html`
        <div class="contextmenu__header">
            <sl-button
                class="contextmenu__delete"
                circle
                @click="${() => {
                    EdgeController.removeConnection(this.selectedObject.data(), this._graph);
                    this.selectedObject.remove();
                    this.contextMenu.style.display = 'none';
                }}"
                >${biTrash}</sl-button
            >
        </div>
        <hr />
        <sl-button
            @click="${() => {
                (this.shadowRoot?.querySelector('#edgeContextDialog') as SlDialog).show();
            }}"
            >Define Interfaces</sl-button
        >
        <sl-color-picker
            id="color-picker"
            swatches=${this.colors.join('; ')}
            @sl-change="${(e: SlChangeEvent) => {
                const color = (e.target as SlColorPicker).value;
                this.selectedObject?.data('color', color);
            }}"
            value=${this.selectedObject?.data('color')}
        ></sl-color-picker>
    `;
}

function networkContextMenuTemplate(this: NetworkComponent): TemplateResult {
    return html`
        <div class="contextmenu__header">
            <sl-button
                class="contextmenu__delete"
                circle
                @click="${() => {
                    GraphNodeFactory.removeNode(this.selectedObject, this);
                    this.selectedObject.remove();
                    this.contextMenu.style.display = 'none';
                }}"
                >${biTrash}</sl-button
            >
        </div>
        <hr />
        <sl-button
            @click="${() => {
                (this.shadowRoot?.querySelector('#networkContextDialog') as SlDialog).show();
            }}"
            >Define Network</sl-button
        >
        <sl-color-picker
            id="color-picker"
            swatches=${this.colors.join('; ')}
            @sl-change="${(e: SlChangeEvent) => {
                const color = (e.target as SlColorPicker).value;
                this.selectedObject?.data('color', color);
            }}"
            value=${this.selectedObject?.data('color')}
        ></sl-color-picker>
        ${this.selectedObject?.data('gateways')?.size > 1
            ? html`
                  Default Gateway:
                  <sl-select
                      @sl-change=${(e: SlChangeEvent) => {
                          const gateway = (e.target as SlSelect).value;
                          const port = this.selectedObject?.data('gateways')?.get(gateway);
                          this.selectedObject?.data('currentDefaultGateway', [gateway, port]);
                      }}
                      value=${this.selectedObject?.data('currentDefaultGateway')
                          ? this.selectedObject?.data('currentDefaultGateway')[0]
                          : ''}
                  >
                      ${Array.from(this.selectedObject?.data('gateways')?.keys()).map((key) => {
                          return html`<sl-option value=${key as string}>${key}</sl-option>`;
                      })}
                  </sl-select>
              `
            : this.selectedObject?.data('gateways')?.size > 0
            ? html` Default Gateway: ${this.selectedObject?.data('currentDefaultGateway')} `
            : ''}
    `;
}

function nodeContextDialogTemplate(this: NetworkComponent) {
    const node: any = this.selectedObject;
    const ports: Map<string, Map<string, any>> = node?.data('portData');
    const columns = ports?.size > 0 ? Array.from(Array.from(ports?.values())[0].keys()) : [];

    return html`
        <sl-dialog
            id="nodeContextDialog"
            label=${'Details of the ports ' + node?.data('name')}
            @sl-hide=${() => this.requestUpdate()}
        >
            ${ports?.size > 0
                ? html`
                      <table>
                          <tr>
                              <th>Index</th>
                              ${columns.includes('Name') ? html`<th>Name</th>` : ''}
                              ${columns.includes('Connection Type') ? html`<th>Connection Type</th>` : ''}
                              ${columns.includes('MAC') ? html`<th>MAC</th>` : ''}
                              ${columns.includes('IPv4') ? html`<th>IPv4</th>` : ''}
                              ${columns.includes('IPv6') ? html`<th>IPv6</th>` : ''}
                              <th></th>
                          </tr>
                          ${Array.from(ports?.entries()).map((port, index) => {
                              return html`
                                  <tr>
                                      <td>${index}</td>
                                      ${columns.includes('Name')
                                          ? html`<td>
                                                <sl-input
                                                    value=${port[1].get('Name')}
                                                    @sl-input=${(e: SlChangeEvent) => {
                                                        const v = (e.target as SlInput).value;
                                                        const portData = node.data('portData');
                                                        portData.get(port[0]).set('Name', v);
                                                        node.data('portData', portData);
                                                    }}
                                                ></sl-input>
                                            </td>`
                                          : ''}
                                      ${columns.includes('Connection Type')
                                          ? html`<td>
                                                <sl-select
                                                    @sl-change=${handlePortTypeChangeGenerator
                                                        .bind(this)(port[0])
                                                        .bind(this)}
                                                    value=${port[1].get('Connection Type')}
                                                    ?disabled=${isPortConnected.bind(this)(node, port[0])}
                                                >
                                                    <sl-option value="ethernet">Ethernet</sl-option>
                                                    <sl-option value="wireless">Wireless</sl-option>
                                                </sl-select>
                                            </td>`
                                          : ''}
                                      ${columns.includes('MAC')
                                          ? html`<td>
                                                <sl-input
                                                    value=${port[1].get('MAC')?.address}
                                                    @sl-input=${handleMacAddressChangeGenerator
                                                        .bind(this)(port[0])
                                                        .bind(this)}
                                                ></sl-input>
                                            </td>`
                                          : ''}
                                      ${columns.includes('IPv4')
                                          ? html`<td>
                                                <sl-input
                                                    value=${port[1].get('IPv4')?.address}
                                                    @sl-input=${handleIPv4AddressChangeGenerator
                                                        .bind(this)(port[0])
                                                        .bind(this)}
                                                ></sl-input>
                                            </td>`
                                          : ''}
                                      ${columns.includes('IPv6')
                                          ? html`<td>
                                                <sl-input
                                                    value=${port[1].get('IPv6')?.address}
                                                    @sl-input=${handleIPv6AddressChangeGenerator
                                                        .bind(this)(port[0])
                                                        .bind(this)}
                                                ></sl-input>
                                            </td>`
                                          : ''}
                                      <td>
                                          <sl-button
                                              circle
                                              @click=${() => {
                                                  removePort.bind(this)(node, port[0]);
                                              }}
                                              >${biDashSquare}</sl-button
                                          >
                                      </td>
                                  </tr>
                              `;
                          })}
                      </table>
                  `
                : html`<p>No port available.</p>`}
            <sl-button @click="${addPort.bind(this, node)}">
                <span slot="prefix">${biPlusSquare}</span>
                Add Port</sl-button
            >
        </sl-dialog>
    `;
}

function edgeContextDialogTemplate(this: NetworkComponent) {
    const edge: any = this.selectedObject;

    if (!edge) return html``;

    const source: any = edge.source();
    const target: any = edge.target();

    let availableSourcePorts: number[] = [];
    let availableTargetPorts: number[] = [];

    source.data('portLinkMapping').forEach((link: any, port: any) => {
        if (link == null || link == undefined || link == '' || link === edge.data('id')) {
            availableSourcePorts.push(port);
        }
    });
    target.data('portLinkMapping').forEach((link: any, port: any) => {
        if (link == null || link == undefined || link == '' || link === edge.data('id')) {
            availableTargetPorts.push(port);
        }
    });

    return html`
        <sl-dialog
            id="edgeContextDialog"
            label=${'Details of the connection between ' + source.data('name') + ' and ' + target.data('name')}
            @sl-hide=${() => {
                this.requestUpdate();
            }}
        >
            <div class="contextmenu__edgedisplay">
                <div class="contextmenu__edgedisplay__node">
                    <div
                        class="contextmenu__edgedisplay__nodeImage"
                        style=${styleMap({
                            backgroundColor: source.data('color'),
                            backgroundImage: `url("${source.data('backgroundPath')}")`,
                        })}
                    ></div>
                    <div class="contextmenu__edgedisplay__nodeTitle">${source.data('name')}</div>
                </div>
                <div class="contextmenu__edgedisplay__edge">
                    <sl-select
                        style="align-self: flex-start"
                        placeholder="Source Port"
                        @sl-change=${(e: SlChangeEvent) => {
                            const port = parseInt((e.target as SlSelect).value as string);
                            if (Number.isNaN(port)) {
                                this.selectedPorts['source'].connectionType = null;
                                this.selectedPorts['source'].port = null;
                            } else {
                                const cv = source.data('portData').get(port).get('Connection Type');
                                this.selectedPorts['source'].connectionType = cv;
                                this.selectedPorts['source'].port = port;
                            }
                            if (this.selectedPorts['source'].port && this.selectedPorts['target'].port)
                                updatePortLink.bind(this)();
                            this.requestUpdate();
                        }}
                        value=${edge.data('inPort')?.toString() || ''}
                        clearable
                    >
                        <span slot="prefix">${biPCICardNetwork}</span>
                        ${availableSourcePorts.map(
                            (port) => html`
                                <sl-option
                                    value=${port}
                                    ?disabled=${this.selectedPorts['target'].connectionType &&
                                    this.selectedPorts['target'].connectionType !==
                                        source.data('portData').get(port).get('Connection Type')}
                                    ?selected=${port === edge.data('inPort')}
                                >
                                    <span slot="prefix"
                                        >${source.data('portData').get(port).get('Connection Type') === 'ethernet'
                                            ? biEthernet
                                            : biWifi}</span
                                    >
                                    <span slot="suffix">
                                        ${`MAC: ${source.data('portData').get(port).get('MAC').address}`}
                                    </span>
                                    ${source.data('portData').get(port).get('Name') || port}
                                </sl-option>
                            `
                        )}
                    </sl-select>
                    <hr style=${`border-top: 3px dashed ${edge.data('color')}`} />
                    <sl-select
                        style="align-self: flex-end"
                        placeholder="Target Port"
                        @sl-change=${(e: SlChangeEvent) => {
                            const port = parseInt((e.target as SlSelect).value as string);
                            if (Number.isNaN(port)) {
                                this.selectedPorts['target'].connectionType = null;
                                this.selectedPorts['target'].port = null;
                            } else {
                                const cv = target.data('portData').get(port).get('Connection Type');
                                this.selectedPorts['target'].connectionType = cv;
                                this.selectedPorts['target'].port = port;
                            }
                            if (this.selectedPorts['source'].port && this.selectedPorts['target'].port)
                                updatePortLink.bind(this)();
                            this.requestUpdate();
                        }}
                        value=${edge.data('outPort')?.toString() || ''}
                        clearable
                    >
                        <span slot="prefix">${biEthernet}</span>
                        ${availableTargetPorts.map(
                            (port) => html`
                                <sl-option
                                    value=${port}
                                    ?disabled=${this.selectedPorts['source'].connectionType &&
                                    this.selectedPorts['source'].connectionType !==
                                        target.data('portData').get(port).get('Connection Type')}
                                    ?selected=${port === edge.data('outPort')}
                                >
                                    <span slot="prefix"
                                        >${target.data('portData').get(port).get('Connection Type') === 'ethernet'
                                            ? biEthernet
                                            : biWifi}</span
                                    >
                                    <span slot="suffix">
                                        ${`MAC: ${target.data('portData').get(port).get('MAC').address}`}
                                    </span>
                                    ${target.data('portData').get(port).get('Name') || port}
                                </sl-option>
                            `
                        )}
                    </sl-select>
                </div>
                <div class="contextmenu__edgedisplay__node">
                    <div
                        class="contextmenu__edgedisplay__nodeImage"
                        style=${styleMap({
                            backgroundColor: target.data('color'),
                            backgroundImage: `url("${target.data('backgroundPath')}")`,
                        })}
                    ></div>
                    <div class="contextmenu__edgedisplay__nodeTitle">${target.data('name')}</div>
                </div>
            </div>
        </sl-dialog>
    `;
}

function networkContextDialogTemplate(this: NetworkComponent) {
    const network: any = this.selectedObject;
    const subnet: any = network.data('subnet');

    return html`
        <sl-dialog
            id="networkContextDialog"
            label=${'Details of the network ' + network?.data('id')}
            @sl-hide=${() => this.requestUpdate()}
        >
            <sl-input
                type="text"
                placeholder="NetId"
                value=${network?.data('networkAddress')?.address}
                @sl-input=${(e: SlChangeEvent) => {
                    const value = (e.target as SlInput).value;
                    const subnet: Net = this.selectedObject.data();

                    if (Ipv4Address.validateAddress(value, this.ipv4Database) == null) {
                        (e.target as SlInput).classList.add('danger');
                        (e.target as SlInput).classList.remove('success');
                        (e.target as SlInput).setAttribute('help-text', 'IPv4 address is invalid.');
                        return;
                    } else {
                        (e.target as SlInput).classList.remove('danger');
                        (e.target as SlInput).classList.add('success');
                        (e.target as SlInput).setAttribute('help-text', '');
                    }

                    const success = subnet.handleChangesOnNewNetInfo(value, subnet.netmask, subnet.bitmask, this);
                    if (success) {
                        this.selectedObject.toggleClass('unconfigured-net', false);

                        const name = this.selectedObject.data('name');
                        this.selectedObject.data('name', name);
                    } else {
                        (e.target as SlInput).classList.add('danger');
                        (e.target as SlInput).classList.remove('success');
                        (e.target as SlInput).setAttribute('help-text', 'Invalid net id.');
                    }
                }}
            ></sl-input>
            <sl-input
                type="text"
                placeholder="Network Mask"
                id="netmask"
                value=${network?.data('netmask')}
                @sl-input=${(e: SlChangeEvent) => {
                    const value = (e.target as SlInput).value;
                    const subnet: Net = this.selectedObject.data();

                    if (Ipv4Address.validateAddress(value, this.ipv4Database) == null) {
                        (e.target as SlInput).classList.add('danger');
                        (e.target as SlInput).classList.remove('success');
                        (e.target as SlInput).setAttribute('help-text', 'IPv4 address is invalid.');
                        return;
                    } else {
                        (e.target as SlInput).classList.remove('danger');
                        (e.target as SlInput).classList.add('success');
                        (e.target as SlInput).setAttribute('help-text', '');
                    }

                    const success = subnet.handleChangesOnNewNetInfo(
                        subnet.networkAddress.address,
                        value,
                        subnet.bitmask,
                        this
                    );
                    if (success) {
                        this.selectedObject.toggleClass('unconfigured-net', false);

                        const name = this.selectedObject.data('name');
                        this.selectedObject.data('name', name);

                        const bitmask = (
                            AddressingHelper.decimalStringWithDotToBinary(value).match(new RegExp('1', 'g')) || []
                        ).length;
                        this.shadowRoot?.querySelector('#bitmask')?.setAttribute('value', bitmask.toString());
                    } else {
                        (e.target as SlInput).classList.add('danger');
                        (e.target as SlInput).classList.remove('success');
                        (e.target as SlInput).setAttribute('help-text', 'Invalid netmask.');
                    }
                }}
            ></sl-input>
            <sl-input
                type="number"
                max="32"
                min="0"
                placeholder="Bitmask"
                id="bitmask"
                value=${network?.data('bitmask')}
                @sl-change=${(e: SlChangeEvent) => {
                    const value = parseInt((e.target as SlInput).value);
                    const subnet: Net = this.selectedObject.data();

                    const netmask = AddressingHelper.binaryToDecimalOctets(''.padStart(value, '1').padEnd(32, '0'));

                    const success = subnet.handleChangesOnNewNetInfo(
                        subnet.networkAddress.address,
                        netmask.join('.'),
                        value,
                        this
                    );

                    this.shadowRoot?.querySelector('#netmask')?.setAttribute('value', netmask.join('.'));

                    if (success) {
                        this.selectedObject.toggleClass('unconfigured-net', false);

                        const name = this.selectedObject.data('name');
                        this.selectedObject.data('name', name);

                        (e.target as SlInput).classList.remove('danger');
                        (e.target as SlInput).classList.add('success');
                        (e.target as SlInput).setAttribute('help-text', '');
                    } else {
                        (e.target as SlInput).classList.add('danger');
                        (e.target as SlInput).classList.remove('success');
                        (e.target as SlInput).setAttribute('help-text', 'Invalid bitmask.');
                    }
                }}
            ></sl-input>
        </sl-dialog>
    `;
}

function handleMacAddressChangeGenerator(this: NetworkComponent, index: string) {
    return function handleMacAddressChange(this: NetworkComponent, e: SlChangeEvent) {
        const v = (e.target as SlInput).value;
        const mac = MacAddress.validateAddress(v, this.macDatabase);

        if (mac != null) {
            MacAddress.removeAddressFromDatabase(
                this.selectedObject.data('portData').get(index).get('MAC'),
                this.macDatabase
            );
            const portData = this.selectedObject.data('portData');
            portData.get(index).set('MAC', mac);
            this.selectedObject.data('portData', portData);
            MacAddress.addAddressToDatabase(mac, this.macDatabase, this.selectedObject.id);
            (e.target as SlInput).classList.remove('danger');
            (e.target as SlInput).classList.add('success');
            (e.target as SlInput).setAttribute('help-text', '');
        } else {
            (e.target as SlInput).classList.add('danger');
            (e.target as SlInput).classList.remove('success');
            (e.target as SlInput).setAttribute('help-text', 'MAC address is invalid.');
        }
    };
}

function handleIPv4AddressChangeGenerator(this: NetworkComponent, index: string) {
    const subnet = this.selectedObject.isChild() ? this.selectedObject.parent().data() : null;
    const gateway: boolean = this.selectedObject.hasClass('gateway-node');

    return function handleIPv4AddressChange(this: NetworkComponent, e: SlChangeEvent) {
        const v = (e.target as SlInput).value;
        const ipv4 = Ipv4Address.validateAddress(v, this.ipv4Database);

        if (ipv4 != null) {
            if (subnet != null && Net.mode == 'HOST_BASED') {
                Net.calculateCIDRGivenNewHost(subnet, ipv4, this.ipv4Database);
                this.selectedObject.parent().classes(subnet.cssClass);
            }
            if (subnet != null && Net.mode == 'NET_BASED' && !ipv4.matchesNetworkCidr(subnet)) {
                (e.target as SlInput).classList.add('danger');
                (e.target as SlInput).classList.remove('success');
                (e.target as SlInput).setAttribute('help-text', "Inserted IPv4 doesn't match the subnet mask.");
                return;
            }

            if (gateway) {
                // console.log('gateway', this.selectedObject.data(), index);
                const affectedNetwork: Net | undefined = (this.selectedObject.data() as Router).portNetMapping.get(
                    parseInt(index)
                );

                if (Net.mode == 'HOST_BASED' && affectedNetwork) {
                    Net.calculateCIDRGivenNewHost(affectedNetwork, ipv4, this.ipv4Database);
                    this._graph.$('#' + affectedNetwork.id).classes(affectedNetwork.cssClass);
                }

                if (Net.mode == 'NET_BASED' && affectedNetwork && !ipv4.matchesNetworkCidr(affectedNetwork)) {
                    (e.target as SlInput).classList.add('danger');
                    (e.target as SlInput).classList.remove('success');
                    (e.target as SlInput).setAttribute(
                        'help-text',
                        "Inserted IPv4 for gateway doesn't match the subnet mask or the network is not configured."
                    );
                    return;
                }
            }

            Ipv4Address.removeAddressFromDatabase(
                this.selectedObject.data('portData').get(index).get('IPv4'),
                this.ipv4Database
            );
            const portData = this.selectedObject.data('portData');
            portData.get(index).set('IPv4', ipv4);
            this.selectedObject.data('portData', portData);
            Ipv4Address.addAddressToDatabase(ipv4, this.ipv4Database, this.selectedObject.data('id'));

            (e.target as SlInput).classList.remove('danger');
            (e.target as SlInput).classList.add('success');
            (e.target as SlInput).setAttribute('help-text', '');
        } else {
            (e.target as SlInput).classList.add('danger');
            (e.target as SlInput).classList.remove('success');
            (e.target as SlInput).setAttribute('help-text', 'IPv4 address is invalid.');
        }
    };
}

function handleIPv6AddressChangeGenerator(this: NetworkComponent, index: string) {
    return function handleIPv6AddressChange(this: NetworkComponent, e: SlChangeEvent) {
        const v = (e.target as SlInput).value;
        const ipv6 = Ipv6Address.validateAddress(v, this.ipv6Database);

        if (ipv6 != null) {
            Ipv6Address.removeAddressFromDatabase(
                this.selectedObject.data('portData').get(index).get('IPv6'),
                this.ipv6Database
            );
            const portData = this.selectedObject.data('portData');
            portData.get(index).set('IPv6', ipv6);
            this.selectedObject.data('portData', portData);
            Ipv6Address.addAddressToDatabase(ipv6, this.ipv6Database, this.selectedObject.data('id'));
            (e.target as SlInput).classList.remove('danger');
            (e.target as SlInput).classList.add('success');
            (e.target as SlInput).setAttribute('help-text', '');
        } else {
            (e.target as SlInput).classList.add('danger');
            (e.target as SlInput).classList.remove('success');
            (e.target as SlInput).setAttribute('help-text', 'IPv6 address is invalid.');
        }
    };
}

function handlePortTypeChangeGenerator(this: NetworkComponent, index: string) {
    return function handlePortTypeChange(this: NetworkComponent, e: SlChangeEvent) {
        const v = (e.target as SlSelect).value;
        const portData = this.selectedObject.data('portData');
        portData.get(index).set('Connection Type', v);
        this.selectedObject.data('portData', portData);
    };
}

function addPort(this: NetworkComponent, node: any) {
    const portInfo = new Map();
    if (
        node.data('cssClass').includes('access-point-node') ||
        node.data('cssClass').includes('switch-node') ||
        node.data('cssClass').includes('bridge-node')
    ) {
        const mac = MacAddress.generateRandomAddress(this.macDatabase);

        portInfo.set('MAC', mac);
    }

    if (node.data('cssClass').includes('bridge-node') || node.data('cssClass').includes('repeater-node')) {
        portInfo.set('Connection Type', 'ethernet');
    }

    if (node.data('cssClass').includes('router-node') || node.data('cssClass').includes('host-node')) {
        const mac = MacAddress.generateRandomAddress(this.macDatabase);
        const ipv4 = Ipv4Address.getLoopBackAddress();
        const ipv6 = Ipv6Address.getLoopBackAddress();
        const name = 'port-' + (node.data('portData').size + 1);
        const connectionType = 'ethernet';

        portInfo.set('MAC', mac);
        portInfo.set('IPv4', ipv4);
        portInfo.set('IPv6', ipv6);
        portInfo.set('Name', name);
        portInfo.set('Connection Type', connectionType);
    }

    node.data('portData').set(node.data('portData').size + 1, portInfo);
    node.data('portLinkMapping').set(node.data('portLinkMapping').size + 1, null);

    node.data('numberOfInterfacesOrPorts', node.data('numberOfInterfacesOrPorts') + 1);

    this.requestUpdate();
}

function removePort(this: NetworkComponent, node: any, index: string) {
    const ipv4 = node.data('portData').get(index).get('IPv4');
    if (ipv4 != null) Ipv4Address.removeAddressFromDatabase(ipv4, this.ipv4Database);

    const ipv6 = node.data('portData').get(index).get('IPv6');
    if (ipv6 != null) Ipv6Address.removeAddressFromDatabase(ipv6, this.ipv6Database);

    const mac = node.data('portData').get(index).get('MAC');
    if (mac != null) MacAddress.removeAddressFromDatabase(mac, this.macDatabase);

    node.data('portData').delete(index);
    node.data('portLinkMapping').delete(index);

    node.data('numberOfInterfacesOrPorts', node.data('numberOfInterfacesOrPorts') - 1);

    this.requestUpdate();
}

function updatePortLink(this: NetworkComponent) {
    const edge = this.selectedObject;
    const inPort = this.selectedPorts['source'].port || 0;
    const outPort = this.selectedPorts['target'].port || 0;

    const sourceNode = edge.source().data();
    const targetNode = edge.target().data();

    const newData = configurePorts.bind(this)(edge.data(), inPort, outPort);
    console.log(newData);
    if (newData != null) {
        edge.removeClass('unconfigured-edge');
        edge.addClass(newData.cssClass);
    } //set new format-display for this connection if no error appears

    SubnettingController.setUpGateway(
        this._graph.$('#' + sourceNode.id),
        this._graph.$('#' + targetNode.id),
        inPort,
        this.ipv4Database
    );
    SubnettingController.setUpGateway(
        this._graph.$('#' + targetNode.id),
        this._graph.$('#' + sourceNode.id),
        outPort,
        this.ipv4Database
    );
}

function configurePorts(this: NetworkComponent, edge: GraphEdge, inPort: number, outPort: number): GraphEdge {
    let inPortData: Map<string, any> = edge.from.portData.get(inPort);
    let outPortData: Map<string, any> = edge.to.portData.get(outPort);

    if (inPortData.get('Connection Type') == 'wireless' && outPortData.get('Connection Type') == 'wireless') {
        edge.cssClass.push('wireless-edge');
    } else if (
        (inPortData.get('Connection Type') == 'wireless' && outPortData.get('Connection Type') == 'ethernet') ||
        (inPortData.get('Connection Type') == 'ethernet' && outPortData.get('Connection Type') == 'wireless')
    ) {
        AlertHelper.toastAlert(
            'danger',
            'exclamation-triangle',
            'The connection type of assigned ports are not compatible!',
            'Please re-assign your ports or dismiss this connection.'
        );
        return null;
    } else {
        edge.cssClass.push('wired-edge');
    }

    edge.cssClass.push('labelled-edge');

    let index;
    if ((index = edge.cssClass.indexOf('unconfigured-edge')) > -1) edge.cssClass.splice(index, 1);

    console.log(edge);

    const nodeFrom = this._graph.getElementById(edge.source);
    const nodeTo = this._graph.getElementById(edge.target);

    const fromMap = new Map(nodeFrom.data('portLinkMapping'));
    const toMap = new Map(nodeTo.data('portLinkMapping'));

    fromMap.set(inPort, edge.id);
    toMap.set(outPort, edge.id);

    nodeFrom.data('portLinkMapping', fromMap);
    nodeTo.data('portLinkMapping', toMap);

    const netEdge = this._graph.getElementById(edge.id);

    netEdge.data('inPort', inPort);
    netEdge.data('outPort', outPort);

    return edge;

    //check if one node belongs to a net, if yes --> other node must be a router
}

function isPortConnected(this: NetworkComponent, node: any, port: string): boolean {
    return node.data('portLinkMapping').get(port) != null;
}
