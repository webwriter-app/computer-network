import { css, html, LitElement, PropertyValueMap, TemplateResult } from 'lit';
import { LitElementWw } from '@webwriter/lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import { networkStyles } from './styles/network';
import { toolboxStyles } from './styles/toolbox';
import { contextMenuStyles } from './styles/contextmenu';
import { simulationMenuStyles } from './styles/simulationmenu';

import { GraphNodeFactory } from './event-handlers/component-manipulation';
import { EdgeController } from './event-handlers/edge-controller';
import { DialogFactory } from './event-handlers/dialog-content';
import { SubnettingController } from './event-handlers/subnetting-controller';
import { Net, SubnettingMode } from './components/logicalNodes/Net';
import { PacketSimulator } from './event-handlers/packet-simulator';
import { ImportExportController } from './exporting/importExportController';

import {
    biBoxes,
    biBroadcastPin,
    biCloudArrowUp,
    biCloudCheck,
    biCloudPlus,
    biDiagram3,
    biHdd,
    biPcDisplayHorizontal,
    biPencil,
    biPerson,
    biPhone,
    biRouter,
    biShare,
    biTrash,
    faPlus,
    iBridge,
    iHub,
    iSwitch,
} from './styles/icons';

import 'cytoscape-context-menus/cytoscape-context-menus.css';
import { initNetwork } from './network-config';
import { EventObject } from 'cytoscape';
import { contextMenuTemplate } from './ui/ContextMenu';

import '@shoelace-style/shoelace/dist/themes/light.css';

import SlButton from '@shoelace-style/shoelace/dist/components/button/button.component.js';
import SlDetails from '@shoelace-style/shoelace/dist/components/details/details.component.js';
import SlInput from '@shoelace-style/shoelace/dist/components/input/input.component.js';
import SlCheckbox from '@shoelace-style/shoelace/dist/components/checkbox/checkbox.component.js';
import SlTooltip from '@shoelace-style/shoelace/dist/components/tooltip/tooltip.component.js';
import SlButtonGroup from '@shoelace-style/shoelace/dist/components/button-group/button-group.component.js';
import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.component.js';
import SlSelect from '@shoelace-style/shoelace/dist/components/select/select.component.js';
import SlOption from '@shoelace-style/shoelace/dist/components/option/option.component.js';
import SlDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog.component.js';
import SlColorPicker from '@shoelace-style/shoelace/dist/components/color-picker/color-picker.component.js';
import SlPopup from '@shoelace-style/shoelace/dist/components/popup/popup.component.js';
import SlTabGroup from '@shoelace-style/shoelace/dist/components/tab-group/tab-group.component.js';
import SlTab from '@shoelace-style/shoelace/dist/components/tab/tab.component.js';
import SlTabPanel from '@shoelace-style/shoelace/dist/components/tab-panel/tab-panel.component.js';

import { MacAddress } from './adressing/MacAddress';
import { simulationMenuTemplate } from './ui/SimulationMenu';
import { Component, Connection, load, Network, setupListeners } from './utils/setup';
import { SlChangeEvent } from '@shoelace-style/shoelace';

@customElement('ww-network')
export class NetworkComponent extends LitElementWw {
    @query('#cy')
    _cy: any;

    _graph: any;
    currentComponentToAdd: string = '';
    currentColor: string = 'white';
    colors = [
        'Plum',
        '#BAADD1',
        '#9CB6D6',
        '#9DCBD1',
        'LightSeaGreen',
        '#5FCCAB',
        '#ADE07A',
        '#E2E379',
        'Tomato',
        '#FFA6B4',
        '#FF938B',
        '#FFA07A',
        '#8A8A8A',
        '#A6A6A6',
        '#D4B6A0',
        '#C29C8D',
    ];
    networkAvailable: Boolean = false;
    _edgeHandles: any; //controller for edgehandles extension
    drawModeOn: boolean = false;
    _menu: any; //controller for menu extension
    _cdnd: any; //controller for drag-and-drop compound nodes extension
    resetColorModeOn: boolean = false;
    ipv4Database: Map<string, string> = new Map<string, string>(); //(address, nodeId)
    macDatabase: Map<string, string> = new Map<string, string>();
    ipv6Database: Map<string, string> = new Map<string, string>();

