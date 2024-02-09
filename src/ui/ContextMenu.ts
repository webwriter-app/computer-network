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

export function contextMenuTemplate(this: NetworkComponent): TemplateResult {
    return html`
        ${this.selectedObject?.isNode()
            ? nodeContextDialogTemplate.bind(this)()
            : edgeContextDialogTemplate.bind(this)()}
        <div id="contextMenu" class="contextmenu" @contextmenu=${(e: Event) => e.preventDefault()} style="display:none">
            ${this.selectedObject?.isNode()
                ? nodeContextMenuTemplate.bind(this)()
                : edgeContextMenuTemplate.bind(this)()}
            <!-- <pre>${JSON.stringify(this.selectedObject?.data(), null, 2)}</pre> -->
        </div>
    `;
}

function nodeContextMenuTemplate(this: NetworkComponent): TemplateResult {
    return html` <div class="contextmenu__header">
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
        ></sl-color-picker>`;
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
                                                        ports
                                                            .get(port[0])
                                                            ?.set('Name', (e.target as HTMLInputElement).value);
                                                    }}
                                                ></sl-input>
                                            </td>`
                                          : ''}
                                      ${columns.includes('Connection Type')
                                          ? html`<td>${port[1].get('Connection Type')}</td>`
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

function handleMacAddressChangeGenerator(this: NetworkComponent, index: string) {
    return function handleMacAddressChange(this: NetworkComponent, e: SlChangeEvent) {
        const v = (e.target as SlInput).value;
        const mac = MacAddress.validateAddress(v, this.macDatabase);

        if (mac != null) {
            MacAddress.removeAddressFromDatabase(
                this.selectedObject.data('portData').get(index).get('MAC'),
                this.macDatabase
            );
            this.selectedObject.data('portData').get(index).set('MAC', mac);
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
                const affectedNetwork: Net | undefined = (this.selectedObject as Router).portNetMapping.get(
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
            this.selectedObject.data('portData').get(index).set('IPv4', ipv4);
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
            this.selectedObject.data('portData').get(index).set('IPv6', ipv6);
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

    const newData = GraphEdge.addPorts(edge.data(), inPort, outPort); //add port-link mapping for source+target
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
