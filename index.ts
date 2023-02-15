import { LitElementWw } from "@webwriter/lit"
import { css, html } from "lit"
import { customElement, property, query } from "lit/decorators.js"
import "@shoelace-style/shoelace/dist/themes/light.css"

import 'cytoscape-context-menus/cytoscape-context-menus.css';
import { GraphNodeFactory } from "./src/event-handlers/component-manipulation";
import { EdgeController } from "./src/event-handlers/edge-controller";
import { DialogFactory } from "./src/event-handlers/dialog-content";
import { SubnettingController } from "./src/event-handlers/subnetting-controller";
import { Net } from "./src/components/logicalNodes/Net";
import { PacketSimulator } from "./src/event-handlers/packet-simulator";
import { ImportExportController } from "./src/exporting/importExportController";
import { SlSelect } from "@shoelace-style/shoelace";


@customElement("computer-network")
export class ComputerNetwork extends LitElementWw {


  @query('#cy')
  _cy;
  _graph;
  currentComponentToAdd: string = "";
  currentColor: string = "white";
  colors = ['Plum', '#BAADD1', '#9CB6D6', '#9DCBD1', 'LightSeaGreen', '#5FCCAB', '#ADE07A', '#E2E379',
    'Tomato', '#FFA6B4', '#FF938B', '#FFA07A', '#8A8A8A', '#A6A6A6', '#D4B6A0', '#C29C8D'];
  networkAvailable: Boolean = false;
  _edgeHandles; //controller for edgehandles extension
  drawModeOn: boolean = false;
  _instance; //controller for menu extension
  _cdnd; //controller for drag-and-drop compound nodes extension
  resetColorModeOn: boolean = false;
  ipv4Database: Map<string, string> = new Map<string, string>(); //(address, nodeId)
  macDatabase: Map<string, string> = new Map<string, string>();
  ipv6Database: Map<string, string> = new Map<string, string>();

  @property({
    type: Boolean,
    reflect: true
  })
  editable: boolean = true;

  @property({
    type: Boolean,
    reflect: true
  })
  automate: boolean = true;

  @property({
    type: String,
    reflect: true
  })
  screen: string = "medium"; //small/medium



