import { SlButton, SlDialog, SlInput, SlSelect, SlTabGroup, SlTabPanel } from "@shoelace-style/shoelace";
import { ComputerNetwork } from "..";
import { Address } from "../adressing/Address";
import { Ipv4Address } from "../adressing/Ipv4Address";
import { Ipv6Address } from "../adressing/Ipv6Address";
import { MacAddress } from "../adressing/MacAddress";
import { GraphEdge } from "../components/GraphEdge";
import { Subnet } from "../components/logicalNodes/Subnet";
import { Router } from "../components/physicalNodes/Connector";
import { PhysicalNode } from "../components/physicalNodes/PhysicalNode";
import { AlertHelper } from "../utils/AlertHelper";


export class DialogFactory {
  static generateInputsDetailsForNode(network: ComputerNetwork): void {

    let currentComponentToAdd = network.currentComponentToAdd;

    if (currentComponentToAdd == "") {
      return;
    }

    let numberOfPortsOrInterfaces: number = (network.renderRoot.querySelector('#ports') as SlInput).valueAsNumber ?
      (network.renderRoot.querySelector('#ports') as SlInput).valueAsNumber :
      (currentComponentToAdd == 'computer' || currentComponentToAdd == 'mobile' ? 1 : 2);


    let layer: number = 0;
    let portNum: number = 0;

    switch (currentComponentToAdd) {
      case 'computer': case 'mobile': case 'router':
        layer = 3; //add IPv4, IPv6
        break;
      case 'access-point': case 'bridge': case 'switch':
        layer = 2; //add MAC
        break;
      case 'hub': case 'repeater':
        layer = 1; //add connection type
        break;
      default: break;
    }

    if (currentComponentToAdd == 'repeater' || currentComponentToAdd == 'bridge'
      || numberOfPortsOrInterfaces == null || numberOfPortsOrInterfaces == undefined) {
      portNum = 2;
    }
    else {
      portNum = numberOfPortsOrInterfaces;
    }

    let dialog = new SlDialog();
    dialog.label = "Add details for each port of your " + currentComponentToAdd;

    let table = `<table>`;

    //add the columns
    table += `<tr>`;
    table += `<td>Index</td>`;
    table += layer < 3 ? `<td>Port number</td>` : `<td>Interface name</td>`;
    table += `<td>Connection type</td>`;
    table += layer > 1 ? `<td>MAC Address</td>` : "";
    table += layer > 2 ? `<td>Ipv4</td><td>Ipv6</td>` : "";
    table += `</tr>`;

    //add row for each port/interface
    for (let i = 1; i <= portNum; i++) {
      table += `<tr>`;
      table += `<td>` + i + `</td>`;
      table += layer < 3 ? `<td><sl-input id="port-number-` + i + `" placeholder="Port number" clearable type="number" min="0" max="65536"></sl-input></td>`
        : `<td><sl-input id="interface-name-` + i + `" placeholder="Interface name" clearable></sl-input></td>`;

      switch (currentComponentToAdd) {
        case 'hub': case 'switch':
          table += `<td>Ethernet</td>`;
          break;
        case 'access-point':
          table += `<td>Wireless</td>`;
          break;
        default:
          table += `<td><sl-select id="connection-type-` + i + `"><sl-menu-item value="ethernet" style="overflow: hidden;">Ethernet</sl-menu-item>
        <sl-menu-item value="wireless" style="overflow: hidden;">Wireless</sl-menu-item></sl-select></td>`;
          break;
      }

      table += layer > 1 ? `<td><sl-input id="mac-` + i + `" placeholder="FF:FF:FF:FF:FF:FF" clearable></sl-input></td>` : "";
      table += layer > 2 ? `<td><sl-input id="ip4-` + i + `" placeholder="0:0:0:0" clearable></sl-input></td>` : "";
      table += layer > 2 ? `<td><sl-input id="ip6-` + i + `"placeholder="FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF" clearable></sl-input></td>` : "";

      table += `</tr>`;
    }
    table += `</table>`;
    dialog.innerHTML = table;

    //TODO: add event listener vào cái nút add node
    const saveButton = new SlButton();
    saveButton.slot = "footer";
    saveButton.variant = "primary";
    saveButton.innerHTML = "Save";
    saveButton.addEventListener('click', () => dialog.hide());
    dialog.appendChild(saveButton);
    (network.renderRoot.querySelector('#inputDialog') as HTMLElement).innerHTML = "";
    (network.renderRoot.querySelector('#inputDialog') as HTMLElement).append(dialog);
    dialog.show();

  }

