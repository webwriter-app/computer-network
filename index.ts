import { LitElementWw } from "@webwriter/lit"
import { css, html } from "lit"
import { customElement, property, query } from "lit/decorators.js"
import "@shoelace-style/shoelace/dist/themes/light.css"
import cytoscape from "cytoscape/dist/cytoscape.esm.min.js";
import edgehandles from 'cytoscape-edgehandles/cytoscape-edgehandles.js';
import { SlAnimation, SlDetails, SlInput, SlTextarea, registerIconLibrary, SlButton, SlMenu, SlMenuLabel, SlMenuItem, SlDivider, SlCheckbox } from "@shoelace-style/shoelace"
import { addNode, toggleDrawMode, toggleResetColor } from "./network-manipulation/component-manipulation"
import contextMenus from 'cytoscape-context-menus/cytoscape-context-menus.js';

// import CSS as well
import 'cytoscape-context-menus/cytoscape-context-menus.css';
import { toggleSubnetting } from "./adressing/subnetting-controller";


// register extension
cytoscape.use(contextMenus);
cytoscape.use(edgehandles);

@customElement("computer-network")
export class ComputerNetwork extends LitElementWw {


  @query('#cy')
  _cy;

  @property({ reflect: true })
  _graph;

  @property({ type: String, reflect: true })
  currentNodeToAdd: String = "";

  @property({ type: String, reflect: true })
  currentColor: String = "white";

  @property() colors = ['AntiqueWhite', 'Lavender', 'LemonChiffon', 'LavenderBlush', 'LightCoral', 'LightPink', 'LightGreen', 'LightSalmon', 'PaleTurquoise', 'Tomato',
    'Plum', 'Aquamarine', 'Chartreuse', 'LightGrey', 'GreenYellow', 'LightSeaGreen'];

  @property({ type: Boolean, reflect: true })
  networkAvailable: Boolean = false;

  objectIconMap: Map<String, String> = new Map<string, string>([
    ["pc", "/node_modules/@shoelace-style/shoelace/dist/assets/icons/pc-display-horizontal.svg"],
    ["switch", "/node_modules/@shoelace-style/shoelace/dist/assets/icons/hdd.svg"],
    ["hub", "/node_modules/@shoelace-style/shoelace/dist/assets/icons/hdd.svg"],
    ["router", "/node_modules/@shoelace-style/shoelace/dist/assets/icons/hdd.svg"],
    ["cloud", "/node_modules/@shoelace-style/shoelace/dist/assets/icons/cloudy.svg"]
  ]);

  @property({ type: Number, reflect: true })
  nodeCounter: number = 0;

  @property({ type: Number, reflect: true })
  edgeCounter: number = 0;

  @property({ type: String, reflect: true })
  edgeType: String = "";

  @property()
  _edgeHandles; //controller for edgehandles extension

  @property()
  _instance; //controller for menu extension

  @property()
  _cdnd; //controller for drag-and-drop compound nodes extension

  @property({ type: Boolean, reflect: true })
  drawModeOn: boolean = false;

  @property({ type: Boolean, reflect: true })
  resetColorModeOn: boolean = false;

  @property({
    type: Boolean,
    reflect: true
  })
  editable: boolean = true;