    @state()
    packetSimulator: PacketSimulator = new PacketSimulator(this);

    @state()
    subnettingController: SubnettingController = new SubnettingController(this);

    @property({ type: Boolean, reflect: true })
    automate: boolean = false;

    @property({ type: String, reflect: true })
    screen: 'small' | 'medium' = 'medium'; //small/medium

    @property({ type: Object })
    selectedObject: any;

    @query('#toolboxButtons')
    toolboxButtons!: HTMLElement;

    @query('#contextMenu')
    contextMenu!: HTMLElement;

    @state()
    selectedPorts: {
        source: {
            connectionType: 'ethernet' | 'wireless' | null;
            port: number | null;
        };
        target: {
            connectionType: 'ethernet' | 'wireless' | null;
            port: number | null;
        };
    } = {
        source: { connectionType: null, port: 0 },
        target: { connectionType: null, port: 0 },
    };

    @state()
    mutexDragAndDrop: string | null = null;

    @property({ type: Array, reflect: true, attribute: true })
    componets: Array<Component> = [];

    @property({ type: Array, reflect: true, attribute: true })
    connections: Array<Connection> = [];

    @property({ type: Array, reflect: true, attribute: true })
    networks: Array<Network> = [];

    @state()
    mode: 'edit' | 'simulate' = 'edit';

    @state()
    subnettingMode: SubnettingMode = 'MANUAL';

    /* Previously Static Variables */
    net_mode: SubnettingMode = 'MANUAL';

    public static get styles() {
        return [networkStyles, toolboxStyles, contextMenuStyles, simulationMenuStyles];
    }

    static shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

    public static get scopedElements() {
        return {
            'sl-button': SlButton,
            'sl-button-group': SlButtonGroup,
            'sl-details': SlDetails,
            'sl-input': SlInput,
            'sl-checkbox': SlCheckbox,
            'sl-tooltip': SlTooltip,
            'sl-alert': SlAlert,
            'sl-select': SlSelect,
            'sl-option': SlOption,
            'sl-dialog': SlDialog,
            'sl-color-picker': SlColorPicker,
            'sl-popup': SlPopup,
            'sl-tab-group': SlTabGroup,
            'sl-tab': SlTab,
            'sl-tab-panel': SlTabPanel,
        };
    }

    public isEditable(): boolean {
        return this.contentEditable === 'true' || this.contentEditable === '';
    }

    protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        super.firstUpdated(_changedProperties);
        initNetwork(this);

        this._graph.on('cxttap', (event: EventObject) => {
            event.preventDefault();

            if (event.target === this._graph) {
                this.contextMenu.style.display = 'none';
                return;
            }

            this.selectedObject = event.target;

            if (!this.selectedObject.isNode()) {
                const edge = this.selectedObject.data();

                this.selectedPorts = {
                    source: { connectionType: null, port: 0 },
                    target: { connectionType: null, port: 0 },
                };

                if (edge.inPort != undefined && edge.inPort != null && !Number.isNaN(edge.inPort)) {
                    this.selectedPorts.source.port = edge.inPort;
                    this.selectedPorts.source.connectionType = edge.from.portData
                        .get(edge.inPort)
                        .get('Connection Type');
                }

                if (edge.outPort != undefined && edge.outPort != null && !Number.isNaN(edge.outPort)) {
                    this.selectedPorts.target.port = edge.outPort;
                    this.selectedPorts.target.connectionType = edge.to.portData
                        .get(edge.outPort)
                        .get('Connection Type');
                }
            }

            console.log(this.selectedObject.data());

            this.contextMenu.style.display = 'block';
            this.contextMenu.style.left = event.renderedPosition.x + 'px';
            this.contextMenu.style.top = event.renderedPosition.y + 'px';
        });

        this._graph.on('tap', (event: EventObject) => {
            const t = this.selectedObject;
            this.selectedObject = null;
            this.selectedObject = t;
            this.contextMenu.style.display = 'none';
        });