  static generateInputsDetailsForEdge(network: ComputerNetwork, edge: any, sourceNode: PhysicalNode, targetNode: PhysicalNode): void {
    //filter available ports
    let availableSourcePorts: Map<number, string> = new Map();
    let availableTargetPorts: Map<number, string> = new Map();
    sourceNode.portLinkMapping.forEach((link, index) => {
      if (link == null || link == undefined || link == "") {
        availableSourcePorts.set(index, sourceNode.portData.get(index).get('Name'));
      }
    });
    targetNode.portLinkMapping.forEach((link, index) => {
      if (link == null || link == undefined || link == "") {
        availableTargetPorts.set(index, targetNode.portData.get(index).get('Name'));
      }
    });

    let dialog = new SlDialog();
    dialog.label = "Assigning ports for this connection";
    let tabGroup: SlTabGroup = new SlTabGroup();
    tabGroup.innerHTML += `<sl-tab slot="nav" panel="chooseSourcePort">` + sourceNode.name + `</sl-tab><sl-tab slot="nav" panel="chooseTargetPort">` + targetNode.name + `</sl-tab>`;

    //init panel with data of ports of source + select port for source
    let sourcePanel = new SlTabPanel();
    sourcePanel.name = "chooseSourcePort";
    let sourceTable: string = `<table cellspacing="10"><tr>`;
    sourceTable += `<td>Index</td>`;
    sourceNode.portData.entries().next().value[1].forEach((_, columnName) => sourceTable += `<td>` + columnName + `</td>`);
    sourceTable += `</tr>`;

    sourceNode.portData.forEach((data, index) => {
      sourceTable += `<tr>`;
      sourceTable += `<td>` + index + `</td>`; //add index
      data.forEach((value) => {
        if (value instanceof Address) {
          sourceTable += `<td>` + value.address + `</td>`;
        }
        else {
          sourceTable += `<td>` + value + `</td>`;
        }
      });
      sourceTable += `</tr>`;
    });
    sourceTable += `</table>`;
    sourcePanel.innerHTML += sourceTable;

    let selectedSourcePort = new SlSelect();
    availableSourcePorts.forEach((port, index) => selectedSourcePort.innerHTML += `<sl-menu-item value="` + index + `">` + port + `</sl-menu-item>`);
    sourcePanel.innerHTML += "Select one from available ports/ interfaces:";
    sourcePanel.appendChild(selectedSourcePort);
    tabGroup.append(sourcePanel);

    //init panel with data of ports of target + select port for target
    let targetPanel = new SlTabPanel();
    targetPanel.name = "chooseTargetPort";
    let targetTable: string = `<table cellspacing="10"><tr>`;
    targetTable += `<td>Index</td>`;
    targetNode.portData.entries().next().value[1].forEach((_, columnName) => targetTable += `<td>` + columnName + `</td>`);
    targetTable += `</tr>`;

    targetNode.portData.forEach((data, index) => {
      targetTable += `<tr>`;
      targetTable += `<td>` + index + `</td>`; //add port/interface name
      data.forEach((value) => {
        if (value instanceof Address) {
          targetTable += `<td>` + value.address + `</td>`;
        }
        else {
          targetTable += `<td>` + value + `</td>`;
        }
      });
      targetTable += `</tr>`;
    });
    targetTable += `</table>`;
    targetPanel.innerHTML += targetTable;

    let selectedTargetPort = new SlSelect();
    availableTargetPorts.forEach((port, index) => selectedTargetPort.innerHTML += `<sl-menu-item value="` + index + `">` + port + `</sl-menu-item>`);

    targetPanel.innerHTML += "Select one from available ports/ interfaces:";
    targetPanel.appendChild(selectedTargetPort);
    tabGroup.append(targetPanel);


    dialog.appendChild(tabGroup);

    const saveButton = new SlButton();
    saveButton.slot = "footer";
    saveButton.variant = "primary";
    saveButton.innerHTML = "Save";
    saveButton.addEventListener('click', () => {
      let inPort: number = +(selectedSourcePort.value as string);
      let outPort: number = +(selectedTargetPort.value as string);

      if (Number.isNaN(inPort) || inPort == undefined || inPort == null) {
        AlertHelper.toastAlert("warning", "exclamation-triangle", "", "Please choose port/interface for " + sourceNode.name);
        return;
      }
      if (Number.isNaN(outPort) || outPort == undefined || outPort == null) {
        AlertHelper.toastAlert("warning", "exclamation-triangle", "", "Please choose port/interface for " + sourceNode.name);
        return;
      }

      let newData = GraphEdge.addPorts(edge.data(), inPort, outPort);
      if (newData != null) {
        edge.removeClass("unconfigured-edge");
        edge.addClass(newData.cssClass);
        edge.data(newData);
        dialog.hide();
      } //set new format-display for this connection if no error appears
    }
    );
    dialog.appendChild(saveButton);

    (network.renderRoot.querySelector('#inputDialog') as HTMLElement).innerHTML = "";
    (network.renderRoot.querySelector('#inputDialog') as HTMLElement).append(dialog);
    dialog.show();
  }


