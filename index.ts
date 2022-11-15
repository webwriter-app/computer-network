import { LitElementWw } from "@webwriter/lit"
import { css, html } from "lit"
import { customElement, property, query } from "lit/decorators.js"
import "./simulators/simulators.ts"
import "@shoelace-style/shoelace/dist/themes/light.css"
import cytoscape from "cytoscape/dist/cytoscape.esm.min.js";
import edgehandles from 'cytoscape-edgehandles/cytoscape-edgehandles.js';
import { SlAnimation, SlDetails, SlInput, SlTextarea, registerIconLibrary, SlButton } from "@shoelace-style/shoelace"

cytoscape.use(edgehandles);

class NodeData {
  data: {
    id: String;
    name: String;
    backgroundPath: String;
    color: String;
  }
}


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

  private objectIconMap: Map<String, String> = new Map<string, string>([
    ["pc", "/node_modules/@shoelace-style/shoelace/dist/assets/icons/pc-display-horizontal.svg"],
    ["switch", "/node_modules/@shoelace-style/shoelace/dist/assets/icons/hdd.svg"],
    ["hub", "/node_modules/@shoelace-style/shoelace/dist/assets/icons/hdd.svg"],
    ["router", "/node_modules/@shoelace-style/shoelace/dist/assets/icons/hdd.svg"],
    ["cloud", "/node_modules/@shoelace-style/shoelace/dist/assets/icons/cloudy.svg"]
  ]);

  @property({ type: Number, reflect: true })
  counter: number = 0;

  @property({ type: String, reflect: true })
  selectedNode: String = "";

  @property({ type: String, reflect: true })
  edgeType: String = "";

  @property()
  _edgeHandles;

  @property({ type: Boolean, reflect: true })
  drawModeOn: boolean = false;


  static styles =
    css`
      .base {
        display: flex;
        width: calc(85vw + 1px);
        height: calc(22vh - 10px);
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
      input {
        margin: 1vh;
        border-radius: 1vh;
        border: LightGrey;
        width: 10vw;
        height: 3vh;
        display: inline-block;
        float: right;
      }
      .nameBox {
        position: fixed;
        right: calc(15vw + 30vh);
        width: 20vw;
        height: calc(22vh - 10px);
        display:grid;
        grid-template-columns: max-content max-content;
        grid-gap:5px;
        align-items: center;
      }
      .nameBox label       { 
        text-align:right; 
        font-size: 1vmax;
        font-family: Sans-serif;
      }
      .nameBox label:after { content: ":"; }

      .dropdown {
        position: relative;
        display: inline-block;
      }
      .dropdown-content {
        display: none;
        position: absolute;
        background-color: LightBlue;
        font-size: 1vmax;
        font-family: Sans-serif;
        min-width: 10vw;
        box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
        z-index: 1;
      }
      .dropdown-content a {
        color: black;
        padding: 12px 16px;
        text-decoration: none;
        display: block;
      }
      #cy {
        height: 100%;
        width: 100%;
        position: absolute;
        left: 0;
        top: 0;
      }

      .dropdown-content a:hover {background-color: SteelBlue;}

      .dropdown:hover .dropdown-content {display: block;}

      .dropdown:hover .dropbtn {background-color: #3e8e41;}

    `;
  render() {
    const colorOptions = [];
    for (const color of this.colors) {
      colorOptions.push(html`<button class="colorButton" id=${color} style="background-color: ${color}" @click="${this.clickOnColor}"></button>`);
    }

    return html`
    <div class="canvas" id="myCanvas">
    <div id="cy"></div>
    </div>

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
          <a id="switch" @click="${() => this.edgeType = "wire"}">Wire</a>
          <a id="hub" @click="${() => this.edgeType = "wireless"}">Wireless</a>
        </div>
      </button>
    </div>

      <div class="nameBox">
        <label>Name</label><input id="inputName" type="text" placeholder="Name">
        <label>IP-Address</label><input id="inputIP" type="text" placeholder="IP-Address">
        <label>MAC-Address</label><input id="inputMAC" type="text" placeholder="MAC-Address">
      </div>

      <div class="colorPalette">
        ${colorOptions}
      </div>

      <div class="addOption">
          <button class="addBtn" @click="${this.addNode}"><sl-icon name="plus"></sl-icon></button>
          <button class="addBtn" @click="${this.removeNode}"><sl-icon name="dash"></sl-icon></button>
          <button class="addBtn" id="drawBtn" @click="${this.toggleDrawMode}"><sl-icon id="drawMode" name="play"></sl-icon></button>
      </div>

    </div>
    
    <network-simulator></network-simulator>
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

  private addNode(): void {
    if (this.currentNodeToAdd == "" || this.currentNodeToAdd == null) {
      return;
    }
    let name: String = (this.renderRoot.querySelector('#inputName') as HTMLInputElement).value.trim();

    if (name == null || name == "") {
      name = this.currentNodeToAdd + this.counter.toString();
    }

    this.counter++;

    if (!this.networkAvailable) {
      this.networkAvailable = true;
      this.initNetwork();
    }
    this._graph.add({
      group: 'nodes',
      data: {
        id: this.currentNodeToAdd + this.counter.toString(),
        name: name,
        backgroundPath: this.objectIconMap.get(this.currentNodeToAdd),
        color: this.currentColor
      },
      position: { x: 10, y: 10 },
    });

  }

  private removeNode(): void {
    this._graph.$('#' + this.selectedNode).remove();
  }

  private toggleDrawMode(): void {
    //TODO: create wireless "edge"
    if(this.edgeType != "wire"){
      return;
    }
    if (!this.drawModeOn) {
      this._edgeHandles.enableDrawMode();
      (this.renderRoot.querySelector('#drawMode') as SlButton).name = "pause";
      (this.renderRoot.querySelector('#drawBtn') as HTMLElement).style.backgroundColor = "SteelBlue";
    }
    else {
      this._edgeHandles.disableDrawMode();
      (this.renderRoot.querySelector('#drawMode') as SlButton).name = "play";
      (this.renderRoot.querySelector('#drawBtn') as HTMLElement).style.backgroundColor = "DodgerBlue";
    }
    this.drawModeOn = !this.drawModeOn;
  }

  private initNetwork(): void {
    this._graph = cytoscape({
      container: this._cy,

      boxSelectionEnabled: false,
      autounselectify: true,

      style: cytoscape.stylesheet()
        .selector('node')
        .css({
          "shape": "round-rectangle",
          "label": "data(name)",
          "height": 20,
          "width": 20,
          'background-image': "data(backgroundPath)",
          'background-color': "data(color)",
          'font-size': 15,

        })
        .selector(':selected')
        .css({
          'background-color': 'grey',
          'line-color': 'black',
          'target-arrow-color': 'black',
          'source-arrow-color': 'black',
          'text-outline-color': 'black'
        })
      ,
      layout: {
        name: 'grid',
        padding: 2
      },
      // initial viewport state:
      zoom: 5,
      pan: { x: 0, y: 0 },
      minZoom: 3,
      maxZoom: 1e50,
    });

    this._graph.on('tap', 'node', (e: any) => {
      var node = e.target;
      console.log('tapped ' + node.id());
      this.selectedNode = node.id();
    });


    // the default values of each option are outlined below:
    let defaults = {
      canConnect: function (sourceNode, targetNode) {
        // whether an edge can be created between source and target
        return !sourceNode.same(targetNode); // e.g. disallow loops
      },
      edgeParams: function (sourceNode, targetNode) {
        // for edges between the specified source and target
        // return element object to be passed to cy.add() for edge
        return {};
      },
      hoverDelay: 150, // time spent hovering over a target node before it is considered selected
      snap: true, // when enabled, the edge can be drawn by just moving close to a target node (can be confusing on compound graphs)
      snapThreshold: 50, // the target node must be less than or equal to this many pixels away from the cursor/finger
      snapFrequency: 15, // the number of times per second (Hz) that snap checks done (lower is less expensive)
      noEdgeEventsInDraw: true, // set events:no to edges during draws, prevents mouseouts on compounds
      disableBrowserGestures: true // during an edge drawing gesture, disable browser gestures such as two-finger trackpad swipe and pinch-to-zoom
    };

    //register edge handles
    this._edgeHandles = this._graph.edgehandles(defaults);
  }


}