        this._graph.on('drag', (event: EventObject) => {
            const t = this.selectedObject;
            this.selectedObject = null;
            this.selectedObject = t;
            this.contextMenu.style.display = 'none';
        });

        load.bind(this)();
        setupListeners.bind(this)();
    }

    public render(): TemplateResult {
        return html`
            ${this.isEditable() ? this.asideTemplate() : null}
            <div class="canvas" id="myCanvas">
                <div class="modeSwitch">
                    <sl-select
                        value=${this.mode}
                        @sl-change=${(event: Event) => {
                            const mode = (event.target as HTMLSelectElement).value as 'edit' | 'simulate';
                            if (mode === 'edit') {
                                const components = [...this.componets];
                                const connections = [...this.connections];
                                const networks = [...this.networks];

                                this.ipv4Database = new Map<string, string>(); //(address, nodeId)
                                this.macDatabase = new Map<string, string>();
                                this.ipv6Database = new Map<string, string>();
                                console.log(components, connections, networks);

                                this._graph.elements().remove();

                                this.componets = components;
                                this.connections = connections;
                                this.networks = networks;

                                load.bind(this)();
                            } else {
                                this._graph.$('node').lock();
                                this.packetSimulator.initSession(this);
                            }
                            this.mode = mode;
                        }}
                        size="small"
                    >
                        <span slot="prefix">${this.mode === 'edit' ? biPencil : biBoxes}</span>
                        <sl-option value="edit">Edit</sl-option>
                        <sl-option value="simulate">Simulate</sl-option>
                    </sl-select>
                </div>

                <div id="cy"></div>
                ${this.toolboxTemplate()} ${contextMenuTemplate.bind(this)()} ${simulationMenuTemplate.bind(this)()}
            </div>

            <div id="inputDialog"></div>
            <!-- <sl-dialog id="example-graphs"> ${ImportExportController.exampleTemplate(this)} </sl-dialog> -->
            <!-- <sl-dialog id="instructions" label="Tutorials"> ${DialogFactory.showHelpText(this)} </sl-dialog> -->
        `;
    }

    private toolboxTemplate(): TemplateResult {
        return html`
            <div class="toolbox" style=${this.mode == 'edit' ? 'display: flex;' : 'display: none;'}>
                <sl-button size="large" circle class="toolbox__open" @click=${() => this.openToolbox()}>
                    ${faPlus}
                </sl-button>

                <div class="toolbox__buttons closed" id="toolboxButtons">
                    <div class="toolbox__buttongroup">
                        <!-- <sl-tooltip content="Host" placement="left"> -->
                        <sl-button circle class="toolbox__btn" ?disabled=${this.drawModeOn}> ${biPerson} </sl-button>
                        <!-- </sl-tooltip> -->
                        <div class="toolbox__subbuttons">
                            <sl-tooltip content="Computer" placement="top">
                                <sl-button circle class="toolbox__btn" @click=${this.addHost().computer}>
                                    ${biPcDisplayHorizontal}
                                </sl-button>
                            </sl-tooltip>
                            <sl-tooltip content="Mobile device" placement="top">
                                <sl-button circle class="toolbox__btn" @click=${this.addHost().mobile}>
                                    ${biPhone}
                                </sl-button>
                            </sl-tooltip>
                        </div>
                    </div>
                    <div class="toolbox__buttongroup">
                        <!-- <sl-tooltip content="Network device" placement="left"> -->
                        <sl-button circle class="toolbox__btn" ?disabled=${this.drawModeOn}> ${biHdd} </sl-button>
                        <!-- </sl-tooltip> -->
                        <div class="toolbox__subbuttons">
                            <sl-tooltip content="Router" placement="top">
                                <sl-button circle class="toolbox__btn" @click=${this.addNetworkDevice().router}>
                                    ${biRouter}
                                </sl-button>
                            </sl-tooltip>
                            <sl-tooltip content="Access point" placement="top">
                                <sl-button circle class="toolbox__btn" @click=${this.addNetworkDevice().accessPoint}>
                                    ${biBroadcastPin}
                                </sl-button>
                            </sl-tooltip>
                            <sl-tooltip content="Repeater" placement="top">
                                <sl-button circle class="toolbox__btn" @click=${this.addNetworkDevice().repeater}>
                                    ${biHdd}
                                </sl-button>
                            </sl-tooltip>
                            <sl-tooltip content="Hub" placement="top">
                                <sl-button circle class="toolbox__btn" @click=${this.addNetworkDevice().hub}>
                                    ${iHub}
                                </sl-button>
                            </sl-tooltip>
                            <sl-tooltip content="Bridge" placement="top">
                                <sl-button circle class="toolbox__btn" @click=${this.addNetworkDevice().bridge}>
                                    ${iBridge}
                                </sl-button>
                            </sl-tooltip>
                            <sl-tooltip content="Switch" placement="top">
                                <sl-button circle class="toolbox__btn" @click=${this.addNetworkDevice().switch}>
                                    ${iSwitch}
                                </sl-button>
                            </sl-tooltip>
                        </div>
                    </div>
                    <div class="toolbox__buttongroup">
                        <sl-tooltip content="Edge" placement="left">
                            <sl-button
                                circle
                                class="toolbox__btn"
                                variant=${this.drawModeOn ? 'primary' : 'default'}
                                @click="${() => EdgeController.toggleDrawMode(this)}"
                            >
                                ${biShare}
                            </sl-button>
                        </sl-tooltip>
                    </div>
                    <div class="toolbox__buttongroup">
                        <sl-tooltip content="Network" placement="bottom">
                            <sl-button
                                circle
                                class="toolbox__btn"
                                ?disabled=${this.drawModeOn}
                                @click="${() => this.addNetwork()}"
                            >
                                ${biDiagram3}
                            </sl-button>
                        </sl-tooltip>

                        <div class="toolbox__subbuttons">
                            <sl-tooltip content="Network assignment" placement="top">
                                <sl-button
                                    circle
                                    class="toolbox__btn"
                                    variant=${this.mutexDragAndDrop === 'subnetting' ? 'primary' : 'default'}
                                    @click="${(event: Event) =>
                                        this.subnettingController.toggleDragAndDropSubnetting(event, this)}"
                                >
                                    ${biCloudPlus}
                                </sl-button>
                            </sl-tooltip>
                            <sl-tooltip content="Gateway assignment" placement="top">
                                <sl-button
                                    circle
                                    class="toolbox__btn"
                                    variant=${this.mutexDragAndDrop === 'gateway' ? 'primary' : 'default'}
                                    @click="${(event: Event) =>
                                        this.subnettingController.toggleAssigningGateway(event, this)}"
                                >
                                    ${biCloudArrowUp}
                                </sl-button>
                            </sl-tooltip>
                            <sl-tooltip content="Validate global address assignments" placement="top">
                                <sl-button
                                    circle
                                    class="toolbox__btn"
                                    @click="${() => this.subnettingController.validateAllNets(false, this)}"
                                >
                                    ${biCloudCheck}
                                </sl-button>
                            </sl-tooltip>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    private openToolbox(): void {
        this.toolboxButtons.classList.toggle('closed');
    }

    private addHost() {
        return {
            computer: () => {
                GraphNodeFactory.addNode(this, {
                    componentType: 'computer',
                    interfaces: [
                        {
                            name: 'eth0',
                            connectionType: 'ethernet',
                            mac: MacAddress.generateRandomAddress(this.macDatabase).address,
                            ipv4: '192.168.20.1',
                            ipv6: '0:0:0:0:0:0:0:1',
                        },
                    ],
                });
            },
            mobile: () => {
                GraphNodeFactory.addNode(this, {
                    componentType: 'mobile',
                    interfaces: [
                        {
                            name: 'eth0',
                            connectionType: 'wireless',
                            mac: MacAddress.generateRandomAddress(this.macDatabase).address,
                            ipv4: '192.168.20.1',
                            ipv6: '0:0:0:0:0:0:0:1',
                        },
                    ],
                });
            },
        };
    }

    private addNetworkDevice() {
        return {
            router: () => {
                GraphNodeFactory.addNode(this, {
                    componentType: 'router',
                    interfaces: [],
                });
            },
            accessPoint: () => {
                GraphNodeFactory.addNode(this, {
                    componentType: 'access-point',
                    interfaces: [
                        { mac: MacAddress.generateRandomAddress(this.macDatabase).address },
                        { mac: MacAddress.generateRandomAddress(this.macDatabase).address },
                    ],
                });
            },
            repeater: () => {
                GraphNodeFactory.addNode(this, {
                    componentType: 'repeater',
                    interfaces: [{ connectionType: 'ethernet' }, { connectionType: 'ethernet' }],
                });
            },
            hub: () => {
                GraphNodeFactory.addNode(this, {
                    componentType: 'hub',
                    interfaces: [],
                });
            },
            bridge: () => {
                GraphNodeFactory.addNode(this, {
                    componentType: 'bridge',
                    interfaces: [
                        { connectionType: 'ethernet', mac: MacAddress.generateRandomAddress(this.macDatabase).address },
                        { connectionType: 'ethernet', mac: MacAddress.generateRandomAddress(this.macDatabase).address },
                    ],
                });
            },
            switch: () => {
                GraphNodeFactory.addNode(this, {
                    componentType: 'switch',
                    interfaces: [
                        { mac: MacAddress.generateRandomAddress(this.macDatabase).address },
                        { mac: MacAddress.generateRandomAddress(this.macDatabase).address },
                    ],
                });
            },
        };
    }

    private addEdge() {}

    private addNetwork() {
        GraphNodeFactory.addNode(this, {
            componentType: 'net',
            net: {
                netid: '1.1.1.0',
                netmask: '255.255.255.0',
                bitmask: 24,
            },
        });
    }

    private asideTemplate(): TemplateResult {
        return html`
            <aside part="options">
                <form autocomplete="off">
                    <input class="importBtn" style="width: 11cqw;" type="file" id="import-file" />
                    <sl-tooltip content="Import a file created by this widget" placement="bottom">
                        <button
                            class="importBtn"
                            type="button"
                            @click="${() => ImportExportController.importFile(this)}"
                        >
                            Import
                        </button>
                    </sl-tooltip>
                    <sl-tooltip content="Export the current graph" placement="bottom">
                        <button
                            class="importBtn"
                            type="button"
                            @click="${() => ImportExportController.exportFile(this)}"
                        >
                            Export
                        </button>
                    </sl-tooltip>
                    <sl-tooltip content="Example graphs/exercises" placement="bottom">
                        <button
                            class="importBtn"
                            type="button"
                            @click="${() => (this.renderRoot.querySelector('#example-graphs') as SlDialog).show()}"
                        >
                            Examples
                        </button>
                    </sl-tooltip>
                    <sl-tooltip content="Tutorials for features of this widget" placement="bottom">
                        <button
                            class="importBtn"
                            type="button"
                            @click="${() => (this.renderRoot.querySelector('#instructions') as SlDialog).show()}"
                        >
                            Help
                        </button>
                    </sl-tooltip>
                </form>
                <h2>New Node</h2>
                <div class="componentMenu">
                    <sl-tooltip content="Host" placement="top">
                        <sl-dropdown placement="bottom">
                            <button class="btn" id="host" slot="trigger"><sl-icon name="person"></sl-icon></button>
                            <sl-menu>
                                <sl-menu-item id="computer" @click="${this.clickOnComponentButton}"
                                    ><sl-icon name="pc-display-horizontal"></sl-icon
                                ></sl-menu-item>
                                <sl-menu-item id="mobile" @click="${this.clickOnComponentButton}"
                                    ><sl-icon name="phone"></sl-icon
                                ></sl-menu-item>
                            </sl-menu>
                        </sl-dropdown>
                    </sl-tooltip>
                    <sl-tooltip content="Network device" placement="top">
                        <sl-dropdown placement="bottom">
                            <button class="btn" id="connector" slot="trigger"><sl-icon name="hdd"></sl-icon></button>
                            <sl-menu>
                                <sl-menu-item id="router" @click="${this.clickOnComponentButton}"
                                    >Router <sl-icon name="router"></sl-icon
                                ></sl-menu-item>
                                <sl-menu-item id="access-point" @click="${this.clickOnComponentButton}"
                                    >Access Point <sl-icon name="broadcast-pin"></sl-icon
                                ></sl-menu-item>
                                <sl-menu-item id="repeater" @click="${this.clickOnComponentButton}"
                                    >Repeater <sl-icon name="hdd"></sl-icon
                                ></sl-menu-item>
                                <sl-menu-item id="hub" @click="${this.clickOnComponentButton}"
                                    >Hub <sl-icon src="resources/icons/hub.svg"></sl-icon
                                ></sl-menu-item>
                                <sl-menu-item id="bridge" @click="${this.clickOnComponentButton}"
                                    >Bridge <sl-icon src="resources/icons/bridge.svg"></sl-icon
                                ></sl-menu-item>
                                <sl-menu-item id="switch" @click="${this.clickOnComponentButton}"
                                    >Switch <sl-icon src="resources/icons/switch.svg"></sl-icon
                                ></sl-menu-item>
                            </sl-menu>
                        </sl-dropdown>
                    </sl-tooltip>
                    <sl-tooltip content="Edge" placement="top">
                        <button class="btn" id="edge" @click="${this.clickOnComponentButton}">
                            <sl-icon name="share"></sl-icon>
                        </button>
                    </sl-tooltip>
                    <sl-tooltip content="Network" placement="top">
                        <button class="btn" id="net" @click="${this.clickOnComponentButton}">
                            <sl-icon name="diagram-3"></sl-icon>
                        </button>
                    </sl-tooltip>
                </div>
                <div class="nameBox">
                    <sl-tab-group id="physical-logical-group">
                        <sl-tab slot="nav" panel="physical">Physical Node</sl-tab>
                        <sl-tab slot="nav" panel="logical">Logical Node</sl-tab>

                        <sl-tab-panel name="physical" id="physical-node-panel" active>
                            <sl-input class="label-on-left" label="Name" id="inputName" placeholder="Name"></sl-input>
                            <sl-input
                                class="label-on-left"
                                label="Number of ports"
                                id="ports"
                                placeholder="Number of input ports"
                                type="number"
                                min="1"
                            ></sl-input>
                            <sl-button
                                size=${this.screen}
                                style="margin-top: 1cqw;"
                                @click="${() => DialogFactory.generateInputsDetailsForNode(this)}"
                                >Add details for ports</sl-button
                            >
                        </sl-tab-panel>
                        <sl-tab-panel name="logical" id="logical-node-panel">
                            <sl-input class="label-on-left" label="NetID" id="net-num" placeholder="0.0.0.0"></sl-input>
                            <sl-input
                                class="label-on-left"
                                label="Netmask"
                                id="net-mask"
                                placeholder="255.255.255.255"
                            ></sl-input>
                            <sl-input
                                class="label-on-left"
                                label="Bitmask"
                                id="net-bitmask"
                                placeholder=""
                                type="number"
                                min="0"
                                max="32"
                            ></sl-input>
                        </sl-tab-panel>
                    </sl-tab-group>
                </div>
                <div class="colorPalette"></div>
                <div class="addOption">
                    <sl-tooltip content="Click to add your component" placement="left" style="--max-width: 7cqw;">
                        <button class="addBtn" id="addCompBtn" @click="${() => GraphNodeFactory.addNode(this)}">
                            <sl-icon name="plus" disabled="${this.isEditable()}"></sl-icon>
                        </button>
                    </sl-tooltip>
                    <sl-tooltip content="Click to draw connecting links" placement="left" style="--max-width: 7cqw;">
                        <button
                            class="addBtn"
                            id="drawBtn"
                            @click="${() => EdgeController.toggleDrawMode(this)}"
                            style="font-size: 1cqw;"
                        >
                            <sl-icon id="drawMode" name="plug"></sl-icon>
                        </button>
                    </sl-tooltip>
                    <sl-tooltip
                        content="Click to change color of existing components"
                        placement="left"
                        style="--max-width: 9cqw;"
                    >
                        <button
                            class="addBtn"
                            id="resetColorBtn"
                            @click="${() => GraphNodeFactory.toggleResetColor(this)}"
                        >
                            <sl-icon id="changeColorMode" name="eyedropper"></sl-icon>
                        </button>
                    </sl-tooltip>
                </div>
                <sl-menu style="background-color: #F1F1F1; border: transparent; height: 100%;">
                    <sl-details summary="CIDR/Subnetting controller" open>
                        <sl-menu-label
                            >Choose a mode:
                            <sl-select
                                size=${this.screen}
                                id="current-subnet-mode"
                                @sl-change="${(event: SlChangeEvent) => {
                                    Net.setMode((event.target as SlSelect).value, this);
                                }}"
                                value="MANUAL"
                            >
                                <sl-menu-item value="MANUAL">Manual Mode</sl-menu-item>
                                <sl-menu-item value="NET_BASED">Net-based Mode</sl-menu-item>
                                <sl-menu-item value="HOST_BASED">Host-based Mode</sl-menu-item>
                            </sl-select>
                        </sl-menu-label>
                        <sl-menu-item
                            @click="${(event) => this.subnettingController.toggleDragAndDropSubnetting(event, this)}"
                            style="font-size: max(0.1cqw, 12px) !important;"
                            >Activate Draw-and-drop</sl-menu-item
                        >
                        <sl-menu-item
                            @click="${(event) => this.subnettingController.toggleAssigningGateway(event, this)}"
                            style="font-size: max(0.1cqw, 12px) !important;"
                            >Drag to assign gateway</sl-menu-item
                        >
                        <sl-menu-item>
                            <sl-tooltip hoist content="Validate global address assignments" placement="top">
                                <sl-button
                                    size=${this.screen}
                                    class="blue-button"
                                    @click="${() => this.subnettingController.validateAllNets(false, this)}"
                                    >Check</sl-button
                                >
                            </sl-tooltip>
                        </sl-menu-item>
                    </sl-details>

                    <sl-details id="packet-sending-extension" summary="Packet sending controller">
                        <sl-menu-item style="display: flex;">
                            <sl-button
                                size=${this.screen}
                                style="display: inline-block;"
                                class="blue-button"
                                id="setSourceBtn"
                                @click="${(event) => this.packetSimulator.setSource(event, this)}"
                                >Choose sender</sl-button
                            >
                            <sl-select
                                size=${this.screen}
                                id="ip-source-select"
                                hoist
                                style="display: inline-block; margin-left: 7.5px;"
                                @sl-change="${(event) => {
                                    this.packetSimulator.sourceIp = event.target.value;
                                }}"
                                value="127.0.0.1"
                            >
                                <sl-menu-item value="127.0.0.1">127.0.0.1</sl-menu-item>
                            </sl-select>
                        </sl-menu-item>
                        <sl-menu-item>
                            <sl-button
                                size=${this.screen}
                                style="display: inline-block;"
                                class="blue-button"
                                id="setTargetBtn"
                                @click="${(event) => this.packetSimulator.setTarget(event, this)}"
                                >Choose receiver</sl-button
                            >
                            <sl-select
                                size=${this.screen}
                                id="ip-target-select"
                                hoist
                                style="display: inline-block;"
                                @sl-change="${(event) => {
                                    this.packetSimulator.targetIp = event.target.value;
                                }}"
                                value="127.0.0.1"
                            >
                                <sl-menu-item value="127.0.0.1">127.0.0.1</sl-menu-item>
                            </sl-select>
                        </sl-menu-item>
                        <sl-menu-item
                            ><sl-input
                                class="label-on-left"
                                @sl-change="${(event) => (this.packetSimulator.duration = event.target.value * 1000)}"
                                label="Speed"
                                type="number"
                                min="1"
                            ></sl-input
                        ></sl-menu-item>
                        <sl-menu-item
                            @click="${(event) => {
                                event.target.checked = !event.target.checked;
                                this.packetSimulator.focus = event.target.checked;
                            }}"
                            >Focus on animated nodes</sl-menu-item
                        >
                        <sl-menu-item>
                            <b><i>Session: </i></b>
                            <sl-tooltip hoist content="Create a new simulation session" placement="top">
                                <sl-button
                                    class="blue-button"
                                    size=${this.screen}
                                    @click="${() => this.packetSimulator.initSession(this)}"
                                    >Init</sl-button
                                >
                            </sl-tooltip>
                            <sl-tooltip hoist content="Start sending a new packet" placement="top">
                                <sl-button
                                    class="blue-button"
                                    size=${this.screen}
                                    @click="${() => this.packetSimulator.startSession(this)}"
                                    ><sl-icon name="play"
                                /></sl-button>
                            </sl-tooltip>
                            <sl-tooltip hoist content="Pause/resume all packets" placement="top">
                                <sl-button
                                    class="blue-button"
                                    size=${this.screen}
                                    @click="${() => this.packetSimulator.pauseOrResumeSession(this)}"
                                    ><sl-icon
                                        id="pause-ani"
                                        src="/node_modules/@shoelace-style/shoelace/dist/assets/icons/pause.svg"
                                /></sl-button>
                            </sl-tooltip>
                            <sl-tooltip hoist content="Stop the simulation session" placement="top">
                                <sl-button
                                    class="blue-button"
                                    size=${this.screen}
                                    @click="${() => this.packetSimulator.stopSession(this)}"
                                    ><sl-icon name="stop-circle"
                                /></sl-button>
                            </sl-tooltip>
                        </sl-menu-item>
                        <sl-menu-item>
                            <sl-details id="tables-for-packet-simulator" summary="Track tables" open> </sl-details>
                        </sl-menu-item>
                    </sl-details>
                </sl-menu>
            </aside>
        `;
    }

    private clickOnComponentButton(e: Event): void {
        this.currentComponentToAdd = (e.target as HTMLElement).getAttribute('id');
        let nodeToHighLight: string = '';
        let panelToActive: string = '';
        switch (this.currentComponentToAdd) {
            case 'computer':
            case 'mobile':
                nodeToHighLight = 'host';
                panelToActive = 'physical';
                break;
            case 'router':
            case 'access-point':
            case 'hub':
            case 'repeater':
            case 'bridge':
            case 'switch':
                nodeToHighLight = 'connector';
                panelToActive = 'physical';
                break;
            case 'net':
                nodeToHighLight = 'net';
                panelToActive = 'logical';
            default:
                nodeToHighLight = this.currentComponentToAdd;
                break;
        }

        this.renderRoot.querySelectorAll('.btn').forEach((e) => {
            if (e.id == nodeToHighLight) {
                //highlight the chosen component
                (e as HTMLElement).style.border = 'solid 2px #404040';
            } else {
                //un-highlight other components
                (e as HTMLElement).style.border = 'solid 1px transparent';
            }
        });
        if (panelToActive != '') {
            (this.renderRoot.querySelector('#physical-logical-group') as SlTabGroup).show(panelToActive);
        }
    }

    updated(changedProperties: Map<string, unknown>) {
        if (changedProperties.has('contentEditable')) {
            // new value is
            const newValue = this.isEditable();
            if (newValue) {
                if (this.networkAvailable) this._graph.elements().toggleClass('deletable', true);
                ['host', 'connector', 'edge', 'net', 'addCompBtn', 'drawBtn'].forEach((buttonId) => {
                    if (this.renderRoot.querySelector('#' + buttonId))
                        (this.renderRoot.querySelector('#' + buttonId) as HTMLButtonElement).disabled = false;
                });
            } else {
                if (this.networkAvailable) this._graph.elements().toggleClass('deletable', false);
                ['host', 'connector', 'edge', 'net', 'addCompBtn', 'drawBtn'].forEach((buttonId) => {
                    if (this.renderRoot.querySelector('#' + buttonId))
                        (this.renderRoot.querySelector('#' + buttonId) as HTMLButtonElement).disabled = true;
                });
            }
        }

        if (changedProperties.has('automate')) {
            // new value is
            const newValue = this.automate;
            if (newValue) {
                (this.renderRoot.querySelector('#current-subnet-mode') as SlSelect).disabled = false;
            } else {
                (this.renderRoot.querySelector('#current-subnet-mode') as SlSelect).value = 'MANUAL';
                (this.renderRoot.querySelector('#current-subnet-mode') as SlSelect).disabled = true;
                Net.setMode('MANUAL', this);
            }
        }
    }
}
