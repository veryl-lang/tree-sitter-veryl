/**
 * @file Veryl grammar for tree-sitter
 * @author hota1024 <dev@hota1024.com> <dev@hota1024.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

export default grammar({
  name: "veryl",

  rules: {
    // TODO: add the actual grammar rules
    source_file: $ => "hello"
  }
});
