import { SlButton, SlDialog, SlInput, SlSelect, SlTabGroup, SlTabPanel } from "@shoelace-style/shoelace";
import { ComputerNetwork } from "..";
import { Address } from "../adressing/Address";
import { GraphEdge } from "../components/GraphEdge";
import { PhysicalNode } from "../components/physicalNodes/PhysicalNode";
import { AlertHelper } from "../utils/AlertHelper";
import { EdgeController } from "./edge-controller";


export class InputData {
  label: string;
  helpText: string;
  placeHolder: string;
  clearable: boolean;
  disabled: boolean;

  constructor(label: string,
    helpText: string,
    placeHolder: string,
    clearable: boolean,
    disabled?: boolean) {
    this.label = label;
    this.helpText = helpText;
    this.placeHolder = placeHolder;
    this.clearable = clearable;
    this.disabled = disabled;
  }

}

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
    dialog.label = "Add details for each port/interface of your " + currentComponentToAdd;

    let table = `<table>`;

    //add the columns
    table += `<tr>`;
    table += `<td>Order</td>`;
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
          table += `<td><sl-select id="connection-type-` + i + `"><sl-menu-item value="ethernet">Ethernet</sl-menu-item>
        <sl-menu-item value="wireless">Wireless</sl-menu-item></sl-select></td>`;
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
    let availableSourcePorts: string[] = [];
    let availableTargetPorts: string[] = [];
    sourceNode.portLinkMapping.forEach((link, port) => {
      if (link == null || link == undefined || link == "") {
        availableSourcePorts.push(port);
      }
    });
    targetNode.portLinkMapping.forEach((link, port) => {
      if (link == null || link == undefined || link == "") {
        availableTargetPorts.push(port);
      }
    });

    let dialog = new SlDialog();
    dialog.label = "Assigning ports/interfaces for this connection";
    let tabGroup: SlTabGroup = new SlTabGroup();
    tabGroup.innerHTML += `<sl-tab slot="nav" panel="chooseSourcePort">` + sourceNode.name + `</sl-tab><sl-tab slot="nav" panel="chooseTargetPort">` + targetNode.name + `</sl-tab>`;

    //init panel with data of ports of source + select port for source
    let sourcePanel = new SlTabPanel();
    sourcePanel.name = "chooseSourcePort";
    let sourceTable: string = `<table cellspacing="10"><tr>`;
    sourceTable += sourceNode.layer < 3 ? `<td>Port</td>` : `<td>Interface</td>`;
    sourceNode.portData.entries().next().value[1].forEach((_, columnName) => sourceTable += `<td>` + columnName + `</td>`);
    sourceTable += `</tr>`;

    sourceNode.portData.forEach((data, port) => {
      sourceTable += `<tr>`;
      sourceTable += `<td>` + port + `</td>`; //add port/interface name
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
    availableSourcePorts.forEach(port => selectedSourcePort.innerHTML += `<sl-menu-item value="` + port + `">` + port + `</sl-menu-item>`);
    sourcePanel.appendChild(selectedSourcePort);
    tabGroup.append(sourcePanel);

    //init panel with data of ports of target + select port for target
    let targetPanel = new SlTabPanel();
    targetPanel.name = "chooseTargetPort";
    let targetTable: string = `<table cellspacing="10"><tr>`;
    targetTable += targetNode.layer < 3 ? `<td>Port</td>` : `<td>Interface</td>`;
    targetNode.portData.entries().next().value[1].forEach((_, columnName) => targetTable += `<td>` + columnName + `</td>`);
    targetTable += `</tr>`;

    targetNode.portData.forEach((data, port) => {
      targetTable += `<tr>`;
      targetTable += `<td>` + port + `</td>`; //add port/interface name
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
    availableTargetPorts.forEach(port => selectedTargetPort.innerHTML += `<sl-menu-item value="` + port + `">` + port + `</sl-menu-item>`);
    targetPanel.appendChild(selectedTargetPort);
    tabGroup.append(targetPanel);


    dialog.appendChild(tabGroup);

    const saveButton = new SlButton();
    saveButton.slot = "footer";
    saveButton.variant = "primary";
    saveButton.innerHTML = "Save";
    saveButton.addEventListener('click', () => {
      console.log(selectedSourcePort.value);
      console.log(selectedTargetPort.value);
      let inPort: string = selectedSourcePort.value as string;
      let outPort: string = selectedTargetPort.value as string;

      if (inPort == "") {
        AlertHelper.toastAlert("warning", "exclamation-triangle", "", "Please choose port/interface for " + sourceNode.name);
        return;
      }
      if (outPort == "") {
        AlertHelper.toastAlert("warning", "exclamation-triangle", "", "Please choose port/interface for " + sourceNode.name);
        return;
      }

      let newData = GraphEdge.addPorts(edge.data(), inPort, outPort);
      if (newData != null) {
        edge.removeClass("unconfigured-edge");
        edge.addClass(newData.cssClass);
        console.log(newData.cssClass);
        edge._private.data = newData;
        dialog.hide();
      } //set new format-display for this connection if no error appears
    }
    );
    dialog.appendChild(saveButton);

    (network.renderRoot.querySelector('#inputDialog') as HTMLElement).innerHTML = "";
    (network.renderRoot.querySelector('#inputDialog') as HTMLElement).append(dialog);
    dialog.show();
  }
}

export function handleChangesInDialogForHost(id: string, node: any, network: ComputerNetwork) {

  // let host: Host = node._private.data;

  // //pass data of current node into the dialog
  // let inputFields = generateDialog(
  //   id,
  //   new Map<string, InputData>([
  //     ["name", new InputData("Name", "The name of this component", host.name, true)],
  //     ["mac", new InputData("MAC", "The MAC-Address of this component", host.mac.address, true)],
  //     ["ip", new InputData("IP", "The IP-Address of this component", host.ip.address, true)],
  //     ["ipBin", new InputData("IP(2)", "The IP-Address of this component (binary)", host.ip.binaryOctets.join("."), true)],
  //   ]));

  // const saveButton = new SlButton();
  // saveButton.slot = "footer";
  // saveButton.variant = "primary";
  // saveButton.innerHTML = "Save changes";

  // let error: boolean = false;

  // saveButton.addEventListener('click', () => {
  //   const alert = new SlAlert();
  //   alert.closable = true;

  //   //list of methods to update data, ip, subnet
  //   let newName = (network.renderRoot.querySelector('#' + id + "name") as SlInput).value.trim();
  //   let newMac = (network.renderRoot.querySelector('#' + id + "mac") as SlInput).value.trim();
  //   let newIp = (network.renderRoot.querySelector('#' + id + "ip") as SlInput).value.trim();
  //   //todo: update with binary IP?
  //   let newIpBin = (network.renderRoot.querySelector('#' + id + "ipBin") as SlInput).value.trim();

  //   host.name = newName;
  //   let newMacAddress: MacAddress = MacAddress.validateAddress(newMac, network.macDatabase);
  //   if (newMac == "") {
  //     //do nothing if no input is given
  //   } else if (newMacAddress != null) {
  //     host.mac = newMacAddress;
  //   }
  //   else {
  //     error = true;
  //     alert.innerHTML += "The inserted MAC Address <strong>" + newMac + "</strong> is not valid.\n";
  //   }

  //   let newIpAddress: IpAddress = IpAddress.validateAddress(newIp, network.ipDatabase);
  //   if (newIp == "") {
  //     //do nothing if no input is given
  //   }
  //   else if (newIpAddress != null) {
  //     host.ip = newIpAddress;
  //   }
  //   else {
  //     error = true;
  //     alert.innerHTML += "The inserted IP Address <strong>" + newIp + "</strong> is not valid.\n";

  //   }

  //   if (newName == "" && newIp == "" && newMac == "") {
  //     const noti = new SlAlert();
  //     noti.closable = true;
  //     noti.variant = "primary";
  //     noti.innerHTML = "<sl-icon slot=\"icon\" name=\"info-circle\"></sl-icon>No new data is given.";
  //     noti.toast();
  //   }
  //   else if (error) {
  //     alert.variant = "warning";
  //     alert.innerHTML = "<sl-icon slot=\"icon\" name=\"exclamation-triangle\"></sl-icon>" + alert.innerHTML;
  //     alert.toast();
  //     error = false;
  //   }
  //   else {
  //     const noti = new SlAlert();
  //     noti.closable = true;
  //     noti.variant = "success";
  //     noti.innerHTML = "<sl-icon slot=\"icon\" name=\"check2-circle\"></sl-icon>Your changes have been successfully saved.";
  //     noti.toast();
  //   }

  //   //TODO: adapt IP on dragOntoNewSubnet
  //   // if (node._private.parent.length > 0) {
  //   //   adaptSubnetInformationOnIpChanges(network._graph.$('#' + node._private.parent._private), newIpAddress);
  //   // }
  // });
  // let dialog = (network.renderRoot.querySelector('#infoDialog') as SlDialog);
  // dialog.innerHTML = "";
  // inputFields.forEach(e => dialog.appendChild(e));
  // dialog.appendChild(saveButton);
  // dialog.show();
}

export function handleChangesInDialogForConnector(id: string, node: any, network: ComputerNetwork) {

  // let connector: Connector = node._private.data;

  // let fields: Map<string, InputData> = new Map();

  // fields.set("name", new InputData("Name", "", connector.name, true));
  // fields.set("layer", new InputData("Layer", "", connector.layer.toString(), true, true));

  // switch (connector.layer) {
  //   case 2:
  //     connector.addresses.forEach((addresses, port) => {
  //       fields.set(port + ".MAC", new InputData(port + ".MAC", "", addresses[0].address, true));
  //     });
  //     break;
  //   case 3:
  //     connector.addresses.forEach((addresses, port) => {
  //       fields.set(port + ".MAC", new InputData(port + ".MAC", "", addresses[0].address, true));
  //       fields.set(port + ".IP", new InputData(port + ".IP", "", addresses[1].address, true));
  //     });
  //     break;
  // }

  // //pass data of current connector into the dialog
  // let inputFields = generateDialog(id, fields);

  // const saveButton = new SlButton();
  // saveButton.slot = "footer";
  // saveButton.variant = "primary";
  // saveButton.innerHTML = "Save changes";

  // let error: boolean = false;

  // saveButton.addEventListener('click', () => {
  //   const alert = new SlAlert();
  //   alert.closable = true;

  //   //list of methods to update data, ip, subnet
  //   let newName = (network.renderRoot.querySelector('#' + id + "name") as SlInput).value.trim();
  //   let newMac = (network.renderRoot.querySelector('#' + id + "mac") as SlInput).value.trim();
  //   let newIp = (network.renderRoot.querySelector('#' + id + "ip") as SlInput).value.trim();
  //   //todo: update with binary IP?
  //   let newIpBin = (network.renderRoot.querySelector('#' + id + "ipBin") as SlInput).value.trim();

  //   host.name = newName;
  //   let newMacAddress: MacAddress = MacAddress.validateAddress(newMac, network.macDatabase);
  //   if (newMac == "") {
  //     //do nothing if no input is given
  //   } else if (newMacAddress != null) {
  //     host.mac = newMacAddress;
  //   }
  //   else {
  //     error = true;
  //     alert.innerHTML += "The inserted MAC Address <strong>" + newMac + "</strong> is not valid.\n";
  //   }

  //   let newIpAddress: IpAddress = IpAddress.validateAddress(newIp, network.ipDatabase);
  //   if (newIp == "") {
  //     //do nothing if no input is given
  //   }
  //   else if (newIpAddress != null) {
  //     host.ip = newIpAddress;
  //   }
  //   else {
  //     error = true;
  //     alert.innerHTML += "The inserted IP Address <strong>" + newIp + "</strong> is not valid.\n";

  //   }

  //   if (newName == "" && newIp == "" && newMac == "") {
  //     const noti = new SlAlert();
  //     noti.closable = true;
  //     noti.variant = "primary";
  //     noti.innerHTML = "<sl-icon slot=\"icon\" name=\"info-circle\"></sl-icon>No new data is given.";
  //     noti.toast();
  //   }
  //   else if (error) {
  //     alert.variant = "warning";
  //     alert.innerHTML = "<sl-icon slot=\"icon\" name=\"exclamation-triangle\"></sl-icon>" + alert.innerHTML;
  //     alert.toast();
  //     error = false;
  //   }
  //   else {
  //     const noti = new SlAlert();
  //     noti.closable = true;
  //     noti.variant = "success";
  //     noti.innerHTML = "<sl-icon slot=\"icon\" name=\"check2-circle\"></sl-icon>Your changes have been successfully saved.";
  //     noti.toast();
  //   }

  //   if (node._private.parent.length > 0) {
  //     adaptSubnetInformationOnIpChanges(network._graph.$('#' + node._private.parent._private), newIpAddress);
  //   }
  // });
  // let dialog = (network.renderRoot.querySelector('#infoDialog') as SlDialog);
  // dialog.innerHTML = "";
  // inputFields.forEach(e => dialog.appendChild(e));
  // //dialog.appendChild(saveButton);
  // dialog.show();
}

export function handleChangesInDialogForSubnet(id: string, node: any, network: ComputerNetwork) {

  //   let subnet: Subnet = node._private.data;

  //   let fields: Map<string, InputData> = new Map();

  //   fields.set("networkAddress", new InputData("Network Address", "", subnet.networkAddress.address, true));
  //   fields.set("cidr", new InputData("CIDR", "", subnet.cidr.toString(), true));
  //   fields.set("subnetmask", new InputData("Subnet mask", "", subnet.subnetMask, true));
  //   fields.set("subnetmask", new InputData("Gateway", "", subnet.gateway.getIpAddresses.toString(), true));


  //   //pass data of current subnet into the dialog
  //   let inputFields = generateDialog(id, fields);
  //   let dialog = (network.renderRoot.querySelector('#infoDialog') as SlDialog);
  //   dialog.innerHTML = "";
  //   inputFields.forEach(e => dialog.appendChild(e));
  //   //dialog.appendChild(saveButton);
  //   dialog.show();
  // }



  // export function adaptSubnetInformationOnIpChanges(node: any, newIp: IpAddress): void {
  //   let compound = node._private.parent._private;
  //   let siblings = compound.children;

  //   let oldIp = node._private.data.ipAddress;

  //   let ips: IpAddress[] = [];

  //   siblings.forEach(child => {
  //     let ip = child._private.data.ipAddress;
  //     if (ip.address == oldIp.address) {
  //       ips.push(newIp);
  //     }
  //     else {
  //       ips.push(child._private.data.ipAddress);
  //     }
  //   });
  //   node.data.calculateSubnetNumber(ips);
}



