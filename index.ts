import { LitElementWw } from "@webwriter/lit"
import { css, html } from "lit"
import { customElement, property, query } from "lit/decorators.js"
import "@shoelace-style/shoelace/dist/themes/light.css"

import 'cytoscape-context-menus/cytoscape-context-menus.css';
import { Ipv4Address } from "./src/adressing/Ipv4Address"
import { MacAddress } from "./src/adressing/MacAddress"
import { GraphNodeFactory } from "./src/event-handlers/component-manipulation";
import { EdgeController } from "./src/event-handlers/edge-controller";
import { DialogFactory } from "./src/event-handlers/dialog-content";
import { SubnettingController } from "./src/event-handlers/subnetting-controller";
import { Subnet } from "./src/components/logicalNodes/Subnet";
import { PacketSimulator } from "./src/event-handlers/packet-simulator";


@customElement("computer-network")
export class ComputerNetwork extends LitElementWw {


  @query('#cy')
  _cy;

  @property({ reflect: true })
  _graph;

  @property({ type: String, reflect: true })
  currentComponentToAdd: string = "";

  @property({ type: String, reflect: true })
  currentColor: string = "white";

  @property() colors = ['AntiqueWhite', 'Lavender', 'LemonChiffon', 'LavenderBlush', 'LightCoral', 'LightPink', 'LightGreen', 'LightSalmon', 'PaleTurquoise', 'Tomato',
    'Plum', 'Aquamarine', 'Chartreuse', 'LightGrey', 'GreenYellow', 'LightSeaGreen'];

  @property({ type: Boolean, reflect: true })
  networkAvailable: Boolean = false;

  @property()
  _edgeHandles; //controller for edgehandles extension

  @property({ type: Boolean, reflect: true })
  drawModeOn: boolean = false;

  @property()
  _instance; //controller for menu extension

  @property()
  _cdnd; //controller for drag-and-drop compound nodes extension

  @property({ type: Boolean, reflect: true })
  resetColorModeOn: boolean = false;

  @property({
    type: Boolean,
    reflect: true
  })
  editable: boolean = true;

