// @flow

import { Record } from 'immutable';

export type OptionsFormat = {
    typeTable?: string,
    typeRow?: string,
    typeCell?: string,
    typeContent?: string,
    exitBlockType?: string,
    allowBlocksInCells?: boolean
};

/**
 * The plugin options
 */
class Options extends Record({
    typeTable: 'table',
    typeRow: 'table_row',
    typeCell: 'table_cell',
    typeContent: 'paragraph',
    exitBlockType: 'paragraph',
    allowBlocksInCells: false
}) {
    // The type of table blocks
    typeTable: string;
    // The type of row blocks
    typeRow: string;
    // The type of cell blocks
    typeCell: string;
    // The type of default cell blocks when allowBlocksInCells is true
    typeContent: string;
    // The type of block inserted when exiting
    exitBlockType: string;
    // Allow blocks within cells
    allowBlocksInCells: boolean;
}

export default Options;
