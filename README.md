# tree-sitter-veryl

Veryl grammar for tree-sitter.

## Overview

This is a tree-sitter parser for [Veryl](https://veryl-lang.org/), a modern hardware description language based on SystemVerilog. This parser enables syntax highlighting and code analysis for Veryl in editors like Zed, Neovim, and others that support tree-sitter.

## Features

- Complete Veryl syntax support including:
  - Module, interface, and package declarations
  - Import statements
  - Function declarations with parameters and return types
  - Embed declarations for SystemVerilog integration
  - Struct and enum types with attributes
  - Type declarations and aliases
  - Always blocks (always_comb, always_ff, initial)
  - Control flow statements (if, else, for, case, switch, break, return)
  - Veryl-specific features:
    - if_reset statement for reset logic
    - clock and reset types
    - Concatenation with repeat syntax
    - Case and if expressions
    - Bit slicing and indexing
  - System functions (e.g., $display, $sv::*)
  - Scoped identifiers and namespaces
  - Attributes (#[...])
  - Built-in types (logic, bit, u32, u64, i32, clock, reset, string)
  - Operators and expressions
- Comprehensive syntax highlighting queries
- Tested on real-world Veryl projects (zenbu, bluecore)

## Installation

### Building the parser

```bash
npm install
tree-sitter generate
```

### Using with editors

#### Neovim

Add the following to your Neovim configuration:

```lua
local parser_config = require("nvim-treesitter.parsers").get_parser_configs()
parser_config.veryl = {
  install_info = {
    url = "https://github.com/hota1024/tree-sitter-veryl",
    files = {"src/parser.c"},
    branch = "main",
  },
  filetype = "veryl",
}

vim.filetype.add({
  extension = {
    veryl = "veryl",
  },
})
```

#### Zed

This parser can be integrated with Zed editor for Veryl syntax highlighting.

## Example

```veryl
module Counter #(
    param WIDTH: u32 = 8,
) (
    clk: input clock,
    rst: input reset,
    count: output logic<WIDTH>,
) {
    var counter: logic<WIDTH>;

    always_ff (clk) {
        if_reset {
            counter = '0;
        } else {
            counter += 1;
        }
    }

    assign count = counter;
}
```

## Development

### Testing the parser

Create a test file with `.veryl` extension and run:

```bash
tree-sitter parse your-file.veryl
```

### Testing syntax highlighting

```bash
tree-sitter highlight your-file.veryl
```

## Related Projects

- [Veryl](https://github.com/veryl-lang/veryl) - The Veryl language compiler and tools
- [Veryl Documentation](https://doc.veryl-lang.org/book/) - Official Veryl documentation

## License

MIT

## Author

hota1024 <dev@hota1024.com>