  static styles =
    css`
    .main-container {
        container-type: inline-size;
        height: 100%;
        width: 100%;
    }
    .base {
        display: flex;
        width: 75cqw;
        height: 12cqw;
        min-height: 192px;
        margin-bottom: 1cqw;
        background-color: #F1F1F1;
    }
    .addOption {
        width: 12cqw;
        display: flex;
        flex-direction: row;
        gap: 1.5cqw;
        margin: auto;
    }
    .colorPalette {
        position: flex;
        width: 10.2cqw;
        margin: auto;
        display: flex;
        flex-wrap: wrap;
        gap: 1.4cqw;
        height: 10.2cqw;
    }
    #myCanvas {
        position: relative;
        width: 75cqw;
        height: calc(100cqh - 14.5cqw);
        max-height: calc(100cqh - 192px - 2.5cqw);
        border: 1px solid #ADADAD;
    }
    #cy {
        height: 100%;
        width: 100%;
        position: absolute;
    }
    .componentMenu {
        position: relative;
        width: 25cqw;
        display: flex;
        flex-direction: row;
        gap: auto;
        padding: auto;
        margin: auto;
    }
    .nameBox {
        position: relative;
        margin: 0 auto;
    } 
    .sidebar {
        height: calc(100cqh - 1.5cqw);
        position: fixed;
        right: 0;
        background: #F1F1F1;
        width: 23.7cqw;
    }
  
    /** Buttons **/
    .btn {
        border-radius: 0.5cqw;
        background-color: #8BA8CC;
        border: solid 1px transparent;
        color: white;
        align-items: center;
        font-size: 1.6cqw;
        cursor: pointer;
        width: 4cqw;
        height: 4cqw;
        margin: auto;
    }
    .importBtn {
        border-radius: 0.3cqw;
        background-color: #8BA8CC;
        border: solid 1px transparent;
        color: white;
        align-items: center;
        font-size: 0.8cqw;
        cursor: pointer;
        margin: auto;
    }
    button:hover:enabled {
        background-color: #0291DB;
    }
    .addBtn {
        border-radius: 0.5cqw;
        background-color: #8BA8CC;
        border: solid 1px transparent;
        color: white;
        align-items: center;
        font-size: 1cqw;
        cursor: pointer;
        width: 3cqw;
        height: 3cqw;
    }
    button:disabled,
    button[disabled],
    #drawBtn:disabled,
    #resetColorBtn:disabled {
        border: 1px solid #BFBFBF;
        background-color: #E8E8E8 !important;
        color: #858585;
    }
    .colorButton {
        border-radius: 0.3cqw;
        border: solid 1px #ADADAD;
        cursor: pointer;
        width: 1.5cqw;
        height: 1.5cqw;
    }
    .blue-button::part(base) {
      background-color: #F1F1F1;
      border: none;
    }
    
    /** scrollbar **/
    ::-webkit-scrollbar {
        width: 6px;
    }
    ::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 5px;
    }
    ::-webkit-scrollbar-thumb {
        background: #8BA8CC;
        border-radius: 5px;
    }
    ::-webkit-scrollbar-thumb:hover {
        background: #0291DB;
    }
    
    /** CONTEXTUAL MENU - cytoscape **/
    .custom-menu-item {
        border: none !important;
        height: 3cqw !important;
        width: 8cqw !important;
        padding-left: 1cqw !important;
        color: black !important;
        background-color: white !important;
        font-family: --sl-font-sans !important;
        font-weight: normal !important;
        font-size: 0.8cqw !important;
        text-align: left !important;
        box-shadow: none !important;
    }
    .custom-menu-item:hover {
        background-color: #F1F1F1 !important;
    }
    .custom-context-menu {
        border: none !important;
        padding-top: 0.5cqw !important;
        padding-bottom: 0.5cqw !important;
        border-radius: 0.2cqw !important;
        background-color: #fafafa !important;
        box-shadow: 0px 0px 8px 0px rgb(0, 0, 0, 0.12),
            0px 8px 8px 0px rgb(0, 0, 0, 0.24) !important;
    }
    
    /** SL-INPUT **/
    sl-input::part(base),
    sl-input::part(input) {
        border: none;
        font-size: max(0.8cqw, 11px);
        height: max(35px, 1.5cqw);
    }
    .label-on-left {
        --label-width: 3cqw;
        --gap-width: 2cqw;
        margin: auto;
    }
    .label-on-left::part(form-control) {
        display: grid;
        grid: auto / var(--label-width) 1fr;
        gap: 1cqw;
        align-items: center;
    }
    .label-on-left::part(form-control-label) {
        text-align: right;
        font-size: max(0.8cqw, 11px);
    }
    .label-on-left::part(form-control-help-text) {
        grid-column: span 2;
        padding-left: calc(var(--label-width) + var(--gap-width));
    }
    
    /** SL-MENU-ITEM **/
    sl-menu-item::part(base),
    sl-menu-item::part(label) {
        font-size: max(0.8cqw, 11px);
    }
    
    /** SL-DETAILS **/
    #packet-sending-extension::part(content) {
        height: fit-content;
    }
    .details-for-table::part(content) {
        width: 320px;
        overflow: auto;
    }
    sl-details::part(base) {
        height: fit-content;
        background-color: #F1F1F1;
        border: none;
    }
    sl-details::part(summary) {
        font-size: 14px;
        font-weight: 600;
        color: #F2F2F2;
        font-family: sans-serif;
    }
    sl-details::part(header) {
        background-color: #8BA8CC;
    }
    sl-details table,
    sl-details th,
    sl-details td {
        border: 1px solid #8BA8CC;
        border-collapse: collapse;
        color: black !important;
    }
    sl-details th,
    sl-details td {
        padding: 10px;
    }
    sl-tab-panel::part(base) {
        font-size: max(0.8cqw, 11px);
    }
  
    sl-dropdown {
        display: flex;
        justify-content: space-between;
        margin: auto;
    }
    
    sl-dialog::part(base),
    sl-select::part(base) {
        --width: fit-content;
    }
    
    /** tables **/
    td {
        text-align: center;
    }
    table.fixedRout {
        table-layout: fixed;
        width: 100%;
    }
    table.fixedRout td:nth-of-type(1) {
        width: 20px;
    }
    table.fixedRout td:nth-of-type(2) {
        width: 110px;
    }
    table.fixedRout td:nth-of-type(3) {
        width: 110px;
    }
    table.fixedRout td:nth-of-type(4) {
        width: 70px;
    }
    table.fixedRout td:nth-of-type(5) {
        width: 70px;
    }
    table.fixedRout td:nth-of-type(6) {
        width: 100px;
    }
    table.fixedArp {
        table-layout: fixed;
        width: 100%;
    }
    table.fixedArp td:nth-of-type(1) {
        width: 20px;
    }
    table.fixedArp td:nth-of-type(2) {
        width: 50%;
    }
    table.fixedArp td:nth-of-type(3) {
        width: 42%;
    }
    table.fixedMac {
        table-layout: fixed;
        width: 100%;
    }
    table.fixedMac td:nth-of-type(1) {
        width: 20px;
    }
    table.fixedArp td:nth-of-type(2) {
        width: 40%;
    }
    table.fixedMac td:nth-of-type(3) {
        width: 52%;
    }
  
    /** Container queries **/
    
    @container (max-width: 1550px) {
        .addOption {
            width: 5cqw;
            flex-direction: column;
        }
    }
    @container (max-width: 1215px) {
        .colorPalette {
            width: 11cqw;
            height: 11cqw;
            gap: 1.5cqw;
        }
        sl-button::part(base) {
            font-size: 0.1cqw;
        }
    }
    @container (max-width: 1123px) {
        .colorPalette {
            gap: 1.4cqw;
        }
    }
    @container (max-width: 1086px) {
        .colorPalette {
            width: 12cqw;
            height: 12cqw;
        }
    }
    @container (max-width: 1041px) {
        .colorPalette {
            width: 13cqw;
            height: 13cqw;
        }
    }
    @container (max-width: 1019px) {
        .colorPalette {
            width: 13.5cqw;
            height: 13.5cqw;
        }
    }
    @container (max-width: 988px) {
        .colorPalette {
            width: 14cqw;
            height: 14cqw;
        }
        .componentMenu {
            width: 9cqw;
            flex-direction: column;
            gap: 0.5cqw;
            padding-left: 1cqw;
        }
        .nameBox {
            width: 30cqw;
        }
        .label-on-left {
            --label-width: 6cqw;
            --gap-width: 2cqw;
            margin: auto;
        }
        sl-input::part(input) {
            width: 10cqw;
        }
    }     
`;


