import { css } from 'lit';

export const simulationMenuStyles = css`
    .simulationmenu {
        position: absolute;
        display: flex;
        flex-direction: column-reverse;
        align-items: flex-start;

        right: 10px;
        top: 10px;
    }

    .simulationmenu sl-button::part(base) {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .simulationmenu__context {
        outline: black solid 1px;
        background-color: white;

        padding: 10px;
        min-width: 200px;
    }
`;
