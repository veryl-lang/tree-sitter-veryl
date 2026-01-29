/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

export default grammar({
  name: "veryl",

  extras: ($) => [/\s/, $.line_comment, $.block_comment],

  conflicts: ($) => [
    [$.struct_literal, $.concatenation],
    [$.block, $.struct_literal, $.concatenation],
    [$.case_expression, $.case_statement],
    [$.if_expression, $.if_statement],
    [$.default_switch_arm, $._statement],
    [$.default_case_arm, $._statement],
    [$.switch_arm, $._statement],
    [$.case_arm, $._statement],
  ],

  word: ($) => $.identifier,

  rules: {
    source_file: ($) => repeat($._item),

    _item: ($) =>
      choice(
        $.import_declaration,
        $.module_declaration,
        $.interface_declaration,
        $.package_declaration,
        $.struct_declaration,
        $.enum_declaration,
        $.type_declaration,
        $.function_declaration,
        $.embed_declaration,
      ),

    // Import declaration
    import_declaration: ($) => seq("import", $.scoped_identifier_or_glob, ";"),

    scoped_identifier_or_glob: ($) =>
      choice(seq($.identifier, "::", "*"), $.scoped_identifier, $.identifier),

    // Function declaration
    function_declaration: ($) =>
      seq(
        optional($.attribute),
        "function",
        $.identifier,
        optional($.function_parameter_list),
        optional(seq("->", $._type)),
        $.block,
      ),

    function_parameter_list: ($) =>
      seq(
        "(",
        optional(
          seq(
            $.function_parameter,
            repeat(seq(",", $.function_parameter)),
            optional(","),
          ),
        ),
        ")",
      ),

    function_parameter: ($) =>
      seq(
        $.identifier,
        ":",
        optional(choice("input", "output", "inout", "ref")),
        $._type,
      ),

    // Embed declaration
    embed_declaration: ($) =>
      seq("embed", "(", $.identifier, ")", $.identifier, $.embed_content),

    embed_content: ($) =>
      token(seq("{{{", repeat(choice(/[^}]/, /}[^}]/, /}}[^}]/)), "}}}")),

    // Module declaration
    module_declaration: ($) =>
      seq(
        optional($.attribute),
        "module",
        $.identifier,
        optional($.parameter_list),
        optional($.port_list),
        "{",
        repeat($._module_item),
        "}",
      ),

    // Interface declaration
    interface_declaration: ($) =>
      seq(
        optional($.attribute),
        "interface",
        $.identifier,
        optional($.parameter_list),
        "{",
        repeat($._interface_item),
        "}",
      ),

    // Package declaration
    package_declaration: ($) =>
      seq(
        optional($.attribute),
        "package",
        $.identifier,
        "{",
        repeat($._package_item),
        "}",
      ),

    // Parameter list
    parameter_list: ($) =>
      seq(
        "#",
        "(",
        optional(
          seq(
            $.parameter_declaration,
            repeat(seq(",", $.parameter_declaration)),
            optional(","),
          ),
        ),
        ")",
      ),

    parameter_declaration: ($) =>
      seq(
        choice("param", "const"),
        $.identifier,
        ":",
        $._type,
        optional(seq("=", $._expression)),
      ),

    // Port list
    port_list: ($) =>
      seq(
        "(",
        optional(
          seq(
            $.port_declaration,
            repeat(seq(",", $.port_declaration)),
            optional(","),
          ),
        ),
        ")",
      ),

    port_declaration: ($) =>
      seq(
        $.identifier,
        ":",
        choice(
          seq($.port_direction, $._type),
          "interface",
          seq("modport", $.scoped_identifier),
        ),
      ),

    port_direction: ($) => choice("input", "output", "inout"),

    // Module items
    _module_item: ($) =>
      choice(
        $.const_declaration,
        $.variable_declaration,
        $.type_declaration,
        $.struct_declaration,
        $.enum_declaration,
        $.function_declaration,
        $.assign_statement,
        $.always_comb_block,
        $.always_ff_block,
        $.initial_block,
        $.instance,
        $.generate_block,
      ),

    // Interface items
    _interface_item: ($) =>
      choice(
        $.const_declaration,
        $.variable_declaration,
        $.type_declaration,
        $.struct_declaration,
        $.enum_declaration,
        $.modport_declaration,
      ),

    // Package items
    _package_item: ($) =>
      choice(
        $.const_declaration,
        $.type_declaration,
        $.struct_declaration,
        $.enum_declaration,
        $.function_declaration,
      ),

    // Declarations
    const_declaration: ($) =>
      seq("const", $.identifier, ":", $._type, "=", $._expression, ";"),

    variable_declaration: ($) =>
      seq(
        choice("var", "let"),
        $.identifier,
        ":",
        $._type,
        optional(seq("=", $._expression)),
        ";",
      ),

    type_declaration: ($) => seq("type", $.identifier, "=", $._type, ";"),

    // Struct declaration
    struct_declaration: ($) =>
      seq(
        optional($.attribute),
        "struct",
        $.identifier,
        "{",
        repeat($.struct_field),
        "}",
      ),

    struct_field: ($) => seq($.identifier, ":", $._type, ","),

    // Enum declaration
    enum_declaration: ($) =>
      seq(
        optional($.attribute),
        "enum",
        $.identifier,
        optional(seq(":", $._type)),
        "{",
        optional(
          seq($.enum_member, repeat(seq(",", $.enum_member)), optional(",")),
        ),
        "}",
      ),

    enum_member: ($) => seq($.identifier, optional(seq("=", $._expression))),

    // Modport declaration
    modport_declaration: ($) =>
      seq(
        "modport",
        $.identifier,
        "{",
        repeat(seq($.identifier, ":", $.port_direction, ",")),
        "}",
      ),

    // Type
    _type: ($) => seq($._base_type, optional($.unpacked_dimension)),

    _base_type: ($) =>
      choice($.builtin_type, $.scoped_identifier, $.identifier, "type"),

    builtin_type: ($) =>
      prec(
        2,
        seq(
          optional($.type_modifier),
          choice(
            "logic",
            "bit",
            "bbool",
            "lbool",
            "u32",
            "u64",
            "i32",
            "clock",
            "reset",
            "string",
          ),
          optional($.packed_dimension),
        ),
      ),

    type_modifier: ($) =>
      choice("signed", "tri", seq("tri", "signed"), seq("signed", "tri")),

    packed_dimension: ($) =>
      seq("<", $._expression, optional(seq(",", $._expression)), ">"),

    unpacked_dimension: ($) => repeat1(seq("[", optional($._expression), "]")),

    // Statements
    assign_statement: ($) =>
      seq("assign", $._expression, "=", $._expression, ";"),

    always_comb_block: ($) => seq("always_comb", $.block),

    always_ff_block: ($) => seq("always_ff", optional(seq("(", $.identifier, ")")), $.block),

    initial_block: ($) => seq("initial", $.block),

    block: ($) => seq("{", repeat($._statement), "}"),

    _statement: ($) =>
      choice(
        $.assignment_statement,
        $.if_statement,
        $.if_reset_statement,
        $.for_statement,
        $.case_statement,
        $.switch_statement,
        $.break_statement,
        $.return_statement,
        $.expression_statement,
        $.block,
      ),

    assignment_statement: ($) =>
      seq(
        $._expression,
        choice(
          "=",
          "+=",
          "-=",
          "*=",
          "/=",
          "%=",
          "&=",
          "|=",
          "^=",
          "<<=",
          ">>=",
          "<<<=",
          ">>>=",
        ),
        $._expression,
        ";",
      ),

    if_statement: ($) =>
      prec.right(
        seq(
          "if",
          $._expression,
          $.block,
          optional(seq("else", choice($.if_statement, $.block))),
        ),
      ),

    if_reset_statement: ($) =>
      seq(
        "if_reset",
        $.block,
        optional(seq("else", choice($.if_statement, $.block))),
      ),

    for_statement: ($) =>
      seq(
        "for",
        $.identifier,
        ":",
        $._type,
        "in",
        optional("rev"),
        $._expression,
        optional(seq("step", choice("+=", "-=", "*=", "/="), $._expression)),
        $.block,
      ),

    case_statement: ($) =>
      seq(
        "case",
        $._expression,
        "{",
        repeat($.case_arm),
        optional($.default_case_arm),
        "}",
      ),

    case_arm: ($) => seq($.case_pattern, ":", choice($._statement, $.block)),

    case_pattern: ($) =>
      choice(
        $._expression,
        seq($._expression, repeat(seq(",", $._expression))),
        seq($._expression, "..=", $._expression),
      ),

    default_case_arm: ($) => seq("default", ":", choice($._statement, $.block)),

    switch_statement: ($) =>
      seq(
        "switch",
        "{",
        repeat($.switch_arm),
        optional($.default_switch_arm),
        "}",
      ),

    switch_arm: ($) =>
      seq($.switch_condition, ":", choice($._statement, $.block)),

    switch_condition: ($) =>
      choice(
        $._expression,
        seq($._expression, repeat(seq(",", $._expression))),
      ),

    default_switch_arm: ($) =>
      seq("default", ":", choice($._statement, $.block)),

    break_statement: ($) => seq("break", ";"),

    return_statement: ($) => seq("return", optional($._expression), ";"),

    expression_statement: ($) => seq($._expression, ";"),

    // Instance
    instance: ($) =>
      seq(
        "inst",
        $.identifier,
        ":",
        $.scoped_identifier,
        optional($.instance_parameter_list),
        optional($.instance_port_list),
        ";",
      ),

    instance_parameter_list: ($) =>
      seq(
        "#",
        "(",
        optional(
          seq(
            $.instance_parameter,
            repeat(seq(",", $.instance_parameter)),
            optional(","),
          ),
        ),
        ")",
      ),

    instance_parameter: ($) => seq($.identifier, ":", $._expression),

    instance_port_list: ($) =>
      seq(
        "(",
        optional(
          seq(
            $.instance_port,
            repeat(seq(",", $.instance_port)),
            optional(","),
          ),
        ),
        ")",
      ),

    instance_port: ($) => seq($.identifier, ":", $._expression),

    // Generate block
    generate_block: ($) =>
      seq(
        choice("generate", "if", "for"),
        // Simplified for now
        $.block,
      ),

    // Expressions
    _expression: ($) =>
      choice(
        $.identifier,
        $.scoped_identifier,
        $.number_literal,
        $.special_literal,
        $.boolean_literal,
        $.string_literal,
        $.parenthesized_expression,
        $.unary_expression,
        $.binary_expression,
        $.range_expression,
        $.member_expression,
        $.index_expression,
        $.call_expression,
        $.struct_literal,
        $.concatenation,
        $.case_expression,
        $.if_expression,
        $.cast_expression,
      ),

    parenthesized_expression: ($) => seq("(", $._expression, ")"),

    unary_expression: ($) =>
      prec(
        14,
        choice(
          seq("+", $._expression),
          seq("-", $._expression),
          seq("!", $._expression),
          seq("~", $._expression),
          seq("&", $._expression),
          seq("|", $._expression),
          seq("^", $._expression),
          seq("~&", $._expression),
          seq("~|", $._expression),
          seq("~^", $._expression),
        ),
      ),

    binary_expression: ($) => {
      const table = [
        [13, "**"],
        [12, choice("*", "/", "%")],
        [11, choice("+", "-")],
        [10, choice("<<", ">>", "<<<", ">>>")],
        [9, choice("<:", "<=", ">:", ">=")],
        [8, choice("==", "!=", "==?", "!=?")],
        [7, "&"],
        [6, choice("^", "~^")],
        [5, "|"],
        [4, "&&"],
        [3, "||"],
      ];

      return choice(
        ...table.map(([precedence, operator]) =>
          prec.left(precedence, seq($._expression, operator, $._expression)),
        ),
      );
    },

    range_expression: ($) =>
      prec.left(
        2,
        choice(
          seq($._expression, "..", $._expression),
          seq($._expression, "..=", $._expression),
        ),
      ),

    member_expression: ($) => prec(15, seq($._expression, ".", $.identifier)),

    index_expression: ($) =>
      prec(
        15,
        seq(
          $._expression,
          "[",
          $._expression,
          optional(seq(":", $._expression)),
          "]",
        ),
      ),

    call_expression: ($) =>
      prec(
        15,
        seq(
          choice(
            $.identifier,
            $.system_function_identifier,
            $.scoped_identifier,
            $.scoped_system_function_identifier,
          ),
          "(",
          optional(
            seq($._expression, repeat(seq(",", $._expression)), optional(",")),
          ),
          ")",
        ),
      ),

    struct_literal: ($) =>
      seq(
        "{",
        optional(
          seq(
            $.struct_field_init,
            repeat(seq(",", $.struct_field_init)),
            optional(","),
          ),
        ),
        "}",
      ),

    struct_field_init: ($) => seq($.identifier, ":", $._expression),

    // Concatenation and repeat
    concatenation: ($) =>
      seq(
        "{",
        optional(
          seq(
            $.concat_element,
            repeat(seq(",", $.concat_element)),
            optional(","),
          ),
        ),
        "}",
      ),

    concat_element: ($) =>
      choice(seq($._expression, "repeat", $._expression), $._expression),

    // Case expression
    case_expression: ($) =>
      seq(
        "case",
        $._expression,
        "{",
        repeat($.case_arm),
        optional($.default_case_arm),
        "}",
      ),

    // If expression
    if_expression: ($) =>
      prec.right(
        seq(
          "if",
          $._expression,
          $.block,
          "else",
          choice($.if_expression, $.block),
        ),
      ),

    // Cast expression
    cast_expression: ($) =>
      prec.left(1, seq($._expression, "as", $._base_type)),

    // Literals
    number_literal: ($) =>
      token(
        choice(
          // Integer
          /[0-9][0-9_]*/,
          // Floating point
          /[0-9][0-9_]*\.[0-9][0-9_]*([eE][+-]?[0-9][0-9_]*)?/,
          // Based literal with width
          /[0-9][0-9_]*'[sS]?[bBoOdDhH][0-9a-fA-FxXzZ_]+/,
          // Based literal without width
          /'[sS]?[bBoOdDhH][0-9a-fA-FxXzZ_]+/,
        ),
      ),

    special_literal: ($) => token(choice("'0", "'1", "'x", "'X", "'z", "'Z")),

    boolean_literal: ($) => choice("true", "false"),

    string_literal: ($) =>
      token(seq('"', repeat(choice(/[^"\\]/, /\\./)), '"')),

    // Identifiers
    identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    system_function_identifier: ($) => /\$[a-zA-Z_][a-zA-Z0-9_]*/,

    scoped_identifier: ($) =>
      prec(1, seq($.identifier, repeat1(seq("::", $.identifier)))),

    scoped_system_function_identifier: ($) =>
      prec(
        1,
        seq($.system_function_identifier, repeat1(seq("::", $.identifier))),
      ),

    // Attribute
    attribute: ($) =>
      seq(
        "#",
        "[",
        $.identifier,
        optional(
          seq(
            "(",
            optional(
              seq(
                $.attribute_arg,
                repeat(seq(",", $.attribute_arg)),
                optional(","),
              ),
            ),
            ")",
          ),
        ),
        "]",
      ),

    attribute_arg: ($) => $._expression,

    // Comments
    line_comment: ($) => token(seq("//", /.*/)),

    block_comment: ($) =>
      token(seq("/*", repeat(choice(/[^*]/, /\*[^/]/)), "*/")),
  },
});
