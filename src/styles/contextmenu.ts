import { css } from 'lit';

export const contextMenuStyles = css`
    .contextmenu {
        position: absolute;
        display: flex;
        flex-direction: column;

        background-color: white;
        outline: red solid 1px;

        padding: var(--sl-spacing-small);
    }

    .contextmenu__header {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: var(--sl-spacing-small);
    }

    .contextmenu__title {
        font-size: 1.2em;
    }

    .contextmenu__edgedisplay {
        display: flex;
        flex-direction: row;
        align-items: flex-start;

        margin-bottom: var(--sl-spacing-small);

        outline: black solid 1px;
        padding: var(--sl-spacing-2x-large);
    }

    .contextmenu__edgedisplay__node {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--sl-spacing-small);

        width: 100px;
        overflow-y: visible;
    }

    .contextmenu__edgedisplay__nodeImage {
        height: 100px;
        width: 100px;

        padding: var(--sl-spacing-small);
        box-sizing: border-box;

        border-radius: 15px;

        background-repeat: no-repeat;
        background-size: cover;
        background-origin: content-box;
    }

    .contextmenu__edgedisplay__nodeTitle {
        font-size: 1.2em;
    }

    .contextmenu__edgedisplay__edge {
        flex-grow: 1;
        min-width: 500px;

        display: flex;
        flex-direction: column;
        gap: var(--sl-spacing-small);
    }

    .contextmenu__edgedisplay__edge hr {
        display: block;
        width: 100%;
        margin: 0;
    }

    .contextmenu__edgedisplay__edge sl-select {
        max-width: 80%;
        margin: auto var(--sl-spacing-small);
    }
`;
