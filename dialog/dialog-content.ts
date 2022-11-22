import { SlDialog, SlInput } from "@shoelace-style/shoelace";
import { html } from "lit";

export class InputData {
  label: string;
  helpText: string;
  placeHolder: string;
  clearable: boolean;

  constructor(label: string,
    helpText: string,
    placeHolder: string,
    clearable: boolean) {
    this.label = label;
    this.helpText = helpText;
    this.placeHolder = placeHolder;
    this.clearable = clearable;
  }

}

export function generateDialog(inputs: Map<string, InputData>): SlInput[] {
  let dialogContent: SlInput[] = [];

  inputs.forEach((data: InputData) => {

    let input: SlInput = new SlInput();
    input.label = data.label;
    input.className = "label-on-left";
    input.helpText = data.helpText;
    input.placeholder = data.placeHolder;
    input.clearable = data.clearable;
    dialogContent.push(input);

  });

  //TODO: a button SAVE --> change data of node on click

  return dialogContent;
}



