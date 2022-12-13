import { LitElementWw } from "@webwriter/lit"
import { css, html } from "lit"
import { customElement, property, query } from "lit/decorators.js"
import "@shoelace-style/shoelace/dist/themes/light.css"
import { toggleDragAndDropSubnetting, validateAllSubnets } from "./event-handlers/subnetting-controller";

import 'cytoscape-context-menus/cytoscape-context-menus.css';
import { Ipv4Address } from "./adressing/Ipv4Address"
import { MacAddress } from "./adressing/MacAddress"
import { GraphNodeFactory } from "./event-handlers/component-manipulation";
import { EdgeController } from "./event-handlers/edge-controller";
import { DialogFactory } from "./event-handlers/dialog-content";
import { Subnet } from "./components/logicalNodes/Subnet";


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

  ipv4Database: Map<string, Ipv4Address> = new Map<string, Ipv4Address>();
  macDatabase: Map<string, MacAddress> = new Map<string, MacAddress>();
  ipv6Database: Map<string, MacAddress> = new Map<string, MacAddress>();
  ipv4SubnetDatabase: Map<string, Map<number, Ipv4Address>> = new Map();

  static styles =
    css`
    .base {
      display: flex;
      width: 75vw;
      height: 12vw;
      margin-top: 1vw;
      margin-bottom: 1vw;
      background-color: LightBlue;
    }
    .btn {
        border-radius: 0.5vw;
        background-color: DodgerBlue;
        border: dashed transparent;
        color: white;
        align-items: center;
        font-size: 1.6vw;
        cursor: pointer;
        width: 4vw;
        height: 4vw;
        margin: auto;
    }
    .btn:hover {
        background-color: rgb(2, 132, 199);
    }
    .addOption {
        width: 12vw;
        display: flex;
        flex-direction: row;
        gap: 1.5vw;
        margin: auto;
    }
    .addBtn {
        border-radius: 0.5vw;
        background-color: DodgerBlue;
        border: dashed transparent;
        color: white;
        align-items: center;
        font-size: 1vw;
        cursor: pointer;
        width: 3vw;
        height: 3vw;
    }
    .addBtn:hover {
        background-color: rgb(2, 132, 199);
    }
    .colorPalette {
        position: flex;
        width: 10.2vw;
        margin: auto;
        display: flex;
        flex-wrap: wrap;
        gap: 1.4vw;
    }
    .colorButton {
        border-radius: 0.3vw;
        border: dashed transparent;
        cursor: pointer;
        width: 1.5vw;
        height: 1.5vw;
    }
    #myCanvas {
        position: relative;
        width: 75vw;
        height: calc(100vh - 15vw);
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

        border-radius: 0.5vw;
        border: dashed transparent;
        align-items: center;
        font-size: 1vw;
        cursor: pointer;
        width: 3vw;
        height: 3vw;
    }
    .rainbowBtn:hover {
        box-shadow: inset 0 0 0 100px rgb(2, 132, 199);
    }
  
    /** CONTEXTUAL MENU - cytoscape **/
    .custom-menu-item {
        border: none !important;
        height: 3vw !important;
        width: 8vw !important;
        padding-left: 1vw !important;
        color: black !important;
        background-color: white !important;
        font-family: --sl-font-sans !important;
        font-weight: normal !important;
        font-size: 0.8vw !important;
        text-align: left !important;
        box-shadow: none !important;
    }
    .custom-menu-item:hover {
        background-color: LightBlue !important;
    }
    .custom-context-menu {
        border: none !important;
        padding-top: 0.5vw !important;
        padding-bottom: 0.5vw !important;
        border-radius: 0.2vw !important;
        background-color: #fafafa !important;
        box-shadow: 0px 0px 8px 0px rgb(0, 0, 0, 0.12),
            0px 8px 8px 0px rgb(0, 0, 0, 0.24) !important;
    }

    /** SL-INPUT **/
    .label-on-left {
      --label-width: 3vw;
      --gap-width: 2vw;
      margin: auto;
    }
    sl-input::part(base), sl-input::part(input) {
      border: none;
      font-size: 0.8vw;
			height: 1.5vw;
    }
    .label-on-left::part(form-control) {
      display: grid;
      grid: auto / var(--label-width) 1fr;
      gap: 1vw;
      align-items: center;
    }
    .label-on-left::part(form-control-label) {
      text-align: right;
      font-size: 0.8vw;
    }
    .label-on-left::part(form-control-help-text) {
      grid-column: span 2;
      padding-left: calc(var(--label-width) + var(--gap-width));
    }

    sl-checkbox::part(base), sl-checkbox::part(label) {
      font-size: 0.8vw;
      height: 1.5vw;
    }
    sl-menu-item::part(base), sl-menu-item::part(label) {
      font-size: 0.8vw;
      height: 1.5vw;
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

    /** additional info next to Node **/
    .element-info-box {
      margin: auto;
      border-radius: 0.2vw;
      border: solid 0.1vw gray;
      font-size: 0.3vw;
      font-family: monospace;
      background: white;
      display: block;
      padding: 0 0.2vw;
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
      height: calc(100vh - 1.8vw);
      position: fixed;
      right: 0;
      background: LightBlue;
      width: 23.7vw;
    }
    
`;
  render() {
    const colorOptions = [];
    for (const color of this.colors) {
      colorOptions.push(html`<button class="colorButton" id=${color} style="background-color: ${color}" @click="${this.clickOnColor}"></button>`);
    }

    return html`

    <div class="sidebar">
    <sl-menu style="background-color: LightBlue; border: transparent;">
    <sl-details summary="Subnetting extension" open>
      <sl-select id="current-subnet-mode" label="Choose one mode:" @sl-change="${(event)=>{Subnet.setMode(event.target.value)}}" value="MANUAL">
        <sl-menu-item value="HOST_BASED">Hosts-based Mode</sl-menu-item>
        <sl-menu-item value="SUBNET_BASED">Subnet-based Mode</sl-menu-item>
        <sl-menu-item value="MANUAL">Manual Mode</sl-menu-item>
      </sl-select>
      <div class="details-group-example" @sl-show="${(event) => { this.renderRoot.querySelector('.details-group-example').querySelectorAll('sl-details').forEach(details => (details.open = event.target === details)) }}">
  <sl-details summary="Hosts-based Mode">
    A bottom-up auto calculation of subnet number according to hosts' IPv4 Addresses.
  </sl-details>

  <sl-details summary="Subnet-based Mode">
    A top-down auto adaptation of IPv4 addresses for hosts according to subnet number.
  </sl-details>

  <sl-details summary="Manual Mode">
    A manual mode that let you manually assign the IPv4 Addresses and Subnet number, validate with the <strong>check</strong> button.
    <sl-button @click="${() => validateAllSubnets(this)}">Check</sl-button>
  </sl-details>
  
</div>
<sl-menu-item @click="${(event) => toggleDragAndDropSubnetting(event, this)}" style="font-size: 0.1vw !important;">Activate Draw-and-drop</sl-menu-item>
</sl-details>

    <sl-details summary="Packet sending extension">
      <sl-menu-label>Some explanations for the extension</sl-menu-label>
      <sl-menu-item>etc</sl-menu-item>
      <sl-menu-item>etc</sl-menu-item>
      <sl-menu-item>etc</sl-menu-item>
    </sl-details>
    </sl-menu>
  </div>

    <div class="base">

    <div style="position:relative; width: 25vw; display: flex; flex-direction: row; gap: auto; padding: auto">
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

    <sl-divider vertical style="--width: 0.5vw; --color: white;"></sl-divider>

    <div style="position:relative; margin: 0 auto;">
    <sl-tab-group>
      <sl-tab slot="nav" panel="physical">Physical Node</sl-tab>
      <sl-tab slot="nav" panel="logical">Logical Node</sl-tab>

      <sl-tab-panel name="physical">
        <sl-input class="label-on-left" label="Name" id="inputName" placeholder="Name"></sl-input>
        <sl-input class="label-on-left" label="Number of ports/ interfaces" id="ports" placeholder="Number of input ports" type='number' min="1"></sl-input>
        <sl-button style="margin-top: 1vw;" @click="${() => DialogFactory.generateInputsDetailsForNode(this)}">Add details for ports/ interfaces</sl-button>
      </sl-tab-panel>
      <sl-tab-panel name="logical">
      <sl-input class="label-on-left" label="Subnet Number" id="subnet-num" placeholder="Network ID"></sl-input>
      <sl-input class="label-on-left" label="Subnet Mask" id="subnet-mask" placeholder="255.255.255.255"></sl-input>
      <sl-input class="label-on-left" label="Bitmask" id="subnet-bitmask" placeholder="" type='number' min="0" max="32"></sl-input>
      </sl-tab-panel>
    </sl-tab-group>

      
    </div>
      

    <sl-divider vertical style="--width: 0.5vw; --color: white;"></sl-divider>

    <div class="colorPalette">
      ${colorOptions}
    </div>

    <sl-divider vertical style="--width: 0.5vw; --color: white;"></sl-divider>

    <div class="addOption">
      <sl-tooltip content="Click to add your component" placement="left" style="--max-width: 7vw;">
        <button class="addBtn" title="Add component" @click="${() => GraphNodeFactory.addNode(this)}"><sl-icon name="plus" disabled={this.editable}></sl-icon></button>
      </sl-tooltip>
      <sl-tooltip content="Click to draw connecting links" placement="left" style="--max-width: 7vw;">
        <button class="addBtn" title="Draw links" id="drawBtn" @click="${() => EdgeController.toggleDrawMode(this)}" style="font-size: 1vw;">
          <sl-icon id="drawMode" name="plug"></sl-icon>
        </button>
        </sl-tooltip>
        <sl-tooltip content="Click to change color of existing components" placement="left" style="--max-width: 9vw;">
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