  render() {
    const colorOptions = [];
    for (const color of this.colors) {
      colorOptions.push(html`<button class="colorButton" id=${color} style="background-color: ${color}" @click="${this.clickOnColor}"></button>`);
    }

    return html`

    <div class="main-container">
    <div class="sidebar">
      <sl-menu style="background-color: #F1F1F1; border: transparent; height: 100%;">
      
        <sl-details summary="Subnetting extension" open>
          <sl-menu-label>Choose a mode:
            <sl-select size=${this.screen} id="current-subnet-mode" @sl-change="${(event) => { Net.setMode(event.target.value) }}" value="MANUAL">
            <sl-menu-item value="MANUAL">Manual Mode</sl-menu-item>
            <sl-menu-item value="NET_BASED">Net-based Mode</sl-menu-item>
            <sl-menu-item value="HOST_BASED">Host-based Mode</sl-menu-item>
          </sl-select>
          </sl-menu-label>
          <sl-menu-item @click="${(event) => SubnettingController.toggleDragAndDropSubnetting(event, this)}" style="font-size: max(0.1cqw, 12px) !important;">Activate Draw-and-drop</sl-menu-item>
          <sl-menu-item @click="${(event) => SubnettingController.toggleAssigningGateway(event)}" style="font-size: max(0.1cqw, 12px) !important;">Drag to assign gateway</sl-menu-item>
          <sl-menu-item><sl-button size=${this.screen} class="blue-button" @click="${() => SubnettingController.validateAllNets(this)}">Check</sl-button></sl-menu-item>
        </sl-details>

        <sl-details id="packet-sending-extension" summary="Packet sending extension">
          <sl-menu-item style="display: flex;">
            <sl-button size=${this.screen} style="display: inline-block;" class="blue-button" id="setSourceBtn" @click="${(event) => PacketSimulator.setSource(event, this)}">Choose sender</sl-button>
            <sl-select size=${this.screen} id="ip-source-select" hoist style="display: inline-block; margin-left: 7.5px;" @sl-change="${(event) => { PacketSimulator.sourceIp = event.target.value }}" value="127.0.0.1">
            <sl-menu-item value="127.0.0.1">127.0.0.1</sl-menu-item>
            </sl-select>
          </sl-menu-item>
          <sl-menu-item>
            <sl-button size=${this.screen} style="display: inline-block;" class="blue-button" id="setTargetBtn" @click="${(event) => PacketSimulator.setTarget(event, this)}">Choose receiver</sl-button>
            <sl-select size=${this.screen} id="ip-target-select" hoist style="display: inline-block;" @sl-change="${(event) => { PacketSimulator.targetIp = event.target.value }}" value="127.0.0.1">
            <sl-menu-item value="127.0.0.1">127.0.0.1</sl-menu-item>
            </sl-select>
          </sl-menu-item>
          <sl-menu-item><sl-input class="label-on-left" @sl-change="${(event) => PacketSimulator.duration = event.target.value * 1000}" label="Speed" type='number' min="1"></sl-input></sl-menu-item>
          <sl-menu-item @click="${(event) => { event.target.checked = !event.target.checked; PacketSimulator.focus = event.target.checked; }}"">Focus on animated nodes</sl-menu-item>
          <sl-menu-item>
          <b><i>Session: </i></b>
          <sl-button class="blue-button" size=${this.screen} @click="${() => PacketSimulator.initSession(this)}">Init</sl-icon></sl-button>
          <sl-button class="blue-button" size=${this.screen} @click="${() => PacketSimulator.startSession(this)}"><sl-icon name="play" label="Start simulation session"></sl-icon></sl-button>
          <sl-button class="blue-button" size=${this.screen} @click="${() => PacketSimulator.pauseOrResumeSession(this)}"><sl-icon id="pause-ani" src="/node_modules/@shoelace-style/shoelace/dist/assets/icons/pause.svg" label="Pause simulation session"></sl-icon></sl-button>
          <sl-button class="blue-button" size=${this.screen} @click="${() => PacketSimulator.stopSession(this)}"><sl-icon name="stop-circle" label="Stop simulation session"></sl-icon></sl-button></sl-menu-item>
          <sl-menu-item>
            <sl-details id="tables-for-packet-simulator" summary="Track tables" open>

            </sl-details>
          </sl-menu-item>
          
        </sl-details>
      </sl-menu>
    </div>

    <div class="base">
    <div class="componentMenu">
    <form autocomplete="off"
    style="position: fixed; top: 0; left: 0;">
      <input class="importBtn" type="file" id="import-file">
      <button class="importBtn" type='button' @click="${() => ImportExportController.importFile(this)}">Import</button>
      <button class="importBtn" type='button' @click="${() => ImportExportController.exportFile(this)}">Export</button>
      </form>
      <sl-dropdown placement="bottom">
        <button class="btn" id="host" slot="trigger"><sl-icon name="person"></sl-icon></button>
        <sl-menu>
          <sl-menu-item id="computer" @click="${this.clickOnComponentButton}"><sl-icon name="pc-display-horizontal"></sl-icon></sl-menu-item>
          <sl-menu-item id="mobile" @click="${this.clickOnComponentButton}"><sl-icon name="phone"></sl-menu-item>
        </sl-menu>
      </sl-dropdown>
      <sl-dropdown placement="bottom">
        <button class="btn" id="connector" slot="trigger"><sl-icon name="hdd"></sl-icon></button>
        <sl-menu>
          <sl-menu-item id="router" @click="${this.clickOnComponentButton}">Router <sl-icon name="router"></sl-menu-item>
          <sl-menu-item id="access-point" @click="${this.clickOnComponentButton}">Access Point <sl-icon name="broadcast-pin"></sl-menu-item>
          <sl-menu-item id="repeater" @click="${this.clickOnComponentButton}">Repeater <sl-icon name="hdd"></sl-menu-item>
          <sl-menu-item id="hub" @click="${this.clickOnComponentButton}">Hub <sl-icon src="img/icons/hub.svg"></sl-menu-item>
          <sl-menu-item id="bridge" @click="${this.clickOnComponentButton}">Bridge <sl-icon src="img/icons/bridge.svg"></sl-menu-item>
          <sl-menu-item id="switch" @click="${this.clickOnComponentButton}">Switch <sl-icon src="img/icons/switch.svg"></sl-menu-item>
        </sl-menu>
      </sl-dropdown>
      <button class="btn" id="edge" @click="${this.clickOnComponentButton}"><sl-icon name="share"></sl-icon></button>
      <button class="btn" id="net" @click="${this.clickOnComponentButton}"><sl-icon name="diagram-3"></sl-icon></button>
    </div>

    <sl-divider vertical style="--width: 0.5cqw; --color: white; --spacing: 0px;"></sl-divider>

    <div class="nameBox">
    <sl-tab-group>
      <sl-tab slot="nav" panel="physical">Physical Node</sl-tab>
      <sl-tab slot="nav" panel="logical">Logical Node</sl-tab>

      <sl-tab-panel name="physical">
        <sl-input class="label-on-left" label="Name" id="inputName" placeholder="Name"></sl-input>
        <sl-input class="label-on-left" label="Number of ports" id="ports" placeholder="Number of input ports" type='number' min="1"></sl-input>
        <sl-button size=${this.screen} style="margin-top: 1cqw;" @click="${() => DialogFactory.generateInputsDetailsForNode(this)}">Add details for ports</sl-button>
      </sl-tab-panel>
      <sl-tab-panel name="logical">
      <sl-input class="label-on-left" label="NetID" id="net-num" placeholder="0.0.0.0"></sl-input>
      <sl-input class="label-on-left" label="Netmask" id="net-mask" placeholder="255.255.255.255"></sl-input>
      <sl-input class="label-on-left" label="Bitmask" id="net-bitmask" placeholder="" type='number' min="0" max="32"></sl-input>
      </sl-tab-panel>
    </sl-tab-group>
    </div>
      

    <sl-divider vertical style="--width: 0.5cqw; --color: white; --spacing: 0px;"></sl-divider>

    <div class="colorPalette">
      ${colorOptions}
    </div>

    <sl-divider vertical style="--width: 0.5cqw; --color: white; --spacing: 0px;"></sl-divider>

    <div class="addOption">
      <sl-tooltip content="Click to add your component" placement="left" style="--max-width: 7cqw;">
        <button class="addBtn" id="addCompBtn" title="Add component" @click="${() => GraphNodeFactory.addNode(this)}"><sl-icon name="plus" disabled={this.editable}></sl-icon></button>
      </sl-tooltip>
      <sl-tooltip content="Click to draw connecting links" placement="left" style="--max-width: 7cqw;">
        <button class="addBtn" title="Draw links" id="drawBtn" @click="${() => EdgeController.toggleDrawMode(this)}" style="font-size: 1cqw;">
          <sl-icon id="drawMode" name="plug"></sl-icon>
        </button>
        </sl-tooltip>
        <sl-tooltip content="Click to change color of existing components" placement="left" style="--max-width: 9cqw;">
          <button class="addBtn" id="resetColorBtn" @click="${() => GraphNodeFactory.toggleResetColor(this)}">
            <sl-icon id="changeColorMode" name="eyedropper"></sl-icon>
          </button>
        </sl-tooltip>
    </div>

    </div>

    <div class="canvas" id="myCanvas">
    <div id="cy"></div>
  </div>

    <div id="inputDialog"/>

    </div>
    `
  }

