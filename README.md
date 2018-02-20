# slate-edit-table

[![NPM version](https://badge.fury.io/js/slate-edit-table.svg)](http://badge.fury.io/js/slate-edit-table)
[![Linux Build Status](https://travis-ci.org/GitbookIO/slate-edit-table.png?branch=master)](https://travis-ci.org/GitbookIO/slate-edit-table)

A Slate plugin to handle table edition.

Demo: [gitbookio.github.io/slate-edit-table/](https://gitbookio.github.io/slate-edit-table/)

## Install

```
npm install slate-edit-table
```

## Features

- Pressing <kbd>Up</kbd> and <kbd>Down</kbd>, moves the cursor to next/previous row
- Pressing <kbd>Enter</kbd>, insert a new row
- Pressing <kbd>Cmd+Enter</kbd> (<kbd>Ctrl+Enter</kbd> on Windows/Linux) exits the table, into a new default block.
- Pressing <kbd>Tab</kbd>, move the cursor to next cell
- Pressing <kbd>Shift+Tab</kbd>, move the cursor to previous cell

All these default features are configurable.

## Simple Usage

```js
import EditTable from 'slate-edit-table'

const tablePlugin = EditTable(/* options */)

const plugins = [
  tablePlugin
]
```

## Data structure

Here is what your Slate document containing tables should look like:

```jsx
<value><document>
  <paragraph>Some text</paragraph>

  <table>
    <table_row>
      <table_cell>
        <paragraph>Any block can goes into cells</paragraph>
      </table_cell>

      <table_cell>
        <image isVoid src="image.png" />
      </table_cell>
    </table_row>

    <table_row>
      <table_cell>
        <paragraph>Second row</paragraph>
      </table_cell>

      <table_cell>
        <paragraph>Second row</paragraph>
      </table_cell>
    </table_row>
  </table>
</document></value>
```

## `Options`

Option object you can pass to the plugin.

- ``[typeTable: String]`` — type for table
- ``[typeRow: String]`` — type for the rows.
- ``[typeCell: String]`` — type for the cells.
- ``[typeContent: String]`` — default type for blocks in cells. Also used as default type for blocks created when exiting the table with Mod+Enter.

## `EditTable`

### `EditTable(options: Options) => Instance`

Constructs an instance of the table plugin, for the given options. You can then add this instance to the list of plugins passed to Slate.

Once you have constructed an instance of the plugin, you get access to utilities and changes through `pluginInstance.utils` and `pluginInstance.changes`.

### [`EditTable.TablePosition`](./TablePosition)

An instance of `TablePosition` represents a position within a table (row and column).

## Utils

### `utils.isSelectionInTable`

`isSelectionInTable(value: Slate.Value) => boolean`

Return true if selection is inside a table cell.

### `utils.isSelectionOutOfTable`

`isSelectionOutOfTable(value: Slate.Value) => boolean`

Return true if selection starts and ends both outside any table.  (Notice: it is NOT the opposite value of `isSelectionInTable`)

### `utils.getPosition`

`getPosition(value: Slate.Value) => TablePosition`

Returns the detailed position in the current table.

### `utils.createTable`

```js
createTable(
    columns: number,
    rows: number,
    getCellContent?: (row: number, column: number) => Node[]
): Block
```

Returns a table. The content can be filled with the given `getCellContent` generator.


### `utils.createRow`

```js
createRow(
    columns: number,
    getCellContent?: (column: number) => Node[]
): Block
```

Returns a row. The content can be filled with the given `getCellContent` generator.

### `utils.createCell`

```js
createCell(opts: Options, nodes?: Node[]): Block
```

Returns a cell. The content defaults to an empty `typeContent` block.

## Changes

### `changes.insertTable`

`insertTable(change: Change, columns: ?number, rows: ?number) => Change`

Insert a new empty table.

### `changes.insertRow`

```js
insertRow(
    opts: Options,
    change: Change,
    at?: number, // row index
    getRow?: (columns: number) => Block // Generate the row yourself
): Change
```

Insert a new row after the current one or at the specific index (`at`).

### `changes.insertColumn`

```js
insertColumn(
    opts: Options,
    change: Change,
    at?: number, // Column index
    getCell?: (column: number, row: number) => Block // Generate cells
): Change
```

Insert a new column after the current one or at the specific index (`at`).

### `changes.removeTable`

`removeTable(change: Change) => Change`

Remove current table.

### `changes.removeRow`

`removeRow(change: Change, at: ?number) => Change`

Remove current row or the one at a specific index (`at`).

### `changes.removeColumn`

`removeColumn(change: Change, at: ?number) => Change`

Remove current column or the one at a specific index (`at`).

### `changes.moveSelection`

`moveSelection(change: Change, column: number, row: number) => Change`

Move the selection to a specific position in the table.

### `changes.moveSelectionBy`

`moveSelectionBy(change: Change, column: number, row: number) => Change`

Move the selection by the given amount of columns and rows.

### `changes.setColumnAlign`

`setColumnAlign(change: Change, align: string, at: number) => Change`

Sets column alignment for a given column (`at`), in the current table. `align`
defaults to center, `at` is optional and defaults to current cursor position.

> The `align` values are stored in the table node's data.
> `table.node.data.get('align')` should be an array of aligns string, corresponding to
each column.