  ipv4Database: Map<string, string> = new Map<string, string>(); //(address, nodeId)
  macDatabase: Map<string, string> = new Map<string, string>();
  ipv6Database: Map<string, string> = new Map<string, string>();

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
      margin-top: 1cqw;
      margin-bottom: 1cqw;
      background-color: LightBlue;
    }
    .btn {
        border-radius: 0.5cqw;
        background-color: DodgerBlue;
        border: dashed transparent;
        color: white;
        align-items: center;
        font-size: 1.6cqw;
        cursor: pointer;
        width: 4cqw;
        height: 4cqw;
        margin: auto;
    }
    .btn:hover {
        background-color: rgb(2, 132, 199);
    }
    .addOption {
        width: 12cqw;
        display: flex;
        flex-direction: row;
        gap: 1.5cqw;
        margin: auto;
    }
    .addBtn {
        border-radius: 0.5cqw;
        background-color: DodgerBlue;
        border: dashed transparent;
        color: white;
        align-items: center;
        font-size: 1cqw;
        cursor: pointer;
        width: 3cqw;
        height: 3cqw;
    }
    .addBtn:hover {
        background-color: rgb(2, 132, 199);
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
    .colorButton {
        border-radius: 0.3cqw;
        border: dashed transparent;
        cursor: pointer;
        width: 1.5cqw;
        height: 1.5cqw;
    }
    #myCanvas {
        position: relative;
        width: 75cqw;
        height: calc(100vh - 15cqw);
        border: 1px solid SteelBlue;
        flex-grow: 1;
    }
    #cy {
        height: 100%;
        width: 100%;
        position: absolute;
    }
    .rainbowBtn {
        display: inline-block;
        background: linear-gradient(#faceca, #fae1ca, #ecfaca, #cafae4), linear-gradient(#faceca, #fae1ca, #ecfaca, #cafae4);
        color: white;
        background-clip:  border-box, text;
        background-position: center center;
        box-shadow:inset 0 0 0 100px DodgerBlue;
        background-size:  110% 110%;

        border-radius: 0.5cqw;
        border: dashed transparent;
        align-items: center;
        font-size: 1cqw;
        cursor: pointer;
        width: 3cqw;
        height: 3cqw;
    }
    .rainbowBtn:hover {
        box-shadow: inset 0 0 0 100px rgb(2, 132, 199);
    }
    .componentMenu {
      position:relative; 
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
        background-color: LightBlue !important;
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
    .label-on-left {
      --label-width: 3cqw;
      --gap-width: 2cqw;
      margin: auto;
    }
    sl-input::part(base), sl-input::part(input) {
      border: none;
      font-size: max(0.8cqw, 12px);
			height: max(40px, 1.5cqw);
    }
    .label-on-left::part(form-control) {
      display: grid;
      grid: auto / var(--label-width) 1fr;
      gap: 1cqw;
      align-items: center;
    }
    .label-on-left::part(form-control-label) {
      text-align: right;
      font-size: max(0.8cqw, 12px);
    }
    .label-on-left::part(form-control-help-text) {
      grid-column: span 2;
      padding-left: calc(var(--label-width) + var(--gap-width));
    }

    sl-checkbox::part(base), sl-checkbox::part(label) {
      font-size: max(0.8cqw, 12px);
      height: max(40px, 1.5cqw);
    }
    sl-menu-item::part(base), sl-menu-item::part(label) {
      font-size: max(0.8cqw, 12px);
      height: max(40px, 1.5cqw);
    }
    .blue-button::part(base) {
      background-color: LightBlue;
      border: none;
    }
    sl-details::part(base) {
      background-color: LightBlue;
      border: none;
    }
    sl-details::part(summary) {
      font-size: 14px;
      font-weight: 600;
      color: 	#567d96;
      font-family: sans-serif;
    }


    sl-dropdown {
      display:flex;
      justify-content: space-between;
      margin: auto;
    }

    sl-dialog::part(base), sl-select::part(base) {
      --width: fit-content;
    }

    td {
      text-align: center;
    }

    .sidebar {
      height: calc(100vh - 1.8cqw);
      position: fixed;
      right: 0;
      background: LightBlue;
      width: 23.7cqw;
    }

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
      <sl-menu style="background-color: LightBlue; border: transparent; height: fit-content;">
        <sl-details summary="Subnetting extension" open>
          <sl-menu-label>Choose a mode:
            <sl-select id="current-subnet-mode" @sl-change="${(event)=>{Subnet.setMode(event.target.value)}}" value="MANUAL">
            <sl-menu-item value="MANUAL">Manual Mode</sl-menu-item>
            <sl-menu-item value="SUBNET_BASED">Subnet-based Mode</sl-menu-item>
            <sl-menu-item value="HOST_BASED">Host-based Mode</sl-menu-item>
          </sl-select>
          </sl-menu-label>
          <sl-menu-item @click="${(event) => SubnettingController.toggleDragAndDropSubnetting(event, this)}" style="font-size: max(0.1cqw, 12px) !important;">Activate Draw-and-drop</sl-menu-item>
          <sl-menu-item @click="${(event) => SubnettingController.toggleAssigningGateway(event)}" style="font-size: max(0.1cqw, 12px) !important;">Drag to assign gateway</sl-menu-item>
          <sl-menu-item><sl-button class="blue-button" @click="${() => SubnettingController.validateAllSubnets(this)}">Check</sl-button></sl-menu-item>
        </sl-details>

        <sl-details summary="Packet sending extension">
          <sl-menu-item style="display: flex;">
            <sl-button style="display: inline-block;" class="blue-button" id="setSourceBtn" @click="${(event) => PacketSimulator.setSource(event, this)}">Choose sender</sl-button>
            <sl-select id="ip-source-select" hoist style="display: inline-block; margin-left: 7.5px;" @sl-change="${(event)=>{PacketSimulator.sourceIp = event.target.value}}" value="127.0.0.1">
            <sl-menu-item value="127.0.0.1">127.0.0.1</sl-menu-item>
            </sl-select>
          </sl-menu-item>
          <sl-menu-item>
            <sl-button style="display: inline-block;" class="blue-button" id="setTargetBtn" @click="${(event) => PacketSimulator.setTarget(event, this)}">Choose receiver</sl-button>
            <sl-select id="ip-target-select" hoist style="display: inline-block;" @sl-change="${(event)=>{PacketSimulator.targetIp = event.target.value}}" value="127.0.0.1">
            <sl-menu-item value="127.0.0.1">127.0.0.1</sl-menu-item>
            </sl-select>
          </sl-menu-item>
          <sl-menu-item><sl-input class="label-on-left" @sl-change="${(event) => PacketSimulator.duration=event.target.value*1000}" label="Latency" type='number' min="1"></sl-input></sl-menu-item>
          <sl-menu-item><sl-button class="blue-button" @click="${() => PacketSimulator.startSession(this)}"><sl-icon name="play" label="Start simulation session"></sl-icon></sl-button>
          <sl-button class="blue-button" @click="${() => PacketSimulator.startSession(this)}"><sl-icon name="pause" label="Pause simulation session"></sl-icon></sl-button>
          <sl-button class="blue-button" @click="${() => PacketSimulator.resetDatabase(this)}"><sl-icon name="stop-circle" label="Stop simulation session"></sl-icon></sl-button></sl-menu-item>
          <sl-menu-item>
            <sl-details id="tables-for-packet-simulator" summary="Track tables" open>
          
            </sl-details>
          </sl-menu-item>
          
        </sl-details>
      </sl-menu>
    </div>

    <div class="base">
    <div class="componentMenu">
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
          <sl-menu-item id="hub" @click="${this.clickOnComponentButton}">Hub <sl-icon src="doc/icons/hub.svg"></sl-menu-item>
          <sl-menu-item id="bridge" @click="${this.clickOnComponentButton}">Bridge <sl-icon src="doc/icons/bridge.svg"></sl-menu-item>
          <sl-menu-item id="switch" @click="${this.clickOnComponentButton}">Switch <sl-icon src="doc/icons/switch.svg"></sl-menu-item>
        </sl-menu>
      </sl-dropdown>
      <button class="btn" id="edge" @click="${this.clickOnComponentButton}"><sl-icon name="share"></sl-icon></button>
      <button class="btn" id="subnet" @click="${this.clickOnComponentButton}"><sl-icon name="diagram-3"></sl-icon></button>
    </div>

    <sl-divider vertical style="--width: 0.5cqw; --color: white;"></sl-divider>

    <div class="nameBox">
    <sl-tab-group>
      <sl-tab slot="nav" panel="physical">Physical Node</sl-tab>
      <sl-tab slot="nav" panel="logical">Logical Node</sl-tab>

      <sl-tab-panel name="physical">
        <sl-input class="label-on-left" label="Name" id="inputName" placeholder="Name"></sl-input>
        <sl-input class="label-on-left" label="Number of ports" id="ports" placeholder="Number of input ports" type='number' min="1"></sl-input>
        <sl-button style="margin-top: 1cqw;" @click="${() => DialogFactory.generateInputsDetailsForNode(this)}">Add details for ports</sl-button>
      </sl-tab-panel>
      <sl-tab-panel name="logical">
      <sl-input class="label-on-left" label="Subnet Number" id="subnet-num" placeholder="Network ID"></sl-input>
      <sl-input class="label-on-left" label="Subnet Mask" id="subnet-mask" placeholder="255.255.255.255"></sl-input>
      <sl-input class="label-on-left" label="Bitmask" id="subnet-bitmask" placeholder="" type='number' min="0" max="32"></sl-input>
      </sl-tab-panel>
    </sl-tab-group>
    </div>
      

    <sl-divider vertical style="--width: 0.5cqw; --color: white;"></sl-divider>

    <div class="colorPalette">
      ${colorOptions}
    </div>

    <sl-divider vertical style="--width: 0.5cqw; --color: white;"></sl-divider>

    <div class="addOption">
      <sl-tooltip content="Click to add your component" placement="left" style="--max-width: 7cqw;">
        <button class="addBtn" title="Add component" @click="${() => GraphNodeFactory.addNode(this)}"><sl-icon name="plus" disabled={this.editable}></sl-icon></button>
      </sl-tooltip>
      <sl-tooltip content="Click to draw connecting links" placement="left" style="--max-width: 7cqw;">
        <button class="addBtn" title="Draw links" id="drawBtn" @click="${() => EdgeController.toggleDrawMode(this)}" style="font-size: 1cqw;">
          <sl-icon id="drawMode" name="plug"></sl-icon>
        </button>
        </sl-tooltip>
        <sl-tooltip content="Click to change color of existing components" placement="left" style="--max-width: 9cqw;">
          <button class="rainbowBtn" id="resetColorBtn" @click="${() => GraphNodeFactory.toggleResetColor(this)}">
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
      if(e.id==nodeToHighLight){
        //highlight the chosen component
        (e as HTMLElement).style.border = "dashed rgb(50,50,50)";
      }
      else{
        //un-highlight other components
        (e as HTMLElement).style.border = "dashed transparent";
      }
    });


  }

  private clickOnColor(e: Event): void {
    this.currentColor = (e.target as HTMLElement).getAttribute('id');
    this.renderRoot.querySelectorAll('.colorButton').forEach(e => {
      if(e.id==this.currentColor){
        (e as HTMLElement).style.border = "dashed rgb(80,80,80)";
      }
      else{
        (e as HTMLElement).style.border = "dashed transparent";
      }
    });
    
  }

}