  private clickOnComponentButton(e: Event): void {
    this.currentComponentToAdd = (e.target as HTMLElement).getAttribute('id');
    let nodeToHighLight: string = "";
    switch (this.currentComponentToAdd) {
      case 'computer': case 'mobile':
        nodeToHighLight = 'host';
        break;
      case 'router': case 'access-point': case 'hub': case 'repeater': case 'bridge': case 'switch':
        nodeToHighLight = 'connector';
        break;
      default:
        nodeToHighLight = this.currentComponentToAdd;
        break;
    }

    this.renderRoot.querySelectorAll('.btn').forEach(e => {
      if (e.id == nodeToHighLight) {
        //highlight the chosen component
        (e as HTMLElement).style.border = "solid 2px #404040";
      }
      else {
        //un-highlight other components
        (e as HTMLElement).style.border = "solid 1px transparent";
      }
    });


  }

  private clickOnColor(e: Event): void {
    this.currentColor = (e.target as HTMLElement).getAttribute('id');
    this.renderRoot.querySelectorAll('.colorButton').forEach(e => {
      if (e.id == this.currentColor) {
        (e as HTMLElement).style.border = "solid 2px #404040";
      }
      else {
        (e as HTMLElement).style.border = "solid 1px #ADADAD";
      }
    });

  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has("editable")) {
      // new value is 
      const newValue = this.editable;
      if (newValue) {
        if (this.networkAvailable) this._graph.elements().toggleClass('deletable', true);
        ['host', 'connector', 'edge', 'net', 'addCompBtn', 'drawBtn'].forEach((buttonId) => {
          (this.renderRoot.querySelector('#' + buttonId) as HTMLButtonElement).disabled = false;
        });
      }
      else {
        if (this.networkAvailable) this._graph.elements().toggleClass('deletable', false);
        ['host', 'connector', 'edge', 'net', 'addCompBtn', 'drawBtn'].forEach((buttonId) => {
          (this.renderRoot.querySelector('#' + buttonId) as HTMLButtonElement).disabled = true;
        });
      }
    }

    if (changedProperties.has("automate")) {
      // new value is 
      const newValue = this.automate;
      if (newValue) {
        (this.renderRoot.querySelector('#current-subnet-mode') as SlSelect).disabled = false;
      }
      else {
        (this.renderRoot.querySelector('#current-subnet-mode') as SlSelect).value = 'MANUAL';
        (this.renderRoot.querySelector('#current-subnet-mode') as SlSelect).disabled = true;
        Net.setMode('MANUAL');
      }
    }
  }

}