  static handleChangesInDialogForPhysicalNode(id: string, node: any, network: ComputerNetwork) {
    let physicalNode: PhysicalNode = node.data();
    let dialog: SlDialog = new SlDialog();
    let table: string = `<table cellspacing="10"><tr>`;
    table += `<td>Index</td>`;
    physicalNode.portData.entries().next().value[1].forEach((_, columnName) => table += `<td>` + columnName + `</td>`);
    table += `</tr>`;
  
    physicalNode.portData.forEach((data, index) => {
      table += `<tr>`;
      table += `<td>` + index + `</td>`; //add index
      data.forEach((value, key) => {
        if (value instanceof Address) {
          table += `<td><sl-input id="` + id + "-" + index + "-" + key + `" placeholder="` + value.address + `" clearable type="string"></td>`;
        }
        else if (key == "Connection Type") {
          //show only
          table += `<td>` + value + `</td>`;
        }
        else {
          table += `<td><sl-input id="` + id + "-" + index + "-" + key + `" placeholder="` + value + `" clearable type="string"></td>`;
        }
      });
      table += `</tr>`;
    });
    table += `</table>`;
    dialog.innerHTML += table;
  
    const saveButton = new SlButton();
    saveButton.slot = "footer";
    saveButton.variant = "primary";
    saveButton.innerHTML = "Save";
    saveButton.addEventListener('click', () => {
      let changed: boolean = false;
      //for each interface-index
      for (let index = 1; index <= physicalNode.portData.size; index++) {
        let newName = (network.renderRoot.querySelector('#' + id + "-" + index + "-" + "Name") as SlInput).value.trim();
        if (newName != "") {
          physicalNode.portData.get(index).set('Name', newName);
          changed = true;
        }
  
        if (physicalNode.layer >= 2) {
          let newMac = (network.renderRoot.querySelector('#' + id + "-" + index + "-" + "MAC") as SlInput).value.trim();
          let validatedMac = newMac != "" ? MacAddress.validateAddress(newMac, network.macDatabase) : null;
          if (validatedMac != null) {
            physicalNode.portData.get(index).set('MAC', validatedMac);
            changed = true;
          }
          else if (newMac != "") {
            AlertHelper.toastAlert("warning", "exclamation-triangle", "", newMac + " is not a valid MAC Address.");
          }
        }
  
        if (physicalNode.layer >= 3) {
          let newIpv4 = (network.renderRoot.querySelector('#' + id + "-" + index + "-" + "IPv4") as SlInput).value.trim();
          let newIpv6 = (network.renderRoot.querySelector('#' + id + "-" + index + "-" + "IPv6") as SlInput).value.trim();
          let validatedIpv4 = newIpv4 != "" ? Ipv4Address.validateAddress(newIpv4, network.ipv4Database) : null;
          if (validatedIpv4 != null) {
            physicalNode.portData.get(index).set('IPv4', validatedIpv4);
            changed = true;
          }
          else if (newIpv4 != "") {
            AlertHelper.toastAlert("warning", "exclamation-triangle", "", newIpv4 + " is not a valid IPv4 Address.");
          }
  
          let validatedIpv6 = newIpv6 != "" ? Ipv6Address.validateAddress(newIpv6, network.ipv6Database) : null;
          if (validatedIpv6 != null) {
            physicalNode.portData.get(index).set('IPv6', validatedIpv6);
            changed = true;
          }
          else if (newIpv6 != "") {
            AlertHelper.toastAlert("warning", "exclamation-triangle", "", newIpv6 + " is not a valid IPv6 Address.");
          }
        }
      }
  
      if (changed) {
        AlertHelper.toastAlert("success", "check2-circle", "Your changes have been saved.", "");
      }
      dialog.hide();
    }
    );
    dialog.appendChild(saveButton);
  
    (network.renderRoot.querySelector('#inputDialog') as HTMLElement).innerHTML = "";
    (network.renderRoot.querySelector('#inputDialog') as HTMLElement).append(dialog);
    dialog.show();
  
  }