  static styles =
    css`
    .base {
      display: flex;
      width: calc(85vw + 1px);
      height: calc(22vh - 4px);
      margin-bottom: 2vh;
      background-color: LightBlue;
    }
    .btn {
        border-radius: 1vh;
        background-color: DodgerBlue;
        border: dashed transparent;
        color: white;
        align-items: center;
        margin: 6vh 2vw;
        font-size: 2vmin;
        cursor: pointer;
        width: 8vh;
        height: 8vh;
    }
    .btn:hover {
        background-color: SteelBlue;
    }
    .addOption {
        margin-left: auto;
        margin-right: 0;
        right: 0;
        width: 10vh;
        height: calc(22vh - 10px);
    }
    .addBtn {
        border-radius: 1vh;
        background-color: DodgerBlue;
        border: dashed transparent;
        color: white;
        align-items: center;
        margin: 1vh 1vw;
        font-size: 2vh;
        cursor: pointer;
        width: 5vh;
        height: 5vh;
    }
    .addBtn:hover {
        background-color: SteelBlue;
    }
    .colorPalette {
        position: fixed;
        right: calc(15vw + 10vh);
        width: 20vh;
        height: calc(22vh - 10px);
        margin-top: 0.5vh;
    }
    .colorButton {
        flex-wrap: wrap;
        border-radius: 1vh;
        border: dashed transparent;
        margin: 1vh;
        cursor: pointer;
        width: 3vh;
        height: 3vh;
    }
    #myCanvas {
        position: fixed;
        bottom: 1vh;
        width: 85vw;
        height: 75vh;
        border: 1px solid SteelBlue;
    }
    .nameBox {
        position: fixed;
        right: calc(15vw + 30vh);
        width: 20vw;
        height: calc(22vh - 10px);
        top: 3vh;
    }
    .dropdown {
        position: relative;
        display: inline-block;
    }
    .dropdown-content {
        display: none;
        position: absolute;
        background-color: LightBlue;
        font-size: 1.2vmax;
        font-family: system-ui;
        min-width: 8vw;
        box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
        z-index: 1;
    }
    .dropdown-content a {
        color: black;
        padding: 1vh 1vw;
        text-decoration: none;
        display: block;
        padding: 1vh 0;
        border: dashed transparent;
    }
    #cy {
        height: 100%;
        width: 100%;
        position: flex;
        left: 0;
        top: 0;
    }
    .dropdown-content a:hover {
        background-color: SteelBlue;
    }
    .dropdown:hover .dropdown-content {
        display: block;
    }
    .dropdown:hover .dropbtn {
        background-color: #3e8e41;
    }
    .rainbowBtn {
        display: inline-block;
        background: linear-gradient(#faceca, #fae1ca, #ecfaca, #cafae4), linear-gradient(#faceca, #fae1ca, #ecfaca, #cafae4);
        color: white;
        background-clip:  border-box, text;
        background-position: center center;
        box-shadow:inset 0 0 0 100px DodgerBlue;
        background-size:  110% 110%;

        border-radius: 1vh;
        border: dashed transparent;
        align-items: center;
        margin: 1vh 1vw;
        font-size: 1.8vh;
        cursor: pointer;
        width: 5vh;
        height: 5vh;
    }
    .rainbowBtn:hover {
        box-shadow: inset 0 0 0 100px SteelBlue;
    }
  
    /** CONTEXTUAL MENU - cytoscape **/
    .custom-menu-item {
        border: none !important;
        height: 32px !important;
        width: 170px !important;
        padding-left: 24px !important;
        color: rgb(0, 0, 0, 0.87) !important;
        background-color: #fafafa !important;
        font-weight: normal !important;
        font-size: 13px !important;
        text-align: left !important;
        box-shadow: none !important;
    }
    .custom-menu-item:hover {
        background-color: #c8c8c8 !important;
    }
    .custom-context-menu {
        border: none !important;
        padding-top: 8px !important;
        padding-bottom: 8px !important;
        background-color: #fafafa !important;
        box-shadow: 0px 0px 8px 0px rgb(0, 0, 0, 0.12),
            0px 8px 8px 0px rgb(0, 0, 0, 0.24) !important;
    }

    /** SL-INPUT **/
    .label-on-left {
      --label-width: 5vw;
      --gap-width: 1rem;
    }
    .label-on-left + .label-on-left {
      margin-top: var(--sl-spacing-medium);
    }
    .label-on-left::part(form-control) {
      display: grid;
      grid: auto / var(--label-width) 1fr;
      gap: var(--sl-spacing-3x-small) var(--gap-width);
      align-items: center;
    }
    .label-on-left::part(form-control-label) {
      text-align: right;
    }
    .label-on-left::part(form-control-help-text) {
      grid-column: span 2;
      padding-left: calc(var(--label-width) + var(--gap-width));
    }

    /** additional info next to Node **/
    .element-info-box {
      margin: auto;
      border-radius: 0.5vh;
      border: solid 0.1vh gray;
      font-size: 0.3vw;
      font-family: monospace;
      background: white;
      display: inline-flex;

      margin-top: 10px;
      padding: 0.5vh;
    }

    network-simulator {
      position: absolute;
      bottom: 5px;
      right: 5px;
      width: calc(14vw - 10px);
      height: calc(100vh - 10px);
      background-color: LightBlue;
    }
    
`;
  render() {
    const colorOptions = [];
    for (const color of this.colors) {
      colorOptions.push(html`<button class="colorButton" id=${color} style="background-color: ${color}" @click="${this.clickOnColor}"></button>`);
    }

    return html`
    

    <div class="base">
      <button class="btn" id="pc" @click="${this.clickOnNode}"><sl-icon name="pc-display-horizontal"></sl-icon></button>
      
      <div class="dropdown">
        <button class="btn" id="hdd">
          <sl-icon name="hdd"></sl-icon>
          <div class="dropdown-content">
            <a id="switch" @click="${this.clickOnNode}">Switch</a>
            <a id="hub" @click="${this.clickOnNode}">Hub</a>
            <a id="router" @click="${this.clickOnNode}">Router</a>
          </div>
        </button>
      </div>

      <button id="cloud" class="btn" @click="${this.clickOnNode}"><sl-icon name="cloudy"></sl-icon></button>

      <div class="dropdown">
      <button class="btn" id="edge">
        <sl-icon name="share"></sl-icon>
        <div class="dropdown-content">
          <a id="switch" @click="${() => this.edgeType = "wire"}"><sl-icon name="arrow-left-right"></a>
          <a id="hub" @click="${() => this.edgeType = "wire"}"><sl-icon name="arrow-right"></a>
          <a id="hub" @click="${() => this.edgeType = "wireless"}"><sl-icon name="broadcast-pin"></a>
        </div>
      </button>
    </div>

      <div class="nameBox">
        <sl-input class="label-on-left" label="Name" id="inputName" placeholder="Name"></sl-input>
        <sl-input class="label-on-left" label="IP-Address" id="inputIP" placeholder="IP-Address"></sl-input>
        <sl-input class="label-on-left" label="MAC-Address" id="inputMAC" placeholder="MAC-Address"></sl-input>
      </div>

      <div class="colorPalette">
        ${colorOptions}
      </div>

      <div class="addOption">
        <sl-tooltip content="Click to add your component" placement="right" style="--max-width: 7vw;">
          <button class="addBtn" title="Add component" @click="${() => addNode(this)}"><sl-icon name="plus" disabled={this.editable}></sl-icon></button>
        </sl-tooltip>
        <sl-tooltip content="Click to draw connecting links" placement="right" style="--max-width: 7vw;">
          <button class="addBtn" title="Draw links" id="drawBtn" @click="${() => toggleDrawMode(this)}" style="font-size: 1.6vh;">
            <sl-icon id="drawMode" name="share"></sl-icon>
          </button>
        </sl-tooltip>
        <sl-tooltip content="Click to change color of existing components" placement="right" style="--max-width: 9vw;">
          <button class="rainbowBtn" id="resetColorBtn" @click="${() => toggleResetColor(this)}">
            <sl-icon id="changeColorMode" name="eyedropper"></sl-icon>
          </button>
        </sl-tooltip>
      </div>

    </div>


    <div class="canvas" id="myCanvas">
    <div id="cy"></div>
    </div>

    <sl-dialog label="Component details" id="infoDialog">
    </sl-dialog>

    <network-simulator>
      <sl-menu style="background-color: LightBlue; border: transparent;">
        <sl-menu-label>Labeling</sl-menu-label>
        <sl-menu-item><sl-checkbox id="IpCheckBox">Show IP</sl-checkbox></sl-menu-item>
        <sl-menu-item><sl-checkbox id="IpBinCheckBox">Show IP binary</sl-checkbox></sl-menu-item>
        <sl-menu-item><sl-checkbox id="MacCheckBox">Show MAC</sl-checkbox></sl-menu-item>

        <sl-divider style="--width: 1vh; --color: white"></sl-divider>

        <sl-menu-label>Subnetting extension</sl-menu-label>
        <sl-menu-item @click="${(event) => toggleSubnetting(event, this)}" style="font-size: 0.1vw !important;">Activate Draw-and-drop</sl-menu-item>
        <sl-menu-item>etc</sl-menu-item>
        <sl-menu-item>etc</sl-menu-item>

        <sl-divider style="--width: 1vh; --color: white"></sl-divider>

        <sl-menu-label>Firewall extension</sl-menu-label>
        <sl-menu-item>etc</sl-menu-item>
        <sl-menu-item>etc</sl-menu-item>
        <sl-menu-item>etc</sl-menu-item>
      </sl-menu>
    </network-simulator>
    `
  }

  private clickOnNode(e: Event): void {
    this.currentNodeToAdd = (e.target as HTMLElement).getAttribute('id')!;
    this.renderRoot.querySelectorAll('.btn').forEach(e => {
      (e as HTMLElement).style.border = "dashed transparent";
    });
    switch (this.currentNodeToAdd) {
      case 'pc': case 'cloud':
        (this.renderRoot.querySelector('#' + this.currentNodeToAdd) as HTMLElement).style.border = "dashed rgb(50,50,50)";
        break;
      case 'switch': case 'hub': case 'router':
        (this.renderRoot.querySelector('#hdd') as HTMLElement).style.border = "dashed rgb(50,50,50)";
        break;
      default: break;
    }
  }

  private clickOnColor(e: Event): void {
    this.currentColor = (e.target as HTMLElement).getAttribute('id')!;
    this.renderRoot.querySelectorAll('.colorButton').forEach(e => {
      (e as HTMLElement).style.border = "dashed transparent";
    });
    (this.renderRoot.querySelector('#' + this.currentColor) as HTMLElement).style.border = "dashed rgb(80,80,80)";
  }

}