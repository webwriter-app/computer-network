import { LitElementWw } from "@webwriter/lit"
import { css, html } from "lit"
import { customElement, property, query } from "lit/decorators.js"
import "./simulators/simulators.ts"
import "@shoelace-style/shoelace/dist/themes/light.css"
import cytoscape from "cytoscape/dist/cytoscape.esm.min.js";
import { SlAnimation, SlDetails, SlInput, SlTextarea, registerIconLibrary } from "@shoelace-style/shoelace"

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

  @property({ type: Array<NodeData>, reflect: true })
  nodes: Array<any> = [];

  @property({ type: Array<any>, reflect: true })
  edges: Array<any> = [];

  @property({ type: String, reflect: true })
  currentNodeToAdd: String = "";

  @property({ type: String, reflect: true })
  currentColor: String = "white";

  @property() colors = ['AntiqueWhite', 'Lavender', 'LemonChiffon', 'LavenderBlush', 'LightCoral', 'LightPink', 'LightGreen', 'LightSalmon', 'PaleTurquoise', 'Tomato',
    'Plum', 'Aquamarine', 'Chartreuse', 'Grey', 'GreenYellow', 'LightSeaGreen'];

  private objectIconMap: Map<String, String> = new Map<string, string>([
    ["pc", "/node_modules/@shoelace-style/shoelace/dist/assets/icons/pc-display-horizontal.svg"],
    ["switch", "/node_modules/@shoelace-style/shoelace/dist/assets/icons/hdd.svg"],
    ["hub", "/node_modules/@shoelace-style/shoelace/dist/assets/icons/hdd.svg"],
    ["router", "/node_modules/@shoelace-style/shoelace/dist/assets/icons/hdd.svg"],
    ["cloud", "/node_modules/@shoelace-style/shoelace/dist/assets/icons/cloudy.svg"]
  ]);

  @property({ type: Number, reflect: true })
  counter: number = 0;


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
        border: none;
        color: white;
        padding: 10px;
        margin: 5vh 2vw;
        font-size: 23px;
        cursor: pointer;
        width: 10vh;
        height: 10vh;
      }
      /* Darker background on mouse-over */
      .btn:hover {
        background-color: SteelBlue;
    }
    .addOption {
      position: fixed;
      right: 15vw;
      top: 2vh;
      width: 10vh;
      height: calc(22vh - 10px);
    }
    .addBtn {
      border-radius: 1vh;
      background-color: DodgerBlue;
      border: none;
      color: white;
      padding: 10px;
      margin: 2vh 1vw;
      font-size: 14px;
      cursor: pointer;
      width: 5vh;
      height: 5vh;
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
      border: none;
      margin: 1vh;
      cursor: pointer;
      width: 3vh;
      height: 3vh;
    }

    #myCanvas {
      position: fixed;
      bottom: 1vh;
      left: 1vw;
      width: 85vw;
      height: 75vh;
      border: 1px solid CadetBlue;
    }
    
    .dropdown {
      position: relative;
      display: inline-block;
    }
    
    .dropdown-content {
      display: none;
      position: absolute;
      background-color: #f1f1f1;
      min-width: 160px;
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
    
    .dropdown-content a:hover {background-color: #ddd;}
    
    .dropdown:hover .dropdown-content {display: block;}
    
    .dropdown:hover .dropbtn {background-color: #3e8e41;}

    `;
  render() {
    const colorOptions = [];
    for (const color of this.colors) {
      colorOptions.push(html`<button class="colorButton" style="background-color: ${color}" @click="${() => this.currentColor = color}"></button>`);
    }

    return html`
    <div class="canvas" id="myCanvas">
    <div id="cy"></div>
    </div>

    <div class="base">
      <button class="btn" @click="${() => this.currentNodeToAdd = "pc"}"><sl-icon name="pc-display-horizontal"></sl-icon></button>
      
      <div class="dropdown">
        <button class="btn">
          <sl-icon name="hdd"></sl-icon>
          <div class="dropdown-content">
            <a @click="${() => this.currentNodeToAdd = "switch"}">Switch</a>
            <a @click="${() => this.currentNodeToAdd = "hub"}">Hub</a>
            <a @click="${() => this.currentNodeToAdd = "router"}">Router</a>
          </div>
        </button>
      </div>

      <button class="btn"><sl-icon name="share"></sl-icon></button>
      <button class="btn" @click="${() => this.currentNodeToAdd = "cloud"}"><sl-icon name="cloudy"></sl-icon></button>

      <div class="colorPalette">

      ${colorOptions}

      </div>


      <div class="addOption">
          <button class="addBtn" @click="${this.addNode}"><sl-icon name="plus-square"></sl-icon></button>
          <button class="addBtn"><sl-icon name="dash-square"></sl-icon></button>
      </div>
    </div>
    
    <network-simulator></network-simulator>
    `
  }


  private addNode(): void {
    if (this.currentNodeToAdd == "") {
      return;
    }
    this.nodes.push({
      data: {
        id: this.currentNodeToAdd + this.counter.toString(),
        name: this.currentNodeToAdd + this.counter.toString(),
        backgroundPath: this.objectIconMap.get(this.currentNodeToAdd),
        color: this.currentColor
      },
    });
    this.counter++;
    this.initNetwork();
  }

  private initNetwork(): void {
    this._cy = cytoscape({
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

      elements: {
        nodes: this.nodes,
        edges: this.edges
      },

      layout: {
        name: 'grid',
        padding: 2
      }
    });

    this._cy.on('tap', 'node', function () {
      try { // your browser may block popups
      } catch (e) { // fall back on url change
      }
    });

  }
}