  static handleChangesInDialogForSubnet(id: string, node: any, network: ComputerNetwork) {

    let dialog: SlDialog = new SlDialog();
  
    let subnet: Subnet = node.data();
    dialog.innerHTML += `<sl-input id="` + id + `"NetworkAddress" label="Network Address" placeholder="` + subnet.networkAddress.address + `" clearable type="string">`;
    dialog.innerHTML += `<sl-input id="` + id + `"Bitmask" label="Bitmask" placeholder="` + subnet.bitmask + `" clearable type="number" min=0>`;
    dialog.innerHTML += `<sl-input id="` + id + `"SubnetMask" label="Subnet Mask" placeholder="` + subnet.subnetMask + `" clearable type="string">`;
  
    //table for gateways
    let gateways: Map<[string, number], Router> = subnet.gateways;
    if (gateways.size != 0) {
  
      let table: string = `<table cellspacing="10"><tr><td>Gateway</td><td>Interface</td><td>Connection Type</td><td>MAC</td><td>IPv4</td><td>IPv6</td></tr>`;
  
      //TODO: add id for changes?
      gateways.forEach((router, [id, portIndex]) => {
        let data = router.portData.get(portIndex);
        table += `<tr>`;
        table += `<td>` + router.name + `</td>`;
        table += `<td>` + data.get('name') + `</td>`;
        table += `<td>` + data.get('Connection Type') + `</td>`;
        table += `<td>` + data.get('MAC') + `</td>`;
        table += `<td>` + data.get('IPv4') + `</td>`;
        table += `<td>` + data.get('IPv6') + `</td>`;
        table += `</tr>`;
      });
  
      dialog.innerHTML += table;
    }
    //TODO: add event listener vào cái nút add node
    const saveButton = new SlButton();
    saveButton.slot = "footer";
    saveButton.variant = "primary";
    saveButton.innerHTML = "Save";
    saveButton.addEventListener('click', () => dialog.hide());
  
    dialog.appendChild(saveButton);
    (network.renderRoot.querySelector('#inputDialog') as HTMLElement).innerHTML = "";
    (network.renderRoot.querySelector('#inputDialog') as HTMLElement).append(dialog);
    dialog.show();
  }
}








